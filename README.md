# MealSaver

**Réduire le gaspillage alimentaire grâce à un foyer connecté, un inventaire partagé, des alertes et des recettes anti-gaspillage.**

MealSaver est une application Web collaborative développée dans le cadre du cours **420-321-AH — Projet intégrateur**.

## État du projet au 10 septembre 2026

- **Sprint 0** : conception, maquettes, prototype et fondations.
- **Sprint 1** : authentification, foyers collaboratifs et inventaire partagé intégrés.
- **Sprint 2** : incrément anti-gaspillage en cours de finalisation pour la revue du 11 septembre 2026.

Le périmètre Sprint 2 reste strictement celui déjà planifié. Aucun nouveau récit n'est ajouté pour la revue.

---

## Objectif du produit

MealSaver vise à aider un foyer à :

- connaître les aliments disponibles ;
- partager un inventaire commun ;
- suivre quantités, emplacements et dates d'expiration ;
- repérer les aliments à consommer rapidement ;
- proposer des recettes qui utilisent les aliments du foyer ;
- limiter les pertes et les achats inutiles.

Parcours produit visé :

**Foyer → Inventaire → Alertes → Recettes → Liste d'épicerie**

---

# Sprint 1 — Base fonctionnelle

Le Sprint 1 a transformé le prototype en application Web avec frontend, backend et base PostgreSQL.

Fonctions intégrées :

- création de compte, connexion, session et déconnexion ;
- création et consultation des foyers ;
- invitations et gestion des membres ;
- inventaire partagé par foyer ;
- ajout, modification et suppression d'aliments ;
- contrôle d'accès selon l'appartenance au foyer.

Les contributions originales des membres sont conservées dans l'historique Git et les Pull Requests.

---

# Sprint 2 — État réel du périmètre engagé

| Jira | Récit | Responsable | État au 10 septembre | Preuve GitHub |
|---|---|---|---|---|
| MEALSAVER-33 | Scanner ou téléverser un aliment | Hafedh | **Done** | PR #34 fusionnée |
| MEALSAVER-34 | Valider ou corriger le résultat du scan | Hafedh | **Done** | PR #36 fusionnée |
| MEALSAVER-35 | Utiliser une saisie manuelle si le scan échoue | Hafedh | **En revue** | PR #40 ouverte, CI verte |
| MEALSAVER-36 | Recevoir une recette | Kevin | **Done** | PR #32 fusionnée |
| MEALSAVER-37 | Voir les ingrédients disponibles et manquants | Kevin | **Done** | PR #32 fusionnée |
| MEALSAVER-38 | Prioriser les aliments proches de l'expiration | Kevin | **Done** | PR #32 fusionnée |
| MEALSAVER-39 | Ajouter un article à la liste | Jean Jacques | **In Progress** | non intégré à `main` |
| MEALSAVER-40 | Ajouter les ingrédients manquants d'une recette à la liste | Jean Jacques | **In Progress** | non intégré à `main` |
| MEALSAVER-41 | Cocher un article acheté | Jean Jacques | **In Progress** | non intégré à `main` |
| MEALSAVER-42 | Recevoir une alerte d'expiration | Kevin | **Done** | PR #37 fusionnée |
| MEALSAVER-43 | Voir les alertes dans le tableau de bord | Kevin | **Done** | PR #37 fusionnée |
| MEALSAVER-44 | Relier une alerte à une recette | Kevin | **Done** | PR #37 fusionnée |
| MEALSAVER-48 | Consulter son profil | Kevin | **To Do** | aucun incrément fusionné |
| MEALSAVER-49 | Modifier ses préférences alimentaires | Kevin | **To Do** | aucun incrément fusionné |
| MEALSAVER-50 | Gérer les notifications | Kevin | **To Do** | aucun incrément fusionné |

Les tâches de vérification/QA prévues pour Danensky au Sprint 2 ont été transférées à Kevin selon l'instruction de l'enseignant. Les contributions historiques de Danensky au Sprint 1 restent inchangées.

## Scan intelligent

Le parcours intégré couvre :

1. téléversement ou prise d'une photo ;
2. prévisualisation de l'image ;
3. proposition d'identification par Google Gemini ;
4. validation ou correction manuelle du résultat ;
5. ajout à l'inventaire uniquement après action explicite de l'utilisateur.

MEALSAVER-35 complète ce parcours par une saisie manuelle lorsque l'identification échoue. La PR #40 reste en revue et ne doit être fusionnée qu'après validation croisée.

