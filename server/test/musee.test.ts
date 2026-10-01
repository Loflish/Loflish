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
    get: (u: string, h?: Record<string, string>) => req('GET', u, undefined, h),
    post: (u: string, p?: unknown, h?: Record<string, string>) => req('POST', u, p ?? {}, h),
    put: (u: string, p: unknown) => req('PUT', u, p),
    del: (u: string, p?: unknown) => req('DELETE', u, p ?? {}),
    async connecter(email: string) {
      const l = await req('POST', '/api/auth/code', { email });
      expect(l.statusCode).toBe(200);
      const v = await req('POST', '/api/auth/verifier', { email, code: l.json().code });
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
  it('entre avec un code à six chiffres, qui ne sert qu’une fois', async () => {
    const v = visiteur();
    expect((await v.get('/api/moi')).json().compte).toBeNull();
    const l = await v.post('/api/auth/code', { email: 'Ines@Exemple.fr' });
    const code = l.json().code as string;
    expect(code).toMatch(/^\d{6}$/);
    expect((await v.post('/api/auth/verifier', { email: 'ines@exemple.fr', code })).statusCode).toBe(200);
    expect((await v.get('/api/moi')).json().compte.email).toBe('ines@exemple.fr');
    // le même code ne sert pas deux fois
    expect((await visiteur().post('/api/auth/verifier', { email: 'ines@exemple.fr', code })).statusCode).toBe(400);
    await v.post('/api/auth/deconnexion');
    expect((await v.get('/api/moi')).json().compte).toBeNull();
  });

  it('un code ne vaut que pour son adresse, et cinq erreurs l’annulent', async () => {
    const v = visiteur();
    const code = (await v.post('/api/auth/code', { email: 'patiente@exemple.fr' })).json().code as string;
    // le bon code, pour une autre adresse : refusé
    expect((await v.post('/api/auth/verifier', { email: 'autre-adresse@exemple.fr', code })).statusCode).toBe(400);
    const faux = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < 4; i++) {
      const r = await v.post('/api/auth/verifier', { email: 'patiente@exemple.fr', code: faux });
      expect(r.json().code).toBe('code-faux');
    }
    expect((await v.post('/api/auth/verifier', { email: 'patiente@exemple.fr', code: faux })).json().code).toBe('code-essais');
    // même le bon code ne passe plus : il faut en demander un nouveau
    expect((await v.post('/api/auth/verifier', { email: 'patiente@exemple.fr', code })).statusCode).toBe(400);
    // un nouveau code remplace l'ancien
    const c1 = (await v.post('/api/auth/code', { email: 'patiente@exemple.fr' })).json().code;
    const c2 = (await v.post('/api/auth/code', { email: 'patiente@exemple.fr' })).json().code;
    if (c1 !== c2) expect((await v.post('/api/auth/verifier', { email: 'patiente@exemple.fr', code: c1 })).statusCode).toBe(400);
    expect((await v.post('/api/auth/verifier', { email: 'patiente@exemple.fr', code: c2 })).statusCode).toBe(200);
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
    // une mémoire : ce que l'on peut dire de la personne, 500 caractères au plus
    expect((await auteur.post('/api/traces', { type: 'memoire', nom: 'Jeannot', couleur: 'v3', memoire: { deposeePar: 'Léa', aperçu: 'x'.repeat(501) } })).statusCode).toBe(400);
    const m = await auteur.post('/api/traces', { type: 'memoire', nom: 'Jeannot', couleur: 'v3', memoire: { deposeePar: 'Léa', aperçu: 'Il semait des radis. '.repeat(20).trim() } });
    expect(m.statusCode).toBe(200);
    expect(m.json().trace.memoire.aperçu.length).toBeGreaterThan(400);
    expect((await auteur.post('/api/traces', { type: 'memoire', nom: 'Autre', couleur: 'v3', memoire: { deposeePar: 'Léa', aperçu: 'x' } })).statusCode).toBe(409);
  });

  it('les réponses restent scellées cinq ans', async () => {
    const r = await auteur.put(`/api/traces/${id}/reponses`, { questions: ['a', 'b', 'c', 'd'] });
    expect(r.statusCode).toBe(403);
    expect(r.json().erreur).toMatch(/scellées jusqu’au/);
  });

  it('une rubrique a ses limites, l’auteur range ses fragments, un fragment scellé ne change pas', async () => {
    const ids: string[] = [];
    for (let i = 0; i < 7; i++) {
      const r = await auteur.post(`/api/traces/${id}/fragments`, { rubrique: 'souvenirs', titre: `Souvenir ${i}`, texte: 'Un jour à la mer.' });
      expect(r.statusCode).toBe(200);
      ids.push(r.json().fragmentId);
    }
    expect((await auteur.post(`/api/traces/${id}/fragments`, { rubrique: 'souvenirs', texte: 'Un de trop' })).statusCode).toBe(409);
    const t = (await visiteur().get(`/api/traces/${id}`)).json().trace;
    expect(t.rubriques.souvenirs.map((f: any) => f.id)).toEqual(ids);
    // ranger : le dernier peut monter jusqu'en haut (les trois premiers se montrent sur le profil)
    for (let i = 0; i < 6; i++) await auteur.post(`/api/fragments/${ids[6]}/deplacer`, { sens: -1 });
    const t2 = (await visiteur().get(`/api/traces/${id}`)).json().trace;
    expect(t2.rubriques.souvenirs[0].id).toBe(ids[6]);
    expect(t2.rubriques.souvenirs[1].id).toBe(ids[0]);
    // au bord, rien ne bouge
    await auteur.post(`/api/fragments/${ids[6]}/deplacer`, { sens: -1 });
    expect((await visiteur().get(`/api/traces/${id}`)).json().trace.rubriques.souvenirs[0].id).toBe(ids[6]);
    expect((await auteur.del(`/api/fragments/${ids[0]}`)).statusCode).toBe(403);
    expect((await auteur.put(`/api/fragments/${ids[0]}`, { texte: 'Réécrit' })).statusCode).toBe(403);
    // cinq ans plus tard, le fragment se modifie (et il est scellé de nouveau)
    await pool.query(`update fragments set scelle_le = now() - interval '6 years' where id = $1`, [ids[0]]);
    const modif = await auteur.put(`/api/fragments/${ids[0]}`, { texte: 'Réécrit, cinq ans après.', titre: 'Souvenir 0' });
    expect(modif.statusCode).toBe(200);
    expect(modif.json().trace.rubriques.souvenirs.find((f: any) => f.id === ids[0]).texte).toBe('Réécrit, cinq ans après.');
    expect((await auteur.put(`/api/fragments/${ids[0]}`, { texte: 'Encore' })).statusCode).toBe(403);
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

  it('photos, vidéos, sons et documents : 20 au plus, rangés par l’auteur', async () => {
    for (let i = 0; i < 20; i++) expect((await auteur.post(`/api/traces/${id}/medias`, { lien: `exemple.fr/${i}`, titre: `Lien ${i}` })).statusCode).toBe(200);
    expect((await auteur.post(`/api/traces/${id}/medias`, { lien: 'exemple.fr/21' })).statusCode).toBe(409);
    const t = (await visiteur().get(`/api/traces/${id}`)).json().trace;
    const libres = t.medias.filter((m: any) => !m.origine);
    expect(libres).toHaveLength(20);
    await auteur.post(`/api/medias/${libres[3].id}/deplacer`, { sens: -1 });
    const apres = (await visiteur().get(`/api/traces/${id}`)).json().trace.medias.filter((m: any) => !m.origine);
    expect(apres[2].id).toBe(libres[3].id);
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

  it('le fondateur retire une bulle signalée ; son auteur lit pourquoi', async () => {
    expect((await visiteur().post('/api/signalements', { traceId: id, motif: 'autre', message: 'Test' })).statusCode).toBe(200);
    const membre = visiteur();
    await membre.connecter('curieux@exemple.fr');
    expect((await membre.get('/api/admin/signalements')).statusCode).toBe(403);
    const admin = visiteur();
    const compte = await admin.connecter('admin@musee.test');
    expect(compte.role).toBe('admin');
    const s = (await admin.get('/api/admin/signalements')).json().signalements;
    expect(s.length).toBeGreaterThan(0);
    // trois motifs seulement
    expect((await visiteur().post('/api/signalements', { traceId: id, motif: 'usurpation' })).statusCode).toBe(400);
    // le fondateur voit les choix de confidentialité de chacun
    const liste = (await admin.get('/api/admin/traces?q=Sakinah')).json().traces;
    expect(liste[0].parametres).toBeDefined();
    expect((await admin.post(`/api/admin/traces/${id}/statut`, { statut: 'retiree' })).statusCode).toBe(400);
    expect((await admin.post(`/api/admin/traces/${id}/statut`, { statut: 'retiree', raison: 'Vérification en cours' })).statusCode).toBe(200);
    expect((await visiteur().get(`/api/traces/${id}`)).statusCode).toBe(404);
    expect((await visiteur().get('/api/presences')).json().presences.some((p: any) => p.id === id)).toBe(false);
    expect((await auteur.get(`/api/traces/${id}`)).json().trace.retireeRaison).toBe('Vérification en cours');
    await admin.post(`/api/admin/signalements/${s[0].id}`, { statut: 'traite', decision: 'Retirée' });
    await admin.post(`/api/admin/traces/${id}/statut`, { statut: 'publiee' });
    expect((await visiteur().get(`/api/traces/${id}`)).statusCode).toBe(200);
    const etat = (await admin.get('/api/admin/etat')).json().etat;
    expect(etat.traces_publiees).toBeGreaterThan(0);
    expect((await admin.get('/api/admin/journal')).json().journal.some((j: any) => j.action === 'trace.retiree')).toBe(true);
  });

  it('le lien partagé donne un aperçu propre, puis ouvre le musée sur la bulle', async () => {
    const r = await visiteur().get(`/b/${id}`);
    expect(r.statusCode).toBe(200);
    expect(r.headers['content-type']).toMatch(/text\/html/);
    expect(r.body).toContain('og:title');
    expect(r.body).toContain('Sakinah');
    expect(r.body).toContain(`#/bulle/${id}`);
    expect((await visiteur().get('/b/inconnue')).body).toContain('Nos Mots Mémoriaux');
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
  it('un seul trait par personne, dans l’œuvre, tous de la même longueur', async () => {
    const v = visiteur();
    expect((await v.post('/api/traits', { x1: 0.5, y1: 0.5, x2: 0.66, y2: 0.5 })).statusCode).toBe(401);
    await v.connecter('brodeuse@exemple.fr');
    expect((await v.post('/api/traits', { x1: 0.5, y1: 0.5, x2: 1.5, y2: 0.55 })).statusCode).toBe(400);
    expect((await v.post('/api/traits', { x1: 0.5, y1: 0.5, x2: 0.55, y2: 0.5 })).statusCode).toBe(400);
    expect((await v.post('/api/traits', { x1: -9, y1: 0.5, x2: -8.84, y2: 0.5 })).statusCode).toBe(400);
    // la toile est immense : loin du cœur, c'est encore l'œuvre
    expect((await v.post('/api/traits', { x1: 6, y1: -3, x2: 6, y2: -2.84 })).statusCode).toBe(200);
    expect((await v.post('/api/traits', { x1: 0.2, y1: 0.2, x2: 0.36, y2: 0.2 })).statusCode).toBe(409);
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

describe('rapidité et lecture des médias', () => {
  const v = visiteur();
  let id = '';
  let src = '';
  let doc = '';

  it('lit une vidéo ou un son par morceaux (Range), et laisse le navigateur garder les fichiers', async () => {
    await v.connecter('rapide@exemple.fr');
    await v.post('/api/moi/majeur', { majeur: true });
    id = (await v.post('/api/traces', personnelle('Rapide'))).json().trace.id;
    const image = png();
    const f = formulaire({ rubrique: 'voir', texte: 'Une image.' }, { nom: 'i.png', contenu: image, type: 'image/png' });
    src = (await v.post(`/api/traces/${id}/fragments`, f.corps, f.entetes)).json().trace.medias[0].src;

    const tout = await visiteur().get(src);
    expect(tout.statusCode).toBe(200);
    expect(tout.headers['accept-ranges']).toBe('bytes');
    expect(String(tout.headers['cache-control'])).toContain('max-age=604800');
    const etag = String(tout.headers.etag);

    const debut = await visiteur().get(src, { range: 'bytes=0-7' });
    expect(debut.statusCode).toBe(206);
    expect(debut.headers['content-range']).toBe(`bytes 0-7/${image.length}`);
    expect(Buffer.from(debut.body, 'latin1').length).toBe(8);

    const fin = await visiteur().get(src, { range: 'bytes=-4' });
    expect(fin.statusCode).toBe(206);
    expect(fin.headers['content-range']).toBe(`bytes ${image.length - 4}-${image.length - 1}/${image.length}`);

    expect((await visiteur().get(src, { range: `bytes=${image.length + 10}-` })).statusCode).toBe(416);
    expect((await visiteur().get(src, { 'if-none-match': etag })).statusCode).toBe(304);
  });

  it('propose un nom de téléchargement sans risque pour les documents', async () => {
    const f = formulaire({ titre: 'Lettre' }, { nom: 'lettre à Jeannot.txt', contenu: Buffer.from('Cher Jeannot,\nà bientôt.'), type: 'text/plain' });
    const r = await v.post(`/api/traces/${id}/medias`, f.corps, f.entetes);
    expect(r.statusCode).toBe(200);
    doc = r.json().trace.medias.find((m: any) => m.kind === 'document').src;
    const d = await visiteur().get(doc);
    expect(String(d.headers['content-disposition'])).toMatch(/^attachment; filename="lettre a Jeannot.txt"; filename\*=UTF-8''/);
  });

  it('ne renvoie la constellation que si elle a changé', async () => {
    const a = await visiteur().get('/api/presences');
    const etag = String(a.headers.etag);
    expect(a.json().presences.some((p: any) => p.id === id)).toBe(true);
    expect((await visiteur().get('/api/presences', { 'if-none-match': etag })).statusCode).toBe(304);
    // une nouvelle trace : la constellation change aussitôt
    const autre = visiteur();
    await autre.connecter('nouvelle@exemple.fr');
    await autre.post('/api/moi/majeur', { majeur: true });
    const nouvelle = (await autre.post('/api/traces', personnelle('Nouvelle'))).json().trace.id;
    const b = await visiteur().get('/api/presences', { 'if-none-match': etag });
    expect(b.statusCode).toBe(200);
    expect(b.json().presences.some((p: any) => p.id === nouvelle)).toBe(true);
  });

  it('l’œuvre commune aussi, et l’étiquette dépend de la personne (« moi »)', async () => {
    const t = await v.get('/api/traits');
    expect(t.statusCode).toBe(200);
    expect((await v.get('/api/traits', { 'if-none-match': String(t.headers.etag) })).statusCode).toBe(304);
    expect((await visiteur().get('/api/traits', { 'if-none-match': String(t.headers.etag) })).statusCode).toBe(200);
  });

  it('refuse proprement des données illisibles, et ne stocke rien pour la trace d’un autre', async () => {
    const limite = '----nmmx';
    const corps = Buffer.from(`--${limite}\r\nContent-Disposition: form-data; name="donnees"\r\n\r\n{pas du json\r\n--${limite}--\r\n`);
    expect((await v.post(`/api/traces/${id}/fragments`, corps, { 'content-type': `multipart/form-data; boundary=${limite}` })).statusCode).toBe(400);
    const intrus = visiteur();
    await intrus.connecter('intrus@exemple.fr');
    const f = formulaire({ rubrique: 'voir', texte: 'x' }, { nom: 'i.png', contenu: png(), type: 'image/png' });
    expect((await intrus.post(`/api/traces/${id}/fragments`, f.corps, f.entetes)).statusCode).toBe(404);
  });

  it('la recherche passe par ses index (rapide même avec des milliers de traces)', async () => {
    const c = await pool.connect();
    try {
      await c.query('set enable_seqscan = off');
      const plan = (await c.query(`explain select id from traces where texte_recherche_trace(nom, pays, q1, q2, q3, q4, memoire_apercu) like lower(sans_accents('%ocean%'))`)).rows.map((r) => r['QUERY PLAN']).join('\n');
      expect(plan).toContain('traces_recherche');
      const planF = (await c.query(`explain select trace_id from fragments where texte_recherche_fragment(titre, texte, lieu) like lower(sans_accents('%ocean%'))`)).rows.map((r) => r['QUERY PLAN']).join('\n');
      expect(planF).toContain('fragments_recherche');
    } finally {
      await c.query('reset enable_seqscan');
      c.release();
    }
    // et elle trouve toujours, accents et majuscules ignorés
    expect((await visiteur().get('/api/recherche?q=' + encodeURIComponent('RAPIDE'))).json().ids).toContain(id);
  });
});

describe('compte : changer d’adresse e-mail', () => {
  it('ne change rien tant que le code envoyé à la nouvelle adresse n’est pas donné', async () => {
    const v = visiteur();
    await v.connecter('ancienne@exemple.fr');
    expect((await v.post('/api/moi/email', { email: 'ancienne@exemple.fr' })).statusCode).toBe(400);
    await visiteur().connecter('prise@exemple.fr');
    expect((await v.post('/api/moi/email', { email: 'prise@exemple.fr' })).statusCode).toBe(409);
    expect((await visiteur().post('/api/moi/email', { email: 'x@exemple.fr' })).statusCode).toBe(401);

    const r = await v.post('/api/moi/email', { email: 'Adresse-Neuve@Exemple.fr' });
    expect(r.statusCode).toBe(200);
    expect((await v.get('/api/moi')).json().compte.email).toBe('ancienne@exemple.fr');
    // ce code ne permet pas d'entrer dans un compte : il confirme seulement le changement
    expect((await visiteur().post('/api/auth/verifier', { email: 'adresse-neuve@exemple.fr', code: r.json().code })).statusCode).toBe(400);
    const ok = await v.post('/api/moi/email/confirmer', { email: 'adresse-neuve@exemple.fr', code: r.json().code });
    expect(ok.statusCode).toBe(200);
    expect((await v.get('/api/moi')).json().compte.email).toBe('adresse-neuve@exemple.fr');
    // l'ancienne adresse ne mène plus à ce compte : elle ouvrirait un compte neuf, vide
    const autre = visiteur();
    const c = await autre.connecter('ancienne@exemple.fr');
    expect(c.id).not.toBe((await v.get('/api/moi')).json().compte.id);
  });
});

describe('bannir', () => {
  it('retire les bulles, suspend le compte et ferme le musée à son adresse IP', async () => {
    const fautif = visiteur();
    await fautif.connecter('fautif@exemple.fr');
    await fautif.post('/api/moi/majeur', { majeur: true });
    const t = (await fautif.post('/api/traces', personnelle('Fautif'))).json().trace;
    const admin = visiteur();
    await admin.connecter('admin@musee.test');
    expect((await admin.post(`/api/admin/traces/${t.id}/bannir`, { raison: '' })).statusCode).toBe(400);
    const r = await admin.post(`/api/admin/traces/${t.id}/bannir`, { raison: 'Harcèlement répété' });
    expect(r.statusCode).toBe(200);
    expect(r.json().adresses).toBeGreaterThan(0);
    // les tests viennent tous de la même adresse : désormais, plus rien ne passe
    const ferme = await visiteur().get('/api/presences');
    expect(ferme.statusCode).toBe(403);
    expect(ferme.json().code).toBe('banni');
    expect((await visiteur().get('/')).statusCode).toBe(403);
    // on lève le bannissement directement dans la base (l'adresse du fondateur est la même ici)
    await pool.query('delete from bannissements');
    const { relireBannissements } = await import('../src/bannis');
    await relireBannissements();
    expect((await visiteur().get(`/api/traces/${t.id}`)).statusCode).toBe(404);
    const c = await pool.query('select suspendu from comptes where email = $1', ['fautif@exemple.fr']);
    expect(c.rows[0].suspendu).toBe(true);
    const fautifRevient = visiteur();
    const code = (await fautifRevient.post('/api/auth/code', { email: 'fautif@exemple.fr' })).json().code;
    expect((await fautifRevient.post('/api/auth/verifier', { email: 'fautif@exemple.fr', code })).statusCode).toBe(403);
  });
});
