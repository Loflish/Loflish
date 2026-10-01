import { Link, useNavigate } from 'react-router-dom';
import { BubbleImage } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { dateLongue, estScellee, premier, reouverture, TYPE_LABEL, useMesTraces } from '../data/store';
import { limiteDe, RUBRIQUES, titreRubrique } from '../data/types';

/**
 * Mes traces : l'espace de l'auteur, dans la page Compte. Sa propre trace
 * d'abord, puis la mémoire créée pour un proche, avec le même affichage.
 * Aucun pourcentage de complétion : une existence n'est jamais « complète ».
 */
export function MesTraces() {
  const mes = [...useMesTraces()].sort((a, b) => (a.type === b.type ? 0 : a.type === 'personnelle' ? -1 : 1));
  const navigate = useNavigate();

  return (
    <section className="mes-traces" aria-labelledby="h-mes-traces">
      <h2 id="h-mes-traces" className="intertitre">
        {mes.length > 1 ? 'Mes traces' : 'Ma trace'}
      </h2>
      {mes.length === 0 ? (
        <p className="compte-vide">
          Tu n’as pas encore déposé de trace dans le musée.{' '}
          <Link to="/creer" className="lien-entrer">
            Créer ma trace <Icon name="fleche" size={16} />
          </Link>
        </p>
      ) : (
        mes.map((t) => (
          <section key={t.id} className="ma-trace-bloc" aria-labelledby={`h-${t.id}`}>
            <div className="ma-trace-tete">
              <BubbleImage id={t.id} couleur={t.couleur} size={120} className="breathing" />
              <div className="ma-trace-id">
                <h3 id={`h-${t.id}`} className="ma-trace-nom">
                  {t.nom}
                </h3>
                <p className="apercu-type">
                  {TYPE_LABEL[t.type]}, publiée le {premier(t.creeLe)}
                </p>
                {estScellee(t) && (
                  <p className="ma-trace-scellee">
                    <Icon name="cadenas" size={16} /> {t.type === 'memoire' ? 'Ce que tu as écrit sur cette personne est scellé' : 'Tes réponses sont scellées'} jusqu’au{' '}
                    {dateLongue(reouverture(t)!)}. Chaque fragment est scellé à son dépôt.
                  </p>
                )}
                <div className="ma-trace-actions">
                  <Link to={`/trace/${t.id}`} className="lien-entrer">
                    {t.type === 'memoire' ? 'Voir sa mémoire' : 'Voir mon profil de dernières volontés'} <Icon name="fleche" size={16} />
                  </Link>
                  <button className="lien-discret" onClick={() => navigate('/', { state: { focus: t.id } })}>
                    <Icon name="lieu" size={16} /> {t.type === 'memoire' ? 'Retrouver sa bulle dans le musée' : 'Retrouver ma bulle dans le musée'}
                  </button>
                </div>
              </div>
            </div>

            <h4 className="ma-trace-sous-titre">{t.type === 'memoire' ? 'Compléter ses fragments d’existence' : 'Compléter mes fragments d’existence'}</h4>
            <ul className="ma-trace-rubriques">
              {RUBRIQUES.map((r) => {
                const n = t.rubriques[r.id]?.length ?? 0;
                return (
                  <li key={r.id}>
                    <button className="ma-trace-rubrique" onClick={() => navigate(`/trace/${t.id}`, { state: { ouvrir: r.id } })}>
                      <Icon name={r.icone} size={22} />
                      <span className="ma-trace-rubrique-titre">{titreRubrique(r, t.type)}</span>
                      <span className="ma-trace-rubrique-n">{n === 0 ? 'Ajouter' : `${n} sur ${limiteDe(r.id)}`}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
      {mes.length === 1 && (
        <p className="ma-trace-autre">
          <Link to="/creer" className="lien-discret">
            <Icon name="plus" size={16} />{' '}
            {mes[0]!.type === 'memoire' ? 'Créer ma propre trace' : 'Créer une mémoire pour une personne décédée'}
          </Link>
        </p>
      )}
      {mes.length > 0 && (
        <p className="muted petit">Chaque personne peut avoir deux bulles au plus : sa propre trace, et une mémoire pour une personne décédée.</p>
      )}
    </section>
  );
}