## Recettes anti-gaspillage

Les recettes :

- utilisent l'inventaire du foyer ;
- distinguent ingrédients disponibles et manquants ;
- priorisent les aliments proches de l'expiration ;
- expliquent pourquoi une recette est recommandée ;
- proposent un repli lorsque le catalogue ne contient pas de recette exacte.

## Alertes d'expiration

Le système :

- calcule le délai avant expiration ;
- affiche les aliments urgents dans le tableau de bord ;
- les ordonne par urgence ;
- permet d'ouvrir l'aliment concerné ;
- transmet le contexte de l'aliment vers les recettes.

---

# Écarts à déclarer à la revue

La documentation de revue doit distinguer ce qui est réellement livré de ce qui reste à faire.

- MEALSAVER-35 est encore en attente de revue croisée avant fusion.
- MEALSAVER-39/40/41 ne sont pas encore intégrés à `main`.
- MEALSAVER-48/49/50 sont encore `To Do` dans Jira.
- L'adresse d'un environnement full-stack déployé doit être fournie à l'enseignant si elle existe ; une exécution uniquement locale ne doit pas être présentée comme un déploiement en ligne.
- La fiche officielle de la semaine 3 demande une chaîne d'objet intelligent acquisition → transmission → persistance → restitution. Aucun nouveau récit ne sera ajouté au Sprint 2 : si cette exigence n'est pas couverte par le périmètre existant, elle doit être déclarée comme écart plutôt que présentée artificiellement comme livrée.

Voir `docs/SPRINT2_LIVRABLE.md` pour la checklist détaillée et `docs/SPRINT2_PRESENTATION.md` pour le déroulement de la revue.

---

# Architecture technique

## Frontend

- React
- TypeScript
- Vite
- React Router

Dossier : `frontend/`

## Backend

- Node.js
- Express
- TypeScript
- Zod
- Prisma ORM
- JWT et cookies de session

Dossier : `backend/`

## Base de données

- PostgreSQL
- Prisma ORM
- migrations versionnées

Schéma : `backend/prisma/schema.prisma`

---

# Installation locale

## Prérequis

- Git
- Node.js et npm
- PostgreSQL

## 1. Cloner le dépôt

```bash
git clone https://github.com/Hafdekhil/MealSaver.git
cd MealSaver
```

## 2. Installer les dépendances

```bash
npm --prefix backend install
npm --prefix frontend install
```

## 3. Préparer l'environnement backend

Sous PowerShell :

```powershell
Copy-Item backend/.env.example backend/.env
```

Chaque membre configure **son propre** `backend/.env`. Le vrai fichier `.env`, les mots de passe, clés API et secrets ne sont jamais versionnés ni partagés dans le dépôt.

## 4. Préparer Prisma et PostgreSQL

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
cd ..
```

## 5. Lancer le backend

```bash
npm --prefix backend run dev
```

Backend local par défaut : `http://127.0.0.1:3001`.

## 6. Lancer le frontend

```bash
npm --prefix frontend run dev
```

Frontend local : `http://localhost:5173`.

---

# Tests et qualité

Backend :

```bash
npm --prefix backend test
npm --prefix backend run build
```

Frontend :

```bash
npm --prefix frontend run lint
npm --prefix frontend run build
```

Règles d'intégration utilisées par l'équipe :

- une contribution est développée sur une branche dédiée ;
- tests/lint/build avant intégration ;
- Pull Request ;
- revue croisée par un autre membre ;
- CI verte avant fusion dans `main` ;
- aucun secret dans Git.

---

# Utilisation de l'IA — Sprint 2

L'utilisation des outils d'IA générative est déclarée :

- **ChatGPT** : assistance à l'analyse, à la revue de code, au débogage, à la documentation et à la préparation des tests ;
- **Google Gemini** : proposition d'identification d'un aliment à partir d'une image dans le parcours Scan.

Gemini ne crée jamais automatiquement un aliment. Sa sortie est une proposition qui doit être vérifiée et validée par l'utilisateur avant ajout à l'inventaire.

Les clés et secrets sont conservés hors du dépôt dans des variables d'environnement.

---

# Revue Sprint 2 — 11 septembre 2026

Documents de préparation :

- `docs/SPRINT2_LIVRABLE.md` — checklist de conformité, preuves et écarts ;
- `docs/SPRINT2_PRESENTATION.md` — scénario de démonstration et répartition de la parole.

La version présentée doit correspondre à la version réellement validée et intégrée dans `main`.