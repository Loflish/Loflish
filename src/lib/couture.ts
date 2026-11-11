import { useEffect } from 'react';

/**
 * Les coutures se cousent quand elles entrent dans l'écran.
 * Chaque partie qui commence par une couture reçoit `data-cousu` la première fois qu'elle est vue ;
 * le CSS (base.css) fait le reste. Les éléments ajoutés plus tard (une salle qui s'ouvre,
 * une étape du parcours) sont pris en compte. Si le système demande moins de mouvement,
 * le CSS montre les coutures déjà cousues : ce crochet ne change alors rien de visible.
 */
/** Les parties qui commencent par une couture : la même liste que dans src/styles/pages.css. */
const COUTURES =
  '[data-couture], .bloc, .site-footer, .projet-section, .verif, .ma-trace-bloc, .compte-bloc + .compte-bloc, .juridique-liste > li';

export function useCoutures(): void {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      document.documentElement.classList.add('sans-couture-animee');
      return;
    }
    const vues = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.cousu = '';
          vues.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
    );
    const suivre = (racine: ParentNode) => {
      for (const el of racine.querySelectorAll<HTMLElement>(COUTURES)) if (!('cousu' in el.dataset)) vues.observe(el);
    };
    suivre(document);
    const ajouts = new MutationObserver((mutations) => {
      for (const m of mutations)
        for (const n of m.addedNodes) {
          if (!(n instanceof HTMLElement)) continue;
          if (n.matches(COUTURES) && !('cousu' in n.dataset)) vues.observe(n);
          suivre(n);
        }
    });
    ajouts.observe(document.body, { childList: true, subtree: true });
    return () => {
      vues.disconnect();
      ajouts.disconnect();
    };
  }, []);
}
