# MealSaver

**Réduire le gaspillage alimentaire grâce à un foyer collaboratif, un inventaire partagé et des fonctions intelligentes.**

MealSaver est une application Web responsive qui aide les membres d'un foyer à gérer leurs aliments, repérer les produits à consommer en priorité et obtenir des suggestions de recettes anti-gaspillage.

Le projet est développé progressivement par sprints :

- **Sprint 0** : cadrage, conception, maquettes, prototype et fondations du projet.
- **Sprint 1** : authentification, foyer collaboratif et inventaire partagé.
- **Sprint 2** : scan intelligent MVP, validation humaine, recettes anti-gaspillage et raccordement alertes-recettes.

> **Revue Sprint 2 : vendredi 11 septembre 2026.** L'état présenté dans ce README correspond à l'avancement réel au 10 septembre 2026. Les éléments encore en cours ne sont pas présentés comme livrés.

---

## Objectif du projet

MealSaver centralise les informations alimentaires d'un foyer afin de :

- savoir quels aliments sont disponibles ;
- éviter les achats en double ;
- suivre les quantités, les emplacements et les dates d'expiration ;
- partager l'information entre les membres du foyer ;
- prioriser les aliments à consommer ;
- proposer des recettes selon l'inventaire ;
- réduire le gaspillage alimentaire.

Parcours produit principal :

**Foyer → Inventaire → Alertes → Recettes → Liste d'épicerie**

---

# Sprint 0 - Conception et prototype

Le Sprint 0 a défini le périmètre MVP, les besoins utilisateurs, l'identité visuelle, les maquettes Web/mobile, le backlog, l'organisation Jira/GitHub et le prototype de démonstration.

Certaines fonctions visibles dans le prototype étaient simulées. Leur implémentation réelle est réalisée progressivement dans les sprints de développement.

## Références Jira - Sprint 0

| Récit | Titre | Statut |
|---|---|---|
| MEALSAVER-21 | Consulter la vitrine MealSaver | Done |
| MEALSAVER-22 | Comprendre la solution proposée | Done |
| MEALSAVER-23 | Demander l'accès ou ouvrir la démo | Done |

---

# Sprint 1 - Application fonctionnelle

Le Sprint 1 a transformé le prototype en application Web réelle avec frontend, backend et base de données.

## Authentification et foyer

L'utilisateur peut créer un compte, se connecter, conserver une session, se déconnecter, créer un foyer, inviter un membre et consulter les personnes du foyer. La maintenance intégrée après le Sprint 1 complète également l'acceptation/refus d'invitation, l'annulation d'une invitation en attente, le retrait ou le départ d'un membre et la gestion de plusieurs foyers.

Les rôles persistés sont `OWNER` et `MEMBER`; les invitations en attente sont gérées séparément.

## Inventaire partagé

Les membres autorisés d'un foyer peuvent consulter un inventaire commun. Un aliment peut contenir un nom, une quantité, une unité, un emplacement, une date d'expiration et l'utilisateur ayant ajouté l'aliment.

Emplacements disponibles : `FRIDGE`, `PANTRY` et `FREEZER`.

Un membre autorisé peut ajouter, modifier et supprimer un aliment. Les contrôles d'appartenance au foyer sont appliqués côté serveur.

## Répartition officielle - Sprint 1

| Récit | Titre | Responsable | Statut |
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

Les contributions historiques du Sprint 1 restent attribuées à leurs auteurs.

---

# Sprint 2 - Dimension intelligente et anti-gaspillage

## Objectif engagé

**Ajouter la dimension intelligente : scan MVP, recettes, liens alertes-recettes et préférences.**

Le Sprint 2 a été raccourci à quatre séances. L'équipe conserve une séparation stricte entre **Done**, **In Progress** et **To Do** afin que Jira, GitHub et la démonstration reflètent l'avancement réel.

## État des récits engagés au Sprint 2

