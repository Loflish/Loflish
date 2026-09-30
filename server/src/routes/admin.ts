import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { exigerRole, Refus } from '../auth';
import { journaliser, requete, transaction, une } from '../db';
import { presence, type LigneTrace } from '../serialiser';
import { stockage } from '../stockage';

/**
 * L'espace de l'équipe du musée : modération (« moderation ») et administration
 * (« admin »). Chaque décision est écrite dans le journal.
 */
export async function routesAdmin(app: FastifyInstance) {
  // le tableau de bord : l'état du musée en un coup d'œil
  app.get('/api/admin/etat', async (req) => {
    exigerRole(req, 'moderation', 'admin');
    const [r] = await requete<Record<string, string>>(`select
      (select count(*) from comptes) comptes,
      (select count(*) from traces where statut = 'publiee') traces_publiees,
      (select count(*) from traces where statut = 'masquee') traces_masquees,
      (select count(*) from traces where type = 'memoire') memoires,
      (select count(*) from fragments) fragments,
      (select count(*) from medias) medias,
      (select coalesce(sum(taille), 0) from medias) octets,
      (select count(*) from traits where not masque) traits,
      (select count(*) from signalements where statut = 'ouvert') signalements_ouverts,
      (select count(*) from traces where cree_le > now() - interval '7 days') traces_7j`);
    return { etat: Object.fromEntries(Object.entries(r!).map(([k, v]) => [k, Number(v)])) };
  });

  // les signalements
  app.get('/api/admin/signalements', async (req) => {
    exigerRole(req, 'moderation', 'admin');
    const { statut } = z.object({ statut: z.enum(['ouvert', 'traite', 'rejete']).default('ouvert') }).parse(req.query);
    const lignes = await requete(
      `select s.*, t.nom as trace_nom, f.texte as fragment_texte, m.titre as media_titre
         from signalements s left join traces t on t.id = s.trace_id
         left join fragments f on f.id = s.fragment_id left join medias m on m.id = s.media_id
        where s.statut = $1 order by s.cree_le desc limit 200`,
      [statut],
    );
    return { signalements: lignes };
  });

  app.post('/api/admin/signalements/:id', async (req) => {
    const c = exigerRole(req, 'moderation', 'admin');
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const d = z.object({ statut: z.enum(['traite', 'rejete']), decision: z.string().trim().max(1000).optional() }).parse(req.body);
    await requete('update signalements set statut = $2, decision = $3, traite_par = $4, traite_le = now() where id = $1', [id, d.statut, d.decision ?? null, c.id]);
    await journaliser(c.id, `signalement.${d.statut}`, id, { decision: d.decision });
    return { ok: true };
  });

  // les traces : chercher, masquer, réafficher
  app.get('/api/admin/traces', async (req) => {
    exigerRole(req, 'moderation', 'admin');
    const { q, statut } = z.object({ q: z.string().trim().max(80).optional(), statut: z.enum(['publiee', 'masquee']).optional() }).parse(req.query);
    const lignes = await requete<LigneTrace & { email: string | null; n_fragments: string; n_medias: string }>(
      `select t.*, c.email,
              (select count(*) from fragments f where f.trace_id = t.id) n_fragments,
              (select count(*) from medias m where m.trace_id = t.id) n_medias
         from traces t left join comptes c on c.id = t.compte_id
        where ($1::text is null or t.nom ilike '%' || $1 || '%' or t.id = $1 or c.email ilike '%' || $1 || '%')
          and ($2::text is null or t.statut = $2)
        order by t.cree_le desc limit 300`,
      [q ?? null, statut ?? null],
    );
    return {
      traces: lignes.map((t) => ({ ...presence(t), statut: t.statut, email: t.email, fragments: Number(t.n_fragments), medias: Number(t.n_medias), masqueeRaison: t.masquee_raison })),
    };
  });

  app.post('/api/admin/traces/:id/statut', async (req) => {
    const c = exigerRole(req, 'moderation', 'admin');
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const d = z.object({ statut: z.enum(['publiee', 'masquee']), raison: z.string().trim().max(500).optional() }).parse(req.body);
    if (d.statut === 'masquee' && !d.raison) throw new Refus(400, 'Indique la raison : l’auteur la verra.', 'raison');
    const r = await une('update traces set statut = $2, masquee_raison = $3 where id = $1 returning id', [id, d.statut, d.statut === 'masquee' ? d.raison : null]);
    if (!r) throw new Refus(404, 'Cette trace n’existe pas.', 'introuvable');
    await journaliser(c.id, d.statut === 'masquee' ? 'trace.masquee' : 'trace.reaffichee', id, { raison: d.raison });
    return { ok: true };
  });

  // retirer un fragment ou un média précis (contenu illégal, danger…), même scellé
  app.delete('/api/admin/fragments/:id', async (req) => {
    const c = exigerRole(req, 'moderation', 'admin');
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const { raison } = z.object({ raison: z.string().trim().min(3).max(500) }).parse(req.body);
    const cles = await transaction(async (tx) => {
      const cles = await requete<{ cle: string }>('select cle from medias where fragment_id = $1 and cle is not null', [id], tx);
      const f = await une('delete from fragments where id = $1 returning trace_id', [id], tx);
      if (!f) throw new Refus(404, 'Ce fragment n’existe pas.', 'introuvable');
      await journaliser(c.id, 'moderation.fragment_retire', id, { raison, ...f }, tx);
      return cles;
    });
    for (const { cle } of cles) await stockage.supprimer(cle);
    return { ok: true };
  });

  app.delete('/api/admin/medias/:id', async (req) => {
    const c = exigerRole(req, 'moderation', 'admin');
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const { raison } = z.object({ raison: z.string().trim().min(3).max(500) }).parse(req.body);
    const m = await une<{ cle: string | null; trace_id: string }>('delete from medias where id = $1 returning cle, trace_id', [id]);
    if (!m) throw new Refus(404, 'Ce média n’existe pas.', 'introuvable');
    if (m.cle) await stockage.supprimer(m.cle);
    await journaliser(c.id, 'moderation.media_retire', id, { raison, trace: m.trace_id });
    return { ok: true };
  });

  // l'œuvre commune : les derniers traits cousus, masquer ou réafficher un trait
  app.get('/api/admin/traits', async (req) => {
    exigerRole(req, 'moderation', 'admin');
    const lignes = await requete(
      `select t.id, t.x1, t.y1, t.x2, t.y2, t.masque, t.cousu_le, c.email
         from traits t left join comptes c on c.id = t.compte_id order by t.cousu_le desc limit 300`,
    );
    return { traits: lignes };
  });

  for (const [chemin, masque] of [['masquer', true], ['reafficher', false]] as const) {
    app.post(`/api/admin/traits/:id/${chemin}`, async (req) => {
      const c = exigerRole(req, 'moderation', 'admin');
      const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
      const r = await une('update traits set masque = $2 where id = $1 returning id', [id, masque]);
      if (!r) throw new Refus(404, 'Ce trait n’existe pas.', 'introuvable');
      await journaliser(c.id, masque ? 'trait.masque' : 'trait.reaffiche', id);
      return { ok: true };
    });
  }

  // ——— administration
  app.get('/api/admin/comptes', async (req) => {
    exigerRole(req, 'admin');
    const { q } = z.object({ q: z.string().trim().max(120).optional() }).parse(req.query);
    const lignes = await requete(
      `select c.id, c.email, c.role, c.suspendu, c.cree_le, c.derniere_connexion, c.majeur_le is not null as majeur,
              (select count(*) from traces t where t.compte_id = c.id) as traces
         from comptes c where ($1::text is null or c.email ilike '%' || $1 || '%') order by c.cree_le desc limit 300`,
      [q ?? null],
    );
    return { comptes: lignes };
  });

  app.post('/api/admin/comptes/:id', async (req) => {
    const c = exigerRole(req, 'admin');
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const d = z.object({ role: z.enum(['membre', 'moderation', 'admin']).optional(), suspendu: z.boolean().optional() }).parse(req.body);
    if (id === c.id && (d.role && d.role !== 'admin')) throw new Refus(400, 'Tu ne peux pas retirer ton propre rôle d’administration.', 'soi');
    await requete('update comptes set role = coalesce($2, role), suspendu = coalesce($3, suspendu) where id = $1', [id, d.role ?? null, d.suspendu ?? null]);
    if (d.suspendu) await requete('delete from sessions where compte_id = $1', [id]);
    await journaliser(c.id, 'compte.modifie', id, d);
    return { ok: true };
  });

  // les éditions des archives
  app.post('/api/admin/editions', async (req) => {
    const c = exigerRole(req, 'admin');
    const d = z.object({ id: z.string().regex(/^[a-z0-9-]{1,60}$/), titre: z.string().trim().min(1).max(80), annee: z.number().int().min(2020).max(3000), note: z.string().trim().max(300).default('') }).parse(req.body);
    await requete(
      'insert into editions (id, titre, annee, note) values ($1,$2,$3,$4) on conflict (id) do update set titre = $2, annee = $3, note = $4',
      [d.id, d.titre, d.annee, d.note],
    );
    await journaliser(c.id, 'edition.enregistree', d.id, d);
    return { ok: true };
  });

  // figer une édition : elle garde pour toujours la liste exacte de ses présences
  app.post('/api/admin/editions/:id/figer', async (req) => {
    const c = exigerRole(req, 'admin');
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const e = await une<{ annee: number }>('select annee from editions where id = $1', [id]);
    if (!e) throw new Refus(404, 'Cette édition n’existe pas.', 'introuvable');
    await requete(
      `update editions set figee_le = now(),
         presences = array(select id from traces where statut = 'publiee' and extract(year from cree_le) <= $2 order by cree_le)
       where id = $1`,
      [id, e.annee],
    );
    await journaliser(c.id, 'edition.figee', id);
    return { ok: true };
  });

  app.delete('/api/admin/editions/:id', async (req) => {
    const c = exigerRole(req, 'admin');
    const { id } = z.object({ id: z.string() }).parse(req.params);
    await requete('delete from editions where id = $1', [id]);
    await journaliser(c.id, 'edition.supprimee', id);
    return { ok: true };
  });

  // exporter toutes les données (sauvegarde lisible, ou étude) : JSON
  app.get('/api/admin/export', async (req, rep) => {
    const c = exigerRole(req, 'admin');
    const [traces, fragments, medias, traits, editions, signalements] = await Promise.all([
      requete('select * from traces order by cree_le'),
      requete('select * from fragments order by cree_le'),
      requete('select * from medias order by cree_le'),
      requete('select id, x1, y1, x2, y2, masque, cousu_le from traits order by cousu_le'),
      requete('select * from editions order by annee'),
      requete('select * from signalements order by cree_le'),
    ]);
    await journaliser(c.id, 'export', null);
    rep.header('content-disposition', `attachment; filename="nos-mots-memoriaux-${new Date().toISOString().slice(0, 10)}.json"`);
    return { exporteLe: new Date().toISOString(), traces, fragments, medias, traits, editions, signalements };
  });

  app.get('/api/admin/journal', async (req) => {
    exigerRole(req, 'admin');
    const lignes = await requete(
      'select j.*, c.email from journal j left join comptes c on c.id = j.compte_id order by j.cree_le desc limit 300',
    );
    return { journal: lignes };
  });
}
