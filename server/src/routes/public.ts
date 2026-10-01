import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { exigerCompte, Refus } from '../auth';
import { dejaAJour, etiquette, memoire } from '../cache';
import { config } from '../config';
import { journaliser, requete, une } from '../db';
import { LONGUEUR_MAX_TRAIT, MONDE, RUBRIQUE_IDS } from '../regles';
import { presence, trace, type LigneFragment, type LigneMedia, type LigneTrace } from '../serialiser';
import { empreinte, jeton } from '../securite';
import { stockage, type Plage } from '../stockage';

/**
 * L'en-tête « Range » d'un lecteur vidéo ou audio : une seule plage d'octets.
 * undefined = tout le fichier ; 'impossible' = plage hors du fichier (réponse 416).
 */
export function lirePlage(entete: string | undefined, taille: number): Plage | 'impossible' | undefined {
  const m = entete ? /^bytes=(\d*)-(\d*)$/.exec(entete.trim()) : null;
  if (!m || (m[1] === '' && m[2] === '')) return undefined;
  let debut: number, fin: number;
  if (m[1] === '') {
    // « bytes=-500 » : les 500 derniers octets
    debut = Math.max(0, taille - Number(m[2]));
    fin = taille - 1;
  } else {
    debut = Number(m[1]);
    fin = m[2] === '' ? taille - 1 : Math.min(Number(m[2]), taille - 1);
  }
  if (debut >= taille || debut > fin) return 'impossible';
  return { debut, fin };
}

