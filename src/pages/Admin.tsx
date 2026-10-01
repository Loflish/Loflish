import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useCompte } from '../data/store';
import { RUBRIQUES, type Trace } from '../data/types';
import { adresseApi, adresseFichier, appel, EN_LIGNE } from '../lib/api';
import { Page } from './Pages';

/**
 * L'espace du fondateur (rôle « admin »), et de qui l'aide à modérer (rôle
 * « moderation ») : l'état du musée, les signalements, les traces (retirer une
 * bulle, bannir), l'œuvre commune ; pour l'administration aussi : les comptes,
 * les adresses bannies, les éditions des archives, le journal et l'export.
 * On y entre depuis la page Compte, une fois connecté avec une adresse de
 * ADMIN_EMAILS. Chaque décision est écrite dans le journal par le serveur.
 */

type Onglet = 'etat' | 'signalements' | 'traces' | 'oeuvre' | 'comptes' | 'bannis' | 'archives' | 'journal';

const ONGLETS: { id: Onglet; titre: string; admin?: boolean }[] = [
  { id: 'etat', titre: 'État du musée' },
  { id: 'signalements', titre: 'Signalements' },
  { id: 'traces', titre: 'Traces' },
  { id: 'oeuvre', titre: 'Œuvre commune' },
  { id: 'comptes', titre: 'Comptes', admin: true },
  { id: 'bannis', titre: 'Adresses bannies', admin: true },
  { id: 'archives', titre: 'Archives', admin: true },
  { id: 'journal', titre: 'Journal & export', admin: true },
];

const date = (s?: string | null) => (s ? new Date(s).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : 'jamais');
const message = (e: unknown) => (e instanceof Error ? e.message : 'Une erreur est survenue.');

/** Charger une liste depuis le serveur, et pouvoir la recharger après une décision. */
function useDonnees<T>(chemin: string | null) {
  const [donnees, setDonnees] = useState<T | null>(null);
  const [erreur, setErreur] = useState('');
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!chemin) return;
    let annule = false;
    appel<T>('GET', chemin)
      .then((d) => !annule && (setDonnees(d), setErreur('')))
      .catch((e) => !annule && setErreur(message(e)));
    return () => {
      annule = true;
    };
  }, [chemin, n]);
  return { donnees, erreur, recharger: useCallback(() => setN((x) => x + 1), []) };
}

export function Admin() {
  const { compte, pret } = useCompte();
  const [onglet, setOnglet] = useState<Onglet>('etat');

  if (!EN_LIGNE) {
    return (
      <Page className="admin">
        <h1 className="page-titre">L’espace du fondateur</h1>
        <p className="lead">Cet espace s’ouvre sur le vrai musée, quand le site est relié à son serveur.</p>
      </Page>
    );
  }
  if (!pret) return <Page className="admin">{null}</Page>;
  if (!compte || compte.role === 'membre') {
    return (
      <Page className="admin">
        <h1 className="page-titre">L’espace du fondateur</h1>
        <p className="lead">Cette partie est réservée au fondateur du musée.</p>
        <Link to="/compte" className="lien-entrer">
          Entrer avec mon e-mail <Icon name="fleche" size={16} />
        </Link>
      </Page>
    );
  }
  const admin = compte.role === 'admin';
  return (
    <Page className="admin">
      <h1 className="page-titre">L’espace du fondateur</h1>
      <p className="muted petit">
        {compte.email}, {admin ? 'administration' : 'modération'}. Chaque décision est écrite dans le journal.
      </p>
      <nav className="chips admin-onglets" aria-label="Parties de l’espace">
        {ONGLETS.filter((o) => admin || !o.admin).map((o) => (
          <button key={o.id} className="chip" aria-pressed={onglet === o.id} onClick={() => setOnglet(o.id)}>
            {o.titre}
          </button>
        ))}
      </nav>
      <section className="admin-partie">
        {onglet === 'etat' && <Etat />}
        {onglet === 'signalements' && <Signalements />}
        {onglet === 'traces' && <Traces admin={admin} />}
        {onglet === 'oeuvre' && <Oeuvre />}
        {onglet === 'comptes' && admin && <Comptes moi={compte.id} />}
        {onglet === 'bannis' && admin && <Bannis />}
        {onglet === 'archives' && admin && <Editions />}
        {onglet === 'journal' && admin && <Journal />}
      </section>
    </Page>
  );
}

