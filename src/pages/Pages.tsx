import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Footer, PageTop } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { allTraces } from '../data/store';
import { useMuseumMode } from '../lib/museum';

function Page({ children, mode = 'texte', className = '' }: { children: ReactNode; mode?: 'texte' | 'minimal'; className?: string }) {
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
        Nous mourons trois fois. D’abord notre corps. Puis les objets qui rappelaient notre existence. Et enfin, la plus dure : le jour où
        plus personne ne se souvient de notre visage, de nos mots, de ce que nous avons partagé.
      </p>
      <div className="deux-colonnes">
        <div className="texte-courant">
          <p>
            Nos mots mémoriaux est né de la perte d’une personne chère. De cette conviction aussi : l’oubli ne devrait pas être le sort de
            celles et ceux qui ne sont pas célèbres. Les grandes figures laissent leurs dernières paroles, leurs œuvres, leurs citations. Les
            autres — nous — disparaissent avec tout ce qu’ils ont été.
          </p>
          <p>
            Ici, chacun peut déposer sa trace de son vivant : quatre questions, et autant de fragments d’existence qu’il le souhaite. Chaque
            personne devient une bulle. Toutes ont la même taille. Aucune n’est plus importante qu’une autre.
          </p>
          <p>
            Le musée est gratuit, pour visiter comme pour participer. Il n’y a ni compteur, ni classement, ni abonnés : seulement des
            présences qui coexistent calmement dans le même espace.
          </p>
          <h2 className="intertitre">Au-delà de l’écran</h2>
          <p>
            Avec l’accord de leurs auteurs, certains mots deviendront des tableaux brodés à la main, exposés un jour dans un musée
            physique, le profil complet présenté au dos de chaque œuvre. La mémoire collective du musée pourra aussi être confiée à des
            archives de très longue durée, comme l’Arctic World Archive.
          </p>
          <p className="vision">Lutter contre l’oubli.</p>
        </div>
        <figure className="objet-reel">
          <img src={tableauUrl} alt="Tableau brodé à la main en fil bordeaux sur satin clair, encadré de bois doré : « Nos mots mémoriaux »." loading="lazy" />
          <figcaption>
            Le premier tableau. Fil bordeaux sur satin, cadre doré — brodé à la main. C’est de lui que vient le logo.
          </figcaption>
        </figure>
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
  const n = allTraces().length;
  return (
    <Page className="archives">
      <h1 className="page-titre">Archives</h1>
      <p className="lead">La croissance du musée fait partie de son histoire. Ce n’est pas une popularité : c’est la taille de la mémoire collective.</p>
      <div className="frise-cadre">
        <ol className="frise">
          <li>
            <span className="frise-date">2026</span>
            <span className="frise-texte">Ouverture du musée — {n.toLocaleString('fr-FR')} présences (démonstration)</span>
          </li>
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
  return (
    <Page className="compte-page">
      <h1 className="page-titre">Compte</h1>
      <p className="lead">La connexion (e-mail vérifié, clé d’accès) arrivera avec la version connectée.</p>
      <div className="liens-colonne">
        <Link to="/ma-trace" className="lien-entrer">
          Ma trace et mes fragments <Icon name="fleche" size={16} />
        </Link>
        <Link to="/trace/sakinah" className="lien-entrer">
          Voir un exemple de trace complète <Icon name="fleche" size={16} />
        </Link>
      </div>
    </Page>
  );
}
