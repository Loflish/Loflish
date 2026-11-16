-- Le catalogue des 183 matières choisies par Tom (6 novembre 2026) porte les numéros 1001 à 1183, et la planche
-- « lumière » va jusqu'à 5600. La base n'acceptait que 0 à 999 : publier en ligne une trace dont la bulle venait du
-- catalogue était refusé (« Certaines informations ne conviennent pas »). Trouvé le 16 novembre en essayant le journal.
alter table traces drop constraint if exists traces_matiere_check;
alter table traces add constraint traces_matiere_check check (matiere between 0 and 9999);
