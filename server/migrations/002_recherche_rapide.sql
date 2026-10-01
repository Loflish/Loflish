-- Recherche rapide, même avec des milliers de traces : index « trigrammes » sur le texte sans accents.
--
-- unaccent() n'est pas déclarée immuable (son dictionnaire pourrait changer) ; PostgreSQL refuse
-- donc de l'utiliser dans un index. On l'enveloppe dans une fonction immuable, qui fixe le
-- dictionnaire utilisé.

create extension if not exists pg_trgm;

create or replace function sans_accents(text) returns text
  language sql immutable parallel safe strict
  as $$ select public.unaccent('public.unaccent'::regdictionary, $1) $$;

-- ce que la recherche lit dans une trace : nom, pays, les quatre réponses ou l'aperçu d'une mémoire
create or replace function texte_recherche_trace(nom text, pays text, q1 text, q2 text, q3 text, q4 text, apercu text) returns text
  language sql immutable parallel safe
  as $$ select lower(sans_accents(coalesce(nom, '') || ' ' || coalesce(pays, '') || ' ' || coalesce(q1, '') || ' ' || coalesce(q2, '') || ' '
                                  || coalesce(q3, '') || ' ' || coalesce(q4, '') || ' ' || coalesce(apercu, ''))) $$;

-- et dans un fragment : titre, texte, lieu
create or replace function texte_recherche_fragment(titre text, texte text, lieu text) returns text
  language sql immutable parallel safe
  as $$ select lower(sans_accents(coalesce(titre, '') || ' ' || coalesce(texte, '') || ' ' || coalesce(lieu, ''))) $$;

create index traces_recherche on traces
  using gin (texte_recherche_trace(nom, pays, q1, q2, q3, q4, memoire_apercu) gin_trgm_ops);
create index fragments_recherche on fragments
  using gin (texte_recherche_fragment(titre, texte, lieu) gin_trgm_ops);

-- les fragments d'une rubrique (filtre « fragments présents » de la recherche)
create index fragments_rubrique on fragments (rubrique, trace_id);
