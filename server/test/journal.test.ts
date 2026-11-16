import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { JOURNAL_PAR_JOUR, JOURNAL_PAR_PAGE, LIMITE_JOURNAL } from '../src/regles';

/**
 * Le journal, de bout en bout, contre une vraie base PostgreSQL : écrire, relire par paquets, choisir qui voit
 * chaque entrée, supprimer ; et ce qui le protège (auteur seulement, limites, trace retirée, effacement).
 */

let app: FastifyInstance;
let pool: import('pg').Pool;

beforeAll(async () => {
  const { migrer } = await import('../src/migrer');
  await migrer();
  const { creerApp } = await import('../src/app');
  ({ pool } = await import('../src/db'));
  app = await creerApp();
});
afterAll(async () => {
  await app.close();
});

type Rep = { statusCode: number; json: () => any; headers: Record<string, unknown>; body: string };

/** Une personne qui visite le musée, avec ses cookies (comme dans musee.test.ts). */
function visiteur() {
  const cookies: Record<string, string> = {};
  const req = async (method: string, url: string, payload?: unknown) => {
    const r = (await app.inject({
      method: method as 'GET',
      url,
      payload: payload as never,
      headers: {
        cookie: Object.entries(cookies)
          .map(([k, v]) => `${k}=${v}`)
          .join('; '),
      },
    })) as unknown as Rep;
    for (const c of ([] as string[]).concat((r.headers['set-cookie'] as string[] | string | undefined) ?? [])) {
      const [k, v] = c.split(';')[0]!.split('=');
      if (v) cookies[k!] = v;
      else delete cookies[k!];
    }
    return r;
  };
  return {
    get: (u: string) => req('GET', u),
    post: (u: string, p?: unknown) => req('POST', u, p ?? {}),
    put: (u: string, p: unknown) => req('PUT', u, p),
    del: (u: string, p?: unknown) => req('DELETE', u, p ?? {}),
    async connecter(email: string) {
      const l = await req('POST', '/api/auth/code', { email });
      expect(l.statusCode).toBe(200);
      const v = await req('POST', '/api/auth/verifier', { email, code: l.json().code });
      expect(v.statusCode).toBe(200);
      return v.json().compte as { id: string };
    },
  };
}

/** Une personne connectée, majeure, avec sa trace personnelle publiée. */
async function auteurAvecTrace(email: string, nom: string) {
  const v = visiteur();
  const compte = await v.connecter(email);
  await v.post('/api/moi/majeur', { majeur: true });
  const r = await v.post('/api/traces', {
    type: 'personnelle',
    nom,
    couleur: 'b3',
    questions: ['Écris chaque jour.', 'Merci.', 'Gardez vos carnets.', 'Un carnet toujours ouvert.'],
  });
  expect(r.statusCode).toBe(200);
  return { v, compte, id: r.json().trace.id as string };
}

/** Quelqu'un de l'équipe du musée (le rôle est donné directement dans la base : l'adresse du fondateur sert déjà aux autres tests). */
async function fondateur(email: string) {
  const v = visiteur();
  await v.connecter(email);
  await pool.query(`update comptes set role = 'admin' where email = $1`, [email]);
  return v;
}

/** Des entrées écrites directement dans la base, une par minute, la plus récente il y a `debutMin` minutes. */
async function semer(traceId: string, n: number, debutMin: number, visible = 'true') {
  await pool.query(
    `insert into journal_entrees (trace_id, texte, visible, ecrit_le)
     select $1, 'Entrée ' || i, ${visible}, date_trunc('milliseconds', now()) - make_interval(mins => $3::int + i)
       from generate_series(0, $2::int - 1) i`,
    [traceId, n, debutMin],
  );
}

const lire = async (qui: ReturnType<typeof visiteur>, id: string, suite = '') => {
  const r = await qui.get(`/api/traces/${id}/journal${suite}`);
  expect(r.statusCode).toBe(200);
  return r.json() as { entrees: { id: string; texte: string; ecritLe: string; visible: boolean }[]; suite: boolean };
};

