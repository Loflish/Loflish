import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Footer, PageTop } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { EDITIONS, tracesDeLEdition } from '../data/archives';
import { allTraces, changerEmail, confirmerEmail, demanderCode, effacerMonCompte, emailDuCompte, entrerAvecCode, seDeconnecter, useCompte, useMesTraces, type CompteSession } from '../data/store';
import { ChoixConfidentialite } from '../components/ChoixConfidentialite';
import { MesTraces } from './MesTraces';
import { CONTACT } from '../lib/contact';
import { adresseApi, EN_LIGNE } from '../lib/api';
import { useMuseumMode } from '../lib/museum';

export function Page({ children, mode = 'texte', className = '' }: { children: ReactNode; mode?: 'texte' | 'minimal'; className?: string }) {
  useMuseumMode(mode);
  return (
    <main className={`page page-texte ${className}`}>
      <PageTop />
      <div className="page-corps emerge">{children}</div>
      <Footer />
    </main>
  );
}

// la photo du fondateur (public/objets/fondateur.webp) ; tant qu'elle n'est pas déposée, rien ne s'affiche à sa place
const photoFondateur = `${import.meta.env.BASE_URL}objets/fondateur.webp`;

export function Projet() {
  const [photo, setPhoto] = useState(true);
  return (
    <Page className="projet">
      <h1 className="page-titre">Le projet</h1>
      <p className="lead">
        Nous mourons trois fois. D’abord notre corps. Puis nos possessions, qui se dispersent. Et enfin l’oubli : la mort la plus fatale, celle
        qui confirme que nous n’existons plus pour personne.
      </p>
      <p className="projet-mission">
        Mon objectif : lutter contre l’oubli de nos existences, pour que le monde de demain apprenne à nous connaître à travers nos propres
        mots. Des mots qui deviendront mémoriaux.
      </p>

      <div className={photo ? 'deux-colonnes' : ''}>
        <div className="texte-courant">
          <h2 className="intertitre">Pourquoi ce musée</h2>
          <p>
            J’ai toujours trouvé injuste que la mort des célébrités soit tellement plus documentée que celle des inconnus, comme toi et moi.
            Nous, nous laissons une épitaphe, un testament, quelques souvenirs à nos proches. Nous restons gravés dans le cœur de ceux qui nous
            ont aimés, mais tôt ou tard, le monde oublie notre visage, notre voix, nos souvenirs, l’existence que nous avons construite. Puis
            ces personnes partent à leur tour, et notre trace s’efface pour toutes les générations qui suivent. Il ne reste qu’une date, un
            chiffre parmi d’autres.
          </p>
          <p>
            Il est normal que l’on raconte la vie de celles et ceux qui ont cherché la gloire. Mais nous n’avons pas encore la chance de
            découvrir, nous aussi, le parcours de personnes que nous ne connaissons pas. Je crois que chaque vie mérite d’être entendue, que
            l’on ait le sentiment d’avoir accompli la sienne ou non. Écouter la vie de l’autre, c’est apprendre l’empathie, et sortir un peu
            de l’individualisme.
          </p>
          <p>
            Nous cherchons déjà à laisser une trace : sur les réseaux sociaux, auprès de nos proches, parfois auprès d’inconnus. Nos Mots
            Mémoriaux offre à ce besoin un lieu fait pour durer.
          </p>
        </div>
        {photo && (
          <figure className="objet-reel fondateur">
            <img src={photoFondateur} alt="Le fondateur de Nos Mots Mémoriaux" loading="lazy" onError={() => setPhoto(false)} />
          </figure>
        )}
      </div>

      <section className="projet-section" aria-labelledby="h-chance">
        <h2 id="h-chance" className="intertitre">
          Une chance très ancienne
        </h2>
        <p className="projet-paragraphe">
          Les dernières paroles portent un nom très ancien : <em>ultima verba</em>, les derniers mots. Depuis l’Antiquité, on les recueille et
          on les transmet ; ceux de Socrate, prononcés en 399 avant notre ère, sont parvenus jusqu’à nous. Au XVᵉ siècle, l’un des premiers
          livres imprimés en Europe, l’<em>Ars moriendi</em>, apprenait à chacun à préparer sa fin et ce qu’il laisserait derrière lui : il a
          connu près de cent éditions avant 1500. Ce besoin n’a jamais disparu. En 2015, une lycéenne américaine a simplement demandé à des
          inconnus de lui confier le dernier message reçu d’un proche : en quelques mois, plus de dix mille personnes ont répondu. Nous voulons
          tous que nos derniers mots restent quelque part. Pourtant, pendant des siècles, seuls les rois, les saints et les écrivains ont vu
          les leurs conservés. Nos Mots Mémoriaux redonne cette chance à chacun, sans attendre la fin : ici, de ton vivant et à ton rythme, tu
          écris ta propre poésie.
        </p>
      </section>

      <section className="projet-section" aria-labelledby="h-comment">
        <h2 id="h-comment" className="intertitre">
          Comment ça marche
        </h2>
        <ol className="projet-etapes-simples">
          <li>
            <span className="projet-numero">1</span>
            <p>
              Tu réponds aux quatre questions : ce que tu dirais à toi-même, à la personne que tu aimes, au monde entier, puis l’essentiel en
              200 caractères.
            </p>
          </li>
          <li>
            <span className="projet-numero">2</span>
            <p>Si tu le souhaites, tu complètes ton profil avec des fragments de ton existence : souvenirs, lieux, personnes, œuvres, photos…</p>
          </li>
          <li>
            <span className="projet-numero">3</span>
            <p>Ta bulle rejoint la constellation : tu fais partie du musée.</p>
          </li>
        </ol>
        <p className="projet-note">
          Le musée est gratuit, pour visiter comme pour participer. Ni compteur, ni classement, ni abonnés : toutes les bulles ont la même
          taille.
        </p>
      </section>

      <section className="projet-section" aria-labelledby="h-regles">
        <h2 id="h-regles" className="intertitre">
          Les règles du musée
        </h2>
        <div className="deux-colonnes projet-regles">
          <div className="texte-courant">
            <h3 className="projet-sous-titre">Ce qui est déposé est scellé</h3>
            <p>
              Ton brouillon reste privé. En publiant, tu scelles tes quatre réponses : elles ne changent plus pendant cinq ans. Chaque fragment
              que tu ajoutes ensuite est scellé à son tour, au moment où tu le déposes. Il faut avoir 18 ans ou plus, et chacun peut avoir deux
              bulles au plus : la sienne, et une mémoire pour une personne décédée.
            </p>
            <p>
              Tes données restent à toi : tu peux m’écrire à tout moment pour les consulter, les modifier ou les supprimer (
              <a href={`mailto:${CONTACT}`}>{CONTACT}</a>).
            </p>
          </div>
          <div className="texte-courant">
            <h3 className="projet-sous-titre">Signaler un contenu</h3>
            <p>
              Chaque trace peut être signalée avec le bouton « Signaler », sur son profil ou dans Se perdre : quelqu’un en danger, de la haine,
              du harcèlement, de la violence, ou autre chose. Je lis moi-même chaque signalement. Selon la gravité, je retire la bulle du
              musée, ou je ferme définitivement l’accès au musée à la personne qui l’a déposée.
            </p>
          </div>
        </div>
      </section>

      <section className="projet-section" aria-labelledby="h-defi">
        <h2 id="h-defi" className="intertitre">
          Mon défi
        </h2>
        <p className="projet-paragraphe">
          Réunir les mots mémoriaux de toute une génération, pour celle d’aujourd’hui comme pour celles qui viendront. Chaque trace compte, même
          la plus courte : plus nous serons nombreux, plus cette mémoire collective aura de force pour exister au-delà de l’écran. Avec ton
          accord, et seulement avec lui, tes mots pourront vivre ailleurs :
        </p>
        <ol className="projet-cartes trois">
          <li className="projet-carte">
            <Icon name="projet" size={24} />
            <h3>Un musée</h3>
            <p>
              Certains mots deviendront des tableaux brodés à la main, exposés dans un vrai lieu, le profil complet présenté au dos de chaque
              œuvre. Plus nous serons nombreux, plus je pourrai convaincre des institutions de soutenir ce musée.
            </p>
          </li>
          <li className="projet-carte">
            <Icon name="archive" size={24} />
            <h3>L’Arctic World Archive</h3>
            <p>
              Une copie de la mémoire du musée, confiée à cette archive creusée dans une montagne du Svalbard, pensée pour traverser les
              siècles. Y conserver ses données coûte d’ordinaire 139 € par personne : si le musée réunit assez de traces, je prendrai ce dépôt à
              ma charge pour tous ceux qui l’acceptent. Tu n’auras rien à payer.
            </p>
          </li>
          <li className="projet-carte">
            <Icon name="reseau" size={24} />
            <h3>Les réseaux sociaux</h3>
            <p>Certains mots partagés sur les réseaux du projet, pour que d’autres les découvrent.</p>
          </li>
        </ol>
        <p className="projet-note">
          Ce sont des projets : je n’ai encore ni date, ni garantie qu’ils aboutissent. Mais ce site en est le point de départ, et chaque trace
          les rapproche.
        </p>
      </section>

      <p className="vision">Lutter contre l’oubli.</p>
    </Page>
  );
}

