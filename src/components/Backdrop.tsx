import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { allTraces, apercu, getTrace, TYPE_LABEL, useMesTraces } from '../data/store';
import { Atmosphere, paperTexture } from '../engine/atmosphere';
import { clearSpriteCache } from '../engine/bubbleSprite';
import { Encre } from '../engine/encre';
import { Entree } from './Entree';
import { FondEau, reglagesEau } from '../engine/eau';
import { Ornements, varianteOrnements } from '../engine/ornements';
import { FOND_ESSAI, FOND_FEUTRE, FOND_VIDEO, FONDS, HD, HD_FILES, LEGER, loadMatieres, loadTaches, TOILE_BRUTE, TOILE_PLEINE, type Fond } from '../lib/hd';
import { Constellation, MODES } from '../engine/constellation';
import { colorById } from '../lib/palette';
import { useMuseum } from '../lib/museum';
import { TexteBrode } from './TexteBrode';
import { Icon } from './Icon';

// le fond qui coule comme une eau calme (?eau=0 le retire, pour comparer)
const EAU = reglagesEau();

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
  const [eauPrete, setEauPrete] = useState(false);
  useEffect(() => {
    if (!EAU || actif !== 'explorer' || !eauRef.current) return;
    const source = window.matchMedia('(max-aspect-ratio: 3/4)').matches ? FONDS.explorer.haut : FONDS.explorer.large;
    const e = new FondEau(eauRef.current, source, EAU, () => setEauPrete(true), () => engine.current?.cam, FOND_VIDEO ?? undefined);
    eau.current = e;
    e.start();
    const onResize = () => e.resize();
    window.addEventListener('resize', onResize);
    ((window as unknown as { __nmmDebug?: Record<string, unknown> }).__nmmDebug ??= {}).eau = e;
    return () => {
      window.removeEventListener('resize', onResize);
      e.stop();
      eau.current = null;
    };
  }, [actif]);
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
  useEffect(() => {
    let t = 0;
    // la vidéo passe après les taches d'aquarelle des bulles : elle ne leur vole pas la connexion
    const go = () => void loadTaches().then(() => (t = window.setTimeout(() => setPret(true), 1200)));
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
      {vus.map((f) => (
        <div key={f} className={`fond-peint fond-${f}${f === actif ? ' is-on' : ''}`} aria-hidden="true">
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
              <img src={FONDS[f].large} alt="" onError={(e) => ((e.currentTarget.closest('.fond-peint') as HTMLElement).hidden = true)} />
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

const ATMOSPHERE_BY_MODE = { explore: 1, perdre: 0.9, trace: 0.7, creer: 0.55, texte: 0.85, minimal: 0.3 } as const;

export function Backdrop() {
  const { engine, mode, reducedMotion, enPause } = useMuseum();
  const mesTraces = useMesTraces();
  const atmoRef = useRef<HTMLCanvasElement>(null);
  const cvsRef = useRef<HTMLCanvasElement>(null);
  const atmo = useRef<Atmosphere | null>(null);
  const ornRef = useRef<HTMLCanvasElement>(null);
  const orn = useRef<Ornements | null>(null);
  const hoverLabel = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const encreRef = useRef<HTMLCanvasElement>(null);
  const encre = useRef<Encre | null>(null);
  const enterBtn = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);
  const [paper] = useState(() => paperTexture());
  const navigate = useNavigate();

  // ——— création unique du fond et de la constellation
  useEffect(() => {
    const a = new Atmosphere(atmoRef.current!);
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
    const c = new Constellation(cvsRef.current!, presences);
    engine.current = c;
    if (HD && encreRef.current) encre.current = new Encre(encreRef.current, HD_FILES.encre);
    if (HD) {
      // les bulles s'affichent tout de suite en lavis provisoire, puis prennent leur vraie
      // matière d'aquarelle dès que les taches HD sont là (8 s au plus, sinon rendu procédural)
      c.spritesAllowed = false;
      const go = () => {
        clearSpriteCache();
        c.resetSprites();
        c.spritesAllowed = true;
      };
      const fallback = window.setTimeout(go, 8000);
      // les taches de base, plus les matières choisies par chacun
      loadMatieres(traces.map((t) => t.matiere)).then(() => {
        window.clearTimeout(fallback);
        go();
      });
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

    const onResize = () => {
      place();
      c.resize();
      orn.current?.resize();
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      orn.current?.stop();
      orn.current = null;
      a.stop();
      c.destroy();
      engine.current = null;
    };
  }, [engine]);

  // ——— événements du moteur → interface (sans re-rendu à chaque image)
  useEffect(() => {
    const c = engine.current;
    if (!c) return;
    c.events.onHover = (id) => setHovered(id);
    c.events.onSelect = (id) => setSelected(id);
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
  }, [engine]);

  // ——— état par page
  useEffect(() => {
    const c = engine.current;
    if (!c) return;
    c.setMode(mode);
    if (mode === 'explore') c.restore();
    else {
      c.select(null);
      setEntering(false);
    }
    atmo.current?.setIntensity(ATMOSPHERE_BY_MODE[mode]);
    orn.current?.setActif(mode === 'explore');
    // le shader s'efface avec la constellation (fondu CSS), puis s'arrête
    const t = window.setTimeout(() => atmo.current?.pause(mode !== 'explore'), mode === 'explore' ? 0 : 1900);
    return () => window.clearTimeout(t);
  }, [mode, engine]);

  useEffect(() => {
    engine.current?.setReducedMotion(reducedMotion);
    orn.current?.setReduit(reducedMotion);
  }, [reducedMotion, engine]);

  // le visiteur a mis le mouvement en pause : les bulles et la peinture s'arrêtent sur l'image
  useEffect(() => {
    engine.current?.setPause(enPause);
    atmo.current?.setStill(enPause);
    orn.current?.setPause(enPause);
  }, [enPause, engine]);

  // ta bulle se distingue, uniquement sur ton appareil
  useEffect(() => {
    engine.current?.setOwn(new Set(mesTraces.map((t) => t.id)));
  }, [mesTraces, engine]);

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
    if (pos && ink?.ready) {
      // l'encre de sa couleur s'ouvre depuis sa bulle, puis la mémoire apparaît
      await Promise.all([engine.current?.enter(selected), ink.play(pos.x, pos.y, pos.r, colorById(trace.couleur).hex, 1500)]);
      navigate(`/trace/${selected}`);
      window.setTimeout(() => ink.fadeOut(), 350);
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
          <div className={`lin-hd${TOILE_BRUTE || FOND_FEUTRE ? ' sous-toile-brute' : ''}`} aria-hidden="true" style={{ backgroundImage: `url(${HD_FILES.lin})` }} />
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