describe('le journal : écrire, relire, choisir qui voit', () => {
  let a: Awaited<ReturnType<typeof auteurAvecTrace>>;
  let autre: ReturnType<typeof visiteur>;
  const ids: string[] = [];

  beforeAll(async () => {
    a = await auteurAvecTrace('diariste@exemple.fr', 'Diariste');
    autre = visiteur();
    await autre.connecter('voisine@exemple.fr');
  });

  it('demande un compte', async () => {
    expect((await visiteur().post(`/api/traces/${a.id}/journal`, { texte: 'Bonjour.', visible: true })).statusCode).toBe(401);
  });

  it('écrit puis relit : la plus récente d’abord, à la date posée par le serveur', async () => {
    const debut = Date.now();
    for (const [texte, visible] of [
      ['Premier jour.', true],
      ['Pour moi seule.', false],
      ['  Troisième jour, rogné.  ', true],
    ] as const) {
      // une date envoyée par le site ne compte pas : c'est le serveur qui la pose
      const r = await a.v.post(`/api/traces/${a.id}/journal`, { texte, visible, ecritLe: '2001-01-01T00:00:00.000Z', id: 'choisi' });
      expect(r.statusCode).toBe(200);
      const e = r.json().entree;
      expect(Object.keys(e).sort()).toEqual(['ecritLe', 'id', 'texte', 'visible']);
      expect(e).toMatchObject({ texte: texte.trim(), visible });
      expect(e.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(new Date(e.ecritLe).toISOString()).toBe(e.ecritLe);
      expect(Date.parse(e.ecritLe)).toBeGreaterThanOrEqual(debut - 1000);
      expect(Date.parse(e.ecritLe)).toBeLessThanOrEqual(Date.now() + 1000);
      ids.push(e.id);
    }
    const j = await lire(a.v, a.id);
    expect(j.suite).toBe(false);
    expect(j.entrees.map((e) => e.texte)).toEqual(['Troisième jour, rogné.', 'Pour moi seule.', 'Premier jour.']);
    expect(j.entrees.map((e) => e.id)).toEqual([...ids].reverse());
    const dates = j.entrees.map((e) => Date.parse(e.ecritLe));
    expect(dates[0]!).toBeGreaterThan(dates[1]!);
    expect(dates[1]!).toBeGreaterThan(dates[2]!);
  });

  it('un visiteur ne voit que les entrées visibles ; l’auteur les voit toutes', async () => {
    expect((await lire(a.v, a.id)).entrees).toHaveLength(3);
    for (const qui of [visiteur(), autre]) {
      const j = await lire(qui, a.id);
      expect(j.entrees.map((e) => e.texte)).toEqual(['Troisième jour, rogné.', 'Premier jour.']);
      expect(j.entrees.every((e) => e.visible)).toBe(true);
      expect(j.suite).toBe(false);
    }
    // ce que lit l'auteur n'est gardé par aucun cache
    expect((await a.v.get(`/api/traces/${a.id}/journal`)).headers['cache-control']).toContain('no-store');
    expect((await visiteur().get('/api/traces/inconnue/journal')).statusCode).toBe(404);
  });

  it('un autre compte ne peut ni écrire, ni changer, ni supprimer', async () => {
    expect((await autre.post(`/api/traces/${a.id}/journal`, { texte: 'Chez toi.', visible: true })).statusCode).toBe(404);
    expect((await autre.put(`/api/journal/${ids[1]}/visibilite`, { visible: true })).statusCode).toBe(404);
    expect((await autre.del(`/api/journal/${ids[0]}`)).statusCode).toBe(404);
    // ni sans compte
    expect((await visiteur().put(`/api/journal/${ids[1]}/visibilite`, { visible: true })).statusCode).toBe(401);
    expect((await visiteur().del(`/api/journal/${ids[0]}`)).statusCode).toBe(401);
    // rien n'a bougé
    const j = await lire(a.v, a.id);
    expect(j.entrees.map((e) => [e.id, e.visible])).toEqual([
      [ids[2], true],
      [ids[1], false],
      [ids[0], true],
    ]);
  });

  it('refuse un texte vide ou trop long, et l’absence de choix de visibilité', async () => {
    const ecrire = (corps: unknown) => a.v.post(`/api/traces/${a.id}/journal`, corps);
    for (const corps of [
      { texte: '', visible: true },
      { texte: '   \n  ', visible: true },
      { texte: 'x'.repeat(LIMITE_JOURNAL + 1), visible: true },
      { visible: true },
      { texte: 'Sans choix.' },
      { texte: 'Choix flou.', visible: 'true' },
      { texte: 'Choix nul.', visible: null },
    ]) {
      const r = await ecrire(corps);
      expect(r.statusCode).toBe(400);
      expect(r.json().code).toBe('invalide');
    }
    expect(LIMITE_JOURNAL).toBe(5000);
    const plein = await ecrire({ texte: 'é'.repeat(LIMITE_JOURNAL), visible: false });
    expect(plein.statusCode).toBe(200);
    expect(plein.json().entree.texte).toHaveLength(5000);
    ids.push(plein.json().entree.id);
    expect((await lire(a.v, a.id)).entrees).toHaveLength(4);
  });

  it('l’auteur change d’avis sur la visibilité : le texte et la date ne bougent pas', async () => {
    const avant = (await lire(a.v, a.id)).entrees.find((e) => e.id === ids[1])!;
    const r = await a.v.put(`/api/journal/${ids[1]}/visibilite`, { visible: true });
    expect(r.statusCode).toBe(200);
    expect(r.json().entree).toEqual({ ...avant, visible: true });
    expect((await lire(visiteur(), a.id)).entrees.map((e) => e.id)).toContain(ids[1]);
    expect((await a.v.put(`/api/journal/${ids[1]}/visibilite`, { visible: false })).json().entree.visible).toBe(false);
    expect((await lire(visiteur(), a.id)).entrees.map((e) => e.id)).not.toContain(ids[1]);
    expect((await a.v.put(`/api/journal/${ids[1]}/visibilite`, {})).statusCode).toBe(400);
    expect((await a.v.put('/api/journal/00000000-0000-4000-8000-000000000000/visibilite', { visible: true })).statusCode).toBe(404);
  });

  it('l’export emporte tout le journal, visible ou non', async () => {
    const exp = (await a.v.get('/api/moi/export')).json();
    expect(exp.traces).toHaveLength(1);
    expect(exp.traces[0].id).toBe(a.id);
    expect(exp.traces[0].journal).toEqual((await lire(a.v, a.id)).entrees);
    expect(exp.traces[0].journal.map((e: any) => e.visible)).toEqual([false, true, false, true]);
  });

  it('l’auteur supprime une entrée', async () => {
    expect((await a.v.del(`/api/journal/${ids[0]}`)).json()).toEqual({ ok: true });
    expect((await lire(a.v, a.id)).entrees.map((e) => e.id)).toEqual([ids[3], ids[2], ids[1]]);
    expect((await lire(visiteur(), a.id)).entrees.map((e) => e.id)).toEqual([ids[2]]);
    expect((await a.v.del(`/api/journal/${ids[0]}`)).statusCode).toBe(404);
    expect((await a.v.del('/api/journal/pas-un-identifiant')).statusCode).toBe(400);
  });

  it('le journal d’audit garde chaque geste, jamais le texte', async () => {
    const { rows } = await pool.query(`select action, cible, details from journal where compte_id = $1 and action like 'journal.%' order by id`, [a.compte.id]);
    expect(rows.map((r) => r.action)).toEqual(['journal.ecrit', 'journal.ecrit', 'journal.ecrit', 'journal.ecrit', 'journal.visibilite', 'journal.visibilite', 'journal.supprime']);
    expect(rows[1]).toMatchObject({ cible: ids[1], details: { trace: a.id, visible: false } });
    expect(rows[4]).toMatchObject({ cible: ids[1], details: { trace: a.id, visible: true } });
    expect(rows[6]).toMatchObject({ cible: ids[0], details: { trace: a.id } });
    expect(JSON.stringify(rows)).not.toMatch(/Premier jour|Pour moi seule|rogné|ééé/);
    // comme pour les fragments : l'empreinte de l'adresse, jamais l'adresse
    const ip = (await pool.query('select ip from journal_entrees where id = $1', [ids[1]])).rows[0].ip as string;
    expect(ip).toBeTruthy();
    expect(ip).not.toContain('127.0.0.1');
  });

  it('une entrée gardée pour soi ne change pas la date de mise à jour du profil', async () => {
    await pool.query(`update traces set maj_le = now() - interval '3 days' where id = $1`, [a.id]);
    const lue = async () => (await pool.query('select maj_le from traces where id = $1', [a.id])).rows[0].maj_le as Date;
    const ancienne = await lue();
    const prive = (await a.v.post(`/api/traces/${a.id}/journal`, { texte: 'En silence.', visible: false })).json().entree;
    expect((await lue()).getTime()).toBe(ancienne.getTime());
    const montre = (await a.v.post(`/api/traces/${a.id}/journal`, { texte: 'À voix haute.', visible: true })).json().entree;
    expect((await lue()).getTime()).toBeGreaterThan(ancienne.getTime());
    for (const e of [prive, montre]) expect((await a.v.del(`/api/journal/${e.id}`)).statusCode).toBe(200);
  });

  it('deux écritures au même instant reçoivent deux dates différentes', async () => {
    const r = await Promise.all([1, 2, 3, 4].map((i) => a.v.post(`/api/traces/${a.id}/journal`, { texte: `Ensemble ${i}.`, visible: true })));
    expect(r.map((x) => x.statusCode)).toEqual([200, 200, 200, 200]);
    expect(new Set(r.map((x) => x.json().entree.ecritLe)).size).toBe(4);
    const j = await lire(a.v, a.id);
    expect(new Set(j.entrees.map((e) => e.ecritLe)).size).toBe(j.entrees.length);
  });
});

describe('le journal : lire par paquets', () => {
  let a: Awaited<ReturnType<typeof auteurAvecTrace>>;
  const N = 45;

  beforeAll(async () => {
    a = await auteurAvecTrace('prolixe@exemple.fr', 'Prolixe');
    // 45 entrées anciennes (hors de la limite par jour) ; une sur trois est gardée pour soi
    await semer(a.id, N, 3 * 24 * 60, 'i % 3 <> 0');
  });

  it('20 par paquet, puis la suite avant la date de la dernière lue, sans doublon ni oubli', async () => {
    expect(JOURNAL_PAR_PAGE).toBe(20);
    const tout: { id: string; texte: string; ecritLe: string }[] = [];
    const tailles: number[] = [];
    let avant = '';
    for (let tour = 0; tour < 10; tour++) {
      const p = await lire(a.v, a.id, avant && `?avant=${encodeURIComponent(avant)}`);
      tailles.push(p.entrees.length);
      tout.push(...p.entrees);
      expect(p.suite).toBe(tout.length < N);
      if (!p.suite) break;
      avant = p.entrees.at(-1)!.ecritLe;
    }
    expect(tailles).toEqual([20, 20, 5]);
    expect(tout.map((e) => e.texte)).toEqual(Array.from({ length: N }, (_, i) => `Entrée ${i}`));
    expect(new Set(tout.map((e) => e.id)).size).toBe(N);
    for (let i = 1; i < tout.length; i++) expect(Date.parse(tout[i]!.ecritLe)).toBeLessThan(Date.parse(tout[i - 1]!.ecritLe));
    // après la plus ancienne : plus rien
    expect(await lire(a.v, a.id, `?avant=${encodeURIComponent(tout.at(-1)!.ecritLe)}`)).toEqual({ entrees: [], suite: false });
  });

  it('le public lit ses paquets parmi les seules entrées visibles', async () => {
    const visibles = Array.from({ length: N }, (_, i) => i).filter((i) => i % 3 !== 0);
    const p1 = await lire(visiteur(), a.id);
    expect(p1.entrees.map((e) => e.texte)).toEqual(visibles.slice(0, 20).map((i) => `Entrée ${i}`));
    expect(p1.suite).toBe(true);
    const p2 = await lire(visiteur(), a.id, `?avant=${encodeURIComponent(p1.entrees.at(-1)!.ecritLe)}`);
    expect(p2.entrees.map((e) => e.texte)).toEqual(visibles.slice(20).map((i) => `Entrée ${i}`));
    expect(p2.suite).toBe(false);
  });

  it('la taille du paquet se choisit, de 1 à 50', async () => {
    const p = await lire(a.v, a.id, '?limite=5');
    expect(p.entrees).toHaveLength(5);
    expect(p.suite).toBe(true);
    expect((await lire(a.v, a.id, '?limite=50')).entrees).toHaveLength(N);
    expect((await lire(a.v, a.id, '?limite=45')).suite).toBe(false);
    expect((await lire(a.v, a.id, '?limite=44')).suite).toBe(true);
    for (const q of ['?limite=0', '?limite=51', '?limite=dix', '?avant=hier', '?avant=2026-11-16']) expect((await a.v.get(`/api/traces/${a.id}/journal${q}`)).statusCode).toBe(400);
  });

  it('la lecture passe par l’index de la trace', async () => {
    const plan = await pool.query(`explain select id from journal_entrees where trace_id = $1 and ecrit_le < now() order by ecrit_le desc limit 21`, [a.id]);
    expect(plan.rows.map((r) => r['QUERY PLAN']).join('\n')).toContain('journal_entrees_trace');
  });
});

describe('le journal : ce qui le protège', () => {
  it('pas plus de 20 entrées par compte sur 24 heures', async () => {
    const a = await auteurAvecTrace('bavarde@exemple.fr', 'Bavarde');
    expect(JOURNAL_PAR_JOUR).toBe(20);
    // 19 entrées dans les dernières 24 heures, et d'autres plus anciennes, qui ne comptent plus
    await semer(a.id, JOURNAL_PAR_JOUR - 1, 10);
    await semer(a.id, 30, 25 * 60);
    const vingtieme = await a.v.post(`/api/traces/${a.id}/journal`, { texte: 'La vingtième.', visible: true });
    expect(vingtieme.statusCode).toBe(200);
    const refus = await a.v.post(`/api/traces/${a.id}/journal`, { texte: 'Une de trop.', visible: true });
    expect(refus.statusCode).toBe(429);
    expect(refus.json().code).toBe('trop');
    expect(refus.json().erreur).toContain('20 entrées');
    // un autre compte n'est pas concerné
    const b = await auteurAvecTrace('discrete@exemple.fr', 'Discrète');
    expect((await b.v.post(`/api/traces/${b.id}/journal`, { texte: 'Ma première.', visible: false })).statusCode).toBe(200);
    // dès qu'une entrée a plus de 24 heures, une place se libère
    await pool.query(`update journal_entrees set ecrit_le = ecrit_le - interval '24 hours' where id = $1`, [vingtieme.json().entree.id]);
    expect((await a.v.post(`/api/traces/${a.id}/journal`, { texte: 'De nouveau.', visible: true })).statusCode).toBe(200);
    expect((await a.v.post(`/api/traces/${a.id}/journal`, { texte: 'Encore trop.', visible: true })).statusCode).toBe(429);
  });

  it('une mémoire n’a pas de journal', async () => {
    const v = visiteur();
    await v.connecter('petite-fille@exemple.fr');
    await v.post('/api/moi/majeur', { majeur: true });
    const m = await v.post('/api/traces', {
      type: 'memoire',
      nom: 'Grand-père Journal',
      couleur: 'v3',
      memoire: { deposeePar: 'Léa', relation: 'sa petite-fille', aperçu: 'Il tenait un carnet de jardin.' },
    });
    expect(m.statusCode).toBe(200);
    const mid = m.json().trace.id;
    const refus = await v.post(`/api/traces/${mid}/journal`, { texte: 'Pour lui.', visible: true });
    expect(refus.statusCode).toBe(409);
    expect(refus.json().code).toBe('pas-personnelle');
    // même une fois publiée par le fondateur
    await (await fondateur('equipe-memoire@exemple.fr')).post(`/api/admin/traces/${mid}/statut`, { statut: 'publiee' });
    expect((await visiteur().get(`/api/traces/${mid}`)).statusCode).toBe(200);
    expect((await v.post(`/api/traces/${mid}/journal`, { texte: 'Pour lui.', visible: true })).statusCode).toBe(409);
    expect(await lire(visiteur(), mid)).toEqual({ entrees: [], suite: false });
    expect(Number((await pool.query('select count(*) n from journal_entrees where trace_id = $1', [mid])).rows[0].n)).toBe(0);
  });

  it('une trace retirée ne montre plus son journal au public, et ne reçoit plus d’entrée', async () => {
    const a = await auteurAvecTrace('retiree@exemple.fr', 'Retirée');
    const e = (await a.v.post(`/api/traces/${a.id}/journal`, { texte: 'Visible un temps.', visible: true })).json().entree;
    await a.v.post(`/api/traces/${a.id}/journal`, { texte: 'Jamais visible.', visible: false });
    expect((await lire(visiteur(), a.id)).entrees).toHaveLength(1);
    const admin = await fondateur('equipe-journal@exemple.fr');
    expect((await admin.post(`/api/admin/traces/${a.id}/statut`, { statut: 'retiree', raison: 'Vérification en cours' })).statusCode).toBe(200);

    const membre = visiteur();
    await membre.connecter('passante@exemple.fr');
    for (const qui of [visiteur(), membre]) {
      const r = await qui.get(`/api/traces/${a.id}/journal`);
      expect(r.statusCode).toBe(404);
      expect(r.json().code).toBe('introuvable');
      expect(r.body).not.toContain('Visible un temps');
    }
    // l'auteur lit toujours tout son journal ; l'équipe, comme pour le profil, lit ce qui était visible, rien de plus
    expect((await lire(a.v, a.id)).entrees).toHaveLength(2);
    expect((await lire(admin, a.id)).entrees.map((x) => x.texte)).toEqual(['Visible un temps.']);
    // il n'y écrit plus, mais peut toujours changer d'avis ou supprimer
    const refus = await a.v.post(`/api/traces/${a.id}/journal`, { texte: 'Malgré tout.', visible: true });
    expect(refus.statusCode).toBe(409);
    expect(refus.json().code).toBe('pas-publiee');
    expect((await a.v.put(`/api/journal/${e.id}/visibilite`, { visible: false })).statusCode).toBe(200);
    expect((await a.v.put(`/api/journal/${e.id}/visibilite`, { visible: true })).statusCode).toBe(200);

    await admin.post(`/api/admin/traces/${a.id}/statut`, { statut: 'publiee' });
    expect((await lire(visiteur(), a.id)).entrees.map((x) => x.texte)).toEqual(['Visible un temps.']);
    expect((await a.v.del(`/api/journal/${e.id}`)).statusCode).toBe(200);
    expect((await lire(visiteur(), a.id)).entrees).toEqual([]);
  });

  it('un compte suspendu n’écrit plus', async () => {
    const a = await auteurAvecTrace('suspendue@exemple.fr', 'Suspendue');
    await pool.query('update comptes set suspendu = true where id = $1', [a.compte.id]);
    const r = await a.v.post(`/api/traces/${a.id}/journal`, { texte: 'Quand même.', visible: true });
    expect(r.statusCode).toBe(403);
    expect(r.json().code).toBe('suspendu');
  });

  it('effacer son compte efface son journal', async () => {
    const a = await auteurAvecTrace('ephemere@exemple.fr', 'Éphémère');
    for (const visible of [true, false]) expect((await a.v.post(`/api/traces/${a.id}/journal`, { texte: 'À effacer.', visible })).statusCode).toBe(200);
    const compte = async () => Number((await pool.query('select count(*) n from journal_entrees where trace_id = $1', [a.id])).rows[0].n);
    expect(await compte()).toBe(2);
    expect((await a.v.del('/api/moi', { confirmation: 'EFFACER' })).statusCode).toBe(200);
    expect(await compte()).toBe(0);
    expect((await visiteur().get(`/api/traces/${a.id}/journal`)).statusCode).toBe(404);
  });

  it('la base refuse d’elle-même un texte trop long, une entrée sans choix, deux entrées à la même date', async () => {
    const a = await auteurAvecTrace('gardienne@exemple.fr', 'Gardienne');
    const inserer = (sql: string, valeurs: unknown[]) => pool.query(sql, valeurs).then(() => 'acceptée', (e: { code: string }) => e.code);
    expect(await inserer('insert into journal_entrees (trace_id, texte, visible) values ($1, $2, true)', [a.id, 'x'.repeat(5001)])).toBe('23514');
    expect(await inserer('insert into journal_entrees (trace_id, texte, visible) values ($1, $2, true)', [a.id, ''])).toBe('23514');
    expect(await inserer('insert into journal_entrees (trace_id, texte) values ($1, $2)', [a.id, 'Sans choix.'])).toBe('23502');
    const meme = `insert into journal_entrees (trace_id, texte, visible, ecrit_le) values ($1, 'Même date.', true, '2026-01-01T00:00:00.123Z')`;
    expect(await inserer(meme, [a.id])).toBe('acceptée');
    expect(await inserer(meme, [a.id])).toBe('23505');
  });
});

describe('publier avec une matière du catalogue', () => {
  // trouvé le 16 novembre 2026 : le catalogue des 183 matières porte les numéros 1001 à 1183, la base s'arrêtait à 999
  it('accepte une bulle du catalogue (matière 1044) et refuse un numéro hors de toute planche', async () => {
    const v = visiteur();
    await v.connecter('catalogue@exemple.fr');
    await v.post('/api/moi/majeur', { majeur: true });
    const corps = { type: 'personnelle', nom: 'Bulle du catalogue', couleur: 'v3', questions: ['Un.', 'Deux.', 'Trois.', 'Quatre.'] };
    const trop = await v.post('/api/traces', { ...corps, matiere: 10000 });
    expect(trop.statusCode).toBe(400);
    const r = await v.post('/api/traces', { ...corps, matiere: 1044 });
    expect(r.statusCode).toBe(200);
    expect(r.json().trace.matiere).toBe(1044);
  });
});
