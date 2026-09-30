import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Footer, PageTop } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { useMuseumMode } from '../lib/museum';

/**
 * Le musée, demain — maquettes du lieu physique. Ce sont des projections
 * (images et vidéos générées avec Higgsfield) : le lieu n'existe pas encore,
 * et la page le dit à chaque image, jamais comme de vraies photos.
 */

const base = `${import.meta.env.BASE_URL}musee/`;

interface Vue {
  image: string;
  video?: string;
  alt: string;
}

const SALLES: { id: string; titre: string; texte: string; vues: Vue[] }[] = [
  {
    id: 'constellation',
    titre: 'La constellation',
    texte:
      'On entre, et toutes les présences sont là. Une bulle de tissu teint à l’aquarelle par personne, suspendue à un fil. Toutes ont la même taille.',
    vues: [
      {
        image: 'constellation',
        video: 'constellation',
        alt: 'Une grande salle claire sous une verrière : des centaines de disques de tissu teints à l’aquarelle, tous de la même taille, suspendus à des fils. Deux visiteurs s’éloignent.',
      },
    ],
  },
  {
    id: 'galerie',
    titre: 'La galerie des mots brodés',
    texte:
      'Les mots confiés, brodés à la main sur du satin, dans des cadres dorés. On fait le tour de chaque tableau : au dos, le profil complet de la personne.',
    vues: [
      {
        image: 'galerie',
        video: 'galerie',
        alt: 'Une longue galerie aux murs peints en grands aplats sauge, ocre, bleu et rose. Des panneaux de lin portent des tableaux brodés encadrés d’or ; un visiteur se penche pour lire.',
      },
      {
        image: 'cabinet',
        video: 'cabinet',
        alt: 'Une salle aux panneaux de couleur où sont accrochés des tableaux brodés. Au centre, deux tableaux sur des pieds de chêne pivotants laissent voir leur dos.',
      },
    ],
  },
  {
    id: 'salon',
    titre: 'Le salon des souvenirs',
    texte:
      'Lire les traces, écouter les voix enregistrées, retrouver sur la carte peinte d’où viennent les présences. Un endroit pour rester.',
    vues: [
      {
        image: 'salon-lecture',
        video: 'salon-lecture',
        alt: 'Un salon aux tissus à petites fleurs et à carreaux, fauteuils et casques d’écoute ; au mur, une grande carte du monde peinte sur lin où sont épinglées de petites bulles de tissu.',
      },
      {
        image: 'salon-ecoute',
        video: 'salon-ecoute',
        alt: 'Un salon calme aux aplats bleu et ocre, face à une grande fenêtre sur un jardin. Une visiteuse écoute un enregistrement au casque, les yeux fermés, souriante.',
      },
    ],
  },
];

/**
 * Une vue de salle : l'image fixe, puis la déambulation lente quand elle est
 * à l'écran. La vidéo part de l'image et s'y refond à la fin : la boucle ne
 * se voit pas.
 */
function VueSalle({ vue }: { vue: Vue }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [repos, setRepos] = useState(true);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let attente = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) void v.play().catch(() => undefined);
        else v.pause();
      },
      { threshold: 0.45 },
    );
    io.observe(v);
    const onTime = () => {
      if (v.duration && v.duration - v.currentTime < 1.4) setRepos(true);
    };
    const onPlaying = () => setRepos(false);
    const onEnded = () => {
      attente = window.setTimeout(() => {
        v.currentTime = 0;
        void v.play().catch(() => undefined);
      }, 3500);
    };
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('playing', onPlaying);
    v.addEventListener('ended', onEnded);
    return () => {
      io.disconnect();
      window.clearTimeout(attente);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('playing', onPlaying);
      v.removeEventListener('ended', onEnded);
    };
  }, []);
  const img = `${base}${vue.image}`;
  return (
    <figure className="vue-salle">
      <div className="vue-cadre">
        {vue.video && (
          <video ref={ref} muted playsInline preload="none" poster={`${img}.webp`} aria-hidden="true">
            <source src={`${base}${vue.video}.webm`} type="video/webm" />
            <source src={`${base}${vue.video}.mp4`} type="video/mp4" />
          </video>
        )}
        <img className={repos ? 'is-on' : ''} src={`${img}.webp`} srcSet={`${img}-petit.webp 1024w, ${img}.webp 1920w`} sizes="(max-width: 900px) 100vw, 1100px" alt={vue.alt} loading="lazy" />
        <span className="vue-projection">Projection</span>
      </div>
    </figure>
  );
}

export function Musee() {
  useMuseumMode('texte');
  return (
    <main className="page page-texte musee">
      <PageTop />
      <div className="page-corps emerge">
        <h1 className="page-titre">Le musée, demain</h1>
        <p className="lead">
          Un jour, les traces sortiront de l’écran. Voici comment le lieu pourrait être : trois salles, calmes et lumineuses, où l’on vient
          rencontrer des présences.
        </p>
        <p className="projection-note">
          <Icon name="batiment" size={18} />
          Ce sont des projections : images et vidéos générées pour imaginer le lieu. Il n’existe pas encore.
        </p>
        {SALLES.map((s, i) => (
          <section key={s.id} className="salle-musee" aria-labelledby={`salle-${s.id}`}>
            <div className="salle-musee-cartel">
              <span className="salle-musee-numero">Salle {i + 1}</span>
              <h2 id={`salle-${s.id}`} className="intertitre">
                {s.titre}
              </h2>
              <p>{s.texte}</p>
            </div>
            <div className={`salle-musee-vues vues-${s.vues.length}`}>
              {s.vues.map((v) => (
                <VueSalle key={v.image} vue={v} />
              ))}
            </div>
          </section>
        ))}
        <p className="musee-suite">
          Les premiers tableaux brodés existent déjà.{' '}
          <Link to="/projet" className="lien-entrer">
            Voir le premier tableau <Icon name="fleche" size={16} />
          </Link>
        </p>
      </div>
      <Footer />
    </main>
  );
}
