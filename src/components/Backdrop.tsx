import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { allTraces, apercu, getTrace, TYPE_LABEL, useMesTraces } from '../data/store';
import { Atmosphere, paperTexture } from '../engine/atmosphere';
import { clearSpriteCache } from '../engine/bubbleSprite';
import { Encre } from '../engine/encre';
import { FONDS, HD, HD_FILES, LEGER, loadMatieres, loadTaches, type Fond } from '../lib/hd';
import { Constellation, MODES } from '../engine/constellation';
import { colorById } from '../lib/palette';
import { useMuseum } from '../lib/museum';
import { TexteBrode } from './TexteBrode';
import { Icon } from './Icon';

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
      if (document.hidden) v.pause();
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
          {f === 'explorer' && f === actif && !LEGER && video && pret ? (
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
        </div>
      ))}
    </>
  );
}

const ATMOSPHERE_BY_MODE = { explore: 1, perdre: 0.9, trace: 0.7, creer: 0.55, texte: 0.85, minimal: 0.3 } as const;

export function Backdrop() {
  const { engine, mode, reducedMotion } = useMuseum();
  const mesTraces = useMesTraces();
  const atmoRef = useRef<HTMLCanvasElement>(null);
  const cvsRef = useRef<HTMLCanvasElement>(null);
  const atmo = useRef<Atmosphere | null>(null);
  const hoverLabel = useRef<HTMLDivElement>(null);
  const nearLabels = useRef<(HTMLDivElement | null)[]>([]);
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
    (window as unknown as Record<string, unknown>).__nmmDebug = { atmo: a, engine: c };
    c.start();

    const onResize = () => {
      place();
      c.resize();
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
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
          hl.style.transform = `translate(${pos.x}px, ${pos.y + pos.r + 8}px) translateX(-50%)`;
          hl.dataset.visible = 'true';
        } else hl.dataset.visible = 'false';
      }
      nearLabels.current.forEach((el, i) => {
        if (!el) return;
        const id = c.nearIds[i];
        const pos = id ? c.screenPos(id) : null;
        if (pos && id) {
          el.textContent = c.presence(id)?.nom ?? '';
          el.style.transform = `translate(${pos.x}px, ${pos.y + pos.r + 6}px) translateX(-50%)`;
          el.dataset.visible = 'true';
        } else el.dataset.visible = 'false';
      });
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
  }, [mode, engine]);

  useEffect(() => {
    engine.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion, engine]);

  // ta bulle se distingue — uniquement sur ton appareil, pour toi seul·e
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
      <canvas
        ref={cvsRef}
        className="backdrop-constellation"
        tabIndex={interactive ? 0 : -1}
        role="application"
        aria-label="Constellation des présences. Flèches pour se déplacer, plus et moins pour s’approcher, Entrée pour rencontrer la présence la plus proche du centre."
        style={{ pointerEvents: interactive ? 'auto' : 'none' }}
      />
      {HD ? (
        <>
          <div className="lin-hd" aria-hidden="true" style={{ backgroundImage: `url(${HD_FILES.lin})` }} />
          {/* les fibres du papier chiffon, sur le tissu de toutes les pages sauf la constellation */}
          <div className="fibres" aria-hidden="true" />
        </>
      ) : (
        <div className="paper" aria-hidden="true" style={{ backgroundImage: paper ? `url(${paper})` : undefined }} />
      )}
      <div className={`veil${entering ? ' is-on' : ''}`} aria-hidden="true" />
      {/* au-dessus des pages : l'encre recouvre encore la mémoire qui s'ouvre */}
      {createPortal(<canvas ref={encreRef} className="encre" aria-hidden="true" hidden />, document.body)}

      <div className="names" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="name-label is-near" ref={(el) => (nearLabels.current[i] = el)} data-visible="false" />
        ))}
        <div ref={hoverLabel} className="name-label" data-visible="false">
          {hovered ? getTrace(hovered)?.nom : ''}
        </div>
      </div>

      {interactive &&
        trace &&
        createPortal(
        <div
          ref={cardRef}
          className={`apercu${entering ? ' is-leaving' : ''}`}
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
            {trace.pays ? ` · ${trace.pays}` : ''}
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