const LIGNES = [
  ['France', '3114', 'Numéro national de prévention du suicide, 24 h/24, gratuit'],
  ['Belgique', '0800 32 123', 'Centre de Prévention du Suicide, 24 h/24'],
  ['Suisse', '143', 'La Main Tendue, 24 h/24'],
  ['Canada', '988', 'Ligne d’aide en cas de crise suicidaire, 24 h/24'],
  ['États-Unis', '988', 'Suicide & Crisis Lifeline, 24 h/24'],
  ['Royaume-Uni et Irlande', '116 123', 'Samaritans, 24 h/24'],
];

export function Ressources() {
  return (
    <Page className="ressources">
      <h1 className="page-titre">Ressources & aide</h1>
      <section className="aide-urgente" aria-labelledby="h-aide">
        <h2 id="h-aide" className="intertitre">
          Si tu penses au suicide, des personnes peuvent t’écouter, maintenant.
        </h2>
        <p>
          Nos Mots Mémoriaux parle de la mémoire et de la vie, pas d’y mettre fin. Si tu traverses un moment très difficile, des personnes
          formées peuvent t’écouter tout de suite, gratuitement, sans jugement, dans ton pays et dans ta langue.
        </p>
        <a className="aide-monde" href="https://findahelpline.com" target="_blank" rel="noreferrer">
          <span className="aide-monde-titre">Trouver une ligne d’écoute, partout dans le monde</span>
          <span className="aide-monde-lien">findahelpline.com</span>
        </a>
        <p className="petit">
          En cas de danger immédiat, appelle les services d’urgence de ton pays (par exemple le <strong>112</strong> en Europe, le{' '}
          <strong>911</strong> en Amérique du Nord).
        </p>
        <details className="lignes-directes">
          <summary>Quelques lignes directes</summary>
          <ul className="lignes">
            {LIGNES.map(([pays, num, desc]) => (
              <li key={pays}>
                <span className="ligne-pays">{pays}</span>
                <a className="ligne-num" href={`tel:${num.replace(/\s/g, '')}`}>
                  {num}
                </a>
                <span className="ligne-desc">{desc}</span>
              </li>
            ))}
          </ul>
          <p className="muted petit">Pour tous les autres pays : findahelpline.com.</p>
        </details>
      </section>
    </Page>
  );
}

