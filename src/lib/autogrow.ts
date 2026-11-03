/**
 * Un champ de texte qui grandit avec ce qu'on y écrit : on relit sa réponse en entier, sans faire
 * défiler une petite boîte. À passer en `ref` et à appeler dans `onChange`.
 */
export function autoGrow(el: HTMLTextAreaElement | null): void {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight + 2}px`;
}
