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
        <button type="button" className="bouton" onClick={() => location.reload()}>
          Recharger la page
        </button>
      </main>
    );
  }
}