export function Soutenir() {
  return (
    <Page className="soutenir">
      <h1 className="page-titre">Soutenir</h1>
      <p className="lead">
        Le musée est et restera gratuit. Les dons permettent de continuer mes projets et de soutenir le site dans son fonctionnement.
      </p>
      <div className="trois-colonnes">
        {[
          ['Faire vivre le site', 'L’hébergement, la sécurité, les sauvegardes.'],
          ['Préserver les traces', 'Des archives faites pour durer très longtemps.'],
          ['Broder les mots', 'Le fil, la toile, les cadres, et un jour un lieu d’exposition.'],
        ].map(([t, d]) => (
          <div key={t} className="colonne-texte">
            <h2 className="intertitre">{t}</h2>
            <p>{d}</p>
          </div>
        ))}
      </div>
      <p className="muted">Il n’est pas encore possible de faire un don : cette page s’ouvrira bientôt.</p>
    </Page>
  );
}

const JURIDIQUE: [string, string][] = [
  [
    'Conditions d’utilisation',
    'Le musée est gratuit. On y dépose ses propres mots, ou ceux que l’on sait réellement d’une personne décédée. Il faut avoir 18 ans ou plus pour créer une trace.',
  ],
  [
    'Protection des données',
    'Tes données t’appartiennent, où que tu vives. Ton adresse e-mail sert seulement à retrouver tes bulles : elle n’est jamais montrée, vendue ni partagée. Tu peux à tout moment demander à consulter, modifier ou supprimer tes données, toutes ou en partie, en écrivant au fondateur.',
  ],
  [
    'Ce que tu autorises',
    'Publier permet au musée de garder et de montrer ce que tu publies. Le reste (archives de longue durée, musée et broderie, réseaux sociaux, messages privés) ne se fait qu’avec ton accord, que tu changes quand tu veux depuis ton compte.',
  ],
  [
    'Publication, scellement et signalements',
    'Publier scelle les quatre réponses pendant cinq ans ; chaque fragment est scellé à son dépôt. Chaque trace peut être signalée. Selon la gravité, le fondateur retire la bulle, ou ferme l’accès au musée : pour cela, une empreinte chiffrée de l’adresse IP de qui écrit est conservée (jamais l’adresse elle-même).',
  ],
  [
    'Mémoires de personnes décédées',
    'Une mémoire transmet ce que l’on sait réellement d’une personne, sans lui prêter de dernières paroles. Ses proches peuvent demander qu’elle soit retirée.',
  ],
  ['Après le décès de l’auteur', 'La trace reste telle que son auteur l’a laissée, sauf demande contraire de ses proches.'],
  ['Mentions légales', 'L’éditeur du site et son hébergeur seront nommés ici à l’ouverture du musée.'],
];

