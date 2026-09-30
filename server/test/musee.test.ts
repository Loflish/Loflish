import { deflateSync } from 'node:zlib';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Le musée de bout en bout, contre une vraie base PostgreSQL : comptes,
 * scellement, deux bulles, limites, médias, modération, archives, œuvre
 * commune, RGPD.
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

/** Une personne qui visite le musée, avec ses cookies. */
function visiteur() {
  let cookies: Record<string, string> = {};
  const garder = (r: Rep) => {
    const sc = r.headers['set-cookie'];
    for (const c of ([] as string[]).concat((sc as string[] | string | undefined) ?? [])) {
      const [kv] = c.split(';');
      const [k, v] = kv!.split('=');
      if (v) cookies[k!] = v;
      else delete cookies[k!];
    }
    return r;
  };
  const req = async (method: string, url: string, payload?: unknown, headers: Record<string, string> = {}) =>
    garder((await app.inject({ method: method as 'GET', url, payload: payload as never, headers: { ...headers, cookie: Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ') } })) as unknown as Rep);
  return {
    get: (u: string) => req('GET', u),
    post: (u: string, p?: unknown, h?: Record<string, string>) => req('POST', u, p ?? {}, h),
    put: (u: string, p: unknown) => req('PUT', u, p),
    del: (u: string, p?: unknown) => req('DELETE', u, p ?? {}),
    async connecter(email: string) {
      const l = await req('POST', '/api/auth/lien', { email });
      expect(l.statusCode).toBe(200);
      const jeton = new URL(l.json().lien.replace('#/', '')).searchParams.get('jeton');
      const v = await req('POST', '/api/auth/verifier', { jeton });
      expect(v.statusCode).toBe(200);
      return v.json().compte;
    },
    oublier: () => (cookies = {}),
  };
}

const personnelle = (nom = 'Sakinah') => ({
  type: 'personnelle',
  nom,
  couleur: 'b3',
  matiere: 12,
  pays: 'France',
  questions: ['Sois fière.', 'Merci d’avoir été là.', 'Prenez soin les uns des autres.', 'Une vie simple, remplie de curiosité.'],
});

/** Une vraie image PNG minuscule (1 × 1 pixel). */
function png(): Buffer {
  const crc = (b: Buffer) => {
    let c = ~0;
    for (const x of b) {
      c ^= x;
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
    return ~c >>> 0;
  };
  const bloc = (type: string, data: Buffer) => {
    const t = Buffer.concat([Buffer.from(type), data]);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(t));
    return Buffer.concat([len, t, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), bloc('IHDR', ihdr), bloc('IDAT', deflateSync(Buffer.from([0, 200, 180, 170]))), bloc('IEND', Buffer.alloc(0))]);
}

/** Un formulaire avec des données et un fichier, comme l'enverrait le navigateur. */
function formulaire(donnees: unknown, fichier?: { nom: string; contenu: Buffer; type: string }) {
  const limite = '----nmm' + Math.random().toString(16).slice(2);
  const morceaux: Buffer[] = [Buffer.from(`--${limite}\r\nContent-Disposition: form-data; name="donnees"\r\n\r\n${JSON.stringify(donnees)}\r\n`)];
  if (fichier) {
    morceaux.push(Buffer.from(`--${limite}\r\nContent-Disposition: form-data; name="fichier"; filename="${fichier.nom}"\r\nContent-Type: ${fichier.type}\r\n\r\n`), fichier.contenu, Buffer.from('\r\n'));
  }
  morceaux.push(Buffer.from(`--${limite}--\r\n`));
  return { corps: Buffer.concat(morceaux), entetes: { 'content-type': `multipart/form-data; boundary=${limite}` } };
}

describe('comptes', () => {
  it('se connecte avec un lien à usage unique', async () => {
    const v = visiteur();
    expect((await v.get('/api/moi')).json().compte).toBeNull();
    const l = await v.post('/api/auth/lien', { email: 'Ines@Exemple.fr' });
    const jeton = new URL(l.json().lien.replace('#/', '')).searchParams.get('jeton');
    expect((await v.post('/api/auth/verifier', { jeton })).statusCode).toBe(200);
    expect((await v.get('/api/moi')).json().compte.email).toBe('ines@exemple.fr');
    // le même lien ne sert pas deux fois
    expect((await visiteur().post('/api/auth/verifier', { jeton })).statusCode).toBe(400);
    await v.post('/api/auth/deconnexion');
    expect((await v.get('/api/moi')).json().compte).toBeNull();
  });
});

describe('traces', () => {
  const auteur = visiteur();
  let id = '';

  it('demande d’avoir 18 ans, puis publie et scelle', async () => {
    await auteur.connecter('sakinah@exemple.fr');
    expect((await auteur.post('/api/traces', personnelle())).statusCode).toBe(403);
    await auteur.post('/api/moi/majeur', { majeur: true });
    const r = await auteur.post('/api/traces', personnelle());
    expect(r.statusCode).toBe(200);
    id = r.json().trace.id;
    expect(r.json().trace.questions[3]).toContain('curiosité');
    const liste = (await visiteur().get('/api/presences')).json().presences;
    expect(liste.find((p: any) => p.id === id).apercu).toContain('curiosité');
  });

  it('deux bulles au plus : une trace, une mémoire', async () => {
    expect((await auteur.post('/api/traces', personnelle('Encore'))).statusCode).toBe(409);
    const m = await auteur.post('/api/traces', { type: 'memoire', nom: 'Jeannot', couleur: 'v3', memoire: { deposeePar: 'Léa', aperçu: 'Il semait des radis.' } });
    expect(m.statusCode).toBe(200);
    expect((await auteur.post('/api/traces', { type: 'memoire', nom: 'Autre', couleur: 'v3', memoire: { deposeePar: 'Léa', aperçu: 'x' } })).statusCode).toBe(409);
  });

  it('les réponses restent scellées cinq ans', async () => {
    const r = await auteur.put(`/api/traces/${id}/reponses`, { questions: ['a', 'b', 'c', 'd'] });
    expect(r.statusCode).toBe(403);
    expect(r.json().erreur).toMatch(/scellées jusqu’au/);
  });

  it('une rubrique a ses limites, 5 fragments en avant au plus, un fragment scellé ne se retire pas', async () => {
    const ids: string[] = [];
    for (let i = 0; i < 7; i++) {
      const r = await auteur.post(`/api/traces/${id}/fragments`, { rubrique: 'souvenirs', titre: `Souvenir ${i}`, texte: 'Un jour à la mer.', enAvant: true });
      expect(r.statusCode).toBe(200);
      ids.push(r.json().fragmentId);
    }
    expect((await auteur.post(`/api/traces/${id}/fragments`, { rubrique: 'souvenirs', texte: 'Un de trop' })).statusCode).toBe(409);
    const t = (await visiteur().get(`/api/traces/${id}`)).json().trace;
    expect(t.rubriques.souvenirs.filter((f: any) => f.enAvant)).toHaveLength(5);
    expect((await auteur.post(`/api/fragments/${ids[6]}/en-avant`, { enAvant: true })).statusCode).toBe(409);
    // trier : le deuxième monte d'un cran
    await auteur.post(`/api/fragments/${ids[1]}/deplacer`, { sens: -1 });
    const t2 = (await visiteur().get(`/api/traces/${id}`)).json().trace;
    expect(t2.rubriques.souvenirs[0].id).toBe(ids[1]);
    expect((await auteur.del(`/api/fragments/${ids[0]}`)).statusCode).toBe(403);
    // les personnes : 15 ; une rubrique inconnue est refusée
    expect((await auteur.post(`/api/traces/${id}/fragments`, { rubrique: 'inconnue', texte: 'x' })).statusCode).toBe(400);
  });

  it('personne d’autre ne dépose sur ma trace', async () => {
    const autre = visiteur();
    await autre.connecter('autre@exemple.fr');
    expect((await autre.post(`/api/traces/${id}/fragments`, { rubrique: 'voir', texte: 'intrusion' })).statusCode).toBe(404);
    expect((await visiteur().post(`/api/traces/${id}/fragments`, { rubrique: 'voir', texte: 'x' })).statusCode).toBe(401);
  });

  it('dépose une vraie photo, refuse un faux fichier, sert le fichier', async () => {
    const f = formulaire({ rubrique: 'voir', texte: 'Le soleil sur l’océan.' }, { nom: 'ocean.png', contenu: png(), type: 'image/png' });
    const r = await auteur.post(`/api/traces/${id}/fragments`, f.corps, f.entetes);
    expect(r.statusCode).toBe(200);
    const m = r.json().trace.medias.find((x: any) => x.kind === 'image');
    expect(m.src).toMatch(/^\/api\/fichiers\/traces\//);
    const fichier = await visiteur().get(m.src);
    expect(fichier.statusCode).toBe(200);
    expect(fichier.headers['content-type']).toBe('image/png');
    // un texte déguisé en photo est refusé
    const faux = formulaire({ rubrique: 'voir', texte: 'x' }, { nom: 'faux.png', contenu: Buffer.from('<script>alert(1)</script>'), type: 'image/png' });
    expect((await auteur.post(`/api/traces/${id}/fragments`, faux.corps, faux.entetes)).statusCode).toBe(415);
  });

  it('médias & documents : 20 au plus, 5 en avant', async () => {
    for (let i = 0; i < 20; i++) expect((await auteur.post(`/api/traces/${id}/medias`, { lien: `exemple.fr/${i}`, titre: `Lien ${i}` })).statusCode).toBe(200);
    expect((await auteur.post(`/api/traces/${id}/medias`, { lien: 'exemple.fr/21' })).statusCode).toBe(409);
    const t = (await visiteur().get(`/api/traces/${id}`)).json().trace;
    const libres = t.medias.filter((m: any) => !m.origine);
    expect(libres).toHaveLength(20);
    expect(libres.filter((m: any) => m.enAvant)).toHaveLength(5);
    expect((await auteur.post(`/api/traces/${id}/medias`, { lien: 'javascript:alert(1)' })).statusCode).toBe(409);
  });

  it('la recherche ignore les accents', async () => {
    const r = await visiteur().get('/api/recherche?q=' + encodeURIComponent('ocean'));
    expect(r.json().ids).toContain(id);
    expect((await visiteur().get('/api/recherche?rubriques=souvenirs')).json().ids).toContain(id);
    expect((await visiteur().get('/api/recherche?rubriques=souvenirs,lieux')).json().ids).not.toContain(id);
    expect((await visiteur().get('/api/recherche?q=' + encodeURIComponent('100%'))).json().ids).toEqual([]);
    expect((await visiteur().get('/api/recherche')).statusCode).toBe(400);
  });

  it('la modération masque une trace signalée ; son auteur la voit encore', async () => {
    expect((await visiteur().post('/api/signalements', { traceId: id, motif: 'autre', message: 'Test' })).statusCode).toBe(200);
    const membre = visiteur();
    await membre.connecter('curieux@exemple.fr');
    expect((await membre.get('/api/admin/signalements')).statusCode).toBe(403);
    const admin = visiteur();
    const compte = await admin.connecter('admin@musee.test');
    expect(compte.role).toBe('admin');
    const s = (await admin.get('/api/admin/signalements')).json().signalements;
    expect(s.length).toBeGreaterThan(0);
    expect((await admin.post(`/api/admin/traces/${id}/statut`, { statut: 'masquee' })).statusCode).toBe(400);
    expect((await admin.post(`/api/admin/traces/${id}/statut`, { statut: 'masquee', raison: 'Vérification en cours' })).statusCode).toBe(200);
    expect((await visiteur().get(`/api/traces/${id}`)).statusCode).toBe(404);
    expect((await visiteur().get('/api/presences')).json().presences.some((p: any) => p.id === id)).toBe(false);
    expect((await auteur.get(`/api/traces/${id}`)).json().trace.masqueeRaison).toBe('Vérification en cours');
    await admin.post(`/api/admin/signalements/${s[0].id}`, { statut: 'traite', decision: 'Masquée' });
    await admin.post(`/api/admin/traces/${id}/statut`, { statut: 'publiee' });
    expect((await visiteur().get(`/api/traces/${id}`)).statusCode).toBe(200);
    const etat = (await admin.get('/api/admin/etat')).json().etat;
    expect(etat.traces_publiees).toBeGreaterThan(0);
    expect((await admin.get('/api/admin/journal')).json().journal.some((j: any) => j.action === 'trace.masquee')).toBe(true);
  });

  it('les archives : une édition, puis figée', async () => {
    const admin = visiteur();
    await admin.connecter('admin@musee.test');
    const annee = new Date().getFullYear();
    expect((await admin.post('/api/admin/editions', { id: String(annee), titre: String(annee), annee, note: 'Ouverture' })).statusCode).toBe(200);
    const e = (await visiteur().get('/api/editions')).json().editions[0];
    expect(e.presences).toBeGreaterThan(0);
    await admin.post(`/api/admin/editions/${annee}/figer`);
    const ids = (await visiteur().get(`/api/editions/${annee}/presences`)).json().ids;
    expect(ids).toContain(id);
  });
});

describe('l’œuvre commune', () => {
  it('un seul trait par personne, dans l’œuvre, pas trop long', async () => {
    const v = visiteur();
    expect((await v.post('/api/traits', { x1: 0.5, y1: 0.5, x2: 0.6, y2: 0.55 })).statusCode).toBe(401);
    await v.connecter('brodeuse@exemple.fr');
    expect((await v.post('/api/traits', { x1: 0.5, y1: 0.5, x2: 1.5, y2: 0.55 })).statusCode).toBe(400);
    expect((await v.post('/api/traits', { x1: -1, y1: 0.5, x2: 0.1, y2: 0.55 })).statusCode).toBe(400);
    expect((await v.post('/api/traits', { x1: 0.5, y1: 0.5, x2: 0.6, y2: 0.55 })).statusCode).toBe(200);
    expect((await v.post('/api/traits', { x1: 0.2, y1: 0.2, x2: 0.3, y2: 0.25 })).statusCode).toBe(409);
    const traits = (await v.get('/api/traits')).json().traits;
    expect(traits.filter((t: any) => t.moi)).toHaveLength(1);

    // la modération masque un trait, puis le réaffiche
    const admin = visiteur();
    await admin.connecter('admin@musee.test');
    const mien = traits.find((t: any) => t.moi).id;
    expect((await admin.get('/api/admin/traits')).json().traits.some((t: any) => t.id === mien && t.email === 'brodeuse@exemple.fr')).toBe(true);
    expect((await admin.post(`/api/admin/traits/${mien}/masquer`, {})).statusCode).toBe(200);
    expect((await visiteur().get('/api/traits')).json().traits.some((t: any) => t.id === mien)).toBe(false);
    expect((await admin.post(`/api/admin/traits/${mien}/reafficher`, {})).statusCode).toBe(200);
    expect((await visiteur().get('/api/traits')).json().traits.some((t: any) => t.id === mien)).toBe(true);
  });
});

describe('RGPD', () => {
  it('emporte ses données, puis efface tout', async () => {
    const v = visiteur();
    await v.connecter('partir@exemple.fr');
    await v.post('/api/moi/majeur', { majeur: true });
    const t = (await v.post('/api/traces', personnelle('Partir'))).json().trace;
    const f = formulaire({ rubrique: 'voir', texte: 'Une photo.' }, { nom: 'p.png', contenu: png(), type: 'image/png' });
    const src = (await v.post(`/api/traces/${t.id}/fragments`, f.corps, f.entetes)).json().trace.medias[0].src;
    const exp = (await v.get('/api/moi/export')).json();
    expect(exp.traces[0].id).toBe(t.id);
    expect((await v.del('/api/moi', { confirmation: 'non' })).statusCode).toBe(400);
    expect((await v.del('/api/moi', { confirmation: 'EFFACER' })).statusCode).toBe(200);
    expect((await visiteur().get(`/api/traces/${t.id}`)).statusCode).toBe(404);
    expect((await visiteur().get(src)).statusCode).toBe(404);
    const reste = await pool.query('select count(*) from traces where id = $1', [t.id]);
    expect(Number(reste.rows[0].count)).toBe(0);
  });
});
