-- Après moi (loi Informatique et Libertés, article 85) : chaque personne dit ce que deviennent ses données à sa mort,
-- et peut désigner quelqu'un. Consentement distinct des conditions d'utilisation, horodaté, révocable.
create table directives_post_mortem (
  compte_id     uuid primary key references comptes (id) on delete cascade,
  choix         text not null check (choix in ('conserver_publique', 'conserver_famille', 'transmettre', 'effacer')),
  tiers_nom     text check (length(tiers_nom) <= 120),
  tiers_email   text check (length(tiers_email) <= 200),
  message       text check (length(message) <= 1000),
  version_texte text not null,
  consenti_le   timestamptz not null default now(),
  maj_le        timestamptz not null default now()
);

-- Signaler un décès : la demande d'un proche ou de la personne désignée, gardée pour y répondre sous un mois (article 85 II).
create table demandes_deces (
  id            uuid primary key default gen_random_uuid(),
  email         text not null check (length(email) <= 200),
  nom_defunt    text not null check (length(nom_defunt) <= 200),
  lien          text not null check (length(lien) <= 200),
  trace_id      text,
  demande       text not null check (demande in ('cloturer', 'conserver', 'transmettre', 'autre')),
  message       text check (length(message) <= 2000),
  statut        text not null default 'recue' check (statut in ('recue', 'en_cours', 'traitee', 'refusee')),
  reponse       text,
  cree_le       timestamptz not null default now(),
  traitee_le    timestamptz
);
