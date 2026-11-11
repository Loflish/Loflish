import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { allTraces, apercu, getTrace, TYPE_LABEL, useMesTraces } from '../data/store';
import { Atmosphere, paperTexture } from '../engine/atmosphere';
import { clearSpriteCache } from '../engine/bubbleSprite';
import { Encre } from '../engine/encre';
import { Entree } from './Entree';
import { FondEau, reglagesEau } from '../engine/eau';
import { Ornements, varianteOrnements } from '../engine/ornements';
import { Filaments, varianteFils } from '../engine/filaments';
import { FOND_DES_PAGES, FOND_ESSAI, FOND_FEUTRE, FOND_VIDEO, FONDS, HD, HD_FILES, LEGER, loadMatieres, loadTaches, TOILE_BRUTE, TOILE_PLEINE, type Fond } from '../lib/hd';
import { Constellation, MODES } from '../engine/constellation';
import { colorById } from '../lib/palette';
import { estRouteExplorer, useMuseum } from '../lib/museum';
import { TexteBrode } from './TexteBrode';
import { Icon } from './Icon';

// le fond qui coule comme une eau calme (?eau=0 le retire, pour comparer)
const EAU = reglagesEau();

/**
 * La peinture de la constellation est arrivée (ou 2,5 s ont passé) : les taches des bulles ne partent qu'après, pour ne
 * pas lui disputer le réseau d'un téléphone (3 Mo de taches contre 480 Ko de peinture : la peinture arrivait en dernier).
 */
let fondArrive: () => void = () => undefined;
const fondPeint = new Promise<void>((r) => {
  fondArrive = r;
  window.setTimeout(r, 2500);
});

// la constellation garde sa peinture vivante ; partout ailleurs, le tissu
const FOND_BY_MODE: Record<keyof typeof MODES, Fond> = {
  explore: 'explorer',
  perdre: 'tissu',
  trace: 'tissu',
  creer: 'tissu',
  texte: 'tissu',
  minimal: 'tissu',
};

/**
 * Un fond peint par espace, en fondu enchaîné très lent. Chaque image n'est
 * chargée que la première fois que l'on entre dans l'espace correspondant.
 */
