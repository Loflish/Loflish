# Ne jamais perdre le travail — récupérer, sauvegarder, reprendre

## Dernier état de progression

Le point actuel est [REPRISE.md](REPRISE.md), daté du 8 octobre 2026. Il réunit les
décisions utiles, les six matières intégrées et les trois essais conservés sous
condition de singularité. Les fichiers sont dans `design/suivi/2026-10-08/`.
Les notes ci-dessous décrivent aussi des échanges Claude antérieurs ; leur
historique privé n'est pas inclus dans ce dépôt. Commencer par REPRISE.md pour
retrouver l'état actuel, les vérifications et les questions encore ouvertes.

Tout le travail sur le site est gardé à trois endroits différents. Même si une limite
d'utilisation est atteinte au milieu d'une tâche, rien de ce qui a été poussé n'est perdu.

| Quoi | Où | Comment le récupérer |
| --- | --- | --- |
| **Le site et le serveur** (tout le code, les images, les matières, les documents) | Sur GitHub : dépôt `Loflish/Loflish`, branche `claude/practical-newton-r1t0oq` | Télécharger le ZIP (voir § 1) ou cloner le dépôt |
| **Nos conversations** | Dans l'historique de tes sessions sur claude.ai/code, et dans l'archive que je t'ai envoyée (`archive-nos-mots-memoriaux.zip`) | Voir § 2 |
| **L'aperçu en ligne** | Ton Artifact privé sur claude.ai : https://claude.ai/artifact/TCtcMK9snJFn31fkH1XwyT | Galerie : https://claude.ai/code/artifacts |
| **Les images Higgsfield** | Dans le dépôt (`public/hd/`, `design/hd/`) et dans l'historique de ton compte Higgsfield | Déjà dans le ZIP du code |

---

## 1. Télécharger tout le code sur ton ordinateur

**Sans rien installer.** Ouvre ce lien, le téléchargement commence :

https://github.com/Loflish/Loflish/archive/refs/heads/claude/practical-newton-r1t0oq.zip

Range le ZIP à deux endroits : sur ton ordinateur, et sur un espace en ligne (iCloud, Google
Drive, OneDrive, une clé USB…). Refais-le de temps en temps, par exemple après chaque grosse
journée de travail : chaque ZIP est une photo complète du site à ce moment-là.

**Avec Git** (si tu veux travailler dessus, ou le faire tourner) :

```bash
git clone -b claude/practical-newton-r1t0oq https://github.com/Loflish/Loflish.git nos-mots-memoriaux
cd nos-mots-memoriaux
npm install
npm run dev          # le site s'ouvre sur http://localhost:5173
```

Pour mettre ta copie à jour plus tard : `git pull` dans le dossier.

**L'historique complet** : chaque étape est un « commit » avec une explication. Sur GitHub :
https://github.com/Loflish/Loflish/commits/claude/practical-newton-r1t0oq — on peut revenir à
n'importe quelle version.

> ⚠️ **Le dépôt est public** : n'importe qui peut lire le code. Si tu préfères le garder pour
> toi, sur GitHub : dépôt → *Settings* → tout en bas *Change repository visibility* → *Private*.
> Le travail avec Claude continue de la même façon.

---

## 2. Garder nos conversations

1. **L'historique claude.ai** : tes sessions restent dans la liste des sessions de Claude Code
   (application Claude, ou https://claude.ai/code). Celle-ci :
   https://claude.ai/code/session_01GETcxTTiGeWmRQhR8pm9zT
2. **L'archive envoyée en fichier** (`archive-nos-mots-memoriaux.zip`), à télécharger et à ranger
   avec le ZIP du code. Elle contient :
   - `nos-conversations.md` : tous tes messages et toutes mes réponses, lisibles (s'ouvre avec
     n'importe quel éditeur de texte ; les résumés automatiques sont dedans aussi) ;
   - `cahier-des-charges-conversation-chatgpt.md` : le document de conception de départ ;
   - `images-envoyees/` : les images que tu m'as envoyées ;
   - `RECUPERER.md` et `CLAUDE.md` : ce guide et la mémoire du projet.
   La transcription technique complète (`transcription-complete-sans-images.jsonl.gz`, sans les
   captures d’écran) est envoyée à part :
   elle ne sert que si une future session doit retrouver un détail précis.
3. Ces fichiers restent privés : ne les mets pas dans le dépôt GitHub (il est public).

---

## 3. Si la limite d'utilisation est atteinte

- **Ce qui est poussé sur GitHub est en sécurité.** Je pousse après chaque étape terminée ; au
  pire, seule l'étape en cours est à refaire.
- La session reprend quand la limite se réinitialise : il suffit de réécrire dans la même
  session. Tout le contexte y est encore.
- Si la session elle-même est perdue ou trop longue, ouvre une **nouvelle session** Claude Code
  sur le dépôt `Loflish/Loflish` et écris par exemple :

  > Reprends le projet Nos mots mémoriaux sur la branche claude/practical-newton-r1t0oq.
  > Lis CLAUDE.md, RECUPERER.md, README.md et DEPLOIEMENT.md avant de faire quoi que ce soit.
  > Ensuite, voici ce que je veux faire aujourd'hui : …

  Le fichier `CLAUDE.md` est lu automatiquement : il contient la direction artistique, les règles
  du musée et la façon de travailler. Si une question précise revient (« pourquoi avait-on choisi
  ça ? »), joins `nos-conversations.md` à ton message.
- Garde aussi le lien de l'aperçu : il se met à jour au même endroit à chaque publication.

---

## 4. Petite routine conseillée

- À la fin de chaque journée de travail : télécharger le ZIP du code (§ 1).
- Après une conversation importante : me demander « exporte nos conversations » pour recevoir
  une archive à jour.
- Une fois par mois : vérifier que tu sais ouvrir le ZIP et lancer `npm run dev` (une sauvegarde
  qu'on n'a jamais ouverte n'est qu'un espoir).
- Quand le musée sera en ligne : les sauvegardes des **données des visiteurs** sont décrites dans
  `DEPLOIEMENT.md` § 6 (automatiques chaque nuit, plus une copie ailleurs).
