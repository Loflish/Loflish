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

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './App';
import { MuseumProvider } from './lib/museum';
import { installSurfaces, loadTaches } from './lib/hd';

installSurfaces();
// les taches d'aquarelle des bulles se chargent avant tout le reste
void loadTaches();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <MuseumProvider>
        <App />
      </MuseumProvider>
    </HashRouter>
  </StrictMode>,
);
