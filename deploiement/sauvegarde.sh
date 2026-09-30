#!/bin/sh
# Nos mots mémoriaux — sauvegarde de la base et des fichiers déposés.
#
#   sh sauvegarde.sh              une sauvegarde maintenant
#   sh sauvegarde.sh chaque-jour  une sauvegarde tout de suite, puis une par jour (service « sauvegarde »)
#
# Dans le dossier des sauvegardes :
#   base-AAAA-MM-JJ_HHMM.dump   la base entière (pg_dump), une par jour, gardée GARDER_JOURS jours
#   fichiers/                   une copie de tous les fichiers déposés (les fichiers ne changent
#                               jamais : seuls les nouveaux sont copiés)
#   fichiers-retires/           les fichiers retirés du musée (modération, effacement d'un compte),
#                               gardés GARDER_JOURS jours puis effacés pour de bon
#
# La connexion à la base vient de PGHOST, PGUSER, PGPASSWORD, PGDATABASE.
set -eu

DEST="${DEST:-/sauvegardes}"
SOURCE="${SOURCE:-/fichiers}"
GARDER="${GARDER_JOURS:-30}"

une_sauvegarde() {
  quand="$(date +%Y-%m-%d_%H%M)"
  mkdir -p "$DEST/fichiers" "$DEST/fichiers-retires"

  # 1. la base : écrite à part, puis renommée (jamais de sauvegarde à moitié écrite)
  pg_dump --format=custom --file="$DEST/base-$quand.dump.partiel"
  mv "$DEST/base-$quand.dump.partiel" "$DEST/base-$quand.dump"

  # 2. les fichiers : on copie les nouveaux
  if [ -d "$SOURCE" ]; then
    cp -a -n "$SOURCE/." "$DEST/fichiers/"
    # ceux qui ont quitté le musée passent dans « fichiers-retires »
    (cd "$DEST/fichiers" && find . -type f) | while IFS= read -r f; do
      if [ ! -e "$SOURCE/$f" ]; then
        mkdir -p "$DEST/fichiers-retires/$(dirname "$f")"
        mv "$DEST/fichiers/$f" "$DEST/fichiers-retires/$f"
        touch "$DEST/fichiers-retires/$f"
      fi
    done
  fi

  # 3. le ménage : au-delà de GARDER jours, on efface
  find "$DEST" -maxdepth 1 -name 'base-*.dump' -mtime +"$GARDER" -delete
  find "$DEST/fichiers-retires" -type f -mtime +"$GARDER" -delete
  find "$DEST/fichiers-retires" -mindepth 1 -type d -empty -delete

  echo "$(date '+%Y-%m-%d %H:%M') sauvegarde faite : base-$quand.dump ($(du -h "$DEST/base-$quand.dump" | cut -f1)), fichiers $(du -sh "$DEST/fichiers" | cut -f1)"
}

if [ "${1:-}" = "chaque-jour" ]; then
  while true; do
    une_sauvegarde || echo "$(date '+%Y-%m-%d %H:%M') LA SAUVEGARDE A ÉCHOUÉ" >&2
    sleep 86400
  done
else
  une_sauvegarde
fi
