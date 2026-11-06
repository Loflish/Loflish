-- Une mémoire déposée pour une personne décédée passe par un examen avant d'entrer dans le musée
-- (cahier des charges §43.1 et §94.16) : statut « en_attente » entre l'envoi et la décision du fondateur.
alter table traces drop constraint traces_statut;
alter table traces add constraint traces_statut check (statut in ('publiee', 'en_attente', 'retiree'));
