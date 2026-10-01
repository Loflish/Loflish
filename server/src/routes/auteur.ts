import { createWriteStream } from 'node:fs';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { fileTypeFromFile } from 'file-type';
import type pg from 'pg';
import { z } from 'zod';
import { exigerCompte, publicCompte, Refus, type Compte } from '../auth';
import { journaliser, pool, requete, transaction, une, type Client } from '../db';
import { LIMITES, MAX_MEDIAS, TAILLES_MAX, couleurValide, estRubrique, lienValide, limiteDe, natureDe, reouverture, scelleEncore } from '../regles';
import { trace as serialiserTrace, type LigneFragment, type LigneMedia, type LigneTrace } from '../serialiser';
import { idTrace } from '../securite';
import { stockage } from '../stockage';

/**
 * Ce que fait l'auteur d'une trace. Chaque règle du musée est vérifiée ici :
 * deux bulles au plus, réponses scellées cinq ans, chaque dépôt scellé,
 * limites de chaque rubrique, vingt médias ; l'ordre choisi par l'auteur
 * décide des trois premiers montrés sur son profil.
 */

const texte = (max: number) => z.string().trim().min(1).max(max);
const facultatif = (max: number) => z.string().trim().max(max).optional().transform((v) => v || undefined);

const schemaCreation = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('personnelle'),
    nom: texte(80),
    pseudo: facultatif(60),
    couleur: z.string().refine(couleurValide, 'couleur inconnue'),
    matiere: z.number().int().min(0).max(999).optional(),
    pays: facultatif(80),
    questions: z.tuple([texte(LIMITES.q), texte(LIMITES.q), texte(LIMITES.q), texte(LIMITES.q4)]),
    q2Destinataire: facultatif(120),
    parametres: z.record(z.string(), z.unknown()).optional(),
  }),
  z.object({
    type: z.literal('memoire'),
    nom: texte(80),
    couleur: z.string().refine(couleurValide, 'couleur inconnue'),
    matiere: z.number().int().min(0).max(999).optional(),
    pays: facultatif(80),
    memoire: z.object({ deposeePar: texte(80), relation: facultatif(80), origine: facultatif(1200), aperçu: texte(LIMITES.memoire) }),
    parametres: z.record(z.string(), z.unknown()).optional(),
  }),
]);

const schemaFragment = z.object({
  rubrique: z.string().refine(estRubrique, 'rubrique inconnue'),
  texte: texte(1200),
  titre: facultatif(200),
  quand: facultatif(120),
  lieu: facultatif(160),
  lien: facultatif(120),
  categorie: facultatif(60),
  /** un lien joint au fragment (sinon, un fichier dans le formulaire) */
  mediaLien: z.object({ url: z.string().max(2000), titre: facultatif(200) }).optional(),
  mediaTitre: facultatif(200),
});

const schemaMedia = z.object({
  titre: facultatif(200),
  legende: facultatif(600),
  duree: facultatif(12),
  lien: z.string().max(2000).optional(),
});

/** La trace de l'auteur, verrouillée pour la durée de l'écriture (deux dépôts simultanés ne dépassent jamais une limite). */
async function maTrace(c: pg.PoolClient, compte: Compte, id: string): Promise<LigneTrace> {
  const t = await une<LigneTrace>('select * from traces where id = $1 for update', [id], c);
  if (!t || t.compte_id !== compte.id) throw new Refus(404, 'Cette trace n’est pas la tienne.', 'introuvable');
  return t;
}

async function traceComplete(id: string, client: Client = pool, auteur = true) {
  const t = (await une<LigneTrace>('select * from traces where id = $1', [id], client))!;
  const [f, m] = await Promise.all([
    requete<LigneFragment>('select * from fragments where trace_id = $1 order by rubrique, ordre, cree_le', [id], client),
    requete<LigneMedia>('select * from medias where trace_id = $1 order by ordre, cree_le', [id], client),
  ]);
  return serialiserTrace(t, f, m, auteur);
}