| Récit | Titre | Responsable principal | État au 10 septembre |
|---|---|---|---|
| MEALSAVER-33 | Scanner ou téléverser un aliment | Hafedh | **Done - PR #34 fusionnée** |
| MEALSAVER-34 | Valider ou corriger le résultat du scan | Hafedh | **Done - PR #36 fusionnée** |
| MEALSAVER-35 | Utiliser une saisie manuelle si le scan échoue | Hafedh | **In Progress** |
| MEALSAVER-36 | Recevoir une recette | Kevin | **Done - PR #32 fusionnée** |
| MEALSAVER-37 | Voir les ingrédients disponibles et manquants | Kevin | **Done - PR #32 fusionnée** |
| MEALSAVER-38 | Prioriser les aliments proches de l'expiration | Kevin | **Done - PR #32 fusionnée** |
| MEALSAVER-40 | Ajouter les ingrédients manquants d'une recette à la liste | Jean Jacques | **In Progress** |
| MEALSAVER-44 | Relier une alerte à une recette | Kevin | **Done - PR #37 fusionnée** |
| MEALSAVER-48 | Consulter son profil | Kevin | **To Do** |
| MEALSAVER-49 | Modifier ses préférences alimentaires | Kevin | **To Do** |
| MEALSAVER-50 | Gérer les notifications | Kevin | **To Do** |

MEALSAVER-39 et MEALSAVER-41 appartiennent au périmètre planifié du Sprint 1 dans le carnet de produit. Ils restent suivis séparément et ne sont pas ajoutés artificiellement aux récits engagés du Sprint 2.

## Rattrapage intégré pendant le Sprint 2

Les alertes d'expiration prévues antérieurement ont été finalisées pendant le Sprint 2 :

| Récit | Titre | Responsable | État |
|---|---|---|---|
| MEALSAVER-42 | Recevoir une alerte d'expiration | Kevin | **Done - PR #37 fusionnée** |
| MEALSAVER-43 | Voir les alertes dans le tableau de bord | Kevin | **Done - PR #37 fusionnée** |

Selon l'instruction de l'enseignant, Kevin reprend les tâches de vérification et de QA du Sprint 2 initialement attribuées à Danensky. Les contributions historiques de Danensky au Sprint 1 restent inchangées.

## Scan intelligent MVP

Le parcours livré permet :

1. de téléverser une image ou prendre une photo sur un appareil compatible ;
2. d'afficher un aperçu ;
3. d'envoyer l'image à une route backend protégée ;
4. d'obtenir une proposition d'identification ;
5. de corriger le nom et la quantité ;
6. de confirmer explicitement l'ajout à l'inventaire.

Aucun aliment n'est ajouté automatiquement à l'inventaire à partir de la seule réponse du modèle.

Le parcours de secours de **MEALSAVER-35** reste à finaliser : lorsqu'une analyse échoue, l'utilisateur doit pouvoir continuer avec une saisie manuelle claire.

## Recettes anti-gaspillage

Les recettes utilisent l'inventaire du foyer. Le système distingue les ingrédients disponibles et manquants, priorise les aliments proches de l'expiration et explique la recommandation. Une solution de repli est fournie lorsqu'aucune recette exacte du catalogue ne correspond.

Le raccordement réel des ingrédients manquants vers la liste d'épicerie relève de **MEALSAVER-40** et reste à finaliser.

## Alertes → Recettes

Une alerte d'expiration peut ouvrir les recettes en transmettant le foyer et l'aliment concerné. Le backend privilégie une recette utilisant cet aliment. Le contexte est affiché dans l'interface afin que l'utilisateur comprenne pourquoi la recette est proposée.

---

# Exigence particulière de la revue Sprint 2 : objet intelligent

Le livrable officiel de la semaine 3 demande une chaîne démontrable de bout en bout :

**acquisition automatique d'une mesure → transmission au système → persistance horodatée avec sa source → restitution dans l'interface**.

