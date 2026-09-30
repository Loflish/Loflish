import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { exigerCompte, Refus } from '../auth';
import { config } from '../config';
import { journaliser, requete, une } from '../db';
import { LONGUEUR_MAX_TRAIT, MONDE } from '../regles';
import { presence, trace, type LigneFragment, type LigneMedia, type LigneTrace } from '../serialiser';
import { empreinte, jeton } from '../securite';
import { stockage } from '../stockage';

/** Ce que tout le monde peut voir et faire, sans compte (sauf coudre un trait). */
export async function routesPubliques(app: FastifyInstance) {
  // la constellation : toutes les présences publiées
  app.get('/api/presences', async (_req, rep) => {
    const lignes = await requete<LigneTrace>(`select * from traces where statut = 'publiee' order by cree_le`);
    rep.header('cache-control', 'public, max-age=30');
    return { presences: lignes.map(presence) };
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

  // rechercher un nom, un mot, un lieu (accents et majuscules ignorés)
  app.get('/api/recherche', async (req) => {
    const { q } = z.object({ q: z.string().trim().min(2).max(80) }).parse(req.query);
    const motif = `%${q}%`;
    const lignes = await requete<{ id: string }>(
      `select distinct t.id from traces t left join fragments f on f.trace_id = t.id
        where t.statut = 'publiee' and (
          unaccent(t.nom) ilike unaccent($1) or unaccent(coalesce(t.pays, '')) ilike unaccent($1)
          or unaccent(concat_ws(' ', t.q1, t.q2, t.q3, t.q4, t.memoire_apercu)) ilike unaccent($1)
          or unaccent(concat_ws(' ', f.titre, f.texte, f.lieu)) ilike unaccent($1))
        limit 200`,
      [motif],
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
    const f = await stockage.lire(cle);
    if (!f) throw new Refus(404, 'Ce fichier est introuvable dans le stockage.', 'introuvable');
    if ('redirection' in f) return rep.redirect(f.redirection, 302);
    rep.header('content-type', m.mime).header('content-length', f.taille).header('cache-control', 'private, max-age=86400');
    rep.header('x-content-type-options', 'nosniff');
    if (m.mime === 'application/pdf' || m.mime.startsWith('image/') || m.mime.startsWith('video/') || m.mime.startsWith('audio/')) rep.header('content-disposition', 'inline');
    else rep.header('content-disposition', `attachment; filename="${encodeURIComponent(m.nom_fichier ?? 'document')}"`);
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
  app.get('/api/traits', async (req, rep) => {
    const lignes = await requete<{ id: string; x1: number; y1: number; x2: number; y2: number; compte_id: string | null; appareil: string | null }>(
      'select id, x1, y1, x2, y2, compte_id, appareil from traits where not masque order by cousu_le limit 50000',
    );
    const app_ = req.cookies[APPAREIL] ? empreinte(req.cookies[APPAREIL]!) : null;
    rep.header('cache-control', 'no-store');
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
