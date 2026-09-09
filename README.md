# MealSaver

**Réduire le gaspillage alimentaire grâce à un foyer connecté et un inventaire partagé.**

MealSaver est une application Web collaborative qui aide les membres d'un foyer à gérer leurs aliments et à réduire le gaspillage alimentaire.

Le projet est développé progressivement par sprints :

- **Sprint 0** : conception, maquettes, prototype et fondations du projet.
- **Sprint 1** : authentification, foyer collaboratif et inventaire partagé fonctionnel.
- **Sprint 2** : fonctionnalités intelligentes et anti-gaspillage - planifiées (To Do dans Jira).

---

## Objectif du projet

Dans un foyer, les aliments sont répartis entre le réfrigérateur, le congélateur et le garde-manger.

MealSaver vise à centraliser ces informations afin de :

- savoir quels aliments sont disponibles ;
- éviter les achats en double ;
- suivre les quantités et les dates d'expiration ;
- partager l'information entre les membres du foyer ;
- réduire le gaspillage alimentaire.

Le parcours produit prévu est :

**Foyer -> Inventaire -> Alertes -> Recettes -> Liste d'épicerie**

---

# Sprint 0 - Conception et prototype

Le Sprint 0 a permis de définir les fondations de MealSaver.

Il comprend notamment :

- définition du problème et de la solution ;
- analyse du besoin utilisateur ;
- conception de l'expérience utilisateur ;
- maquettes Web et responsive ;
- identité visuelle MealSaver ;
- prototype démonstratif ;
- organisation du dépôt GitHub ;
- préparation du backlog produit.

Le prototype Sprint 0 présentait notamment :

- foyer collaboratif ;
- inventaire alimentaire ;
- alertes d'expiration ;
- recettes anti-gaspillage ;
- liste d'épicerie collaborative ;
- scan intelligent ;
- tableau de bord.

Certaines de ces fonctions étaient uniquement représentées dans le prototype. Leur implémentation réelle est réalisée progressivement dans les sprints suivants.


## Références Jira - Sprint 0

| Récit | Titre | Statut |
|---|---|---|
| MEALSAVER-21 | Consulter la vitrine MealSaver | Done |
| MEALSAVER-22 | Comprendre la solution proposée | Done |
| MEALSAVER-23 | Demander l’accès ou ouvrir la démo | Done |

---

# Sprint 1 - Application fonctionnelle

Le Sprint 1 transforme le prototype en application Web réelle avec frontend, backend et base de données.

## Authentification

L'utilisateur peut :

- créer un compte ;
- se connecter ;
- conserver une session authentifiée ;
- se déconnecter ;
- accéder aux pages protégées uniquement lorsqu'il est connecté.

## Foyer collaboratif

L'utilisateur peut :

- créer un foyer ;
- consulter ses foyers ;
- sélectionner un foyer actif ;
- inviter une personne par courriel ;
- empêcher une invitation en double ;
- consulter les membres du foyer ;
- distinguer le propriétaire des membres ;
- voir séparément les invitations en attente.

Les rôles utilisés sont :

- `OWNER`
- `MEMBER`


## Inventaire partagé

Les membres autorisés d'un foyer peuvent consulter un inventaire commun.

Un aliment peut contenir : nom, quantité, unité, emplacement, date d'expiration et utilisateur ayant ajouté l'aliment.

Emplacements disponibles : FRIDGE (réfrigérateur), PANTRY (garde-manger) et FREEZER (congélateur).

Un membre autorisé peut ajouter, modifier et supprimer un aliment. Une confirmation est demandée avant la suppression.


---

# Architecture technique

## Frontend

React, TypeScript, Vite et React Router.

Dossier principal : frontend/

## Backend

Node.js, Express, TypeScript, Zod, Prisma ORM, JWT et cookies de session.

Dossier principal : backend/

## Base de données

PostgreSQL avec Prisma ORM et migrations versionnées.

Schéma principal : backend/prisma/schema.prisma


---

# Installation locale

## Prérequis

- Git
- Node.js et npm
- PostgreSQL

## 1. Cloner le projet

`ash
git clone https://github.com/Hafdekhil/MealSaver.git
cd MealSaver
`

## 2. Installer les dépendances

`ash
npm --prefix backend install
npm --prefix frontend install
`

## 3. Configurer le backend

Copier le fichier d'exemple :

`powershell
Copy-Item backend/.env.example backend/.env
`

Configurer ensuite ackend/.env avec notamment DATABASE_URL et JWT_SECRET. Le vrai fichier .env ne doit jamais être ajouté à Git.


## 4. Préparer Prisma et la base de données

Après avoir créé la base PostgreSQL et configuré DATABASE_URL :

`ash
cd backend
npx prisma generate
npx prisma migrate deploy
cd ..
`

## 5. Lancer le backend

Dans un premier terminal, depuis la racine du projet :

`ash
npm --prefix backend run dev
`

Par défaut, le backend est accessible sur http://127.0.0.1:3001.

## 6. Lancer le frontend

