# MealSaver — Sprint 2 — Jean Jacques Arquero

## Travail attribué

### MEALSAVER-39 — Ajouter un article à la liste
Priorité : High

En tant qu'utilisateur, je veux ajouter un article à la liste d'épicerie collaborative afin d'indiquer aux membres du foyer quoi acheter.

Critères d'acceptation :
- L'utilisateur peut ajouter un article avec un nom.
- L'article apparaît dans la liste collaborative.
- Les autres membres peuvent voir l'article.
- Un article déjà présent n'est pas ajouté en double.

### MEALSAVER-40 — Ajouter les ingrédients manquants d'une recette à la liste
Priorité : Medium

En tant qu'utilisateur, je veux ajouter les ingrédients manquants d'une recette à la liste afin de préparer les achats nécessaires.

Critères d'acceptation :
- Les ingrédients manquants peuvent être ajoutés à la liste.
- L'article ajouté contient un nom et une quantité si disponible.
- Les doublons sont évités ou fusionnés.
- Les membres du foyer voient les nouveaux articles.

### MEALSAVER-41 — Cocher un article acheté
Priorité : High

En tant que membre du foyer, je veux cocher un article acheté afin de montrer aux autres membres que l'achat est fait.

Critères d'acceptation :
- Un article peut être marqué comme acheté.
- Un article acheté reste visible avec un statut différent.
- Le statut peut être modifié de nouveau si l'utilisateur s'est trompé.
- Le membre responsable de l'achat peut être affiché.

---

# Règles de travail

- Ne pas travailler directement sur main.
- Travailler uniquement sur MEALSAVER-39, MEALSAVER-40 et MEALSAVER-41.
- Ne pas modifier les fonctionnalités attribuées aux autres collaborateurs.
- Ne pas supprimer ni réécrire l'historique Git.
- Ne jamais utiliser git push --force.
- Conserver l'architecture existante de MealSaver.
- Ne jamais ajouter de .env réel, mot de passe, clé API ou secret dans Git.
- Tester le frontend et le backend avant le push.

---

# Mise en place Git

Dépôt officiel :

https://github.com/Hafdekhil/MealSaver.git

Ouvrir PowerShell dans le dossier MealSaver fourni.

Initialiser Git :

git init

Ajouter le dépôt officiel :

git remote add origin https://github.com/Hafdekhil/MealSaver.git

Récupérer les branches distantes :

git fetch origin

Rattacher le dossier à la base commune Sprint 1 :

git reset --hard origin/integration/sprint1-user-journey

Exclure localement les fichiers de préparation du Sprint 2 :

Add-Content .git/info/exclude "SPRINT2_*_INSTRUCTIONS.md"
Add-Content .git/info/exclude "SPRINT2_COORDINATION.md"
Add-Content .git/info/exclude "backend/src/server.ts"

Créer ensuite la branche Sprint 2 de Jean Jacques :

git switch -c feature/MEALSAVER-39-41-jeanjacques

---

# Développement

Jean Jacques travaille uniquement sur :

MEALSAVER-39
MEALSAVER-40
MEALSAVER-41

Le développement doit s'intégrer au foyer partagé et aux fonctionnalités déjà existantes.

Faire des commits clairs et liés aux récits Jira.

Exemples :

git status
git add <fichiers-modifies-pour-le-recit>
git status
git commit -m "feat(shopping): implement MEALSAVER-39 collaborative shopping list"

git commit -m "feat(shopping): implement MEALSAVER-40 missing recipe ingredients"

git commit -m "feat(shopping): implement MEALSAVER-41 purchased item status"

---

# Validation avant livraison

Backend :

npm --prefix backend test
npm --prefix backend run build

Frontend :

npm --prefix frontend run lint
npm --prefix frontend run build

Git :

git diff --check
git status

Les tests, builds et lint doivent être propres avant le push.

---

# Envoi vers GitHub

git push -u origin feature/MEALSAVER-39-41-jeanjacques

Créer ensuite une Pull Request.

Titre recommandé :

Sprint 2 - Jean Jacques - MEALSAVER-39 40 41 - Liste d'épicerie

La Pull Request doit mentionner :
- MEALSAVER-39
- MEALSAVER-40
- MEALSAVER-41
- les tests effectués
- les fichiers principaux modifiés
- les fonctionnalités terminées

Ne pas merger soi-même la Pull Request.

Attendre :
1. CI verte
2. revue du code
3. validation du responsable du projet
4. autorisation de merge

---

# Important

Ne pas remplacer le dépôt distant.
Ne pas recréer main.
Ne pas effectuer de force push.
Ne pas supprimer le travail des autres collaborateurs.
Ne pas ajouter de documentation ou de travail hors des récits attribués sans demande du responsable.
