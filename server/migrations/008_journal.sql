-- Le journal : en plus des fragments de sa trace, une personne écrit au fil du temps des blocs de texte datés.
-- - chaque entrée est scellée à l'écriture : son texte ne change plus, sa date (posée par le serveur) fait foi ;
--   l'auteur peut toujours la supprimer ;
-- - pour chacune, l'auteur choisit si elle est visible par tous ou gardée pour lui, et peut changer ce choix
--   (pas de valeur par défaut : rien n'est décidé à sa place) ;
-- - texte seul, 5 000 caractères au plus ; nombre d'entrées sans limite, lues par paquets (src/data/types.ts) ;
-- - seulement sur une trace personnelle et publiée (règle appliquée par le serveur, voir src/routes/auteur.ts).
--
-- La table s'appelle « journal_entrees » : « journal » est déjà le journal d'audit du serveur (migration 001).
create table journal_entrees (
  id          uuid primary key default gen_random_uuid(),
  trace_id    text not null references traces (id) on delete cascade,   -- effacer la trace (ou le compte) efface son journal
  texte       text not null check (length(texte) between 1 and 5000),
  visible     boolean not null,
  -- à la milliseconde, comme les dates que le site reçoit et renvoie : la date d'une entrée sert de repère pour lire la suite
  ecrit_le    timestamptz(3) not null default now(),
  ip          text                    -- empreinte de l'adresse de l'auteur, jamais l'adresse en clair (comme les fragments, migration 006)
);
-- « les 20 plus récentes d'une trace, avant telle date » ; unique : dans une trace, deux entrées n'ont jamais la même date
-- (le serveur écrit chacune au moins une milliseconde après la précédente), la lecture par paquets n'en saute donc aucune
create unique index journal_entrees_trace on journal_entrees (trace_id, ecrit_le desc);