function Erreur({ children }: { children: ReactNode }) {
  return children ? (
    <p className="editeur-erreur" role="alert">
      {children}
    </p>
  ) : null;
}

/** Un bouton qui demande d'abord une raison (l'auteur ou le journal la gardera). */
function AvecRaison({ libelle, consigne, agir }: { libelle: string; consigne: string; agir: (raison: string) => Promise<unknown> }) {
  const [ouvert, setOuvert] = useState(false);
  const [raison, setRaison] = useState('');
  const [erreur, setErreur] = useState('');
  if (!ouvert)
    return (
      <button className="lien-discret petit" onClick={() => setOuvert(true)}>
        {libelle}
      </button>
    );
  return (
    <span className="admin-raison">
      <textarea rows={2} value={raison} onChange={(e) => setRaison(e.target.value)} placeholder={consigne} aria-label={consigne} autoFocus />
      <button
        className="bouton bouton-discret"
        disabled={raison.trim().length < 3}
        onClick={() =>
          void agir(raison.trim())
            .then(() => (setOuvert(false), setRaison('')))
            .catch((e) => setErreur(message(e)))
        }
      >
        Confirmer
      </button>
      <button className="lien-discret petit" onClick={() => setOuvert(false)}>
        Annuler
      </button>
      <Erreur>{erreur}</Erreur>
    </span>
  );
}

// ——— état

const LIBELLES_ETAT: [string, string][] = [
  ['traces_publiees', 'traces publiées'],
  ['memoires', 'dont mémoires'],
  ['traces_7j', 'nouvelles traces (7 jours)'],
  ['traces_retirees', 'bulles retirées'],
  ['bannissements', 'adresses bannies'],
  ['fragments', 'fragments'],
  ['medias', 'photos, vidéos, sons et documents'],
  ['traits', 'traits dans l’œuvre commune'],
  ['comptes', 'comptes'],
  ['signalements_ouverts', 'signalements à traiter'],
];

function taille(octets: number) {
  if (octets < 1e6) return `${Math.round(octets / 1e3)} ko`;
  if (octets < 1e9) return `${(octets / 1e6).toFixed(1)} Mo`;
  return `${(octets / 1e9).toFixed(2)} Go`;
}

function Etat() {
  const { donnees, erreur } = useDonnees<{ etat: Record<string, number> }>('/api/admin/etat');
  if (erreur) return <Erreur>{erreur}</Erreur>;
  if (!donnees) return <p className="muted">…</p>;
  const e = donnees.etat;
  return (
    <dl className="admin-etat">
      {LIBELLES_ETAT.map(([k, l]) => (
        <div key={k}>
          <dt>{l}</dt>
          <dd>{(e[k] ?? 0).toLocaleString('fr-FR')}</dd>
        </div>
      ))}
      <div>
        <dt>fichiers stockés</dt>
        <dd>{taille(e.octets ?? 0)}</dd>
      </div>
    </dl>
  );
}

// ——— signalements

interface Signalement {
  id: string;
  trace_id: string | null;
  trace_nom: string | null;
  fragment_texte: string | null;
  media_titre: string | null;
  motif: string;
  message: string | null;
  statut: string;
  decision: string | null;
  cree_le: string;
  traite_le: string | null;
}

