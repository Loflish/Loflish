import { Route, Routes, useLocation } from 'react-router-dom';
import { Backdrop } from './components/Backdrop';
import { Archives, Carte, Compte, Juridique, Projet, Ressources, Soutenir } from './pages/Pages';
import { Creer } from './pages/Creer';
import { Explorer } from './pages/Explorer';
import { MaTrace } from './pages/MaTrace';
import { Musee } from './pages/Musee';
import { SePerdre } from './pages/SePerdre';
import { TracePage } from './pages/TracePage';

export function App() {
  const location = useLocation();
  return (
    <>
      <a href="#contenu" className="skip-link">
        Aller au contenu
      </a>
      {/* La constellation vit derrière toutes les pages, elle n'est jamais démontée. */}
      <Backdrop />
      <div id="contenu" className="layer" key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Explorer />} />
          <Route path="/se-perdre" element={<SePerdre />} />
          <Route path="/trace/:id" element={<TracePage />} />
          <Route path="/creer" element={<Creer />} />
          <Route path="/ma-trace" element={<MaTrace />} />
          <Route path="/projet" element={<Projet />} />
          <Route path="/musee" element={<Musee />} />
          <Route path="/ressources" element={<Ressources />} />
          <Route path="/soutenir" element={<Soutenir />} />
          <Route path="/juridique" element={<Juridique />} />
          <Route path="/archives" element={<Archives />} />
          <Route path="/carte" element={<Carte />} />
          <Route path="/compte" element={<Compte />} />
          <Route path="*" element={<Explorer />} />
        </Routes>
      </div>
    </>
  );
}
