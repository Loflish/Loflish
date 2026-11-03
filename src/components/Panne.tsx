import { Component, type ReactNode } from 'react';

/** Si une page plante, le visiteur garde une phrase et un bouton plutôt qu'un écran blanc. */
export class Panne extends Component<{ children: ReactNode }, { panne: boolean }> {
  state = { panne: false };

  static getDerivedStateFromError() {
    return { panne: true };
  }

  render() {
    if (!this.state.panne) return this.props.children;
    return (
      <main className="page-panne">
        <h1 className="page-titre">Cette page n’a pas pu s’ouvrir.</h1>
        <p className="muted">Rien de ce que tu as déposé n’est perdu : le musée garde tout de son côté.</p>
        <div className="liens-colonne">
          <button type="button" className="bouton" onClick={() => location.reload()}>
            Recharger la page
          </button>
          <a className="lien-entrer" href="#/" onClick={() => window.setTimeout(() => location.reload(), 50)}>
            Retour au musée
          </a>
        </div>
      </main>
    );
  }
}