function FondsPeints({ actif }: { actif: Fond }) {
  const [vus, setVus] = useState<Fond[]>([actif]);
  const [video, setVideo] = useState(true);
  // la peinture fixe s'affiche d'abord ; la vidéo ne se charge qu'une fois la page prête
  const [pret, setPret] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { enPause, reducedMotion, engine } = useMuseum();
  const enPauseRef = useRef(enPause);
  // l'eau : la peinture fixe reste dessous jusqu'à ce que la toile qui coule soit prête
  const eauRef = useRef<HTMLCanvasElement>(null);
  const eau = useRef<FondEau | null>(null);
  const finEau = useRef<(() => void) | null>(null);
  const [eauPrete, setEauPrete] = useState(false);
  // l'eau naît à la première constellation et vit ensuite derrière toutes les pages, muette : la détruire et la
  // recréer à chaque retour rechargeait sa peinture (mesuré le 6 novembre : 306 ms de main + 188 ms de décodage)
  useEffect(() => {
    eau.current?.setActif(actif === 'explorer');
    if (!EAU || actif !== 'explorer' || !eauRef.current || eau.current) return;
    const toile = eauRef.current;
    const source = window.matchMedia('(max-aspect-ratio: 3/4)').matches ? FONDS.explorer.haut : FONDS.explorer.large;
    let e: FondEau | null = null;
    const onResize = () => e?.resize();
    // l'eau se prépare après les deux premières images : la peinture fixe et le logo sont déjà à l'écran
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        performance.mark('nmm:eau:debut');
        e = new FondEau(
          toile,
          source,
          EAU,
          () => setEauPrete(true),
          () => engine.current?.cam,
          FOND_VIDEO ?? undefined,
          FONDS.explorer.largeHD,
        );
        performance.measure('nmm:eau', 'nmm:eau:debut');
        eau.current = e;
        e.start();
        window.addEventListener('resize', onResize);
        ((window as unknown as { __nmmDebug?: Record<string, unknown> }).__nmmDebug ??= {}).eau = e;
      });
    });
    finEau.current = () => {
      window.removeEventListener('resize', onResize);
      e?.stop();
      eau.current = null;
    };
    return () => cancelAnimationFrame(raf);
  }, [actif, engine]);
  // l'eau ne s'arrête qu'avec le fond lui-même (jamais démonté en pratique)
  useEffect(() => () => finEau.current?.(), []);
  useEffect(() => {
    eau.current?.setPause(enPause);
    eau.current?.setReduit(reducedMotion);
  }, [enPause, reducedMotion, eauPrete]);
  useEffect(() => {
    enPauseRef.current = enPause;
    const v = videoRef.current;
    if (!v) return;
    if (enPause) v.pause();
    else if (!document.hidden) void v.play().catch(() => undefined);
  }, [enPause, pret, actif]);
  useEffect(() => setVus((v) => (v.includes(actif) ? v : [...v, actif])), [actif]);
  // la toute première peinture se montre sans fondu : c'est la plus grande image de la page, le navigateur la compte
  // comme « contenu principal » dès qu'elle est visible ; les fondus reprennent ensuite, d'un espace à l'autre
  const [premier, setPremier] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setPremier(false), 2500);
    return () => window.clearTimeout(t);
  }, []);
  useEffect(() => {
    let t = 0;
    // la vidéo (sans l'eau seulement) passe après les taches d'aquarelle des bulles : elle ne leur vole pas la connexion ;
    // avec l'eau, rien à attendre, et surtout pas les taches : hors de la constellation, elles ne se téléchargent pas
    const go = () => void (EAU ? Promise.resolve() : loadTaches()).then(() => (t = window.setTimeout(() => setPret(true), 1200)));
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go, { once: true });
    // onglet caché : la vidéo se repose
    const vis = () => {
      const v = videoRef.current;
      if (!v) return;
      if (document.hidden || enPauseRef.current) v.pause();
      else void v.play().catch(() => undefined);
    };
    document.addEventListener('visibilitychange', vis);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('load', go);
      document.removeEventListener('visibilitychange', vis);
    };
  }, []);
  return (
    <>
      {vus.filter((f) => f === 'explorer' || FOND_DES_PAGES).map((f) => (
        <div key={f} className={`fond-peint fond-${f}${f === actif ? ' is-on' : ''}${premier ? ' sans-fondu' : ''}`} aria-hidden="true">
          {/* la vidéo ne tourne que dans l'espace actif : ailleurs, l'image fixe suffit */}
          {/* la boucle vidéo anime le fond actuel : avec un fond à l'essai, la peinture fixe (le shader la fait respirer) */}
          {f === 'explorer' && f === actif && !LEGER && video && pret && !FOND_ESSAI && !EAU ? (
            <video ref={videoRef} poster={FONDS.explorer.large} autoPlay muted loop playsInline>
              {HD_FILES.fondVideo.map((s, i, all) => (
                <source key={s.src} src={s.src} type={s.type} onError={i === all.length - 1 ? () => setVideo(false) : undefined} />
              ))}
            </video>
          ) : (
            <picture>
              <source media="(max-aspect-ratio: 3/4)" srcSet={FONDS[f].haut} />
              <img
                src={FONDS[f].large}
                alt=""
                onLoad={f === 'explorer' ? () => fondArrive() : undefined}
                onError={(e) => ((e.currentTarget.closest('.fond-peint') as HTMLElement).hidden = true)}
              />
            </picture>
          )}
          {f === 'explorer' && EAU && <canvas ref={eauRef} className={`fond-eau${eauPrete ? ' est-prete' : ''}`} />}
          {/* l'entrée du musée : des gouttes déposent cette peinture même sur le papier vierge */}
          {f === 'explorer' && f === actif && EAU && <Entree eau={eau} pret={eauPrete} />}
        </div>
      ))}
    </>
  );
}

// les ornements de Palerme : seulement si l'adresse les demande, le temps de les juger (?palerme=1)
const VARIANTE_ORNEMENTS = varianteOrnements();
/** essai du 11 novembre : la constellation tissée de fils qui suivent un courant (`?fils=1`, `?fils=2` plus dense) */
const VARIANTE_FILS = varianteFils();

const ATMOSPHERE_BY_MODE = { explore: 1, perdre: 0.9, trace: 0.7, creer: 0.55, texte: 0.85, minimal: 0.3 } as const;
/**
 * Chantier 5 (cahier §53.6, trois intensités) : derrière les pages éditoriales (B, accompagnement) et les profils, les nappes
 * continuent de respirer, aux aplats des Nabis ; formulaires et juridique (C, retrait) restent sur le papier seul.
 * `?nappes=0` rend les pages d'avant.
 */
