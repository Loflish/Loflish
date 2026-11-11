-- Droits au dépôt des médias, motifs de retrait envoyés à l'auteur, opposition des proches, données d'identification
-- des auteurs (LCEN art. 6 V : qui a déposé quoi, quand, d'où ; empreinte de l'adresse, jamais l'adresse en clair).
alter table medias add column droits_le timestamptz;     -- le déposant a déclaré avoir les droits et l'accord des personnes visibles
alter table traces add column ip text;
alter table fragments add column ip text;
alter table medias add column ip text;
alter table traces add column retiree_le timestamptz;

-- l'opposition d'une personne concernée (vie privée) est un motif de signalement, avec une adresse pour lui répondre
alter table signalements add column email text check (length(email) <= 200);
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'signalements'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%motif%'
  loop
    execute format('alter table signalements drop constraint %I', c);
  end loop;
end $$;
alter table signalements add constraint signalements_motif check (motif in ('danger', 'haine', 'intime', 'usurpation', 'vie_privee', 'autre'));
