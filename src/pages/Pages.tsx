import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Footer, PageTop } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { EDITIONS, tracesDeLEdition } from '../data/archives';
import { allTraces, changerEmail, demanderLien, effacerMonCompte, emailDuCompte, modifierParametres, seDeconnecter, useCompte, useMesTraces, verifierLien, type CompteSession } from '../data/store';
import { CONTACT } from '../lib/contact';
import { adresseApi, DEMO, EN_LIGNE } from '../lib/api';
import { APRES_CONNEXION } from './Creer';
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

const tableauUrl = `${import.meta.env.BASE_URL}objets/tableau-nos-mots-memoriaux.webp`;

export function Projet() {
  return (
    <Page className="projet">
      <h1 className="page-titre">Le projet</h1>
      <p className="lead">
        Nous mourons trois fois. D’abord notre corps. Puis nos possessions, qui se dispersent. Et enfin l’oubli : la mort la plus
        fatale, celle qui confirme que nous n’existons plus pour personne, pas même dans le cœur de celles et ceux qui nous ont connus.
      </p>
      <p className="projet-mission">
        Mon objectif : perpétuer chacune de vos existences, pour que le monde de demain apprenne à vous connaître à travers vos
        propres mots. Des mots qui deviendront mémoriaux.
      </p>

      <div className="deux-colonnes">
        <div className="texte-courant">
          <h2 className="intertitre">Pourquoi ce musée</h2>
          <p>
            J’ai toujours trouvé injuste que la mort des célébrités soit tellement plus documentée que celle des inconnus, comme vous et
            moi. Nous, nous laissons une épitaphe, un testament, quelques souvenirs à nos proches. Nous restons gravés dans le cœur de
            ceux qui nous ont aimés, mais tôt ou tard, le monde oublie notre visage, notre voix, nos souvenirs, l’existence que nous avons
            construite. Puis ces personnes partent à leur tour, et notre trace s’efface pour toutes les générations qui suivent. Il ne
            reste qu’une date, un chiffre parmi d’autres.
          </p>
          <p>
            Il est normal que l’on raconte la vie de celles et ceux qui ont cherché la gloire. Mais nous n’avons pas encore la chance de
            découvrir, nous aussi, le parcours de personnes que nous ne connaissons pas. Je crois que chaque vie mérite d’être
            entendue, que l’on ait le sentiment d’avoir accompli la sienne ou non. Écouter la vie de l’autre, c’est apprendre l’empathie,
            et sortir un peu de l’individualisme.
          </p>
          <p>
            Nous cherchons déjà à laisser une trace : sur les réseaux sociaux, auprès de nos proches, parfois auprès d’inconnus. Nos
            mots mémoriaux offre à ce besoin un lieu fait pour durer.
          </p>
        </div>
        <figure className="objet-reel">
          <img src={tableauUrl} alt="Tableau brodé à la main en fil bordeaux sur satin clair, encadré de bois doré : « Nos mots mémoriaux »." loading="lazy" />
          <figcaption>
            Le premier tableau. Fil bordeaux sur satin, cadre doré — brodé à la main. C’est de lui que vient le logo.
          </figcaption>
        </figure>
      </div>

      <section className="projet-section" aria-labelledby="h-chance">
        <h2 id="h-chance" className="intertitre">Une chance très ancienne</h2>
        <p className="projet-intro">Pendant des siècles, pouvoir prononcer ses dernières paroles a été vu comme une chance.</p>
        <div className="projet-cartes deux">
          <article className="projet-carte">
            <p className="projet-carte-lieu">Europe, Moyen Âge</p>
            <blockquote>« De la mort subite et imprévue, délivre-nous, Seigneur. »</blockquote>
            <p>
              On le priait dans les églises. Ce que l’on redoutait le plus, c’était de partir sans avoir eu le temps de dire adieu, de
              pardonner, de transmettre.
            </p>
          </article>
          <article className="projet-carte">
            <p className="projet-carte-lieu">Japon, depuis le XIIIᵉ siècle</p>
            <blockquote>
              « Malade en voyage —<br />
              mes rêves errent
              <br />
              sur la lande desséchée. »
            </blockquote>
            <p>
              Des moines zen et des poètes écrivent un dernier poème, le <em>jisei</em>, pour laisser au monde un regard apaisé sur leur
              vie. Celui-ci est le dernier haïku de Bashō, en 1694.
            </p>
          </article>
        </div>
        <p className="projet-conclusion">
          Nos mots mémoriaux redonne cette chance à chacun, sans attendre la fin : ici, de votre vivant et à votre rythme, vous écrivez
          votre propre poésie.
        </p>
      </section>

      <section className="projet-section" aria-labelledby="h-comment">
        <h2 id="h-comment" className="intertitre">Comment ça marche</h2>
        <ol className="projet-etapes">
          <li>
            <span className="projet-etape-icone" aria-hidden="true">
              <Icon name="plume" size={26} />
            </span>
            <h3>Quatre questions</h3>
            <p>Ce que vous diriez à vous-même, à la personne que vous aimez, au monde entier. Puis l’essentiel, en 200 caractères.</p>
          </li>
          <li>
            <span className="projet-etape-icone" aria-hidden="true">
              <Icon name="image" size={26} />
            </span>
            <h3>Des fragments d’existence</h3>
            <p>Facultatifs : souvenirs, les cinq sens, personnes, lieux, œuvres, petites choses… Autant que vous le souhaitez.</p>
          </li>
          <li>
            <span className="projet-etape-icone" aria-hidden="true">
              <Icon name="bulle" size={26} />
            </span>
            <h3>Une bulle</h3>
            <p>Votre trace devient une bulle dans la constellation. Toutes ont la même taille : aucune n’est plus importante qu’une autre.</p>
          </li>
        </ol>
        <p className="projet-note">Le musée est gratuit, pour visiter comme pour participer. Ni compteur, ni classement, ni abonnés.</p>
      </section>

      <section className="projet-section" aria-labelledby="h-defi">
        <h2 id="h-defi" className="intertitre">Mon défi</h2>
        <p className="projet-intro">
          Réunir les mots mémoriaux de toute une génération, pour celle d’aujourd’hui comme pour celles qui viendront. Chaque trace
          compte, même la plus courte : plus nous serons nombreux, plus cette mémoire collective aura de force pour exister au-delà de
          l’écran.
        </p>
        <p className="projet-intro">Avec votre accord, et seulement avec lui, vos mots pourront vivre ailleurs :</p>
        <ol className="projet-cartes trois">
          <li className="projet-carte">
            <Icon name="projet" size={24} />
            <h3>Un musée</h3>
            <p>Certains mots deviendront des tableaux brodés à la main, exposés dans un vrai musée, le profil complet présenté au dos de chaque œuvre.</p>
          </li>
          <li className="projet-carte">
            <Icon name="archive" size={24} />
            <h3>L’Arctic World Archive</h3>
            <p>
              Une copie de la mémoire du musée confiée à cette archive creusée dans une montagne du Svalbard, pensée pour traverser les
              siècles. Sans frais pour vous.
            </p>
          </li>
          <li className="projet-carte">
            <Icon name="reseau" size={24} />
            <h3>Les réseaux sociaux</h3>
            <p>Certains mots partagés sur les réseaux du projet, pour que d’autres les découvrent.</p>
          </li>
        </ol>
      </section>

      <p className="vision">Lutter contre l’oubli.</p>
      <div className="projet-actions">
        <Link to="/creer" className="lien-entrer">
          Déposer ma trace <Icon name="fleche" size={16} />
        </Link>
        <Link to="/" className="lien-discret">
          Se promener dans le musée
        </Link>
      </div>
    </Page>
  );
}

