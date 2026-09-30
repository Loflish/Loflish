import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

/**
 * Partager une trace. On essaie, dans l'ordre : le partage du téléphone, la
 * copie dans le presse-papiers, l'ancienne commande de copie ; si le
 * navigateur refuse tout (cadre intégré, permissions), le lien s'affiche pour
 * être copié à la main. Il se passe toujours quelque chose de visible.
 */

/** Adresse publique d'une trace (le musée utilise des adresses en #/…). */
export function lienTrace(id: string): string {
  return `${window.location.origin}${window.location.pathname}#/trace/${id}`;
}

async function copier(texte: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texte);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = texte;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

export function BoutonPartager({ titre, url }: { titre: string; url: string }) {
  const [etat, setEtat] = useState<'repos' | 'copie' | 'manuel'>('repos');
  const champ = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (etat === 'manuel') champ.current?.select();
    if (etat !== 'copie') return;
    const t = window.setTimeout(() => setEtat('repos'), 2400);
    return () => window.clearTimeout(t);
  }, [etat]);

  const partager = async () => {
    // sur téléphone, la feuille de partage du système
    if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title: `${titre} — Nos mots mémoriaux`, url });
        return;
      } catch (e) {
        if ((e as DOMException).name === 'AbortError') return;
      }
    }
    setEtat((await copier(url)) ? 'copie' : 'manuel');
  };

  return (
    <span className="partager">
      <button className="lien-discret" onClick={partager} aria-live="polite">
        <Icon name="partager" size={16} /> {etat === 'copie' ? 'Lien copié' : 'Partager'}
      </button>
      {etat === 'manuel' && (
        <span className="partager-manuel" role="dialog" aria-label="Lien à copier">
          <input ref={champ} readOnly value={url} aria-label="Lien de la trace" onFocus={(e) => e.currentTarget.select()} />
          <button className="lien-discret petit" onClick={() => setEtat('repos')}>
            Fermer
          </button>
        </span>
      )}
    </span>
  );
}
