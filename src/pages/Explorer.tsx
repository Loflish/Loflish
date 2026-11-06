import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { editionParId, tracesDeLEdition } from '../data/archives';
import { colorById } from '../lib/palette';
import { allTraces, TYPE_LABEL, useMesTraces } from '../data/store';
import { RUBRIQUES, type RubriqueId, type Trace } from '../data/types';
import { Dock, Logo } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { useMuseum, useMuseumMode } from '../lib/museum';
import { useTitre } from '../lib/titre';
import { appel, EN_LIGNE } from '../lib/api';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function searchable(t: Trace): string {
  const parts = [t.nom, t.pays ?? '', ...(t.questions ?? []), t.memoire?.aperçu ?? ''];
  for (const list of Object.values(t.rubriques)) for (const e of list ?? []) parts.push(e.titre ?? '', e.texte, e.lieu ?? '');
  return ' ' + norm(parts.join(' ')).replace(/[^a-z0-9]+/g, ' ');
}

/** L'année de création, lue dans la date en toutes lettres (« 12 juin 2024 »). */
const anneeDe = (t: Trace) => /(\d{4})/.exec(t.creeLe)?.[1] ?? '';

/** Chaque caractère ramené à sa base (sans accent, en minuscule), un pour un : les positions restent celles du texte d'origine. */
const base = (chars: string[]) => chars.map((ch) => ch.normalize('NFD')[0]!.toLowerCase()).join('');

/** Le passage où le mot cherché apparaît (le nom mis à part) : quelques mots avant, le mot, quelques mots après. */
function extrait(t: Trace, mot: string): { avant: string; mot: string; apres: string } | null {
  if (!mot) return null;
  const textes = [...(t.questions ?? []), t.memoire?.aperçu ?? '', t.pays ?? ''];
  for (const list of Object.values(t.rubriques)) for (const e of list ?? []) textes.push(e.titre ?? '', e.texte, e.lieu ?? '');
  const cible = base([...mot]);
  for (const texte of textes) {
    if (!texte) continue;
    const chars = [...texte];
    const i = base(chars).indexOf(cible);
    if (i < 0) continue;
    const debut = Math.max(0, i - 36);
    const fin = Math.min(chars.length, i + cible.length + 60);
    return {
      avant: (debut > 0 ? '…' : '') + chars.slice(debut, i).join(''),
      mot: chars.slice(i, i + cible.length).join(''),
      apres: chars.slice(i + cible.length, fin).join('') + (fin < chars.length ? '…' : ''),
    };
  }
  return null;
}

/**
 * Lance un minuteur une fois l'écran d'entrée terminé (classe `entree-en-cours` sur <html>, posée par Entree) :
 * sinon les aides de la constellation expirent pendant l'entrée, et le visiteur arrive sans consigne.
 */
function apresEntree(fn: () => void, delai: number): () => void {
  const html = document.documentElement;
  let t = 0;
  const lancer = () => {
    t = window.setTimeout(fn, delai);
  };
  const obs = new MutationObserver(() => {
    if (html.classList.contains('entree-en-cours')) return;
    obs.disconnect();
    lancer();
  });
  if (html.classList.contains('entree-en-cours')) obs.observe(html, { attributes: true, attributeFilter: ['class'] });
  else lancer();
  return () => {
    obs.disconnect();
    window.clearTimeout(t);
  };
}