const LIGNES = [
  ['France', '3114', 'Numéro national de prévention du suicide — 24 h/24, gratuit'],
  ['Belgique', '0800 32 123', 'Centre de Prévention du Suicide — 24 h/24'],
  ['Suisse', '143', 'La Main Tendue — 24 h/24'],
  ['Canada / Québec', '988', 'Ligne d’aide en cas de crise suicidaire — 24 h/24'],
  ['États-Unis', '988', 'Suicide & Crisis Lifeline — 24 h/24'],
  ['Royaume-Uni & Irlande', '116 123', 'Samaritans — 24 h/24'],
];

export function Ressources() {
  return (
    <Page className="ressources">
      <h1 className="page-titre">Ressources & aide</h1>
      <section className="aide-urgente" aria-labelledby="h-aide">
        <h2 id="h-aide" className="intertitre">Si tu penses au suicide, tu n’es pas seul·e.</h2>
        <p>
          Nos mots mémoriaux parle de la mémoire et de la vie, pas d’y mettre fin. Si tu traverses un moment très difficile, des personnes
          formées peuvent t’écouter maintenant, gratuitement, sans jugement, dans ton pays et dans ta langue.
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
          <p className="muted petit">Liste à vérifier avant la mise en ligne ; pour tous les autres pays, findahelpline.com.</p>
        </details>
      </section>
      <div className="deux-colonnes">
        <section className="texte-courant">
          <h2 className="intertitre">Comment fonctionne le musée</h2>
          <p>
            Les brouillons restent privés. Une trace devient publique quand son auteur scelle ses quatre réponses : elles ne changent
            plus pendant cinq ans. Chaque fragment ajouté ensuite est scellé à son tour, au moment où il est déposé.
          </p>
        </section>
        <section className="texte-courant">
          <h2 className="intertitre">Signaler un contenu</h2>
          <p>
            Haine, harcèlement, contenus violents ou illégaux : chaque trace peut être signalée. La modération est semi-automatisée, et
            chaque décision peut être contestée.
          </p>
        </section>
      </div>
    </Page>
  );
}