export function Juridique() {
  return (
    <Page mode="minimal" className="juridique">
      <h1 className="page-titre">Juridique & confidentialité</h1>
      <p className="lead">L’essentiel, en clair. Les textes complets sont en cours de rédaction et de relecture.</p>
      <ol className="juridique-liste">
        {JURIDIQUE.map(([titre, texte]) => (
          <li key={titre}>
            <h2 className="intertitre">{titre}</h2>
            <p>{texte}</p>
          </li>
        ))}
      </ol>
      <p>
        Pour toute question : <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
      </p>
    </Page>
  );
}

export function Archives() {
  const traces = allTraces();
  const annee = new Date().getFullYear();
  return (
    <Page className="archives">
      <h1 className="page-titre">Archives</h1>
      <p className="lead">Chaque année, le musée garde une image de lui-même : sa constellation, et son œuvre commune.</p>
      <div className="frise-cadre">
        <ol className="frise">
          {EDITIONS.map((e) => (
            <li key={e.id}>
              <span className="frise-date">{e.titre}</span>
              <span className="frise-texte">
                {e.note ? `${e.note}, ` : ''}
                {tracesDeLEdition(traces, e).length.toLocaleString('fr-FR')} présences
                <span className="frise-liens">
                  <Link to={`/archives/${e.id}`} className="frise-ouvrir">
                    Ouvrir la constellation <Icon name="fleche" size={14} />
                  </Link>
                  <Link to="/oeuvre-commune" className="frise-ouvrir">
                    Voir l’œuvre commune <Icon name="fleche" size={14} />
                  </Link>
                </span>
              </span>
            </li>
          ))}
          {EDITIONS.length === 0 && (
            <li>
              <span className="frise-date">{annee}</span>
              <span className="frise-texte">
                Le musée ouvre. La première édition sera datée ici.
                <span className="frise-liens">
                  <Link to="/" className="frise-ouvrir">
                    Ouvrir la constellation <Icon name="fleche" size={14} />
                  </Link>
                  <Link to="/oeuvre-commune" className="frise-ouvrir">
                    Voir l’œuvre commune <Icon name="fleche" size={14} />
                  </Link>
                </span>
              </span>
            </li>
          )}
        </ol>
      </div>
    </Page>
  );
}