// 5 novembre : Tom n'aime pas le drap coloré derrière les pages ; il reste derrière ?nappes=1 pour comparer
const NAPPES = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('nappes') === '1';
const AVEC_NAPPES = new Set<keyof typeof MODES>(NAPPES ? (Object.keys(MODES) as (keyof typeof MODES)[]) : ['explore']);
if (!NAPPES && typeof document !== 'undefined') document.documentElement.classList.add('sans-nappes');

export function Backdrop() {
  const { engine, mode, reducedMotion, enPause } = useMuseum();
  const mesTraces = useMesTraces();
  const atmoRef = useRef<HTMLCanvasElement>(null);
  const cvsRef = useRef<HTMLCanvasElement>(null);
  const atmo = useRef<Atmosphere | null>(null);
  const ornRef = useRef<HTMLCanvasElement>(null);
  const orn = useRef<Ornements | null>(null);
  const filsRef = useRef<HTMLCanvasElement>(null);
  const fils = useRef<Filaments | null>(null);
  const hoverLabel = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const encreRef = useRef<HTMLCanvasElement>(null);
  const encre = useRef<Encre | null>(null);
  const enterBtn = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);
  // le papier procédural ne sert que sans les matières HD
  const [paper] = useState(() => (HD ? '' : paperTexture()));
  const navigate = useNavigate();
  // la page où l'on est vraiment (le mode, lui, vaut « explore » un instant au premier rendu de toute page)
  const { pathname } = useLocation();
  const enConstellation = pathname === '/' || pathname.startsWith('/bulle/') || /^\/archives\/./.test(pathname);
  const chargerTaches = useRef<() => void>(() => undefined);
  const tachesDemandees = useRef(false);
  // Le moteur n'est créé que la première fois qu'une adresse montre la constellation : un profil ou une page
  // de texte ouverts directement (lien partagé, favori) ne paient ni le shader, ni les bulles. Il est créé dans
  // le même rendu que la page Explorer, avant ses propres effets : elle le trouve toujours prêt.
  // (Avec ?nappes=1, les nappes vivent derrière toutes les pages : le moteur est alors créé d'emblée.)
  const besoinRef = useRef(false);
  if (estRouteExplorer(pathname) || NAPPES) besoinRef.current = true;
  const moteur = besoinRef.current;
  // le lin (410 Ko) ne sert qu'aux pages : il arrive quand la page est chargée et le navigateur libre, jamais devant la peinture
  const [lin, setLin] = useState(false);
  useEffect(() => {
    let id = 0;
    const plusTard = () => {
      const ric = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
      id = ric ? ric(() => setLin(true)) : window.setTimeout(() => setLin(true), 1500);
    };
    if (document.readyState === 'complete') plusTard();
    else window.addEventListener('load', plusTard, { once: true });
    return () => {
      window.removeEventListener('load', plusTard);
      window.clearTimeout(id);
    };
  }, []);

  // ——— création unique du fond et de la constellation
  useEffect(() => {
    if (!moteur) return;
    // marques de performance (onglet Performance, ou performance.getEntriesByType('measure')) : où part le temps au démarrage
    performance.mark('nmm:atmosphere:debut');
    const a = new Atmosphere(atmoRef.current!);
    performance.measure('nmm:atmosphere', 'nmm:atmosphere:debut');
    atmo.current = a;
    const place = () => {
      // zone calme autour du logo brodé (en haut à gauche, sur une ligne)
      const logo = document.querySelector('.logo img')?.getBoundingClientRect();
      if (logo && logo.width) a.setCalmZone(logo.left + logo.width / 2, logo.top + logo.height / 2, logo.width * 0.62);
      else a.setCalmZone(190, 50, 220);
      a.resize();
    };
    window.setTimeout(place, 600);
    place();
    a.run();

    const traces = allTraces();
    const presences = traces.map((t) => ({ id: t.id, nom: t.nom, hex: colorById(t.couleur).hex, matiere: t.matiere }));
    performance.mark('nmm:constellation:debut');
    const c = new Constellation(cvsRef.current!, presences);
    performance.measure('nmm:constellation', 'nmm:constellation:debut');
    engine.current = c;
    if (HD) {
      // les bulles s'affichent tout de suite en lavis provisoire, puis prennent leur vraie
      // matière d'aquarelle dès que les taches HD sont là (8 s au plus après leur départ, sinon rendu procédural)
      c.spritesAllowed = false;
      tachesDemandees.current = false;
      const go = () => {
        clearSpriteCache();
        // les matières partent vers le travailleur (s'il y en a un), puis les bulles se repeignent, les visibles d'abord
        void c.peintre.envoyerMatieres().then(() => {
          c.resetSprites();
          c.spritesAllowed = true;
        });
      };
      chargerTaches.current = () => {
        if (tachesDemandees.current) return;
        tachesDemandees.current = true;
        const fallback = window.setTimeout(go, 8000);
        // après la peinture du fond : les taches de base, plus les matières choisies par chacun
        void fondPeint
          .then(() => Promise.all([loadTaches(), loadMatieres(traces.map((t) => t.matiere))]))
          .then(() => {
            window.clearTimeout(fallback);
            go();
          });
      };
    }
    // accès pour les tests automatisés (captures, mesures de fluidité)
    Object.assign(((window as unknown as { __nmmDebug?: Record<string, unknown> }).__nmmDebug ??= {}), { atmo: a, engine: c });
    c.start();
    if (VARIANTE_ORNEMENTS && ornRef.current) {
      const o = new Ornements(ornRef.current, VARIANTE_ORNEMENTS, () => engine.current?.cam);
      orn.current = o;
      o.start();
      (window as unknown as { __nmmDebug: Record<string, unknown> }).__nmmDebug.orn = o;
    }
    if (VARIANTE_FILS && filsRef.current) {
      // les fils lisent la caméra et la place des bulles à l'écran : le moteur n'est pas modifié
      const vues = () => {
        const e = engine.current;
        const l: { x: number; y: number; r: number; hex: string }[] = [];
        if (!e) return l;
        const W = window.innerWidth, H = window.innerHeight;
        for (const p of presences) {
          const s = e.screenPos(p.id);
          if (s && s.x > -s.r * 3 && s.x < W + s.r * 3 && s.y > -s.r * 3 && s.y < H + s.r * 3) l.push({ x: s.x, y: s.y, r: s.r, hex: p.hex });
        }
        return l;
      };
      const haut = window.matchMedia('(max-aspect-ratio: 3/4)').matches;
      const f = new Filaments(filsRef.current, VARIANTE_FILS, () => engine.current?.cam, vues, haut ? FONDS.explorer.haut : FONDS.explorer.large);
      fils.current = f;
      f.start();
      (window as unknown as { __nmmDebug: Record<string, unknown> }).__nmmDebug.fils = f;
    }

    const onResize = () => {
      place();
      c.resize();
      orn.current?.resize();
      fils.current?.resize();
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      orn.current?.stop();
      orn.current = null;
      fils.current?.stop();
      fils.current = null;
      a.stop();
      c.destroy();
      engine.current = null;
    };
  }, [engine, moteur]);

  /**
   * La vidéo d'encre (170 Ko) ne se charge qu'au premier geste vers une bulle (survol ou touche), jamais avec la
   * page ; et pas du tout si la personne a demandé d'économiser les données. D'ici le clic sur « Entrer », elle est prête.
   */
  const preparerEncre = () => {
    if (encre.current || !HD || !encreRef.current) return;
    if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;
    encre.current = new Encre(encreRef.current, HD_FILES.encre);
  };

  // la page de la trace se télécharge au premier moment calme : l'encre ne coule plus sur un script en train
  // d'arriver (mesuré le 6 novembre : 176 à 200 ms de lecture au milieu de la transition)
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (n: number) => void };
    // l'encre aussi : sa vidéo se télécharge maintenant, pas au premier clic (sinon la première entrée se faisait sans elle)
    const preparer = () => {
      void import('../pages/TracePage');
      // l'encre ne sert qu'à qui est dans la constellation : une page ouverte directement ne la télécharge pas
      if (engine.current) preparerEncre();
    };
    if (w.requestIdleCallback) {
      const n = w.requestIdleCallback(preparer, { timeout: 6000 });
      return () => w.cancelIdleCallback?.(n);
    }
    const t = window.setTimeout(preparer, 3000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ——— événements du moteur → interface (sans re-rendu à chaque image)
  useEffect(() => {
    const c = engine.current;
    if (!c) return;
    c.events.onHover = (id) => {
      if (id) preparerEncre();
      setHovered(id);
    };
    c.events.onSelect = (id) => {
      if (id) preparerEncre();
      setSelected(id);
    };
    // un second clic sur la bulle ouverte vaut « Entrer dans sa mémoire »
    c.events.onEnter = () => enterBtn.current?.click();
    c.events.onFrame = () => {
      const hl = hoverLabel.current;
      const show = c.hoverId && c.hoverId !== c.selectedId ? c.hoverId : null;
      if (hl) {
        const pos = show ? c.screenPos(show) : null;
        if (pos) {
          // le nom se pose à côté de la bulle, comme le cartel d'une œuvre (à gauche près du bord droit)
          const gauche = pos.x + pos.r + 12 + hl.offsetWidth > window.innerWidth - 12;
          const x = gauche ? pos.x - pos.r - 12 - hl.offsetWidth : pos.x + pos.r + 12;
          hl.style.transform = `translate(${x}px, ${pos.y}px) translateY(-55%)`;
          hl.dataset.visible = 'true';
        } else hl.dataset.visible = 'false';
      }
      const card = cardRef.current;
      if (card && c.selectedId && window.innerWidth >= 700) {
        const pos = c.screenPos(c.selectedId);
        if (pos) {
          const cw = card.offsetWidth;
          const ch = card.offsetHeight;
          let x = pos.x + pos.r + 22;
          if (x + cw > window.innerWidth - 20) x = pos.x - pos.r - 22 - cw;
          const y = Math.max(80, Math.min(window.innerHeight - ch - 110, pos.y - ch / 2));
          card.style.transform = `translate(${x}px, ${y}px)`;
        }
      }
    };
  }, [engine, moteur]);

  // ——— état par page
  useEffect(() => {
    const c = engine.current;
    if (!c) return;
    // les taches des bulles (jusqu'à 3 Mo) ne se téléchargent qu'à la première entrée dans la constellation :
    // qui arrive par un lien sur une trace ne les paie pas (Lighthouse mobile, 3 novembre : 14 s de retard sur la bulle)
    if (mode === 'explore' && enConstellation) chargerTaches.current();
    c.setMode(mode);
    if (mode === 'explore') c.restore();
    else {
      c.select(null);
      setEntering(false);
    }
    atmo.current?.setIntensity(ATMOSPHERE_BY_MODE[mode]);
    atmo.current?.setPage(mode === 'explore' ? 0 : 1);
    orn.current?.setActif(mode === 'explore');
    fils.current?.setActif(mode === 'explore');
    // le shader s'efface avec la constellation (fondu CSS), puis s'arrête
    const t = window.setTimeout(() => atmo.current?.pause(!AVEC_NAPPES.has(mode)), AVEC_NAPPES.has(mode) ? 0 : 1900);
    return () => window.clearTimeout(t);
  }, [mode, engine, enConstellation, moteur]);

  useEffect(() => {
    engine.current?.setReducedMotion(reducedMotion);
    orn.current?.setReduit(reducedMotion);
    fils.current?.setReduit(reducedMotion);
  }, [reducedMotion, engine, moteur]);

  // le visiteur a mis le mouvement en pause : les bulles et la peinture s'arrêtent sur l'image
  useEffect(() => {
    engine.current?.setPause(enPause);
    atmo.current?.setStill(enPause);
    orn.current?.setPause(enPause);
    fils.current?.setPause(enPause);
  }, [enPause, engine, moteur]);

  // ta bulle se distingue, uniquement sur ton appareil
  useEffect(() => {
    engine.current?.setOwn(new Set(mesTraces.map((t) => t.id)));
  }, [mesTraces, engine, moteur]);

  useEffect(() => {
    if (selected && document.activeElement === cvsRef.current) enterBtn.current?.focus({ preventScroll: true });
  }, [selected]);

  const trace = selected ? getTrace(selected) : undefined;
  const interactive = MODES[mode].interactive;

  const enter = async () => {
    if (!selected || !trace) return;
    setEntering(true);
    const pos = engine.current?.screenPos(selected);
    const ink = encre.current;
    // si la vidéo de l'encre arrive juste, on lui laisse 400 ms : mieux vaut un court instant qu'une entrée sans encre
    if (ink && !ink.ready) await new Promise<void>((res) => { const t0 = performance.now(); const voir = () => (ink.ready || performance.now() - t0 > 400 ? res() : requestAnimationFrame(voir)); voir(); });
    if (pos && ink?.ready) {
      // l'encre de sa couleur s'ouvre depuis sa bulle, puis la mémoire apparaît
      // 1,4 s pour couvrir (départ lent depuis la bulle), 150 ms de page sous l'encre, puis 900 ms de fondu
      await Promise.all([engine.current?.enter(selected), ink.play(pos.x, pos.y, pos.r, colorById(trace.couleur).hex, 1400)]);
      navigate(`/trace/${selected}`);
      window.setTimeout(() => ink.fadeOut(), 150);
    } else {
      await engine.current?.enter(selected);
      navigate(`/trace/${selected}`);
    }
  };

  return (
    <div className={`backdrop mode-${mode}`} aria-hidden={!interactive}>
      {HD && <FondsPeints actif={FOND_BY_MODE[mode]} />}
      <canvas ref={atmoRef} className={`backdrop-atmosphere${HD ? ' sur-fond-peint' : ''}`} aria-hidden="true" />
      {VARIANTE_ORNEMENTS && (
        <canvas ref={ornRef} className={`backdrop-ornements${VARIANTE_ORNEMENTS === 'klimt' ? ' colle-au-fond' : ''}`} aria-hidden="true" />
      )}
      {VARIANTE_FILS && <canvas ref={filsRef} className="backdrop-fils" aria-hidden="true" />}
      <canvas
        ref={cvsRef}
        className="backdrop-constellation"
        tabIndex={interactive ? 0 : -1}
        role="application"
        aria-label="Constellation des présences. Chaque bulle est une personne."
        style={{ pointerEvents: interactive ? 'auto' : 'none' }}
      />
      {HD ? (
        <>
          <div
            className={`lin-hd${TOILE_BRUTE || FOND_FEUTRE ? ' sous-toile-brute' : ''}`}
            aria-hidden="true"
            style={lin || mode !== 'explore' ? { backgroundImage: `url(${HD_FILES.lin})` } : undefined}
          />
          {TOILE_BRUTE && (
            <div className={`toile-brute${TOILE_PLEINE ? ' toile-pleine' : ''}`} aria-hidden="true" style={{ backgroundImage: `url(${TOILE_BRUTE})` }} />
          )}
          {/* toutes les pages sauf la constellation : le papier de la carte d'aperçu, ivoire, et ses fibres de chiffon */}
          <div className="papier-page" aria-hidden="true" />
          <div className="fibres" aria-hidden="true" />
        </>
      ) : (
        <div className="paper" aria-hidden="true" style={{ backgroundImage: paper ? `url(${paper})` : undefined }} />
      )}
      <div className={`veil${entering ? ' is-on' : ''}`} aria-hidden="true" />
      {/* au-dessus des pages : l'encre recouvre encore la mémoire qui s'ouvre */}
      {createPortal(<canvas ref={encreRef} className="encre" aria-hidden="true" hidden />, document.body)}

      <div className="names" aria-hidden="true">
        <div ref={hoverLabel} className="name-label" data-visible="false">
          {hovered ? getTrace(hovered)?.nom : ''}
        </div>
      </div>

      {interactive &&
        trace &&
        createPortal(
          <div
            ref={cardRef}
            className={`apercu${entering ? ' is-leaving' : ''}${trace.type === 'memoire' ? ' apercu-memoire' : ''}`}
            role="dialog"
            // le lavis de l'étiquette prend la couleur GRIS de la personne
            style={{ ['--bulle' as string]: colorById(trace.couleur).hex }}
            aria-label={`Aperçu de ${trace.nom}`}
            onKeyDown={(e) => e.key === 'Escape' && engine.current?.select(null)}
          >
            <button className="apercu-close" onClick={() => engine.current?.select(null)} aria-label="Fermer l’aperçu">
              <Icon name="fermer" size={16} />
            </button>
            <p className="apercu-nom">{trace.nom}</p>
            <p className="apercu-type">
              {TYPE_LABEL[trace.type]}
              {trace.pays ? `, ${trace.pays}` : ''}
            </p>
            <p className="apercu-texte">
              <TexteBrode texte={apercu(trace)} />
            </p>
            <button ref={enterBtn} className="lien-entrer" onClick={enter}>
              Entrer dans sa mémoire <Icon name="fleche" size={16} />
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
