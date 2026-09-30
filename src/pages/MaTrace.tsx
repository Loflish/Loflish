import { Link, useNavigate } from 'react-router-dom';
import { BubbleImage, Footer, PageTop } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { dateLongue, estScellee, reouverture, TYPE_LABEL, useMesTraces } from '../data/store';
import { MAX_FRAGMENTS } from '../data/types';
import { RUBRIQUES } from '../data/types';
import { useMuseumMode } from '../lib/museum';

/**
 * Ma trace — l'espace de l'auteur : retrouver sa bulle, voir son profil,
 * compléter ses fragments d'existence. Aucun pourcentage de complétion :
 * une existence n'est jamais « complète ».
 */
export function MaTrace() {
  useMuseumMode('texte');
  const mes = useMesTraces();
  const navigate = useNavigate();

  return (
    <main className="page page-texte ma-trace">
      <PageTop />
      <div className="page-corps emerge">
        <h1 className="page-titre">Ma trace</h1>
        {mes.length === 0 ? (
          <>
            <p className="lead">Tu n’as pas encore déposé de trace dans le musée.</p>
            <Link to="/creer" className="lien-entrer">
              Créer ma trace <Icon name="fleche" size={16} />
            </Link>
          </>
        ) : (
          mes.map((t) => (
            <section key={t.id} className="ma-trace-bloc" aria-labelledby={`h-${t.id}`}>
              <div className="ma-trace-tete">
                <BubbleImage id={t.id} couleur={t.couleur} size={120} className="breathing" />
                <div className="ma-trace-id">
                  <h2 id={`h-${t.id}`} className="ma-trace-nom">
                    {t.nom}
                  </h2>
                  <p className="apercu-type">
                    {TYPE_LABEL[t.type]} · publiée le {t.creeLe}
                  </p>
                  {estScellee(t) && (
                    <p className="ma-trace-scellee">
                      <Icon name="cadenas" size={16} /> {t.type === 'memoire' ? 'Ses 200 caractères' : 'Tes réponses'} sont scellées jusqu’au{' '}
                      {dateLongue(reouverture(t)!)} ; chaque fragment est scellé à son dépôt
                    </p>
                  )}
                  <div className="ma-trace-actions">
                    <Link to={`/trace/${t.id}`} className="lien-entrer">
                      Voir mon profil de dernières volontés <Icon name="fleche" size={16} />
                    </Link>
                    <button className="lien-discret" onClick={() => navigate('/', { state: { focus: t.id } })}>
                      <Icon name="lieu" size={16} /> Retrouver ma bulle dans le musée
                    </button>
                  </div>
                </div>
              </div>

              <h3 className="intertitre">Compléter mes fragments d’existence</h3>
              <ul className="ma-trace-rubriques">
                {RUBRIQUES.map((r) => {
                  const n = t.rubriques[r.id]?.length ?? 0;
                  return (
                    <li key={r.id}>
                      <button className="ma-trace-rubrique" onClick={() => navigate(`/trace/${t.id}`, { state: { ouvrir: r.id } })}>
                        <Icon name={r.icone} size={22} />
                        <span className="ma-trace-rubrique-titre">{r.titre}</span>
                        <span className="ma-trace-rubrique-n">
                          {n >= MAX_FRAGMENTS
                              ? `${MAX_FRAGMENTS} sur ${MAX_FRAGMENTS}`
                              : n === 0
                                ? 'Ajouter'
                                : `${n} sur ${MAX_FRAGMENTS} · ajouter`}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
        {mes.length > 0 && mes.length < 2 && (
          <p className="ma-trace-autre">
            <Link to="/creer" className="lien-discret">
              <Icon name="plus" size={16} />{' '}
              {mes.some((t) => t.type === 'memoire') ? 'Créer ma propre trace' : 'Créer une mémoire pour une personne décédée'}
            </Link>
          </p>
        )}
        <p className="muted petit">
          Chaque personne peut émettre deux bulles au plus : sa propre trace, et une mémoire pour une personne décédée.
        </p>
        <p className="muted petit">Prototype : ta trace est conservée dans ce navigateur uniquement.</p>
      </div>
      <Footer />
    </main>
  );
}
