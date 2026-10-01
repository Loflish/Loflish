# Nos mots mémoriaux — le serveur, les données, la mise en ligne

Ce guide explique comment le musée fonctionne derrière le site, comment le mettre en ligne, et
comment gérer ses données au quotidien : modération, archives, sauvegardes, droits des personnes.

---

## 1. En bref

```
 visiteurs ──HTTPS──▶  web (Caddy)  ──▶  musee (Node.js)  ──▶  base (PostgreSQL)
                        certificat        le site + l'API          comptes, traces, fragments,
                        automatique       /api/…                   fiches des médias, œuvre
                                           │                        commune, journal
                                           ▼
                                  fichiers déposés                sauvegarde (chaque nuit)
                                  (disque ou S3)                  ./sauvegardes
```

- **Un seul serveur** fait tourner quatre services (fichier `docker-compose.yml`) :
  `base` (PostgreSQL 16), `musee` (le site + l'API, dossier `server/`), `web` (Caddy : HTTPS)
  et `sauvegarde` (une copie de la base et des fichiers chaque nuit).
- **Le site** a deux modes :
  - *prototype* (`npm run build`) : tout reste dans le navigateur, avec les présences de
    démonstration. C'est ce mode qui est publié sur claude.ai pour l'aperçu.
  - *en ligne* (`npm run build:en-ligne`, utilisé par Docker) : le site parle au serveur. Aucune
    fausse bulle : la constellation montre seulement les vraies traces.
- **Entrer dans le musée** se fait sans mot de passe : la personne donne son e-mail, reçoit un code
  à six chiffres (valable 15 minutes, une seule fois, cinq essais au plus), le tape sur la page, et
  reste connectée 90 jours sur cet appareil. Changer d'adresse se confirme de la même façon, par un
  code envoyé à la nouvelle adresse.

---

## 2. Ce que tu dois choisir (et que je ne peux pas faire à ta place)

| Décision | Pourquoi | Pistes |
| --- | --- | --- |
| **Un serveur (VPS)** | Faire tourner le musée. Pour commencer : 2 processeurs, 4 Go de mémoire, 80 Go de disque, Ubuntu 24.04. | Hetzner, Scaleway, OVHcloud, Infomaniak (hébergement en Europe : plus simple pour la protection des données). |
| **Le nom de domaine** | L'adresse du musée, par exemple `nosmotsmemoriaux.org`. | Chez n'importe quel registraire (Gandi, OVHcloud, Infomaniak…). |
| **Un service d'envoi d'e-mails (SMTP)** | Sans lui, personne ne reçoit son code pour entrer, et tu ne reçois pas les signalements. | Brevo, Scaleway TEM, Mailjet, Postmark. Il faudra ajouter les enregistrements SPF/DKIM qu'ils indiquent dans les réglages du domaine. |
| **Où garder les fichiers** | Photos, sons, vidéos, documents. | Pour commencer : le disque du serveur (`STOCKAGE=disque`). Quand le musée grandit : un stockage S3 (Scaleway Object Storage, OVHcloud, Cloudflare R2, Backblaze B2). |
| **Ton adresse de fondateur** | Elle devient administratrice à la connexion et reçoit chaque signalement par e-mail (`ADMIN_EMAILS`). | La tienne (plusieurs adresses possibles, séparées par des virgules). |
| **Une copie des sauvegardes ailleurs** | Si le serveur disparaît, les sauvegardes qui sont dessus disparaissent avec lui. | Un second stockage (S3, Backblaze B2…) ou le service de sauvegarde de l'hébergeur. |

Les prix changent souvent : compare sur les sites des fournisseurs au moment de choisir.

---

## 3. Mettre le musée en ligne, pas à pas

1. **Le domaine** : dans les réglages DNS du domaine, crée un enregistrement `A` (et `AAAA` si le
   serveur a une adresse IPv6) qui pointe vers l'adresse du serveur, pour `@` et pour `www`.
2. **Sur le serveur** (en SSH) :

   ```bash
   # Docker (une seule fois)
   curl -fsSL https://get.docker.com | sh

   # le musée
   git clone https://github.com/loflish/loflish.git musee && cd musee
   cp .env.exemple .env
   nano .env            # remplir : DOMAINE, POSTGRES_PASSWORD, SECRET, ADMIN_EMAILS, SMTP_URL
   ```

   Pour créer le mot de passe et le secret : `openssl rand -hex 24` et `openssl rand -hex 32`.
3. **Lancer** :

   ```bash
   docker compose up -d --build
   docker compose ps          # les quatre services doivent être « running » / « healthy »
   docker compose logs -f musee
   ```

   Au premier démarrage, le serveur crée toutes les tables (migrations). Caddy obtient le
   certificat HTTPS tout seul, en quelques secondes.
4. **Première connexion** : va sur `https://ton-domaine/#/compte`, entre une adresse listée dans
   `ADMIN_EMAILS`, tape le code reçu. Le lien « L'espace du fondateur » apparaît dans Compte
   (adresse directe : `/#/admin`).
   *Si l'e-mail n'arrive pas* : le code est aussi écrit dans le journal du serveur
   (`docker compose logs musee | grep "code de connexion"`) tant que `SMTP_URL` est vide.
5. **Vérifier** : `https://ton-domaine/api/sante` doit répondre `{"ok":true}`.

### Mettre à jour le musée

```bash
cd musee
git pull
docker compose up -d --build
```

Les nouvelles migrations de la base s'appliquent toutes seules au démarrage. Les données
(volumes `base` et `fichiers`) ne sont jamais touchées par une mise à jour.

---

## 4. Gérer le musée au quotidien : l'espace du fondateur (`/admin`)

Deux rôles :
- **administration** (le fondateur) : tout, y compris bannir, les comptes, les adresses bannies,
  les éditions des archives, le journal et l'export ;
- **modération** (si un jour quelqu'un t'aide) : état du musée, signalements, traces (retirer une
  bulle), œuvre commune.

Chaque signalement t'arrive aussi par e-mail, aussitôt (objet « Urgent » pour « Quelqu'un est en
danger »), avec le lien vers la trace et vers cet espace.