/** Lit un formulaire : un champ « donnees » (JSON) et au plus un fichier, mis de côté le temps de le vérifier. */
async function lireFormulaire(req: FastifyRequest): Promise<{ donnees: unknown; fichier?: { chemin: string; nom: string; dossier: string } }> {
  if (!req.isMultipart()) return { donnees: req.body };
  let donnees: unknown = {};
  let fichier: { chemin: string; nom: string; dossier: string } | undefined;
  for await (const part of req.parts({ limits: { fileSize: TAILLES_MAX.video, files: 1 } })) {
    if (part.type === 'file') {
      const dossier = await mkdtemp(join(tmpdir(), 'nmm-'));
      const chemin = join(dossier, 'f');
      await pipeline(part.file, createWriteStream(chemin));
      if (part.file.truncated) {
        await rm(dossier, { recursive: true, force: true });
        throw new Refus(413, 'Ce fichier est trop lourd (200 Mo au plus).', 'lourd');
      }
      fichier = { chemin, nom: part.filename, dossier };
    } else if (part.fieldname === 'donnees') {
      try {
        donnees = JSON.parse(String(part.value));
      } catch {
        throw new Refus(400, 'Certaines informations ne conviennent pas.', 'invalide');
      }
    }
  }
  return { donnees, fichier };
}

/** Avant de ranger un fichier : la trace existe et appartient bien à cette personne (sinon rien n'est stocké). */
async function verifierProprietaire(compte: Compte, id: string) {
  const t = await une<{ compte_id: string | null }>('select compte_id from traces where id = $1', [id]);
  if (!t || t.compte_id !== compte.id) throw new Refus(404, 'Cette trace n’est pas la tienne.', 'introuvable');
}

/** Vérifie la vraie nature d'un fichier et le range dans le stockage. */
async function rangerFichier(traceId: string, f: { chemin: string; nom: string }) {
  const type = await fileTypeFromFile(f.chemin);
  const texteBrut = !type && /\.txt$/i.test(f.nom);
  const mime = type?.mime ?? (texteBrut ? 'text/plain' : '');
  const nature = natureDe(mime);
  if (!nature) throw new Refus(415, 'Ce type de fichier n’est pas accepté (photos, vidéos, enregistrements, PDF et documents texte).', 'type');
  const { size } = await stat(f.chemin);
  if (size > TAILLES_MAX[nature]) throw new Refus(413, `Ce fichier est trop lourd (${Math.round(TAILLES_MAX[nature] / 1048576)} Mo au plus pour ce type).`, 'lourd');
  const cle = `traces/${traceId}/${randomUUID()}.${type?.ext ?? 'txt'}`;
  await stockage.deposer(cle, f.chemin, mime);
  return { cle, mime, nature, taille: size };
}