Une version **simulée** est autorisée par le livrable et doit rester disponible comme référence de développement. Au 10 septembre, cette chaîne n'est **pas encore intégrée au dépôt principal MealSaver**. Elle constitue donc un bloc prioritaire avant la revue et ne doit pas être présentée comme livrée tant que son implémentation, ses tests et son intégration ne sont pas terminés.

Le scénario minimal retenu pour satisfaire cette exigence sera documenté dans `docs/SPRINT2_REVIEW.md` et devra inclure un cas de défaillance provoqué.

---

# Architecture technique

## Frontend

React, TypeScript, Vite et React Router.

Dossier principal : `frontend/`

## Backend

Node.js, Express, TypeScript, Zod, Prisma ORM, JWT et cookies de session.

Dossier principal : `backend/`

## Base de données

PostgreSQL avec Prisma ORM et migrations versionnées.

Schéma principal : `backend/prisma/schema.prisma`

---

# Installation locale

## Prérequis

- Git
- Node.js et npm
- PostgreSQL

## Cloner et installer

```bash
git clone https://github.com/Hafdekhil/MealSaver.git
cd MealSaver
npm --prefix backend install
npm --prefix frontend install
```

## Configurer le backend

```powershell
Copy-Item backend/.env.example backend/.env
```

Configurer ensuite `backend/.env` avec les variables nécessaires. Le vrai fichier `.env` et les secrets ne doivent jamais être versionnés.

## Préparer Prisma

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
cd ..
```

## Lancer en développement

```bash
npm --prefix backend run dev
npm --prefix frontend run dev
```

Le backend est normalement accessible sur `http://127.0.0.1:3001` et le frontend Vite sur `http://localhost:5173`.

---

# Tests et intégration continue

```bash
npm --prefix backend test
npm --prefix backend run build
npm --prefix frontend run lint
npm --prefix frontend run build
```

Les Pull Requests fonctionnelles sont revues par un autre membre de l'équipe avant intégration et la CI doit être verte.

Les PR Sprint 2 déjà fusionnées contiennent les preuves de tests et de build propres à chaque incrément. La revue du Sprint 2 doit aussi pouvoir montrer et expliquer les tests d'intégration et de bout en bout associés au parcours de l'objet intelligent lorsque ce bloc sera réalisé.

---

# Déploiement et démonstration

Le prototype statique historique ne doit pas être confondu avec l'application full-stack actuelle.

Pour la revue Sprint 2, le livrable de cours exige que **la version démontrée soit celle qui est déployée en ligne**. Le déploiement de l'application full-stack courante doit donc être validé avant la présentation. Une fonctionnalité uniquement locale ne sera pas comptée comme livrée dans la revue officielle.

Voir `docs/SPRINT2_REVIEW.md` pour la checklist de présentation et les écarts à fermer.

---

# Utilisation de l'IA générative

ChatGPT est utilisé comme assistant de développement pour l'analyse, la revue de code, le débogage, la préparation des tests et la documentation. Les responsables des contributions doivent pouvoir expliquer et défendre le code soumis.

Google Gemini est utilisé par la fonctionnalité de scan pour proposer l'identification d'un aliment à partir d'une image. Cette sortie reste une proposition : une validation humaine est obligatoire avant tout ajout à l'inventaire.

Les clés et secrets sont gérés par variables d'environnement et ne doivent pas être ajoutés au dépôt.

---

# État global au 10 septembre 2026

- **Sprint 0 : terminé.**
- **Sprint 1 : incrément principal intégré ; maintenance foyer/invitations également fusionnée.**
- **Sprint 2 : plusieurs récits centraux sont Done ; MEALSAVER-35, MEALSAVER-40, MEALSAVER-48/49/50, la chaîne d'objet intelligent demandée par la revue et le déploiement final restent à fermer ou à déclarer explicitement comme écarts avant la présentation.**

La référence fonctionnelle reste Jira et le carnet de produit. GitHub fournit la traçabilité des Pull Requests, revues et validations techniques.
