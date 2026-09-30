-- Nos mots mémoriaux — schéma initial.
--
-- Principes :
-- - une personne = un compte (connexion par lien envoyé par e-mail, sans mot de passe) ;
-- - deux bulles au plus par compte : sa propre trace, et une mémoire pour une personne décédée ;
-- - publier une trace scelle ses réponses pour cinq ans ; chaque fragment et chaque média est
--   scellé au moment où il est déposé (ces règles sont appliquées par le serveur, voir src/regles.ts) ;
-- - rien n'est effacé par erreur : les suppressions passent par le journal.

-- recherche sans tenir compte des accents
create extension if not exists unaccent;

create table comptes (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique check (email = lower(email)),
  role            text not null default 'membre' check (role in ('membre', 'moderation', 'admin')),
  majeur_le       timestamptz,               -- la personne a déclaré avoir 18 ans ou plus
  suspendu        boolean not null default false,
  cree_le         timestamptz not null default now(),
  derniere_connexion timestamptz
);

-- liens de connexion envoyés par e-mail (on ne garde que l'empreinte du jeton)
create table liens_connexion (
  empreinte   text primary key,
  email       text not null,
  cree_le     timestamptz not null default now(),
  expire_le   timestamptz not null,
  utilise_le  timestamptz
);
create index liens_connexion_email on liens_connexion (email, cree_le desc);

create table sessions (
  empreinte   text primary key,
  compte_id   uuid not null references comptes (id) on delete cascade,
  cree_le     timestamptz not null default now(),
  expire_le   timestamptz not null,
  vue_le      timestamptz not null default now()
);
create index sessions_compte on sessions (compte_id);

create table traces (
  id              text primary key,
  compte_id       uuid references comptes (id) on delete cascade,
  type            text not null check (type in ('personnelle', 'memoire')),
  statut          text not null default 'publiee' check (statut in ('publiee', 'masquee')),
  nom             text not null check (length(nom) between 1 and 80),
  pseudo          text check (length(pseudo) <= 60),
  couleur         text not null,
  matiere         integer check (matiere between 0 and 999),
  pays            text check (length(pays) <= 80),
  -- les quatre questions (trace personnelle)
  q1 text, q2 text, q3 text, q4 text,
  q2_destinataire text check (length(q2_destinataire) <= 120),
  -- une mémoire déposée pour une personne décédée
  memoire_deposee_par text,
  memoire_relation    text,
  memoire_origine     text,
  memoire_apercu      text,
  parametres      jsonb not null default '{}'::jsonb,
  cree_le         timestamptz not null default now(),
  maj_le          timestamptz not null default now(),
  scellee_le      timestamptz not null default now(),
  masquee_raison  text,
  check (type <> 'personnelle' or (q1 is not null and q2 is not null and q3 is not null and q4 is not null and length(q4) <= 200)),
  check (type <> 'memoire' or (memoire_apercu is not null and length(memoire_apercu) <= 200))
);
-- deux bulles au plus : une de chaque type par compte
create unique index traces_un_type_par_compte on traces (compte_id, type) where compte_id is not null;
create index traces_publiees on traces (statut, cree_le);

create table fragments (
  id          uuid primary key default gen_random_uuid(),
  trace_id    text not null references traces (id) on delete cascade,
  rubrique    text not null,
  titre       text check (length(titre) <= 200),
  texte       text not null check (length(texte) between 1 and 1200),
  quand       text check (length(quand) <= 120),
  lieu        text check (length(lieu) <= 160),
  lien        text check (length(lien) <= 120),
  categorie   text check (length(categorie) <= 60),
  en_avant    boolean not null default false,
  ordre       integer not null default 0,
  scelle_le   timestamptz not null default now(),
  cree_le     timestamptz not null default now()
);
create index fragments_trace on fragments (trace_id, rubrique, ordre);

create table medias (
  id            uuid primary key default gen_random_uuid(),
  trace_id      text not null references traces (id) on delete cascade,
  fragment_id   uuid references fragments (id) on delete cascade,  -- null : « Médias & documents » de la trace
  kind          text not null check (kind in ('image', 'audio', 'video', 'document', 'lien')),
  titre         text not null check (length(titre) <= 200),
  legende       text check (length(legende) <= 600),
  duree         text,
  cle           text unique,          -- clé du fichier dans le stockage (null pour un lien)
  mime          text,
  nom_fichier   text,
  taille        bigint,
  url           text,                 -- adresse d'un lien
  en_avant      boolean not null default false,
  ordre         integer not null default 0,
  scelle_le     timestamptz not null default now(),
  cree_le       timestamptz not null default now(),
  check ((kind = 'lien') = (url is not null)),
  check ((kind = 'lien') or cle is not null)
);
create index medias_trace on medias (trace_id, ordre);

-- l'œuvre commune : un seul trait par personne (compte) et par appareil
create table traits (
  id          uuid primary key default gen_random_uuid(),
  compte_id   uuid unique references comptes (id) on delete cascade,
  appareil    text unique,
  x1 double precision not null, y1 double precision not null,
  x2 double precision not null, y2 double precision not null,
  masque      boolean not null default false,
  cousu_le    timestamptz not null default now()
);

-- les éditions des archives : chacune s'ouvre sur sa constellation
create table editions (
  id          text primary key,
  titre       text not null,
  annee       integer not null,
  note        text not null default '',
  figee_le    timestamptz,            -- une édition figée garde la liste exacte de ses présences
  presences   text[]                  -- identifiants des traces au moment du figeage
);

-- signalements envoyés par les visiteurs ; la modération les traite
create table signalements (
  id          uuid primary key default gen_random_uuid(),
  trace_id    text references traces (id) on delete cascade,
  fragment_id uuid references fragments (id) on delete set null,
  media_id    uuid references medias (id) on delete set null,
  motif       text not null check (motif in ('danger', 'haine', 'intime', 'usurpation', 'autre')),
  message     text check (length(message) <= 2000),
  compte_id   uuid references comptes (id) on delete set null,
  statut      text not null default 'ouvert' check (statut in ('ouvert', 'traite', 'rejete')),
  decision    text,
  traite_par  uuid references comptes (id) on delete set null,
  cree_le     timestamptz not null default now(),
  traite_le   timestamptz
);
create index signalements_ouverts on signalements (statut, cree_le);

-- tout ce qui compte est écrit ici : qui a fait quoi, quand
create table journal (
  id          bigserial primary key,
  compte_id   uuid,
  action      text not null,
  cible       text,
  details     jsonb not null default '{}'::jsonb,
  cree_le     timestamptz not null default now()
);
create index journal_date on journal (cree_le desc);