export async function routesAuteur(app: FastifyInstance) {
  app.get('/api/moi/traces', async (req) => {
    const c = exigerCompte(req);
    const ids = await requete<{ id: string }>('select id from traces where compte_id = $1 order by cree_le', [c.id]);
    return { traces: await Promise.all(ids.map((t) => traceComplete(t.id))) };
  });

  // créer et publier sa trace : ses réponses sont scellées pour cinq ans
  app.post('/api/traces', async (req) => {
    const c = exigerCompte(req);
    if (!c.majeur_le) throw new Refus(403, 'Il faut avoir 18 ans ou plus pour laisser une trace.', 'majeur');
    const d = schemaCreation.parse(req.body);
    const id = idTrace();
    try {
      await requete(
        `insert into traces (id, compte_id, type, nom, pseudo, couleur, matiere, pays, q1, q2, q3, q4, q2_destinataire,
                             memoire_deposee_par, memoire_relation, memoire_origine, memoire_apercu, parametres)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [
          id, c.id, d.type, d.nom, d.type === 'personnelle' ? (d.pseudo ?? null) : null, d.couleur, d.matiere ?? null, d.pays ?? null,
          ...(d.type === 'personnelle' ? d.questions : [null, null, null, null]),
          d.type === 'personnelle' ? (d.q2Destinataire ?? null) : null,
          d.type === 'memoire' ? d.memoire.deposeePar : null,
          d.type === 'memoire' ? (d.memoire.relation ?? null) : null,
          d.type === 'memoire' ? (d.memoire.origine ?? null) : null,
          d.type === 'memoire' ? d.memoire.aperçu : null,
          d.parametres ?? {},
        ],
      );
    } catch (e) {
      if ((e as { code?: string }).code === '23505')
        throw new Refus(409, d.type === 'personnelle' ? 'Tu as déjà ta propre trace.' : 'Tu as déjà déposé une mémoire.', 'deux-bulles');
      throw e;
    }
    await journaliser(c.id, 'trace.publiee', id, { type: d.type });
    return { trace: await traceComplete(id) };
  });

  // réécrire ses réponses : seulement une fois les cinq ans passés (et elles sont scellées de nouveau)
  app.put('/api/traces/:id/reponses', async (req) => {
    const c = exigerCompte(req);
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const d = z.object({ questions: z.tuple([texte(LIMITES.q), texte(LIMITES.q), texte(LIMITES.q), texte(LIMITES.q4)]).optional(), q2Destinataire: facultatif(120), apercu: texte(LIMITES.memoire).optional() }).parse(req.body);
    await transaction(async (tx) => {
      const t = await maTrace(tx, c, id);
      if (scelleEncore(t.scellee_le)) throw new Refus(403, `Tes réponses sont scellées jusqu’au ${reouverture(t.scellee_le).toLocaleDateString('fr-FR')}.`, 'scelle');
      if (t.type === 'personnelle' && d.questions)
        await requete('update traces set q1=$2, q2=$3, q3=$4, q4=$5, q2_destinataire = $6, scellee_le = now(), maj_le = now() where id = $1', [id, ...d.questions, d.q2Destinataire ?? null], tx);
      if (t.type === 'memoire' && d.apercu) await requete('update traces set memoire_apercu = $2, scellee_le = now(), maj_le = now() where id = $1', [id, d.apercu], tx);
      await journaliser(c.id, 'trace.reponses', id, {}, tx);
    });
    return { trace: await traceComplete(id) };
  });

  // les réglages non publics (droits, archivage, après le décès…) : toujours modifiables
  app.put('/api/traces/:id/parametres', async (req) => {
    const c = exigerCompte(req);
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const p = z.record(z.string(), z.union([z.boolean(), z.string().max(200)])).parse(req.body);
    await transaction(async (tx) => {
      await maTrace(tx, c, id);
      await requete('update traces set parametres = parametres || $2::jsonb, maj_le = now() where id = $1', [id, p], tx);
    });
    return { ok: true };
  });

  // déposer un fragment (avec au plus un média) : scellé aussitôt
  app.post('/api/traces/:id/fragments', async (req) => {
    const c = exigerCompte(req);
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const { donnees, fichier } = await lireFormulaire(req);
    try {
      const d = schemaFragment.parse(donnees);
      if (fichier) await verifierProprietaire(c, id);
      const range = fichier ? await rangerFichier(id, fichier) : null;
      const r = await transaction(async (tx) => {
        await maTrace(tx, c, id);
        const n = await une<{ n: string; ordre: number | null }>(
          'select count(*) n, max(ordre) ordre from fragments where trace_id = $1 and rubrique = $2',
          [id, d.rubrique],
          tx,
        );
        if (Number(n!.n) >= limiteDe(d.rubrique)) throw new Refus(409, `Cette rubrique a déjà ses ${limiteDe(d.rubrique)} fragments.`, 'plein');
        // un nouveau fragment se range à la fin : l'auteur le monte s'il veut le montrer sur son profil
        const f = (await une<{ id: string }>(
          `insert into fragments (trace_id, rubrique, titre, texte, quand, lieu, lien, categorie, ordre)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
          [id, d.rubrique, d.titre ?? null, d.texte, d.quand ?? null, d.lieu ?? null, d.lien ?? null, d.categorie ?? null, (n!.ordre ?? -1) + 1],
          tx,
        ))!;
        if (range)
          await requete(
            'insert into medias (trace_id, fragment_id, kind, titre, cle, mime, nom_fichier, taille) values ($1,$2,$3,$4,$5,$6,$7,$8)',
            [id, f.id, range.nature, d.mediaTitre ?? d.titre ?? fichier!.nom.replace(/\.[^.]+$/, '').slice(0, 200), range.cle, range.mime, fichier!.nom.slice(0, 200), range.taille],
            tx,
          );
        else if (d.mediaLien) {
          const url = lienValide(d.mediaLien.url);
          if (!url) throw new Refus(400, 'Ce lien ne mène pas à une page web.', 'lien');
          await requete('insert into medias (trace_id, fragment_id, kind, titre, url) values ($1,$2,$3,$4,$5)', [id, f.id, 'lien', d.mediaLien.titre ?? new URL(url).hostname, url], tx);
        }
        await requete('update traces set maj_le = now() where id = $1', [id], tx);
        await journaliser(c.id, 'fragment.depose', f.id, { trace: id, rubrique: d.rubrique }, tx);
        return f;
      }).catch(async (e) => {
        if (range) await stockage.supprimer(range.cle);
        throw e;
      });
      return { fragmentId: r.id, trace: await traceComplete(id) };
    } finally {
      if (fichier) await rm(fichier.dossier, { recursive: true, force: true });
    }
  });

  // retirer un fragment : seulement une fois ses cinq ans passés
  app.delete('/api/fragments/:fid', async (req) => {
    const c = exigerCompte(req);
    const { fid } = z.object({ fid: z.string().uuid() }).parse(req.params);
    const cles = await transaction(async (tx) => {
      const f = await une<{ trace_id: string; scelle_le: Date }>('select trace_id, scelle_le from fragments where id = $1', [fid], tx);
      if (!f) throw new Refus(404, 'Ce fragment n’existe pas.', 'introuvable');
      await maTrace(tx, c, f.trace_id);
      if (scelleEncore(f.scelle_le)) throw new Refus(403, `Ce fragment est scellé jusqu’au ${reouverture(f.scelle_le).toLocaleDateString('fr-FR')}.`, 'scelle');
      const cles = await requete<{ cle: string }>('select cle from medias where fragment_id = $1 and cle is not null', [fid], tx);
      await requete('delete from fragments where id = $1', [fid], tx);
      await journaliser(c.id, 'fragment.retire', fid, { trace: f.trace_id }, tx);
      return cles;
    });
    for (const { cle } of cles) await stockage.supprimer(cle);
    return { ok: true };
  });

  // modifier un fragment : seulement une fois ses cinq ans passés (il est alors scellé de nouveau)
  app.put('/api/fragments/:fid', async (req) => {
    const c = exigerCompte(req);
    const { fid } = z.object({ fid: z.string().uuid() }).parse(req.params);
    const d = schemaFragment.pick({ texte: true, titre: true, quand: true, lieu: true, lien: true, categorie: true }).parse(req.body);
    const traceId = await transaction(async (tx) => {
      const f = await une<{ trace_id: string; scelle_le: Date }>('select trace_id, scelle_le from fragments where id = $1', [fid], tx);
      if (!f) throw new Refus(404, 'Ce fragment n’existe pas.', 'introuvable');
      await maTrace(tx, c, f.trace_id);
      if (scelleEncore(f.scelle_le)) throw new Refus(403, `Ce fragment est scellé jusqu’au ${reouverture(f.scelle_le).toLocaleDateString('fr-FR')}.`, 'scelle');
      await requete(
        'update fragments set texte = $2, titre = $3, quand = $4, lieu = $5, lien = $6, categorie = $7, scelle_le = now() where id = $1',
        [fid, d.texte, d.titre ?? null, d.quand ?? null, d.lieu ?? null, d.lien ?? null, d.categorie ?? null],
        tx,
      );
      await requete('update traces set maj_le = now() where id = $1', [f.trace_id], tx);
      await journaliser(c.id, 'fragment.modifie', fid, { trace: f.trace_id }, tx);
      return f.trace_id;
    });
    return { trace: await traceComplete(traceId) };
  });

  // ranger ses fragments : monter (-1) ou descendre (+1) d'un cran ; les trois premiers se montrent sur le profil
  app.post('/api/fragments/:fid/deplacer', async (req) => {
    const c = exigerCompte(req);
    const { fid } = z.object({ fid: z.string().uuid() }).parse(req.params);
    const { sens } = z.object({ sens: z.union([z.literal(-1), z.literal(1)]) }).parse(req.body);
    await transaction(async (tx) => {
      const f = await une<{ trace_id: string; rubrique: string }>('select trace_id, rubrique from fragments where id = $1', [fid], tx);
      if (!f) throw new Refus(404, 'Ce fragment n’existe pas.', 'introuvable');
      await maTrace(tx, c, f.trace_id);
      const liste = await requete<{ id: string; ordre: number }>('select id, ordre from fragments where trace_id = $1 and rubrique = $2 order by ordre, cree_le', [f.trace_id, f.rubrique], tx);
      await echanger(tx, 'fragments', liste, fid, sens);
    });
    return { ok: true };
  });

  // déposer un média ou un document dans « Médias & documents » (20 au plus), scellé aussitôt
  app.post('/api/traces/:id/medias', async (req) => {
    const c = exigerCompte(req);
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const { donnees, fichier } = await lireFormulaire(req);
    try {
      const d = schemaMedia.parse(donnees);
      if (!fichier && !d.lien) throw new Refus(400, 'Choisis un fichier ou un lien.', 'vide');
      if (fichier) await verifierProprietaire(c, id);
      const range = fichier ? await rangerFichier(id, fichier) : null;
      await transaction(async (tx) => {
        await maTrace(tx, c, id);
        const n = await une<{ n: string; ordre: number | null }>(
          'select count(*) n, max(ordre) ordre from medias where trace_id = $1 and fragment_id is null',
          [id],
          tx,
        );
        if (Number(n!.n) >= MAX_MEDIAS) throw new Refus(409, `Tu as déjà déposé ${MAX_MEDIAS} photos, vidéos, sons ou documents.`, 'plein');
        const ordre = (n!.ordre ?? -1) + 1;
        if (range) {
          await requete(
            'insert into medias (trace_id, kind, titre, legende, duree, cle, mime, nom_fichier, taille, ordre) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
            [id, range.nature, d.titre ?? fichier!.nom.replace(/\.[^.]+$/, '').slice(0, 200), d.legende ?? null, d.duree ?? null, range.cle, range.mime, fichier!.nom.slice(0, 200), range.taille, ordre],
            tx,
          );
        } else {
          const url = lienValide(d.lien!);
          if (!url) throw new Refus(400, 'Ce lien ne mène pas à une page web.', 'lien');
          await requete('insert into medias (trace_id, kind, titre, legende, url, ordre) values ($1,$2,$3,$4,$5,$6)', [id, 'lien', d.titre ?? new URL(url).hostname, d.legende ?? null, url, ordre], tx);
        }
        await requete('update traces set maj_le = now() where id = $1', [id], tx);
        await journaliser(c.id, 'media.depose', id, { kind: range?.nature ?? 'lien' }, tx);
      }).catch(async (e) => {
        if (range) await stockage.supprimer(range.cle);
        throw e;
      });
      return { trace: await traceComplete(id) };
    } finally {
      if (fichier) await rm(fichier.dossier, { recursive: true, force: true });
    }
  });

  app.post('/api/medias/:mid/deplacer', async (req) => {
    const c = exigerCompte(req);
    const { mid } = z.object({ mid: z.string().uuid() }).parse(req.params);
    const { sens } = z.object({ sens: z.union([z.literal(-1), z.literal(1)]) }).parse(req.body);
    await transaction(async (tx) => {
      const m = await une<{ trace_id: string }>('select trace_id from medias where id = $1 and fragment_id is null', [mid], tx);
      if (!m) throw new Refus(404, 'Ce fichier n’existe pas.', 'introuvable');
      await maTrace(tx, c, m.trace_id);
      const liste = await requete<{ id: string; ordre: number }>('select id, ordre from medias where trace_id = $1 and fragment_id is null order by ordre, cree_le', [m.trace_id], tx);
      await echanger(tx, 'medias', liste, mid, sens);
    });
    return { ok: true };
  });

  app.delete('/api/medias/:mid', async (req) => {
    const c = exigerCompte(req);
    const { mid } = z.object({ mid: z.string().uuid() }).parse(req.params);
    const cle = await transaction(async (tx) => {
      const m = await une<{ trace_id: string; scelle_le: Date; cle: string | null }>('select trace_id, scelle_le, cle from medias where id = $1', [mid], tx);
      if (!m) throw new Refus(404, 'Ce fichier n’existe pas.', 'introuvable');
      await maTrace(tx, c, m.trace_id);
      if (scelleEncore(m.scelle_le)) throw new Refus(403, `Ce fichier est scellé jusqu’au ${reouverture(m.scelle_le).toLocaleDateString('fr-FR')}.`, 'scelle');
      await requete('delete from medias where id = $1', [mid], tx);
      await journaliser(c.id, 'media.retire', mid, { trace: m.trace_id }, tx);
      return m.cle;
    });
    if (cle) await stockage.supprimer(cle);
    return { ok: true };
  });

  // ——— RGPD : emporter toutes ses données, ou tout effacer
  app.get('/api/moi/export', async (req, rep) => {
    const c = exigerCompte(req);
    const ids = await requete<{ id: string }>('select id from traces where compte_id = $1', [c.id]);
    const traces = await Promise.all(ids.map((t) => traceComplete(t.id)));
    const trait = await une('select x1, y1, x2, y2, cousu_le from traits where compte_id = $1', [c.id]);
    rep.header('content-disposition', 'attachment; filename="mes-donnees-nos-mots-memoriaux.json"');
    return { exporteLe: new Date().toISOString(), compte: publicCompte(c), traces, trait: trait ?? null };
  });

  // effacer son compte : le droit à l'effacement prime sur le scellement
  app.delete('/api/moi', async (req, rep) => {
    const c = exigerCompte(req);
    z.object({ confirmation: z.literal('EFFACER') }).parse(req.body);
    const cles = await transaction(async (tx) => {
      const cles = await requete<{ cle: string }>('select m.cle from medias m join traces t on t.id = m.trace_id where t.compte_id = $1 and m.cle is not null', [c.id], tx);
      await journaliser(null, 'compte.efface', null, { traces: (await requete('select id from traces where compte_id = $1', [c.id], tx)).length }, tx);
      await requete('delete from comptes where id = $1', [c.id], tx);
      return cles;
    });
    for (const { cle } of cles) await stockage.supprimer(cle);
    rep.clearCookie('nmm_session', { path: '/' });
    return { ok: true };
  });
}

/** Échange un élément avec son voisin (même liste) : l'ordre est celui que l'auteur choisit. */
async function echanger(tx: pg.PoolClient, table: 'fragments' | 'medias', liste: { id: string; ordre: number }[], id: string, sens: -1 | 1) {
  // on renumérote d'abord, pour que l'ordre soit toujours net
  for (let i = 0; i < liste.length; i++) if (liste[i]!.ordre !== i) await requete(`update ${table} set ordre = $2 where id = $1`, [liste[i]!.id, i], tx);
  const i = liste.findIndex((x) => x.id === id);
  const j = i + sens;
  if (i < 0 || j < 0 || j >= liste.length) return;
  await requete(`update ${table} set ordre = $2 where id = $1`, [liste[i]!.id, j], tx);
  await requete(`update ${table} set ordre = $2 where id = $1`, [liste[j]!.id, i], tx);
}
