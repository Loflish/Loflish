-- Changer son adresse e-mail : un lien de confirmation est envoyé à la nouvelle adresse.
-- Le lien porte le compte à modifier ; une fois ouvert, l'adresse du compte change.
alter table liens_connexion add column compte_id uuid references comptes (id) on delete cascade;