Dans un deuxième terminal :

`ash
npm --prefix frontend run dev
`

Ouvrir ensuite http://localhost:5173 dans le navigateur. En développement, Vite transmet les requêtes /api au backend local.


---

# Tests et validation

## Tests backend

`ash
npm --prefix backend test
`

Les tests couvrent notamment l'authentification, les foyers, les invitations, les membres, l'inventaire et les contrôles d'autorisation.

## Build backend

`ash
npm --prefix backend run build
`

## Build frontend

`ash
npm --prefix frontend run build
`

## Lint frontend

`ash
npm --prefix frontend run lint
`

Avant une fusion vers main, la Pull Request doit être revue et la CI GitHub doit être verte.


---

# Démonstration Sprint 1

Scénario recommandé :

1. Créer un compte et se connecter.
2. Créer un foyer et vérifier le rôle OWNER.
3. Inviter un second utilisateur par courriel et vérifier le statut PENDING.
4. Vérifier que les membres actifs et les invitations en attente sont affichés séparément.
5. Ajouter un aliment avec nom, quantité, unité, emplacement et date d'expiration.
6. Modifier l'aliment et vérifier la mise à jour dans l'inventaire partagé.
7. Supprimer l'aliment et confirmer sa disparition de l'inventaire.

Remarque : l'invitation est actuellement enregistrée dans l'application ; aucun service d'envoi réel de courriel n'est requis pour cette démonstration. Le parcours complet d'acceptation de l'invitation dans l'interface reste en validation finale.

# Répartition officielle - Sprint 1

| Récit | Titre | Responsable | Statut Jira |
|---|---|---|---|
| MEALSAVER-24 | Se connecter au compte | Hafedh | Done |
| MEALSAVER-25 | Créer un compte | Hafedh | Done |
| MEALSAVER-26 | Se déconnecter du compte | Hafedh | Done |
| MEALSAVER-27 | Créer un foyer | Kevin | Done |
| MEALSAVER-28 | Inviter un membre | Kevin | Done |
| MEALSAVER-29 | Consulter les membres du foyer | Danensky | Done |
| MEALSAVER-30 | Ajouter un aliment | Danensky | Done |
| MEALSAVER-31 | Modifier un aliment | Jean Jacques | Done |
| MEALSAVER-32 | Supprimer un aliment | Jean Jacques | Done |

Les contributions Git et les Pull Requests sont conservées afin de préserver la traçabilité du travail de chaque membre.


---

# Sprint 2 - Fonctionnalités anti-gaspillage

Le Sprint 2 est en cours de développement. Les récits ci-dessous ne sont pas considérés comme livrés tant que leurs critères d'acceptation, la revue croisée et la CI ne sont pas validés.

| Récit | Titre | Responsable | Priorité | Statut Jira |
|---|---|---|---|---|
| MEALSAVER-33 | Scanner ou téléverser un aliment | Hafedh | Medium | To Do |
| MEALSAVER-34 | Valider ou corriger le résultat du scan | Hafedh | High | To Do |
| MEALSAVER-35 | Utiliser une saisie manuelle si le scan échoue | Hafedh | Medium | To Do |
| MEALSAVER-36 | Recevoir une recette | Kevin | Highest | To Do |
| MEALSAVER-37 | Voir les ingrédients disponibles et manquants | Kevin | High | To Do |
| MEALSAVER-38 | Prioriser les aliments proches de l’expiration | Kevin | Medium | To Do |
| MEALSAVER-39 | Ajouter un article à la liste | Jean Jacques | High | To Do |
| MEALSAVER-40 | Ajouter les ingrédients manquants d’une recette à la liste | Jean Jacques | Medium | To Do |
| MEALSAVER-41 | Cocher un article acheté | Jean Jacques | High | To Do |
| MEALSAVER-42 | Recevoir une alerte d’expiration | Danensky | Medium | To Do |
| MEALSAVER-43 | Voir les alertes dans le tableau de bord | Danensky | Medium | To Do |
| MEALSAVER-44 | Relier une alerte à une recette | Danensky | Medium | To Do |

## Utilisation de l'IA - Sprint 2

Pour MEALSAVER-33, ChatGPT a été utilisé comme assistant de développement pour l'analyse, la revue de code, le débogage et la préparation des tests. Les modifications ont été exécutées et vérifiées par le responsable du récit.

Google Gemini est utilisé par la fonctionnalité de scan pour proposer l'identification de l'aliment à partir d'une image. Le résultat demeure une proposition et une validation manuelle est obligatoire avant tout ajout à l'inventaire. Les clés et secrets nécessaires sont conservés dans des variables d'environnement et ne sont pas versionnés.

## Statut du projet

- Sprint 0 : terminé.
- Sprint 1 : implémenté et en validation finale.
- Sprint 2 : en cours de développement ; MEALSAVER-33 est en validation avant revue croisée et CI.

La priorité reste le respect du livrable, des critères d'acceptation Jira, de la revue croisée et de la CI avant fusion vers main.