export function Soutenir() {
  return (
    <Page className="soutenir">
      <h1 className="page-titre">Soutenir</h1>
      <p className="lead">Le musée est et restera gratuit. Les dons permettent de le faire vivre et de préserver les traces dans le temps.</p>
      <div className="trois-colonnes">
        {[
          ['Faire vivre le musée', 'Hébergement, sécurité, modération.'],
          ['Préserver les traces', 'Sauvegardes et archives de très longue durée.'],
          ['Broder les mots', 'Fil, toile, cadres, et un jour un lieu d’exposition.'],
        ].map(([t, d]) => (
          <div key={t} className="colonne-texte">
            <h2 className="intertitre">{t}</h2>
            <p>{d}</p>
          </div>
        ))}
      </div>
      <p className="muted">Prototype : aucun paiement n’est activé.</p>
    </Page>
  );
}

export function Juridique() {
  return (
    <Page mode="minimal" className="juridique">
      <h1 className="page-titre">Juridique & confidentialité</h1>
      <p className="lead">Textes en cours de rédaction et de validation juridique. Structure prévue :</p>
      <ol className="sommaire">
        {[
          'Conditions d’utilisation',
          'Politique de confidentialité et données personnelles (RGPD)',
          'Droits nécessaires au fonctionnement et droits facultatifs',
          'Règles de publication et de modération',
          'Traces de tiers et mémoires de personnes décédées',
          'Âge minimum : 18 ans pour créer une trace',
          'Après le décès de l’auteur',
          'Archivage longue durée',
          'Mentions légales',
        ].map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </Page>
  );
}

export function Archives() {
  const traces = allTraces();
  return (
    <Page className="archives">
      <h1 className="page-titre">Archives</h1>
      <p className="lead">La croissance du musée fait partie de son histoire. Ce n’est pas une popularité : c’est la taille de la mémoire collective.</p>
      <div className="frise-cadre">
        <ol className="frise">
          {EDITIONS.map((e) => (
            <li key={e.id}>
              <Link to={`/archives/${e.id}`} className="frise-lien">
                <span className="frise-date">{e.titre}</span>
                <span className="frise-texte">
                  {e.note} — {tracesDeLEdition(traces, e).length.toLocaleString('fr-FR')} présences{DEMO ? ' (démonstration)' : ''}
                  <span className="frise-ouvrir">
                    Ouvrir la constellation <Icon name="fleche" size={14} />
                  </span>
                </span>
              </Link>
            </li>
          ))}
          {EDITIONS.length === 0 && (
            <li>
              <span className="frise-date">{new Date().getFullYear()}</span>
              <span className="frise-texte">Le musée ouvre. La première édition sera datée ici.</span>
            </li>
          )}
          <li>
            <span className="frise-date">À venir</span>
            <span className="frise-texte">Premier instantané daté du musée, confié à une archive de très longue durée.</span>
          </li>
        </ol>
      </div>
    </Page>
  );
}

export function Compte() {
  const { compte, pret } = useCompte();
  if (!EN_LIGNE) {
    return (
      <Page className="compte-page">
        <h1 className="page-titre">Compte</h1>
        <p className="lead">Ce prototype garde tout dans ton navigateur. Dans le vrai musée, on entre avec un simple lien envoyé par e-mail.</p>
        <CompteReglages />
      </Page>
    );
  }
  return (
    <Page className="compte-page">
      <h1 className="page-titre">Compte</h1>
      {!pret ? <p className="lead muted">Un instant…</p> : compte ? <CompteConnecte compte={compte} /> : <DemandeLien />}
    </Page>
  );
}

/** Les choix de chacun sur ses données : ce ne sont pas des contenus, ils ne sont jamais scellés. */
const CHOIX: { cle: 'archivageLongueDuree' | 'droitsReutilisation' | 'reseauxSociaux' | 'feedbackPrive'; titre: string; detail: string }[] = [
  {
    cle: 'archivageLongueDuree',
    titre: 'Archives de longue durée',
    detail: 'Confier une copie de ma trace aux archives patrimoniales (comme l’Arctic World Archive).',
  },
  {
    cle: 'droitsReutilisation',
    titre: 'Musée et broderie',
    detail: 'Permettre que mes mots soient présentés dans le futur musée et deviennent une œuvre brodée à la main.',
  },
  {
    cle: 'reseauxSociaux',
    titre: 'Réseaux sociaux',
    detail: 'Permettre que certains de mes mots soient partagés sur les réseaux sociaux du projet.',
  },
  {
    cle: 'feedbackPrive',
    titre: 'Messages privés',
    detail: 'Accepter de recevoir des messages privés à propos de ma trace (jamais affichés publiquement).',
  },
];

/** Adresse e-mail, choix sur les données, demande de suppression : la même chose en ligne et dans le prototype. */
function CompteReglages() {
  const traces = useMesTraces();
  const [params] = useSearchParams();
  const email = emailDuCompte();
  const [nouvelle, setNouvelle] = useState('');
  const [etat, setEtat] = useState<'' | 'envoi' | 'envoye' | 'change' | 'erreur'>(params.get('adresse') === 'changee' ? 'change' : '');
  const [message, setMessage] = useState('');
  const [lienDev, setLienDev] = useState<string | undefined>();
  const [erreurChoix, setErreurChoix] = useState('');

  const changer = async (e: React.FormEvent) => {
    e.preventDefault();
    setEtat('envoi');
    try {
      const r = await changerEmail(nouvelle.trim());
      setLienDev(r.lien);
      setEtat(r.confirmation ? 'envoye' : 'change');
      if (!r.confirmation) setNouvelle('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'L’adresse n’a pas pu être changée.');
      setEtat('erreur');
    }
  };

  return (
    <div className="compte-reglages">
      <section className="compte-bloc" aria-labelledby="h-adresse">
        <h2 id="h-adresse" className="intertitre">
          Mon adresse e-mail
        </h2>
        <p className="compte-adresse">{email || <span className="muted">Aucune adresse pour l’instant : elle est demandée en créant ta trace.</span>}</p>
        <p className="muted petit">Elle sert seulement à entrer dans le musée. Elle n’apparaît jamais sur ta trace.</p>
        {etat === 'change' && <p className="compte-ok" role="status">C’est fait : ton adresse a changé.</p>}
        {etat === 'envoye' ? (
          <p className="compte-ok" role="status">
            Un lien de confirmation est parti vers <strong>{nouvelle}</strong>. Ton adresse changera dès que tu l’auras ouvert (il est valable
            20 minutes).
            {lienDev && <LienDeveloppement lien={lienDev} />}
          </p>
        ) : (
          (email || !EN_LIGNE) && (
            <form className="compte-changer" onSubmit={changer}>
              <label className="field">
                <span className="field-label">Changer d’adresse</span>
                <input type="email" autoComplete="email" value={nouvelle} onChange={(e) => setNouvelle(e.target.value)} placeholder="nouvelle@adresse.fr" required />
              </label>
              <button className="bouton bouton-discret" disabled={etat === 'envoi' || !nouvelle.trim()}>
                {etat === 'envoi' ? 'Envoi…' : EN_LIGNE ? 'Recevoir un lien de confirmation' : 'Changer'}
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

      <section className="compte-bloc" aria-labelledby="h-choix">
        <h2 id="h-choix" className="intertitre">
          Ce que j’autorise
        </h2>
        <p className="muted petit">
          Tes choix sur l’usage de ta trace. Ils ne sont pas scellés : tu peux les changer quand tu veux, ils prennent effet tout de suite.
        </p>
        {traces.length === 0 ? (
          <p className="compte-vide">
            Tu n’as pas encore de trace. <Link to="/creer">Créer ma trace</Link>
          </p>
        ) : (
          traces.map((t) => (
            <fieldset key={t.id} className="compte-choix">
              <legend>
                {t.nom} <span className="muted petit">· {t.type === 'memoire' ? 'mémoire' : 'ma trace'}</span>
              </legend>
              {CHOIX.map((c) => (
                <label key={c.cle} className="check">
                  <input
                    type="checkbox"
                    checked={!!t.parametres?.[c.cle]}
                    onChange={(e) =>
                      void modifierParametres(t.id, { [c.cle]: e.target.checked })
                        .then(() => setErreurChoix(''))
                        .catch((err) => setErreurChoix(err instanceof Error ? err.message : 'Ce choix n’a pas pu être enregistré.'))
                    }
                  />
                  <span>
                    <strong>{c.titre}</strong> — {c.detail}
                  </span>
                </label>
              ))}
            </fieldset>
          ))
        )}
        {erreurChoix && (
          <p className="editeur-erreur" role="alert">
            {erreurChoix}
          </p>
        )}
      </section>

      <section className="compte-bloc" aria-labelledby="h-suppression">
        <h2 id="h-suppression" className="intertitre">
          Supprimer certaines données
        </h2>
        <p>
          Ce que tu déposes est scellé pendant cinq ans, mais le scellement ne retire aucun de tes droits. Si tu souhaites supprimer
          certaines de tes données avant, écris-moi en privé : <a href={`mailto:${CONTACT}?subject=Suppression%20de%20donn%C3%A9es`}>{CONTACT}</a>.
          Je les retirerai, comme le prévoit le RGPD.
        </p>
      </section>
    </div>
  );
}

/** Hors production, le serveur renvoie aussi le lien : pratique pour essayer sans boîte mail. */
export function LienDeveloppement({ lien }: { lien: string }) {
  const hash = lien.slice(lien.indexOf('#') + 1);
  return (
    <span className="lien-dev">
      Serveur de développement : <a href={`#${hash.replace(/^#/, '')}`}>ouvrir le lien directement</a>
    </span>
  );
}

/** Entrer : sans mot de passe, un lien arrive par e-mail. */
function DemandeLien() {
  const [email, setEmail] = useState('');
  const [etat, setEtat] = useState<'' | 'envoi' | 'envoye' | 'erreur'>('');
  const [message, setMessage] = useState('');
  const [lien, setLien] = useState<string | undefined>();
  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    setEtat('envoi');
    try {
      setLien((await demanderLien(email.trim())).lien);
      setEtat('envoye');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Le lien n’a pas pu partir.');
      setEtat('erreur');
    }
  };
  if (etat === 'envoye')
    return (
      <p className="lead">
        Un lien t’attend dans ta boîte mail (<strong>{email}</strong>). Il est valable 20 minutes et ne sert qu’une fois.
        {lien && <LienDeveloppement lien={lien} />}
      </p>
    );
  return (
    <form className="editeur compte-lien" onSubmit={envoyer}>
      <p className="lead">Pas de mot de passe : donne ton adresse, tu recevras un lien pour entrer.</p>
      <label className="field">
        <span className="field-label">Adresse e-mail</span>
        <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      {etat === 'erreur' && (
        <p className="editeur-erreur" role="alert">
          {message}
        </p>
      )}
      <button className="bouton" disabled={etat === 'envoi'}>
        {etat === 'envoi' ? 'Envoi…' : 'Recevoir mon lien'}
      </button>
    </form>
  );
}

function CompteConnecte({ compte }: { compte: CompteSession }) {
  const navigate = useNavigate();
  const [effacer, setEffacer] = useState('');
  const [erreur, setErreur] = useState('');
  return (
    <div className="compte-connecte">
      <CompteReglages />
      <h2 className="intertitre">Et aussi</h2>
      <div className="liens-colonne">
        {compte.role !== 'membre' && (
          <Link to="/admin" className="lien-entrer">
            L’espace de l’équipe du musée <Icon name="fleche" size={16} />
          </Link>
        )}
        <a href={adresseApi('/api/moi/export')} className="lien-entrer" download>
          Emporter toutes mes données (fichier) <Icon name="fleche" size={16} />
        </a>
        <button className="lien-entrer" onClick={() => void seDeconnecter().then(() => navigate('/'))}>
          Me déconnecter <Icon name="fleche" size={16} />
        </button>
      </div>
      <details className="compte-effacer">
        <summary>Effacer mon compte et tout ce que j’ai déposé</summary>
        <p>
          Tout sera effacé : tes traces, tes fragments, tes médias, ton trait dans l’œuvre commune. Le scellement ne l’empêche pas : c’est
          ton droit. Cela ne peut pas être annulé. Écris <strong>EFFACER</strong> pour confirmer.
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

/** Le lien reçu par e-mail : il ouvre la session, puis publie le brouillon s'il attendait. */
export function Connexion() {
  useMuseumMode('texte');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [erreur, setErreur] = useState('');
  const fait = useRef(false);
  useEffect(() => {
    if (fait.current) return;
    fait.current = true;
    const jeton = params.get('jeton');
    if (!jeton) return setErreur('Ce lien est incomplet.');
    verifierLien(jeton)
      .then((r) => {
        if (r.changement) return navigate('/compte?adresse=changee', { replace: true });
        let publier = false;
        try {
          publier = localStorage.getItem(APRES_CONNEXION) === '1';
        } catch {
          /* ignore */
        }
        navigate(publier ? '/creer?publier=1' : '/ma-trace', { replace: true });
      })
      .catch((e) => setErreur(e instanceof Error ? e.message : 'Ce lien ne fonctionne pas.'));
  }, [params, navigate]);
  return (
    <main className="page page-texte">
      <PageTop />
      <div className="page-corps emerge">
        {erreur ? (
          <>
            <p className="lead">{erreur}</p>
            <Link to="/compte" className="lien-entrer">
              Recevoir un nouveau lien <Icon name="fleche" size={16} />
            </Link>
          </>
        ) : (
          <p className="lead muted">Un instant, la porte s’ouvre…</p>
        )}
      </div>
    </main>
  );
}