export function Compte() {
  const { compte, pret } = useCompte();
  return (
    <Page className="compte-page">
      <h1 className="page-titre">Compte</h1>
      {!EN_LIGNE ? (
        <>
          <MesTraces />
          <CompteReglages />
        </>
      ) : !pret ? (
        <p className="lead muted">Un instant…</p>
      ) : compte ? (
        <CompteConnecte compte={compte} />
      ) : (
        <EntrerDansLeMusee />
      )}
    </Page>
  );
}

/** Entrer dans le musée sur la page Compte : l'adresse, le code reçu, puis retour à l'accueil, connecté. */
function EntrerDansLeMusee() {
  const navigate = useNavigate();
  return (
    <div className="compte-entrer">
      <p className="lead">Pour retrouver tes bulles sur cet appareil : ton adresse e-mail, puis le code à six chiffres que tu reçois. Pas de mot de passe.</p>
      <FormulaireCode onEntre={() => navigate('/')} />
    </div>
  );
}

/**
 * Le formulaire en deux temps : l'adresse, puis le code reçu par e-mail.
 * Utilisé sur la page Compte et pendant la création d'une trace.
 */
export function FormulaireCode({ onEntre, emailInitial = '', bouton = 'Recevoir mon code' }: { onEntre: () => void; emailInitial?: string; bouton?: string }) {
  const [email, setEmail] = useState(emailInitial);
  const [code, setCode] = useState('');
  const [etape, setEtape] = useState<'adresse' | 'code'>('adresse');
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState('');
  const [codeDev, setCodeDev] = useState<string | undefined>();
  const champCode = useRef<HTMLInputElement>(null);
  useEffect(() => setEmail((e) => e || emailInitial), [emailInitial]);

  const demander = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setEnvoi(true);
    setMessage('');
    try {
      setCodeDev((await demanderCode(email.trim())).code);
      setEtape('code');
      setCode('');
      window.setTimeout(() => champCode.current?.focus(), 50);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Le code n’a pas pu partir.');
    } finally {
      setEnvoi(false);
    }
  };
  const entrer = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnvoi(true);
    setMessage('');
    try {
      await entrerAvecCode(email.trim(), code.trim());
      onEntre();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Ce code ne fonctionne pas.');
    } finally {
      setEnvoi(false);
    }
  };

  if (etape === 'code')
    return (
      <form className="formulaire-code" onSubmit={entrer}>
        <p>
          Un code vient de partir vers <strong>{email.trim()}</strong>. Il est valable 15 minutes.
        </p>
        <label className="field">
          <span className="field-label">Le code reçu</span>
          <input
            ref={champCode}
            className="champ-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
          />
        </label>
        {codeDev && <p className="lien-dev">Serveur de développement : le code est {codeDev}.</p>}
        {message && (
          <p className="editeur-erreur" role="alert">
            {message}
          </p>
        )}
        <div className="editeur-actions">
          <button className="bouton" disabled={envoi || code.length !== 6}>
            {envoi ? 'Un instant…' : 'Entrer'}
          </button>
          <button type="button" className="lien-discret" onClick={() => void demander()} disabled={envoi}>
            Renvoyer un code
          </button>
          <button type="button" className="lien-discret" onClick={() => setEtape('adresse')}>
            Changer d’adresse
          </button>
        </div>
        <p className="muted petit">Rien reçu ? Regarde dans les courriers indésirables.</p>
      </form>
    );
  return (
    <form className="formulaire-code" onSubmit={demander}>
      <label className="field">
        <span className="field-label">Adresse e-mail</span>
        <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      {message && (
        <p className="editeur-erreur" role="alert">
          {message}
        </p>
      )}
      <button className="bouton" disabled={envoi || !/.+@.+\..+/.test(email)}>
        {envoi ? 'Envoi…' : bouton}
      </button>
    </form>
  );
}

