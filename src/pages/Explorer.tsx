import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { editionParId, tracesDeLEdition } from '../data/archives';
import { colorById } from '../lib/palette';
import { allTraces, TYPE_LABEL, useMesTraces } from '../data/store';
import { RUBRIQUES, type RubriqueId, type Trace } from '../data/types';
import { Dock, Logo } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { useMuseum, useMuseumMode } from '../lib/museum';
import { appel, EN_LIGNE } from '../lib/api';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function searchable(t: Trace): string {
  const parts = [t.nom, t.pays ?? '', ...(t.questions ?? []), t.memoire?.aperçu ?? ''];
  for (const list of Object.values(t.rubriques)) for (const e of list ?? []) parts.push(e.titre ?? '', e.texte, e.lieu ?? '');
  return ' ' + norm(parts.join(' ')).replace(/[^a-z0-9]+/g, ' ');
}

export function Explorer() {
  useMuseumMode('explore');
  const { engine } = useMuseum();
  // une édition des archives : la même constellation, avec les présences de cette édition seulement
  const params = useParams();
  const edition = editionParId(params.edition);
  const traces = useMemo(() => (edition ? tracesDeLEdition(allTraces(), edition) : allTraces()), [edition]);
  useEffect(() => {
    const c = engine.current;
    const voulu = edition?.id ?? null;
    if (!c || c.edition === voulu) return;
    c.setPresences(traces.map((t) => ({ id: t.id, nom: t.nom, hex: colorById(t.couleur).hex, matiere: t.matiere })));
    c.edition = voulu;
  }, [engine, edition, traces]);
  const maTrace = useMesTraces().find((t) => traces.includes(t));
  const [hint, setHint] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  // une seule phrase, à la toute première visite, puis elle s'efface
  const [intro, setIntro] = useState(() => {
    try {
      return !localStorage.getItem('nmm:vu');
    } catch {
      return true;
    }
  });
  useEffect(() => {
    if (!intro) return;
    try {
      localStorage.setItem('nmm:vu', '1');
    } catch {
      /* ignore */
    }
    const t = window.setTimeout(() => setIntro(false), 9400);
    return () => window.clearTimeout(t);
  }, [intro]);

  // le fond autour du logo brodé reste calme et clair
  const logoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const place = () => {
      const r = logoRef.current?.getBoundingClientRect();
      if (r) engine.current?.setCalmZones([{ x: r.left - 10, y: r.top - 10, w: r.width + 20, h: r.height + 20 }]);
    };
    place();
    const t = window.setTimeout(place, 400);
    window.addEventListener('resize', place);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', place);
      engine.current?.setCalmZones([]);
    };
  }, [engine]);

  useEffect(() => {
    const c = engine.current;
    if (!c) return;
    const prev = c.events.onMoved;
    c.events.onMoved = () => setHint(false);
    return () => {
      c.events.onMoved = prev;
    };
  }, [engine]);

  // « Voir la bulle dans le musée » depuis un profil
  const location = useLocation();
  useEffect(() => {
    const focus = (location.state as { focus?: string } | null)?.focus;
    if (!focus) return;
    const t = window.setTimeout(() => engine.current?.focusOn(focus), 450);
    return () => window.clearTimeout(t);
  }, [location.state, engine]);

  // un lien partagé (#/bulle/…) : la vue glisse jusqu'à la bulle et son aperçu s'ouvre
  const navigate = useNavigate();
  useEffect(() => {
    const id = params.bulle;
    if (!id) return;
    setIntro(false);
    let essais = 0;
    let t = 0;
    const viser = () => {
      const c = engine.current;
      if (c?.has(id)) c.focusOn(id);
      else if (essais++ < 20) t = window.setTimeout(viser, 250);
      else navigate(`/trace/${id}`, { replace: true });
    };
    t = window.setTimeout(viser, 600);
    return () => window.clearTimeout(t);
  }, [params.bulle, engine, navigate]);

  useEffect(() => {
    const t = window.setTimeout(() => setHint(false), 9000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="explorer">
      <h1 className="sr-only">Nos Mots Mémoriaux, {edition ? `archives, édition ${edition.titre}` : 'la constellation des présences'}</h1>
      <div className="explorer-logo" ref={logoRef}>
        <Logo />
        {edition && (
          <p className="explorer-edition">
            <Link to="/archives" className="lien-discret petit">
              <Icon name="archive" size={14} /> Archives, édition {edition.titre}
            </Link>
            <span>{traces.length.toLocaleString('fr-FR')} présences</span>
          </p>
        )}
      </div>

      <div className="explorer-actions">
        <button className="lien-discret" onClick={() => setSearchOpen(true)} aria-expanded={searchOpen}>
          <Icon name="recherche" size={18} /> Rechercher
        </button>
        {maTrace && (
          <button className="lien-discret" onClick={() => engine.current?.focusOn(maTrace.id)}>
            <Icon name="lieu" size={18} /> Retrouver ma bulle
          </button>
        )}
      </div>

      <p className={`explorer-hint${hint ? '' : ' is-hidden'}`} aria-hidden={!hint}>
        <span className="hint-large">Glisse pour te promener, approche-toi avec la molette, clique sur une bulle pour la rencontrer.</span>
        <span className="hint-small">Glisse pour te promener, touche une bulle pour la rencontrer.</span>
      </p>

      {intro && (
        <p className="intro-phrase" aria-live="polite">
          Chaque bulle est une personne.
        </p>
      )}

      {traces.length === 0 && (
        <p className="explorer-vide">
          {edition ? 'Cette édition ne garde encore aucune présence.' : 'Le musée attend sa première présence.'}{' '}
          {!edition && <Link to="/creer">Déposer la tienne</Link>}
        </p>
      )}

      {searchOpen && <SearchPanel traces={traces} onClose={() => setSearchOpen(false)} />}
      <Dock />
    </div>
  );
}

function SearchPanel({ traces: source, onClose }: { traces: Trace[]; onClose: () => void }) {
  const { engine } = useMuseum();
  const [q, setQ] = useState('');
  const [type, setType] = useState<'tous' | Trace['type']>('tous');
  const [rubs, setRubs] = useState<RubriqueId[]>([]);
  const [pays, setPays] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const traces = useMemo(() => source.map((t) => ({ t, text: searchable(t) })), [source]);
  const allPays = useMemo(() => [...new Set(traces.map((x) => x.t.pays).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'fr')), [traces]);

  const active = q.trim() !== '' || type !== 'tous' || rubs.length > 0 || pays !== '';

  // En ligne, les bulles ne portent qu'un aperçu : le texte des fragments et les
  // rubriques remplies sont cherchés par le serveur.
  const [serveur, setServeur] = useState<Set<string> | null>(null);
  useEffect(() => {
    const mot = q.trim();
    if (!EN_LIGNE || (mot.length < 2 && rubs.length === 0)) {
      setServeur(null);
      return;
    }
    let annule = false;
    const minuterie = setTimeout(() => {
      const p = new URLSearchParams();
      if (mot.length >= 2) p.set('q', mot);
      if (rubs.length) p.set('rubriques', rubs.join(','));
      appel<{ ids: string[] }>('GET', `/api/recherche?${p}`)
        .then((d) => !annule && setServeur(new Set(d.ids)))
        .catch(() => !annule && setServeur(new Set()));
    }, 250);
    return () => {
      annule = true;
      clearTimeout(minuterie);
    };
  }, [q, rubs]);

  const results = useMemo(() => {
    if (!active) return [];
    const nq = norm(q.trim());
    return traces
      .filter(({ t, text }) =>
        (serveur
          ? serveur.has(t.id) || (rubs.length === 0 && !!nq && text.includes(' ' + nq))
          : (!nq || text.includes(' ' + nq)) && rubs.every((r) => (t.rubriques[r]?.length ?? 0) > 0)) &&
        (type === 'tous' || t.type === type) &&
        (!pays || t.pays === pays),
      )
      .map((x) => x.t);
  }, [traces, q, type, rubs, pays, active, serveur]);

  useEffect(() => {
    input.current?.focus();
  }, []);
  useEffect(() => {
    engine.current?.setMatch(active ? new Set(results.map((r) => r.id)) : null);
  }, [results, active, engine]);
  useEffect(() => () => engine.current?.setMatch(null), [engine]);

  // Pas de classement : les présences trouvées sont mélangées au hasard (jamais la popularité),
  // puis montrées par séries ; la liste défile dans le panneau.
  const melange = useMemo(() => {
    const m = results.slice();
    for (let i = m.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [m[i], m[j]] = [m[j]!, m[i]!];
    }
    return m;
  }, [results]);
  const [combien, setCombien] = useState(30);
  useEffect(() => setCombien(30), [results]);
  const shown = melange.slice(0, combien);

  return (
    <aside className="search-panel" aria-label="Rechercher et filtrer" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="search-head">
        <h2>Rechercher</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Fermer la recherche">
          <Icon name="fermer" size={18} />
        </button>
      </div>
      <label className="field">
        <span className="sr-only">Un nom, un mot, un lieu</span>
        <input ref={input} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Un nom, un mot, un lieu…" />
      </label>

      <fieldset className="filter">
        <legend>Type de trace</legend>
        <div className="chips">
          {(
            [
              ['tous', 'Toutes'],
              ['personnelle', 'Traces personnelles'],
              ['memoire', 'Mémoires'],
            ] as const
          ).map(([v, l]) => (
            <button key={v} className="chip" aria-pressed={type === v} onClick={() => setType(v)}>
              {l}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="filter">
        <legend>Fragments présents</legend>
        <div className="chips">
          {RUBRIQUES.map((r) => (
            <button
              key={r.id}
              className="chip"
              aria-pressed={rubs.includes(r.id)}
              onClick={() => setRubs((cur) => (cur.includes(r.id) ? cur.filter((x) => x !== r.id) : [...cur, r.id]))}
            >
              {r.titre}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span className="field-label">Pays associé</span>
        <select value={pays} onChange={(e) => setPays(e.target.value)}>
          <option value="">Tous les pays</option>
          {allPays.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>

      {active && (
        <div className="search-results" aria-live="polite">
          <p className="muted">
            {results.length === 0 ? 'Aucune présence ne correspond, pour l’instant.' : `${results.length} présence${results.length > 1 ? 's' : ''} correspond${results.length > 1 ? 'ent' : ''}.`}
          </p>
          <ul>
            {shown.map((t) => (
              <li key={t.id}>
                <button
                  className="result"
                  onClick={() => (engine.current?.has(t.id) ? engine.current.focusOn(t.id) : navigate(`/trace/${t.id}`))}
                >
                  <span className="result-nom">{t.nom}</span>
                  <span className="result-meta">{t.pays ?? TYPE_LABEL[t.type]}</span>
                </button>
              </li>
            ))}
          </ul>
          {melange.length > combien && (
            <button className="lien-discret search-plus" onClick={() => setCombien((n) => n + 30)}>
              Voir d’autres présences ({(melange.length - combien).toLocaleString('fr-FR')})
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