const MOTIFS: Record<string, string> = {
  danger: 'Quelqu’un est en danger',
  haine: 'Haine, harcèlement ou violence',
  autre: 'Autre chose',
  intime: 'Vie privée exposée (ancien motif)',
  usurpation: 'Usurpation (ancien motif)',
};

function Signalements() {
  const [statut, setStatut] = useState<'ouvert' | 'traite' | 'rejete'>('ouvert');
  const { donnees, erreur, recharger } = useDonnees<{ signalements: Signalement[] }>(`/api/admin/signalements?statut=${statut}`);
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [err, setErr] = useState('');
  const decider = (id: string, s: 'traite' | 'rejete') =>
    appel('POST', `/api/admin/signalements/${id}`, { statut: s, decision: decisions[id] || undefined })
      .then(recharger)
      .catch((e) => setErr(message(e)));
  return (
    <>
      <div className="chips">
        {(
          [
            ['ouvert', 'À traiter'],
            ['traite', 'Traités'],
            ['rejete', 'Rejetés'],
          ] as const
        ).map(([v, l]) => (
          <button key={v} className="chip" aria-pressed={statut === v} onClick={() => setStatut(v)}>
            {l}
          </button>
        ))}
      </div>
      <Erreur>{erreur || err}</Erreur>
      {donnees?.signalements.length === 0 && <p className="muted">Rien ici.</p>}
      <ul className="admin-liste">
        {donnees?.signalements.map((s) => (
          <li key={s.id} className={s.motif === 'danger' ? 'est-urgent' : ''}>
            <p>
              <strong>{MOTIFS[s.motif] ?? s.motif}</strong>, <span className="muted">{date(s.cree_le)}</span>
            </p>
            {s.trace_id && (
              <p>
                Trace : <Link to={`/trace/${s.trace_id}`}>{s.trace_nom ?? s.trace_id}</Link>
                {s.fragment_texte && <span className="muted">, fragment « {s.fragment_texte.slice(0, 120)} »</span>}
                {s.media_titre && <span className="muted">, fichier « {s.media_titre} »</span>}
              </p>
            )}
            {s.message && <blockquote>{s.message}</blockquote>}
            {s.statut === 'ouvert' ? (
              <div className="admin-actions">
                <input
                  value={decisions[s.id] ?? ''}
                  onChange={(e) => setDecisions((d) => ({ ...d, [s.id]: e.target.value }))}
                  placeholder="Décision (facultatif)"
                  aria-label="Décision"
                />
                <button className="bouton bouton-discret" onClick={() => void decider(s.id, 'traite')}>
                  Traité
                </button>
                <button className="lien-discret petit" onClick={() => void decider(s.id, 'rejete')}>
                  Rejeter
                </button>
              </div>
            ) : (
              <p className="muted petit">
                {date(s.traite_le)}
                {s.decision ? ` : ${s.decision}` : ''}
              </p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

// ——— traces

interface LigneTrace {
  id: string;
  nom: string;
  type: Trace['type'];
  pays?: string;
  creeLe: string;
  statut: 'publiee' | 'retiree';
  email: string | null;
  compteId: string | null;
  fragments: number;
  medias: number;
  retireeRaison: string | null;
  parametres: Partial<Record<string, unknown>>;
}

const CHOIX_LIBELLES: [string, string][] = [
  ['archivageLongueDuree', 'archives'],
  ['droitsReutilisation', 'musée et broderie'],
  ['reseauxSociaux', 'réseaux sociaux'],
  ['feedbackPrive', 'messages privés'],
];

/** Les choix de confidentialité de la personne, en un coup d'œil. */
function Choix({ p }: { p: LigneTrace['parametres'] }) {
  return (
    <p className="admin-choix">
      {CHOIX_LIBELLES.map(([k, l]) => (
        <span key={k} className={p?.[k] ? 'oui' : 'non'}>
          {l} : {p?.[k] ? 'oui' : 'non'}
        </span>
      ))}
    </p>
  );
}

function Traces({ admin }: { admin: boolean }) {
  const [q, setQ] = useState('');
  const [cherche, setCherche] = useState('');
  const [statut, setStatut] = useState<'' | 'publiee' | 'retiree'>('');
  const p = new URLSearchParams();
  if (cherche) p.set('q', cherche);
  if (statut) p.set('statut', statut);
  const { donnees, erreur, recharger } = useDonnees<{ traces: LigneTrace[] }>(`/api/admin/traces?${p}`);
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [err, setErr] = useState('');
  return (
    <>
      <form
        className="admin-recherche"
        onSubmit={(e) => {
          e.preventDefault();
          setCherche(q.trim());
        }}
      >
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, identifiant ou e-mail" aria-label="Chercher une trace" />
        <select value={statut} onChange={(e) => setStatut(e.target.value as typeof statut)} aria-label="Statut">
          <option value="">Toutes</option>
          <option value="publiee">Dans le musée</option>
          <option value="retiree">Retirées</option>
        </select>
        <button className="bouton bouton-discret">Chercher</button>
      </form>
      <p className="muted petit">
        Selon la gravité : retirer la bulle (la personne lit la raison), ou bannir (ses bulles sont retirées, son compte suspendu, et son
        adresse IP ne peut plus ouvrir le musée).
      </p>
      <Erreur>{erreur || err}</Erreur>
      {donnees?.traces.length === 0 && <p className="muted">Aucune trace.</p>}
      <ul className="admin-liste">
        {donnees?.traces.map((t) => (
          <li key={t.id} className={t.statut === 'retiree' ? 'est-masquee' : ''}>
            <p>
              <Link to={`/trace/${t.id}`}>
                <strong>{t.nom}</strong>
              </Link>{' '}
              <span className="muted petit">
                {t.type === 'memoire' ? 'mémoire' : 'trace personnelle'}, {t.creeLe}
                {t.pays ? `, ${t.pays}` : ''}, {t.fragments} fragments, {t.medias} fichiers
              </span>
            </p>
            <p className="muted petit">
              {t.email ?? 'sans compte'} ({t.id})
            </p>
            <Choix p={t.parametres} />
            {t.statut === 'retiree' && <p className="petit">Retirée : {t.retireeRaison}</p>}
            <div className="admin-actions">
              {t.statut === 'publiee' ? (
                <AvecRaison
                  libelle="Retirer la bulle"
                  consigne="Raison (la personne la lira)"
                  agir={(raison) => appel('POST', `/api/admin/traces/${t.id}/statut`, { statut: 'retiree', raison }).then(recharger)}
                />
              ) : (
                <button
                  className="lien-discret petit"
                  onClick={() => void appel('POST', `/api/admin/traces/${t.id}/statut`, { statut: 'publiee' }).then(recharger).catch((e) => setErr(message(e)))}
                >
                  Remettre la bulle
                </button>
              )}
              {admin && t.compteId && (
                <AvecRaison
                  libelle="Bannir"
                  consigne="Raison du bannissement (gardée dans le journal)"
                  agir={(raison) => appel('POST', `/api/admin/traces/${t.id}/bannir`, { raison }).then(recharger)}
                />
              )}
              <button className="lien-discret petit" aria-expanded={ouverte === t.id} onClick={() => setOuverte(ouverte === t.id ? null : t.id)}>
                {ouverte === t.id ? 'Refermer' : 'Fragments et fichiers'}
              </button>
            </div>
            {ouverte === t.id && <DetailTrace id={t.id} apres={recharger} />}
          </li>
        ))}
      </ul>
    </>
  );
}

// ——— adresses bannies (administration)

interface LigneBanni {
  ip: string;
  raison: string;
  cree_le: string;
  email: string | null;
}

function Bannis() {
  const { donnees, erreur, recharger } = useDonnees<{ bannissements: LigneBanni[] }>('/api/admin/bannissements');
  const [err, setErr] = useState('');
  return (
    <>
      <p className="muted petit">
        Chaque adresse IP bannie n’est gardée que sous forme d’empreinte chiffrée. Lever un bannissement rouvre le musée à cette adresse (le
        compte reste suspendu : lève la suspension dans Comptes si besoin).
      </p>
      <Erreur>{erreur || err}</Erreur>
      {donnees?.bannissements.length === 0 && <p className="muted">Aucune adresse bannie.</p>}
      <ul className="admin-liste">
        {donnees?.bannissements.map((b) => (
          <li key={b.ip}>
            <p>
              <strong>{b.email ?? 'compte effacé'}</strong> <span className="muted petit">{date(b.cree_le)}</span>
            </p>
            <p className="petit">{b.raison}</p>
            <div className="admin-actions">
              <button
                className="lien-discret petit"
                onClick={() =>
                  void appel('DELETE', `/api/admin/bannissements/${encodeURIComponent(b.ip)}`)
                    .then(recharger)
                    .catch((e) => setErr(message(e)))
                }
              >
                Lever le bannissement
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Retirer un fragment ou un média précis, même scellé (contenu illégal, danger…). */
function DetailTrace({ id, apres }: { id: string; apres: () => void }) {
  const { donnees, erreur, recharger } = useDonnees<{ trace: Trace }>(`/api/traces/${id}`);
  if (erreur) return <Erreur>{erreur}</Erreur>;
  if (!donnees) return <p className="muted">…</p>;
  const t = donnees.trace;
  const fini = () => (recharger(), apres());
  const fragments = RUBRIQUES.flatMap((r) => (t.rubriques[r.id] ?? []).map((e) => ({ r, e })));
  return (
    <div className="admin-detail">
      {fragments.length === 0 && t.medias.length === 0 && <p className="muted petit">Aucun fragment ni fichier.</p>}
      <ul>
        {fragments.map(({ r, e }) => (
          <li key={e.id}>
            <span className="muted petit">{r.court ?? r.titre}</span> {e.titre && <strong>{e.titre}. </strong>}
            {e.texte.slice(0, 200)}
            <AvecRaison
              libelle="Retirer"
              consigne="Raison du retrait"
              agir={(raison) => appel('DELETE', `/api/admin/fragments/${e.id}`, { raison }).then(fini)}
            />
          </li>
        ))}
        {t.medias.map((m) => (
          <li key={m.id}>
            <span className="muted petit">{m.kind}</span>{' '}
            {m.src || m.url ? (
              <a href={adresseFichier(m.src) ?? m.url} target="_blank" rel="noreferrer">
                {m.titre}
              </a>
            ) : (
              m.titre
            )}
            <AvecRaison libelle="Retirer" consigne="Raison du retrait" agir={(raison) => appel('DELETE', `/api/admin/medias/${m.id}`, { raison }).then(fini)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ——— œuvre commune

interface LigneTrait {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  masque: boolean;
  cousu_le: string;
  email: string | null;
}

function Oeuvre() {
  const { donnees, erreur, recharger } = useDonnees<{ traits: LigneTrait[] }>('/api/admin/traits');
  const [err, setErr] = useState('');
  const basculer = (t: LigneTrait) =>
    appel('POST', `/api/admin/traits/${t.id}/${t.masque ? 'reafficher' : 'masquer'}`, {})
      .then(recharger)
      .catch((e) => setErr(message(e)));
  return (
    <>
      <p className="muted petit">Les 300 derniers traits cousus. Un trait masqué disparaît de l’œuvre ; la personne ne peut pas en coudre un autre.</p>
      <Erreur>{erreur || err}</Erreur>
      <ul className="admin-liste admin-traits">
        {donnees?.traits.map((t) => (
          <li key={t.id} className={t.masque ? 'est-masquee' : ''}>
            <svg viewBox={`${Math.min(t.x1, t.x2) - 0.05} ${Math.min(t.y1, t.y2) - 0.05} ${Math.abs(t.x2 - t.x1) + 0.1} ${Math.abs(t.y2 - t.y1) + 0.1}`} aria-hidden="true">
              <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
            </svg>
            <span>
              {t.email ?? 'compte effacé'} <span className="muted petit">{date(t.cousu_le)}</span>
            </span>
            <button className="lien-discret petit" onClick={() => void basculer(t)}>
              {t.masque ? 'Réafficher' : 'Masquer'}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

// ——— comptes (administration)

interface LigneCompte {
  id: string;
  email: string;
  role: 'membre' | 'moderation' | 'admin';
  suspendu: boolean;
  cree_le: string;
  derniere_connexion: string | null;
  majeur: boolean;
  traces: string;
}

function Comptes({ moi }: { moi: string }) {
  const [q, setQ] = useState('');
  const [cherche, setCherche] = useState('');
  const { donnees, erreur, recharger } = useDonnees<{ comptes: LigneCompte[] }>(`/api/admin/comptes${cherche ? `?q=${encodeURIComponent(cherche)}` : ''}`);
  const [err, setErr] = useState('');
  const modifier = (id: string, d: { role?: LigneCompte['role']; suspendu?: boolean }) =>
    appel('POST', `/api/admin/comptes/${id}`, d)
      .then(recharger)
      .catch((e) => setErr(message(e)));
  return (
    <>
      <form
        className="admin-recherche"
        onSubmit={(e) => {
          e.preventDefault();
          setCherche(q.trim());
        }}
      >
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="E-mail" aria-label="Chercher un compte" />
        <button className="bouton bouton-discret">Chercher</button>
      </form>
      <p className="muted petit">
        Les adresses de la variable ADMIN_EMAILS redeviennent administratrices à chaque connexion. Suspendre un compte ferme ses sessions ;
        ses bulles restent visibles (retire-les à part, ou bannis depuis Traces).
      </p>
      <Erreur>{erreur || err}</Erreur>
      <ul className="admin-liste">
        {donnees?.comptes.map((c) => (
          <li key={c.id} className={c.suspendu ? 'est-masquee' : ''}>
            <p>
              <strong>{c.email}</strong>{' '}
              <span className="muted petit">
                inscription le {date(c.cree_le)}, dernière venue {date(c.derniere_connexion)}, {c.traces} trace(s)
                {c.majeur ? '' : ', majorité non déclarée'}
              </span>
            </p>
            <div className="admin-actions">
              <select value={c.role} disabled={c.id === moi} onChange={(e) => void modifier(c.id, { role: e.target.value as LigneCompte['role'] })} aria-label="Rôle">
                <option value="membre">membre</option>
                <option value="moderation">modération</option>
                <option value="admin">administration</option>
              </select>
              {c.id !== moi && (
                <button className="lien-discret petit" onClick={() => void modifier(c.id, { suspendu: !c.suspendu })}>
                  {c.suspendu ? 'Lever la suspension' : 'Suspendre'}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

// ——— éditions des archives (administration)

interface LigneEdition {
  id: string;
  titre: string;
  annee: number;
  note: string;
  figee: boolean;
  presences: number;
}

function Editions() {
  const { donnees, erreur, recharger } = useDonnees<{ editions: LigneEdition[] }>('/api/editions');
  const annee = new Date().getFullYear();
  const [f, setF] = useState({ id: String(annee), titre: String(annee), annee, note: '' });
  const [err, setErr] = useState('');
  const agir = (p: Promise<unknown>) => p.then(recharger).catch((e) => setErr(message(e)));
  return (
    <>
      <p className="muted petit">
        Une édition montre les présences publiées jusqu’à son année. La figer garde pour toujours la liste exacte de ses présences
        (l’instantané confié aux archives de longue durée).
      </p>
      <Erreur>{erreur || err}</Erreur>
      <ul className="admin-liste">
        {donnees?.editions.map((e) => (
          <li key={e.id}>
            <p>
              <Link to={`/archives/${e.id}`}>
                <strong>{e.titre}</strong>
              </Link>{' '}
              <span className="muted petit">
                {e.annee}, {e.presences} présences, {e.figee ? 'figée' : 'vivante'}
                {e.note ? `, ${e.note}` : ''}
              </span>
            </p>
            <div className="admin-actions">
              {!e.figee && (
                <button className="lien-discret petit" onClick={() => void agir(appel('POST', `/api/admin/editions/${e.id}/figer`, {}))}>
                  Figer maintenant
                </button>
              )}
              <button className="lien-discret petit" onClick={() => setF({ id: e.id, titre: e.titre, annee: e.annee, note: e.note })}>
                Modifier
              </button>
              <AvecRaison libelle="Supprimer" consigne="Écris SUPPRIMER" agir={async (r) => {
                if (r !== 'SUPPRIMER') throw new Error('Écris SUPPRIMER pour confirmer.');
                await appel('DELETE', `/api/admin/editions/${e.id}`);
                recharger();
              }} />
            </div>
          </li>
        ))}
      </ul>
      <form
        className="admin-formulaire"
        onSubmit={(e) => {
          e.preventDefault();
          void agir(appel('POST', '/api/admin/editions', f));
        }}
      >
        <h2 className="intertitre">Créer ou modifier une édition</h2>
        <label className="field">
          <span className="field-label">Identifiant (lettres, chiffres et tirets ; il apparaît dans l’adresse)</span>
          <input value={f.id} onChange={(e) => setF({ ...f, id: e.target.value.toLowerCase() })} pattern="[a-z0-9-]{1,60}" required />
        </label>
        <label className="field">
          <span className="field-label">Titre</span>
          <input value={f.titre} onChange={(e) => setF({ ...f, titre: e.target.value })} maxLength={80} required />
        </label>
        <label className="field">
          <span className="field-label">Année</span>
          <input type="number" value={f.annee} onChange={(e) => setF({ ...f, annee: Number(e.target.value) })} min={2020} max={3000} required />
        </label>
        <label className="field">
          <span className="field-label">Note (facultatif)</span>
          <input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} maxLength={300} />
        </label>
        <button className="bouton">Enregistrer l’édition</button>
      </form>
    </>
  );
}

// ——— journal et export (administration)

interface LigneJournal {
  id: string;
  action: string;
  cible: string | null;
  details: Record<string, unknown>;
  cree_le: string;
  email: string | null;
}

function Journal() {
  const { donnees, erreur } = useDonnees<{ journal: LigneJournal[] }>('/api/admin/journal');
  return (
    <>
      <div className="liens-colonne">
        <a href={adresseApi('/api/admin/export')} className="lien-entrer" download>
          Exporter toutes les données du musée (JSON) <Icon name="fleche" size={16} />
        </a>
      </div>
      <p className="muted petit">
        L’export contient les traces, les fragments, les fiches des fichiers (pas les fichiers eux-mêmes), les traits, les éditions et les signalements. Les fichiers
        eux-mêmes se sauvegardent avec le stockage (voir DEPLOIEMENT.md).
      </p>
      <Erreur>{erreur}</Erreur>
      <table className="admin-journal">
        <thead>
          <tr>
            <th>Quand</th>
            <th>Qui</th>
            <th>Action</th>
            <th>Cible</th>
          </tr>
        </thead>
        <tbody>
          {donnees?.journal.map((j) => (
            <tr key={j.id}>
              <td>{date(j.cree_le)}</td>
              <td>{j.email ?? ''}</td>
              <td>
                {j.action}
                {typeof j.details?.raison === 'string' && <span className="muted"> : {j.details.raison}</span>}
              </td>
              <td className="petit">{j.cible ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