/** Le nom proposé au téléchargement, sans risque pour l'en-tête (RFC 6266). */
function nomDeTelechargement(nom: string | null): string {
  const n = (nom ?? 'document').replace(/[\r\n"\\]/g, '').slice(0, 180) || 'document';
  const ascii = n.normalize('NFD').replace(/[^\x20-\x7e]/g, '') || 'document';
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(n)}`;
}

/** Ce que tout le monde peut voir et faire, sans compte (sauf coudre un trait). */
export async function routesPubliques(app: FastifyInstance) {
  // la constellation : toutes les présences publiées (gardée en mémoire jusqu'à la prochaine écriture)
  const presences = memoire(async () => {
    const lignes = await requete<LigneTrace>(
      `select id, nom, type, couleur, matiere, pays, cree_le, q4, memoire_apercu from traces where statut = 'publiee' order by cree_le`,
    );
    return JSON.stringify({ presences: lignes.map(presence) });
  });
  app.get('/api/presences', async (req, rep) => {
    rep.header('cache-control', 'public, no-cache');
    if (dejaAJour(req, rep, etiquette('presences'))) return rep;
    return rep.type('application/json; charset=utf-8').send(await presences());
  });

  // un profil complet
  app.get('/api/traces/:id', async (req) => {
    const { id } = z.object({ id: z.string().max(40) }).parse(req.params);
    const t = await une<LigneTrace>('select * from traces where id = $1', [id]);
    const auteur = !!t && !!req.compte && t.compte_id === req.compte.id;
    const equipe = !!req.compte && ['moderation', 'admin'].includes(req.compte.role);
    if (!t || (t.statut !== 'publiee' && !auteur && !equipe)) throw new Refus(404, 'Cette trace n’existe pas ou n’est plus visible.', 'introuvable');
    const [fragments, medias] = await Promise.all([
      requete<LigneFragment>('select * from fragments where trace_id = $1 order by rubrique, ordre, cree_le', [id]),
      requete<LigneMedia>('select * from medias where trace_id = $1 order by ordre, cree_le', [id]),
    ]);
    return { trace: trace(t, fragments, medias, auteur) };
  });

  // rechercher un nom, un mot, un lieu (accents et majuscules ignorés),
  // et/ou les présences qui ont des fragments dans certaines rubriques
  app.get('/api/recherche', async (req) => {
    const { q, rubriques } = z
      .object({ q: z.string().trim().min(2).max(80).optional(), rubriques: z.string().max(400).optional() })
      .parse(req.query);
    const rubs = (rubriques ?? '').split(',').map((r) => r.trim()).filter((r) => RUBRIQUE_IDS.has(r));
    if (!q && rubs.length === 0) throw new Refus(400, 'Écris au moins deux lettres, ou choisis une rubrique.', 'recherche');
    // le motif est comparé au texte sans accents ni majuscules ; les index de la migration 002 rendent
    // cette recherche rapide (les expressions doivent rester identiques à celles des index)
    const motif = q ? `%${q.toLowerCase().replace(/[\\%_]/g, (c) => '\\' + c)}%` : null;
    const lignes = await requete<{ id: string }>(
      `select t.id from traces t
        where t.statut = 'publiee'
          and ($1::text is null
               or texte_recherche_trace(t.nom, t.pays, t.q1, t.q2, t.q3, t.q4, t.memoire_apercu) like lower(sans_accents($1))
               or t.id in (select f.trace_id from fragments f where texte_recherche_fragment(f.titre, f.texte, f.lieu) like lower(sans_accents($1))))
          and not exists (select 1 from unnest($2::text[]) r
                           where not exists (select 1 from fragments f where f.trace_id = t.id and f.rubrique = r))
        limit 1000`,
      [motif, rubs],
    );
    return { ids: lignes.map((l) => l.id) };
  });

  // les éditions des archives, chacune avec ses présences
  app.get('/api/editions', async () => {
    const lignes = await requete<{ id: string; titre: string; annee: number; note: string; figee_le: Date | null; n: string }>(
      `select e.id, e.titre, e.annee, e.note, e.figee_le,
              case when e.figee_le is not null then cardinality(e.presences)
                   else (select count(*) from traces t where t.statut = 'publiee' and extract(year from t.cree_le) <= e.annee) end as n
         from editions e order by e.annee`,
    );
    return { editions: lignes.map((e) => ({ id: e.id, titre: e.titre, annee: e.annee, note: e.note, figee: !!e.figee_le, presences: Number(e.n) })) };
  });

  app.get('/api/editions/:id/presences', async (req) => {
    const { id } = z.object({ id: z.string().max(60) }).parse(req.params);
    const e = await une<{ annee: number; figee_le: Date | null; presences: string[] | null }>('select annee, figee_le, presences from editions where id = $1', [id]);
    if (!e) throw new Refus(404, 'Cette édition n’existe pas.', 'introuvable');
    const ids = e.figee_le
      ? (e.presences ?? [])
      : (await requete<{ id: string }>(`select id from traces where statut = 'publiee' and extract(year from cree_le) <= $1`, [e.annee])).map((l) => l.id);
    return { ids };
  });

  // les fichiers déposés : lisibles quand leur trace est publiée (ou par son auteur et l'équipe)
  app.get('/api/fichiers/*', async (req, rep) => {
    const cle = (req.params as { '*': string })['*'];
    const m = await une<{ mime: string; statut: string; compte_id: string | null; nom_fichier: string | null }>(
      'select m.mime, t.statut, t.compte_id, m.nom_fichier from medias m join traces t on t.id = m.trace_id where m.cle = $1',
      [cle],
    );
    const visible = m && (m.statut === 'publiee' || (req.compte && (req.compte.id === m.compte_id || req.compte.role !== 'membre')));
    if (!m || !visible) throw new Refus(404, 'Ce fichier n’existe pas.', 'introuvable');
    // les fichiers ne changent jamais (chaque dépôt a sa propre clé) : le navigateur peut les garder.
    // « private » : aucun cache partagé ne les conserve (un retrait par la modération est immédiat pour
    // les nouveaux visiteurs).
    rep.header('cache-control', m.statut === 'publiee' ? 'private, max-age=604800, immutable' : 'private, no-store');
    rep.header('x-content-type-options', 'nosniff');
    const etag = `"${cle.replace(/[^a-zA-Z0-9._-]/g, '')}"`;
    if (stockage.type === 'disque' && (req.headers['if-none-match'] ?? '').split(',').some((e) => e.trim().replace(/^W\//, '') === etag))
      return rep.status(304).header('etag', etag).send();

    const infos = stockage.infos ? await stockage.infos(cle) : null;
    const plage = infos ? lirePlage(req.headers.range, infos.taille) : undefined;
    if (plage === 'impossible') return rep.status(416).header('content-range', `bytes */${infos!.taille}`).send();
    const f = await stockage.lire(cle, plage);
    if (!f) throw new Refus(404, 'Ce fichier est introuvable dans le stockage.', 'introuvable');
    if ('redirection' in f) return rep.header('cache-control', 'private, no-cache').redirect(f.redirection, 302);

    rep.header('content-type', m.mime).header('accept-ranges', 'bytes').header('etag', etag).header('last-modified', f.modifie.toUTCString());
    const lisible = m.mime === 'application/pdf' || m.mime.startsWith('image/') || m.mime.startsWith('video/') || m.mime.startsWith('audio/');
    rep.header('content-disposition', lisible ? 'inline' : nomDeTelechargement(m.nom_fichier));
    if (plage) {
      rep.status(206).header('content-range', `bytes ${plage.debut}-${plage.fin}/${f.taille}`).header('content-length', plage.fin - plage.debut + 1);
    } else {
      rep.header('content-length', f.taille);
    }
    return rep.send(f.flux);
  });

  // signaler un contenu : tout le monde peut le faire, la modération tranche
  app.post('/api/signalements', { config: { rateLimit: { max: 10, timeWindow: '1 hour' } } }, async (req) => {
    const s = z
      .object({
        traceId: z.string().max(40),
        fragmentId: z.string().uuid().optional(),
        mediaId: z.string().uuid().optional(),
        motif: z.enum(['danger', 'haine', 'intime', 'usurpation', 'autre']),
        message: z.string().trim().max(2000).optional(),
      })
      .parse(req.body);
    const t = await une('select id from traces where id = $1', [s.traceId]);
    if (!t) throw new Refus(404, 'Cette trace n’existe pas.', 'introuvable');
    await requete('insert into signalements (trace_id, fragment_id, media_id, motif, message, compte_id) values ($1, $2, $3, $4, $5, $6)', [
      s.traceId,
      s.fragmentId ?? null,
      s.mediaId ?? null,
      s.motif,
      s.message ?? null,
      req.compte?.id ?? null,
    ]);
    return { ok: true };
  });

  // ——— l'œuvre commune : un seul trait par personne et par appareil
  const APPAREIL = 'nmm_appareil';
  const traits = memoire(() =>
    requete<{ id: string; x1: number; y1: number; x2: number; y2: number; compte_id: string | null; appareil: string | null }>(
      'select id, x1, y1, x2, y2, compte_id, appareil from traits where not masque order by cousu_le limit 50000',
    ),
  );
  app.get('/api/traits', async (req, rep) => {
    const app_ = req.cookies[APPAREIL] ? empreinte(req.cookies[APPAREIL]!) : null;
    // l'étiquette dépend aussi de la personne : « moi » marque son propre trait
    rep.header('cache-control', 'private, no-cache');
    if (dejaAJour(req, rep, etiquette('traits', empreinte(`${req.compte?.id ?? ''}|${app_ ?? ''}`).slice(0, 12)))) return rep;
    const lignes = await traits();
    return {
      traits: lignes.map((t) => ({ id: t.id, x1: t.x1, y1: t.y1, x2: t.x2, y2: t.y2, moi: (req.compte && t.compte_id === req.compte.id) || (app_ !== null && t.appareil === app_) || undefined })),
    };
  });

  app.post('/api/traits', { config: { rateLimit: { max: 5, timeWindow: '1 hour' } } }, async (req, rep) => {
    const c = exigerCompte(req);
    const p = z.object({ x1: z.number(), y1: z.number(), x2: z.number(), y2: z.number() }).parse(req.body);
    const dansLOeuvre = (x: number, y: number) => x >= 0 && y >= 0 && x <= MONDE.l && y <= MONDE.h;
    if (!dansLOeuvre(p.x1, p.y1) || !dansLOeuvre(p.x2, p.y2)) throw new Refus(400, 'Le trait doit rester dans l’œuvre.', 'hors');
    if (Math.hypot(p.x2 - p.x1, p.y2 - p.y1) > LONGUEUR_MAX_TRAIT + 1e-6) throw new Refus(400, 'Ce trait est trop long.', 'long');
    let brut = req.cookies[APPAREIL];
    if (!brut) {
      brut = jeton(18);
      rep.setCookie(APPAREIL, brut, { path: '/', httpOnly: true, sameSite: 'lax', secure: config.production, maxAge: 10 * 365 * 24 * 3600 });
    }
    const deja = await une('select id from traits where compte_id = $1 or appareil = $2', [c.id, empreinte(brut)]);
    if (deja) throw new Refus(409, 'Tu as déjà cousu ton trait. Il fait partie de l’œuvre, pour toujours.', 'deja');
    const t = await une<{ id: string }>('insert into traits (compte_id, appareil, x1, y1, x2, y2) values ($1, $2, $3, $4, $5, $6) returning id', [
      c.id,
      empreinte(brut),
      p.x1,
      p.y1,
      p.x2,
      p.y2,
    ]);
    await journaliser(c.id, 'trait.cousu', t!.id);
    return { trait: { id: t!.id, ...p, moi: true } };
  });
}