/** Adresse e-mail, choix de confidentialité, protection des données : la même chose en ligne et dans l'aperçu. */
function CompteReglages() {
  const traces = [...useMesTraces()].sort((a, b) => (a.type === b.type ? 0 : a.type === 'personnelle' ? -1 : 1));
  const email = emailDuCompte();
  const [nouvelle, setNouvelle] = useState('');
  const [code, setCode] = useState('');
  const [etat, setEtat] = useState<'' | 'envoi' | 'code' | 'change' | 'erreur'>('');
  const [message, setMessage] = useState('');
  const [codeDev, setCodeDev] = useState<string | undefined>();

  const changer = async (e: React.FormEvent) => {
    e.preventDefault();
    setEtat('envoi');
    try {
      const r = await changerEmail(nouvelle.trim());
      setCodeDev(r.code);
      setEtat(r.confirmation ? 'code' : 'change');
      if (!r.confirmation) setNouvelle('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'L’adresse n’a pas pu être changée.');
      setEtat('erreur');
    }
  };
  const confirmer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await confirmerEmail(nouvelle.trim(), code.trim());
      setEtat('change');
      setNouvelle('');
      setCode('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Ce code ne fonctionne pas.');
    }
  };

  return (
    <div className="compte-reglages">
      <section className="compte-bloc" aria-labelledby="h-adresse">
        <h2 id="h-adresse" className="intertitre">
          Mon adresse e-mail
        </h2>
        <p className="compte-adresse">{email || <span className="muted">Aucune adresse pour l’instant : elle est demandée en créant ta trace.</span>}</p>
        <p className="muted petit">Elle sert seulement à retrouver tes bulles. Elle n’apparaît jamais sur ta trace.</p>
        {etat === 'change' && (
          <p className="compte-ok" role="status">
            C’est fait : ton adresse a changé.
          </p>
        )}
        {etat === 'code' ? (
          <form className="compte-changer" onSubmit={confirmer}>
            <p>
              Pour confirmer que c’est bien toi, un code vient de partir vers <strong>{nouvelle}</strong>. Ton adresse changera dès que tu
              l’auras donné ici (il est valable 15 minutes).
            </p>
            <label className="field">
              <span className="field-label">Le code reçu</span>
              <input
                className="champ-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
            </label>
            {codeDev && <p className="lien-dev">Serveur de développement : le code est {codeDev}.</p>}
            {message && (
              <p className="editeur-erreur" role="alert">
                {message}
              </p>
            )}
            <div className="editeur-actions">
              <button className="bouton bouton-discret" disabled={code.length !== 6}>
                Confirmer ma nouvelle adresse
              </button>
              <button type="button" className="lien-discret" onClick={() => setEtat('')}>
                Annuler
              </button>
            </div>
          </form>
        ) : (
          (email || !EN_LIGNE) && (
            <form className="compte-changer" onSubmit={changer}>
              <label className="field">
                <span className="field-label">Changer d’adresse</span>
                <input type="email" autoComplete="email" value={nouvelle} onChange={(e) => setNouvelle(e.target.value)} placeholder="nouvelle@adresse.fr" required />
              </label>
              <button className="bouton bouton-discret" disabled={etat === 'envoi' || !nouvelle.trim()}>
                {etat === 'envoi' ? 'Envoi…' : EN_LIGNE ? 'Recevoir un code de confirmation' : 'Changer'}
              </button>
              {etat === 'erreur' && (
                <p className="editeur-erreur" role="alert">
                  {message}
                </p>
              )}
            </form>
          )
        )}
      </section>

      {traces.length > 0 && (
        <section className="compte-bloc" aria-labelledby="h-choix">
          <h2 id="h-choix" className="intertitre">
            Mes choix de confidentialité
          </h2>
          <p className="muted petit">Ils ne sont pas scellés : un clic les change, tout de suite.</p>
          {traces.map((t) => (
            <fieldset key={t.id} className="compte-choix">
              <legend>{traces.length > 1 ? `${t.nom}, ${t.type === 'memoire' ? 'la mémoire' : 'ma trace'}` : t.nom}</legend>
              <ChoixConfidentialite trace={t} />
            </fieldset>
          ))}
        </section>
      )}

      <section className="compte-bloc" aria-labelledby="h-donnees">
        <h2 id="h-donnees" className="intertitre">
          Protection de mes données
        </h2>
        <p>
          Tes données t’appartiennent, où que tu vives. Ce que tu déposes est scellé pendant cinq ans, mais le scellement ne retire aucun de tes
          droits : tu peux m’écrire à tout moment pour consulter, modifier ou supprimer tes données, toutes ou en partie. Je m’en occupe
          moi-même, sans te demander de justification.
        </p>
        <p>
          <a href={`mailto:${CONTACT}?subject=${encodeURIComponent('Mes données')}`}>{CONTACT}</a>
        </p>
      </section>
    </div>
  );
}

