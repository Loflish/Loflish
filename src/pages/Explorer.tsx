import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { allTraces, TYPE_LABEL } from '../data/store';
import { RUBRIQUES, type RubriqueId, type Trace } from '../data/types';
import { Dock, Logo } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { useMuseum, useMuseumMode } from '../lib/museum';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function searchable(t: Trace): string {
  const parts = [t.nom, t.pays ?? '', ...(t.questions ?? []), t.memoire?.aperçu ?? ''];
  for (const list of Object.values(t.rubriques)) for (const e of list ?? []) parts.push(e.titre ?? '', e.texte, e.lieu ?? '');
  return ' ' + norm(parts.join(' ')).replace(/[^a-z0-9]+/g, ' ');
}

export function Explorer() {
  useMuseumMode('explore');
  const { engine, reducedMotion } = useMuseum();
  const [moved, setMoved] = useState(false);
  const [hint, setHint] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

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
    c.events.onMoved = () => {
      setHint(false);
      setMoved(c.isMoved);
    };
    const id = window.setInterval(() => setMoved(c.isMoved), 800);
    return () => {
      c.events.onMoved = prev;
      window.clearInterval(id);
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

  useEffect(() => {
    const t = window.setTimeout(() => setHint(false), 9000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="explorer">
      <h1 className="sr-only">Nos mots mémoriaux — la constellation des présences</h1>
      <div className="explorer-logo" ref={logoRef}>
        <Logo />
      </div>

      <button className="explorer-search lien-discret" onClick={() => setSearchOpen(true)} aria-expanded={searchOpen}>
        <Icon name="recherche" size={18} /> Rechercher
      </button>

      {moved && (
        <button className="explorer-reset lien-discret" onClick={() => engine.current?.resetView()}>
          Revenir à l’ensemble
        </button>
      )}

      <p className={`explorer-hint${hint ? '' : ' is-hidden'}`} aria-hidden={!hint}>
        {reducedMotion ? 'Mouvement réduit · ' : ''}
        <span className="hint-large">Glisser pour se promener · molette pour s’approcher · cliquer sur une bulle pour la rencontrer</span>
        <span className="hint-small">Glisser · pincer · toucher une bulle</span>
      </p>

      <p className="demo-note">Prototype — les présences affichées sont des données de démonstration.</p>

      {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} />}
      <Dock />
    </div>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const { engine } = useMuseum();
  const [q, setQ] = useState('');
  const [type, setType] = useState<'tous' | Trace['type']>('tous');
  const [rubs, setRubs] = useState<RubriqueId[]>([]);
  const [pays, setPays] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const traces = useMemo(() => allTraces().map((t) => ({ t, text: searchable(t) })), []);
  const allPays = useMemo(() => [...new Set(traces.map((x) => x.t.pays).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'fr')), [traces]);

  const active = q.trim() !== '' || type !== 'tous' || rubs.length > 0 || pays !== '';
  const results = useMemo(() => {
    if (!active) return [];
    const nq = norm(q.trim());
    return traces
      .filter(({ t, text }) =>
        (!nq || text.includes(' ' + nq)) &&
        (type === 'tous' || t.type === type) &&
        (!pays || t.pays === pays) &&
        rubs.every((r) => (t.rubriques[r]?.length ?? 0) > 0),
      )
      .map((x) => x.t);
  }, [traces, q, type, rubs, pays, active]);

  useEffect(() => {
    input.current?.focus();
  }, []);
  useEffect(() => {
    engine.current?.setMatch(active ? new Set(results.map((r) => r.id)) : null);
  }, [results, active, engine]);
  useEffect(() => () => engine.current?.setMatch(null), [engine]);

  // Pas de classement : pertinence brute puis hasard (jamais la popularité).
  const shown = useMemo(() => results.slice().sort(() => Math.random() - 0.5).slice(0, 12), [results]);

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
              ['personnelle', TYPE_LABEL.personnelle],
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
        </div>
      )}
    </aside>
  );
}
