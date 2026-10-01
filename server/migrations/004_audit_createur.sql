-- Décisions du créateur (audit du musée) :
-- 1. on entre avec un code à six chiffres envoyé par e-mail (plus de lien) ;
-- 2. une mémoire commence par ce que l'on peut dire de la personne : 500 caractères ;
-- 3. pas de masquage : selon la gravité, la bulle est retirée, ou l'adresse IP est bannie ;
-- 4. trois motifs de signalement (les anciens restent lisibles).

-- 1. les codes : on ne garde que leur empreinte, et le nombre d'essais
alter table liens_connexion add column code_empreinte text;
alter table liens_connexion add column essais integer not null default 0;
create index liens_connexion_actifs on liens_connexion (email, cree_le desc) where utilise_le is null;

-- 2. mémoires : 500 caractères
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'traces'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%memoire_apercu%'
  loop
    execute format('alter table traces drop constraint %I', c);
  end loop;
end $$;
alter table traces add constraint traces_memoire_apercu
  check (type <> 'memoire' or (memoire_apercu is not null and length(memoire_apercu) <= 500));

-- 3. une bulle retirée (au lieu de masquée) ; les adresses IP bannies
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'traces'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%statut%'
  loop
    execute format('alter table traces drop constraint %I', c);
  end loop;
end $$;
update traces set statut = 'retiree' where statut = 'masquee';
alter table traces add constraint traces_statut check (statut in ('publiee', 'retiree'));
alter table traces rename column masquee_raison to retiree_raison;

-- l'adresse IP n'est jamais gardée en clair : seulement son empreinte signée, qui suffit à la reconnaître
alter table sessions add column ip text;
alter table comptes add column derniere_ip text;
create table bannissements (
  ip          text primary key,
  raison      text not null check (length(raison) <= 500),
  compte_id   uuid references comptes (id) on delete set null,
  par         uuid references comptes (id) on delete set null,
  cree_le     timestamptz not null default now()
);
