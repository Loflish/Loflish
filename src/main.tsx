import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import '@fontsource-variable/manrope';
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
import { installSurfaces } from './lib/hd';

installSurfaces();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <MuseumProvider>
        <App />
      </MuseumProvider>
    </HashRouter>
  </StrictMode>,
);