| Onglet | Ce qu'on y fait |
| --- | --- |
| **État du musée** | Le nombre de traces, mémoires, fragments, médias, traits, comptes, la place prise par les fichiers, les signalements en attente. |
| **Signalements** | Ce que les visiteurs ont signalé (bouton « Signaler », sur un profil ou dans Se perdre) : quelqu'un en danger ; haine, harcèlement ou violence ; autre chose. « Danger » est marqué d'un fil rouge : à traiter en premier. On les classe « Traité » ou « Rejeté », avec une décision écrite. |
| **Traces** | Chercher par nom, identifiant ou e-mail ; les choix de confidentialité de chacun sont affichés. Selon la gravité : **Retirer la bulle** (la raison est obligatoire : son auteur la lit sur son profil ; « Remettre la bulle » est possible) ou **Bannir** (toutes ses bulles retirées, son compte suspendu, et l'empreinte de ses adresses IP connues refusée sur tout le site). **Fragments et fichiers** : retirer un élément précis, même scellé. Le retrait efface aussi le fichier. |
| **Œuvre commune** | Les derniers traits cousus. Masquer un trait le fait disparaître de l'œuvre ; la personne ne peut pas en coudre un autre. |
| **Comptes** | Donner ou retirer un rôle ; suspendre un compte (ses sessions sont fermées ; ses bulles restent visibles : retire-les à part, ou bannis). |
| **Adresses bannies** | Les bannissements (gardés sous forme d'empreinte chiffrée, jamais l'adresse IP en clair), avec leur raison ; « Lever le bannissement ». |
| **Archives** | Créer les éditions (« 2026 », « 2028 »…). Une édition montre les présences publiées jusqu'à son année. **Figer** une édition garde pour toujours la liste exacte de ses présences : c'est l'instantané à confier aux archives de longue durée. |
| **Journal & export** | Toutes les décisions (qui, quoi, quand, pourquoi). **Exporter** télécharge toutes les données du musée en un fichier JSON lisible. |

Chaque décision est écrite dans le journal. Rien n'est effacé en silence.

### Les règles que le serveur fait respecter (même si quelqu'un contourne le site)

- 18 ans ou plus (déclaration demandée avant la première trace).
- Deux bulles au plus par compte : sa propre trace, et une mémoire pour une personne décédée.
- Publier scelle les quatre réponses pendant cinq ans ; chaque fragment et chaque média est scellé
  au moment où il est déposé (ni modifiable, ni retirable par l'auteur pendant cinq ans).
  L'auteur garde la main sur l'ordre : les trois premiers se montrent sur son profil. Après cinq
  ans, une réponse ou un fragment se modifie, et il est scellé de nouveau.
- Une mémoire commence par « Que peux-tu me dire sur cette personne ? » : 500 caractères.
- Limites par rubrique (10, 7 ou 15 selon la rubrique), 20 photos, vidéos, sons et documents
  libres ; tailles maximales par type de fichier ; le type réel des fichiers est vérifié (un faux
  fichier image est refusé).
- L'œuvre commune : un seul trait par compte **et** par appareil, tous de la même longueur, dans
  la toile (16 × 10).
- Une adresse IP bannie (son empreinte) ne peut plus ouvrir le site.
- Les limites viennent du même fichier que le site (`src/data/types.ts`) : les changer à un
  endroit les change partout.

---

## 5. Où vivent les données

**La base PostgreSQL** (volume Docker `base`) :

| Table | Contenu |
| --- | --- |
| `comptes` | e-mail, rôle, date de la déclaration 18+, suspension, dates de venue |
| `liens_connexion`, `sessions` | codes en attente et connexions en cours (seule une empreinte des codes et des jetons est gardée) |
| `traces` | les bulles : nom, couleur, matière, pays, les quatre réponses (ou l'aperçu d'une mémoire), paramètres privés, statut publiée/retirée (et la raison), date de scellement |
| `fragments` | les fragments d'existence, par rubrique, avec l'ordre choisi par l'auteur |
| `medias` | les fiches des médias (titre, légende, type, clé du fichier ou adresse d'un lien) |
| `traits` | l'œuvre commune |
| `editions` | les éditions des archives (et la liste figée de leurs présences) |
| `signalements` | les signalements et leur traitement |
| `bannissements` | les empreintes des adresses IP bannies, et la raison |
| `journal` | toutes les actions importantes |

**Les fichiers** (photos, sons, vidéos, documents) : dans le volume Docker `fichiers`
(`STOCKAGE=disque`) ou dans le bucket S3 (`STOCKAGE=s3`, bucket privé : le serveur donne des
adresses temporaires signées). Ils sont servis à l'adresse `/api/fichiers/…`.

### Regarder la base directement

```bash
docker compose exec base psql -U nmm nmm
```

Quelques requêtes utiles :

```sql
-- les dernières traces publiées
select id, nom, type, pays, cree_le from traces where statut = 'publiee' order by cree_le desc limit 20;

-- combien de fragments par rubrique
select rubrique, count(*) from fragments group by rubrique order by 2 desc;

-- les traces d'un compte
select t.id, t.nom, t.type from traces t join comptes c on c.id = t.compte_id where c.email = 'personne@exemple.fr';

-- l'activité de la semaine
select action, count(*) from journal where cree_le > now() - interval '7 days' group by action order by 2 desc;
```

Préfère l'espace `/admin` pour toute modification : il écrit au journal et respecte les règles.

---

## 6. Sauvegardes et restauration

Le service `sauvegarde` fait, **chaque nuit**, dans le dossier `./sauvegardes` du serveur :
- `base-AAAA-MM-JJ_HHMM.dump` : toute la base (gardée `SAUVEGARDE_JOURS` jours, 30 par défaut) ;
- `fichiers/` : une copie de tous les fichiers déposés (seuls les nouveaux sont copiés) ;
- `fichiers-retires/` : les fichiers retirés du musée (modération, effacement de compte), gardés
  30 jours puis effacés pour de bon.

Sauvegarde immédiate : `docker compose exec sauvegarde sh /sauvegarde.sh`
Voir les dernières : `docker compose logs sauvegarde`

**Copie hors du serveur (indispensable).** Par exemple avec [rclone](https://rclone.org) vers un
stockage S3 d'un autre fournisseur, chaque nuit (crontab du serveur ; une règle de cycle de vie
chez ce fournisseur peut effacer les vieilles copies) :

```bash
30 4 * * * rclone copy /root/musee/sauvegardes distant:nmm-sauvegardes
```

Si les fichiers sont sur S3 (`STOCKAGE=s3`), active aussi le versionnage du bucket chez le
fournisseur : c'est la sauvegarde des fichiers.

### Restaurer

```bash
docker compose stop musee
# la base (remplace tout par la sauvegarde choisie)
docker compose exec -T base pg_restore -U nmm -d nmm --clean --if-exists < sauvegardes/base-2026-09-30_0400.dump
# les fichiers (STOCKAGE=disque)
docker compose run --rm --no-deps -v "$PWD/sauvegardes:/s:ro" --user root --entrypoint sh musee -c 'cp -a -n /s/fichiers/. /donnees/fichiers/ && chown -R node:node /donnees/fichiers'
docker compose start musee
```

Essaie une restauration de temps en temps sur un serveur de test : une sauvegarde qu'on n'a
jamais restaurée n'est qu'un espoir.

---

## 7. La protection des données (les droits de chacun)

- **Emporter ses données** : dans Compte, « Emporter toutes mes données » télécharge un fichier
  avec son compte, ses traces, fragments, les fiches de ses médias (avec leurs liens de
  téléchargement) et son trait.
- **Tout effacer** : dans Compte, en écrivant `EFFACER`. Le scellement ne l'empêche pas : c'est
  un droit. Les fichiers sont effacés du stockage ; ils disparaissent des sauvegardes au bout de
  30 jours.
- **Minimisation** : on ne garde que l'e-mail (pas de nom légal, pas de mot de passe) ; les codes,
  les sessions, l'identifiant d'appareil de l'œuvre commune et l'adresse IP de qui écrit (pour
  pouvoir bannir) ne sont gardés que sous forme d'empreinte.
- **Écrire au fondateur** : partout sur le site, la même adresse (`VITE_CONTACT` au moment de
  construire le site, `nosmots@memoriaux.org` par défaut) pour consulter, modifier ou supprimer
  ses données.
- À compléter par toi : les mentions légales et la politique de confidentialité (page Juridique),
  avec le nom de l'hébergeur, du service d'e-mail et, s'il y en a un, du stockage S3.

---

## 8. Travailler sur ton ordinateur

Il faut Node.js 22 et une base PostgreSQL. Le plus simple avec Docker :

```bash
docker run -d --name nmm-base -p 5432:5432 -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_DB=nmm postgres:16-alpine

npm install && npm --prefix server install
cp server/.env.exemple server/.env      # mets ton e-mail dans ADMIN_EMAILS
npm run serveur                          # l'API sur http://localhost:8787
npm run dev:en-ligne                     # le site sur http://localhost:5173, relié à l'API
```

Sans SMTP, le code s'affiche sur la page (« Serveur de développement : le code est … ») et dans le
terminal du serveur. `npm run dev` (sans « en-ligne ») lance le prototype autonome.

Les tests du serveur (`npm run serveur:test`) créent une base jetable : ils ont besoin des
programmes PostgreSQL 16 (`initdb`, `pg_ctl`) ; indique leur dossier avec `PG_BIN` s'ils ne sont
pas dans `/usr/lib/postgresql/16/bin`.

---

## 9. L'API, pour mémoire

| Qui | Routes |
| --- | --- |
| Tout le monde | `GET /api/presences` · `GET /api/traces/:id` · `GET /api/recherche?q=…&rubriques=…` · `GET /api/editions` · `GET /api/editions/:id/presences` · `GET /api/fichiers/…` · `POST /api/signalements` · `GET /api/traits` · `GET /b/:id` (lien partagé, aperçu pour les messageries) · `GET /api/sante` |
| Connexion | `POST /api/auth/code` · `POST /api/auth/verifier` (adresse + code) · `POST /api/auth/deconnexion` · `GET /api/moi` · `POST /api/moi/majeur` · `POST /api/moi/email` · `POST /api/moi/email/confirmer` |
| Auteur | `GET /api/moi/traces` · `POST /api/traces` · `PUT /api/traces/:id/reponses` (après cinq ans) · `PUT /api/traces/:id/parametres` · `POST /api/traces/:id/fragments` · `PUT /api/fragments/:id` (après cinq ans) · `POST /api/traces/:id/medias` · ordre (`…/deplacer`) · `POST /api/traits` · `GET /api/moi/export` · `DELETE /api/moi` |
| Fondateur | `/api/admin/…` : `etat`, `signalements`, `traces` (`…/statut`, `…/bannir`), `bannissements`, `fragments/:id`, `medias/:id`, `traits`, `comptes`, `editions`, `journal`, `export` |

Le code : `server/src/routes/` (une route = une règle lisible), le schéma : `server/migrations/`.
Pour faire évoluer la base, ajoute un fichier `server/migrations/005_….sql` (le suivant dans
l'ordre) : il sera appliqué une fois, au prochain démarrage.

---

## 10. Rapidité : ce que le serveur fait déjà

- **Vidéos et sons lus par morceaux** (requêtes « Range ») : on peut avancer dans une vidéo, et
  les iPhone et iPad les lisent (ils l'exigent).
- **Rien n'est envoyé deux fois** : la constellation et l'œuvre commune sont gardées en mémoire et
  portent une étiquette de version ; un navigateur qui a déjà la bonne version reçoit une réponse
  vide (« 304 »). Toute écriture renouvelle la version, la nouvelle bulle apparaît aussitôt.
- **Les fichiers déposés** sont gardés une semaine par le navigateur (ils ne changent jamais) ;
  avec S3, la même adresse temporaire est redonnée pendant 50 minutes pour que le cache serve.
- **Le site** : les fichiers `assets/` sont gardés un an (leur nom change à chaque version), la page
  `index.html` est toujours revérifiée : une mise à jour est vue tout de suite, sans page cassée.
- **La recherche** passe par des index « trigrammes » (migration 002) : elle reste rapide avec des
  milliers de traces et de fragments.
- **Garde-fous** : une requête à la base ne dure jamais plus de 15 secondes ; une connexion perdue
  avec la base n'arrête pas le serveur.

Réglages facultatifs (dans `.env`, rarement utiles) :

| Réglage | Par défaut | Rôle |
| --- | --- | --- |
| `PG_CONNEXIONS` | `10` | connexions simultanées à la base |
| `PROXY_DE_CONFIANCE` | `loopback, linklocal, uniquelocal` | les relais dont on croit l'adresse transmise (Caddy, sur le réseau privé de Docker) |