export function Explorer() {
  useMuseumMode('explore');
  const { engine, enPause, setEnPause } = useMuseum();
  // une édition des archives : la même constellation, avec les présences de cette édition seulement
  const params = useParams();
  const edition = editionParId(params.edition);
  useTitre(edition ? `Archives, ${edition.titre}` : undefined);
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
  // le visiteur s'est promené ou approché : « Revenir au centre » apparaît
  const [deplace, setDeplace] = useState(() => !!engine.current?.isMoved);
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
    return apresEntree(() => setIntro(false), 9400);
  }, [intro]);

  // le fond autour du logo brodé reste calme et clair
  const logoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const c = engine.current;
    const place = () => {
      const r = logoRef.current?.getBoundingClientRect();
      if (r) c?.setCalmZones([{ x: r.left - 10, y: r.top - 10, w: r.width + 20, h: r.height + 20 }]);
    };
    place();
    const t = window.setTimeout(place, 400);
    window.addEventListener('resize', place);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', place);
      c?.setCalmZones([]);
    };
  }, [engine]);

  useEffect(() => {
    const c = engine.current;
    if (!c) return;
    const prev = c.events.onMoved;
    c.events.onMoved = () => {
      setHint(false);
      setDeplace(true);
    };
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

  useEffect(() => apresEntree(() => setHint(false), 9000), []);

  // au clavier : « / » ou Ctrl+K ouvrent la recherche, Échap la ferme
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dansUnChamp = e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]');
      if (e.key === 'Escape' && searchOpen) {
        // la recherche et la fiche ouverte se ferment ensemble : un seul Échap pour revenir à la constellation nue
        engine.current?.select(null);
        return setSearchOpen(false);
      }
      if (dansUnChamp) return;
      if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  const auHasard = () => {
    const c = engine.current;
    const id = c?.auHasard(c.selectedId);
    if (id) c!.focusOn(id);
  };
  const recentrer = () => {
    engine.current?.select(null);
    engine.current?.resetView();
    setDeplace(false);
  };

  return (
    <div className="explorer" role="main">
      <h1 className="sr-only">Nos Mots Mémoriaux, {edition ? `archives, édition ${edition.titre}` : 'la constellation des traces'}</h1>
      <div className="explorer-logo" ref={logoRef}>
        <Logo />
        {edition && (
          <p className="explorer-edition">
            <Link to="/archives" className="lien-discret petit">
              <Icon name="archive" size={14} /> Archives, édition {edition.titre}
            </Link>
            <span>{traces.length.toLocaleString('fr-FR')} bulles</span>
          </p>
        )}
      </div>

      <div className="explorer-actions">
        <button className="lien-discret" onClick={() => setSearchOpen(true)} aria-expanded={searchOpen} aria-keyshortcuts="/ Control+K">
          <Icon name="recherche" size={18} /> Rechercher
        </button>
        <button className="lien-discret" onClick={() => setEnPause(!enPause)}>
          <Icon name={enPause ? 'play' : 'pause'} size={18} /> {enPause ? 'Reprendre le mouvement' : 'Mettre en pause'}
        </button>
        {traces.length > 1 && (
          <button className="lien-discret" onClick={auHasard}>
            <Icon name="onde" size={18} /> Une bulle au hasard
          </button>
        )}
        {maTrace && (
          <button className="lien-discret" onClick={() => engine.current?.focusOn(maTrace.id)}>
            <Icon name="lieu" size={18} /> Retrouver ma bulle
          </button>
        )}
        {deplace && (
          <button className="lien-discret" onClick={recentrer} aria-keyshortcuts="Home">
            <Icon name="retour" size={18} /> Revenir au centre
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
          {edition ? 'Cette édition ne garde encore aucune bulle.' : 'Le musée attend sa première bulle.'}{' '}
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
  // la période de création (cahier §12.4) : l'année où la trace a rejoint le musée
  const [annee, setAnnee] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const traces = useMemo(() => source.map((t) => ({ t, text: searchable(t), annee: anneeDe(t) })), [source]);
  const allPays = useMemo(() => [...new Set(traces.map((x) => x.t.pays).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'fr')), [traces]);
  const annees = useMemo(() => [...new Set(traces.map((x) => x.annee).filter(Boolean))].sort((a, b) => b.localeCompare(a)), [traces]);

  const active = q.trim() !== '' || type !== 'tous' || rubs.length > 0 || pays !== '' || annee !== '';
  const vider = () => {
    setQ('');
    setType('tous');
    setRubs([]);
    setPays('');
    setAnnee('');
    input.current?.focus();
  };

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
      .filter(
        ({ t, text, annee: a }) =>
          (serveur
            ? serveur.has(t.id) || (rubs.length === 0 && !!nq && text.includes(' ' + nq))
            : (!nq || text.includes(' ' + nq)) && rubs.every((r) => (t.rubriques[r]?.length ?? 0) > 0)) &&
          (type === 'tous' || t.type === type) &&
          (!pays || t.pays === pays) &&
          (!annee || a === annee),
      )
      .map((x) => x.t);
  }, [traces, q, type, rubs, pays, annee, active, serveur]);

  useEffect(() => {
    input.current?.focus();
  }, []);
  useEffect(() => {
    engine.current?.setMatch(active ? new Set(results.map((r) => r.id)) : null);
  }, [results, active, engine]);
  useEffect(() => {
    const c = engine.current;
    return () => c?.setMatch(null);
  }, [engine]);

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
  // la bulle trouvée se cadre toujours dans la constellation, même si elle n'y était pas (téléphone : 150 bulles sur 422) ;
  // sans constellation, la page s'ouvre directement
  const rencontrer = (t: Trace) => {
    const c = engine.current;
    if (!c) return navigate(`/trace/${t.id}`);
    if (!c.has(t.id)) c.addPresence({ id: t.id, nom: t.nom, hex: colorById(t.couleur).hex, matiere: t.matiere });
    c.focusOn(t.id);
  };
  const shown = melange.slice(0, combien);
  const mot = q.trim();

  return (
    <aside className="search-panel" aria-label="Rechercher et filtrer" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="search-head">
        <h2>Rechercher</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Fermer la recherche">
          <Icon name="fermer" size={18} />
        </button>
      </div>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          // Entrée avec une seule présence trouvée : on va la voir
          const seule = results.length === 1 ? results[0]! : null;
          if (seule) rencontrer(seule);
        }}
      >
        <label className="field">
          <span className="sr-only">Un nom, un mot, un lieu</span>
          <input ref={input} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Un nom, un mot, un lieu…" autoComplete="off" />
        </label>
        <p className="search-total">Parmi {source.length.toLocaleString('fr-FR')} traces.</p>
      </form>

      {active && (
        <div className="search-results" aria-live="polite">
          <p className="muted">
            {results.length === 0
              ? 'Aucune trace ne correspond, pour l’instant.'
              : `${results.length} trace${results.length > 1 ? 's' : ''} correspond${results.length > 1 ? 'ent' : ''}.`}
          </p>
          <button className="lien-discret petit search-vider" onClick={vider}>
            <Icon name="fermer" size={14} /> Effacer la recherche
          </button>
          <ul>
            {shown.map((t) => {
              const ex = mot.length >= 2 ? extrait(t, mot) : null;
              return (
                <li key={t.id}>
                  <button className="result" onClick={() => rencontrer(t)}>
                    <span className="result-nom">{t.nom}</span>
                    <span className="result-meta">{t.pays ?? TYPE_LABEL[t.type]}</span>
                    {ex && (
                      <span className="result-extrait" dir="auto">
                        {ex.avant}
                        <mark>{ex.mot}</mark>
                        {ex.apres}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          {melange.length > combien && (
            <button className="lien-discret search-plus" onClick={() => setCombien((n) => n + 30)}>
              Voir d’autres traces ({(melange.length - combien).toLocaleString('fr-FR')})
            </button>
          )}
        </div>
      )}

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

      {annees.length > 1 && (
        <fieldset className="filter filter-annees">
          <legend>Arrivée dans le musée</legend>
          <div className="chips">
            <button className="chip" aria-pressed={annee === ''} onClick={() => setAnnee('')}>
              Toutes les années
            </button>
            {annees.map((a) => (
              <button key={a} className="chip" aria-pressed={annee === a} onClick={() => setAnnee(annee === a ? '' : a)}>
                {a}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <label className="field">
        <span className="field-label">Pays associé</span>
        <select value={pays} onChange={(e) => setPays(e.target.value)}>
          <option value="">Tous les pays</option>
          {allPays.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>
    </aside>
  );
}