function CompteConnecte({ compte }: { compte: CompteSession }) {
  const navigate = useNavigate();
  const [effacer, setEffacer] = useState('');
  const [erreur, setErreur] = useState('');
  return (
    <div className="compte-connecte">
      <MesTraces />
      <CompteReglages />
      <h2 className="intertitre">Et aussi</h2>
      <div className="liens-colonne">
        {compte.role !== 'membre' && (
          <Link to="/admin" className="lien-entrer">
            L’espace du fondateur <Icon name="fleche" size={16} />
          </Link>
        )}
        <a href={adresseApi('/api/moi/export')} className="lien-entrer" download>
          Emporter toutes mes données (fichier) <Icon name="fleche" size={16} />
        </a>
        <button className="lien-entrer" onClick={() => void seDeconnecter().then(() => navigate('/'))}>
          Me déconnecter de cet appareil <Icon name="fleche" size={16} />
        </button>
      </div>
      <details className="compte-effacer">
        <summary>Effacer mon compte et tout ce que j’ai déposé</summary>
        <p>
          Tout sera effacé : tes traces, tes fragments, tes fichiers, ton trait dans l’œuvre commune. Le scellement ne l’empêche pas : c’est ton
          droit. Cela ne peut pas être annulé. Écris <strong>EFFACER</strong> pour confirmer.
        </p>
        <input value={effacer} onChange={(e) => setEffacer(e.target.value)} aria-label="Écris EFFACER pour confirmer" />
        {erreur && (
          <p className="editeur-erreur" role="alert">
            {erreur}
          </p>
        )}
        <button
          className="bouton"
          disabled={effacer !== 'EFFACER'}
          onClick={() =>
            void effacerMonCompte()
              .then(() => navigate('/'))
              .catch((e) => setErreur(e instanceof Error ? e.message : 'L’effacement a échoué.'))
          }
        >
          Tout effacer
        </button>
      </details>
    </div>
  );
}
