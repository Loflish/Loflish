import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
// IBM Plex Sans : la typographie fonctionnelle, et celle de toutes les écritures du monde
// (latin, cyrillique, grec, arabe, hébreu, devanagari, thaï ; chargées à la demande ;
// le japonais, le chinois et le coréen prennent la police sans empattement du système)
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/ibm-plex-sans-hebrew/400.css';
import '@fontsource/ibm-plex-sans-hebrew/600.css';
import '@fontsource/ibm-plex-sans-devanagari/400.css';
import '@fontsource/ibm-plex-sans-devanagari/600.css';
import '@fontsource/ibm-plex-sans-thai/400.css';
import '@fontsource/ibm-plex-sans-thai/600.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/museum.css';
import './styles/trace.css';
import './styles/pages.css';
import './styles/finitions.css';
import './styles/design-fable.css';
import './styles/print.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './App';
import { Panne } from './components/Panne';
import { MuseumProvider } from './lib/museum';
import { FONDS, installSurfaces } from './lib/hd';
import { chargerMusee } from './data/store';

installSurfaces();
// `?fable=0` : le site tel qu'il était avant le design du 3 novembre (design-fable.css), pour comparer
if (new URLSearchParams(window.location.search).get('fable') === '0') document.documentElement.classList.add('sans-fable');
// hors de la constellation, le papier des pages (fond-tissu) est demandé dès maintenant, avant même que React ne monte :
// sur une trace, c'est la plus grande image de l'écran, et elle arrivait 1,2 s après le reste (Lighthouse, 3 novembre)
const chemin = window.location.hash.replace(/^#/, '');
if (chemin && chemin !== '/' && !chemin.startsWith('/bulle/') && !chemin.startsWith('/archives/')) {
  const l = document.createElement('link');
  l.rel = 'preload';
  l.as = 'image';
  l.href = window.matchMedia('(max-aspect-ratio: 3/4)').matches ? FONDS.tissu.haut : FONDS.tissu.large;
  l.fetchPriority = 'high';
  document.head.append(l);
}

// en ligne, les présences du musée arrivent avant la constellation (au plus 4 s d'attente)
const attente = new Promise((r) => setTimeout(r, 4000));
void Promise.race([chargerMusee().catch(() => undefined), attente]).then(() => afficher());

function afficher() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {/* les changements de page passent par startTransition : la page qui part reste réactive jusqu'à ce que la suivante soit prête */}
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MuseumProvider>
          <Panne>
            <App />
          </Panne>
        </MuseumProvider>
      </HashRouter>
    </StrictMode>,
  );
}
