# MealSaver

**Réduire le gaspillage alimentaire grâce à un foyer connecté et un inventaire partagé.**

MealSaver est une application Web collaborative qui aide les membres d'un foyer à gérer leurs aliments, surveiller leur expiration et utiliser en priorité les produits disponibles afin de réduire le gaspillage alimentaire.

Le projet est développé progressivement par sprints dans le cadre du cours **420-321-AH — Projet intégrateur**.

## État du projet

* **Sprint 0** — conception, maquettes, prototype et préparation du produit.
* **Sprint 1** — authentification, foyer collaboratif et inventaire partagé.
* **Sprint 2** — scan d'aliments, alertes d'expiration, recettes anti-gaspillage, liste d'épicerie collaborative, profil et préférences.

La validation locale actuelle réussit :

* **18 fichiers de tests backend sur 18** ;
* **103 tests backend sur 103** ;
* build TypeScript backend réussi ;
* lint frontend : **0 erreur et 0 avertissement** ;
* build TypeScript et Vite frontend réussi.

---

# Objectif du projet

Dans un foyer, les aliments peuvent être répartis entre plusieurs espaces de conservation : réfrigérateur, congélateur et garde-manger.

MealSaver centralise ces informations afin de permettre aux membres du foyer de :

* savoir quels aliments sont disponibles ;
* suivre les quantités ;
* connaître les dates d'expiration ;
* éviter les achats en double ;
* partager un même inventaire ;
* identifier les aliments à utiliser en priorité ;
* recevoir des suggestions de recettes adaptées ;
* préparer une liste d'épicerie commune ;
* réduire le gaspillage alimentaire.

Le parcours fonctionnel principal est :

```text
Foyer
  ↓
Inventaire partagé
  ↓
Scan ou saisie
  ↓
Alertes d'expiration
  ↓
Recettes anti-gaspillage
  ↓
Ingrédients disponibles / manquants
  ↓
Liste d'épicerie collaborative
```

---

# Sprint 0 — Conception et prototype

Le Sprint 0 a permis de définir les fondations du projet MealSaver.

Il comprend notamment :

* définition du problème et de la solution ;
* analyse du besoin utilisateur ;
* conception de l'expérience utilisateur ;
* maquettes Web et responsive ;
* identité visuelle MealSaver ;
* prototype démonstratif ;
* organisation du dépôt GitHub ;
* préparation du carnet de produit ;
* planification des premiers sprints ;
* répartition des responsabilités de l'équipe.

Le prototype présentait notamment :

* foyer collaboratif ;
* inventaire alimentaire ;
* alertes d'expiration ;
* recettes anti-gaspillage ;
* liste d'épicerie collaborative ;
* scan intelligent ;
* tableau de bord.

Certaines fonctions étaient uniquement représentées dans le prototype du Sprint 0. Leur implémentation réelle est effectuée progressivement dans les sprints suivants.

## Références Jira — Sprint 0

| Récit        | Titre                              | Statut |
| ------------ | ---------------------------------- | ------ |
| MEALSAVER-21 | Consulter la vitrine MealSaver     | Done   |
| MEALSAVER-22 | Comprendre la solution proposée    | Done   |
| MEALSAVER-23 | Demander l'accès ou ouvrir la démo | Done   |

La documentation détaillée se trouve dans :

```text
documents/sprint-0/
```

---

# Sprint 1 — Fondations fonctionnelles

Le Sprint 1 transforme le prototype en une application Web fonctionnelle reposant sur un frontend, un backend et une base de données persistante.

## Authentification

L'utilisateur peut :

* créer un compte ;
* se connecter ;
* conserver une session authentifiée ;
* se déconnecter ;
* accéder aux pages protégées uniquement lorsqu'il est connecté.

## Foyer collaboratif

L'utilisateur peut notamment :

* créer un foyer ;
* consulter les foyers auxquels il appartient ;
* sélectionner un foyer ;
* inviter un membre ;
* consulter les membres et invitations ;
* distinguer le propriétaire des autres membres.

Les rôles principaux sont :

* `OWNER`
* `MEMBER`

Les contrôles d'autorisation sont réalisés côté serveur.

## Inventaire partagé

Les membres autorisés d'un foyer disposent d'un inventaire commun.

Un aliment peut contenir notamment :

* nom ;
* quantité ;
* unité ;
* emplacement ;
* date d'expiration ;
* auteur de l'ajout.

Les emplacements gérés comprennent :

* `FRIDGE` — réfrigérateur ;
* `FREEZER` — congélateur ;
* `PANTRY` — garde-manger.

Un membre autorisé peut ajouter, modifier et supprimer un aliment.

Les données sont persistées dans PostgreSQL et isolées selon l'appartenance au foyer.

## Répartition Sprint 1

| Récit        | Titre                          | Responsable          | Statut |
| ------------ | ------------------------------ | -------------------- | ------ |
| MEALSAVER-24 | Se connecter au compte         | Hafedh Dekhil        | Done   |
| MEALSAVER-25 | Créer un compte                | Hafedh Dekhil        | Done   |
| MEALSAVER-26 | Se déconnecter du compte       | Hafedh Dekhil        | Done   |
| MEALSAVER-27 | Créer un foyer                 | Kevin Mai            | Done   |
| MEALSAVER-28 | Inviter un membre              | Kevin Mai            | Done   |
| MEALSAVER-29 | Consulter les membres du foyer | Danensky Leveille    | Done   |
| MEALSAVER-30 | Ajouter un aliment             | Danensky Leveille    | Done   |
| MEALSAVER-31 | Modifier un aliment            | Jean Jacques Arquero | Done   |
| MEALSAVER-32 | Supprimer un aliment           | Jean Jacques Arquero | Done   |

Les détails du Sprint 1 sont documentés dans :

```text
documents/sprint-1/README.md
```

---

# Sprint 2 — Parcours anti-gaspillage

Le Sprint 2 complète l'inventaire partagé avec le parcours anti-gaspillage de MealSaver.

## Scan et validation

Les récits concernés comprennent :

* **MEALSAVER-33** — Scanner ou téléverser un aliment.
* **MEALSAVER-34** — Valider ou corriger le résultat du scan.
* **MEALSAVER-35** — Utiliser une saisie manuelle si le scan échoue.

Le scan constitue une aide à l'identification.

Aucun aliment n'est ajouté automatiquement à l'inventaire : l'utilisateur conserve la validation finale.

Le backend vérifie notamment :

* l'authentification ;
* le type de fichier autorisé ;
* la cohérence entre le type annoncé et le contenu réel ;
* la taille maximale de l'image ;
* le cas où aucun aliment n'est identifiable.

En cas d'échec de l'analyse, la saisie manuelle reste disponible.

## Recettes anti-gaspillage

Les récits concernés comprennent :

* **MEALSAVER-36** — Recevoir une recette.
* **MEALSAVER-37** — Voir les ingrédients disponibles et manquants.
* **MEALSAVER-38** — Prioriser les aliments proches de l'expiration.

Les recettes utilisent l'inventaire réel du foyer.

MealSaver privilégie les aliments utilisables dont l'expiration est la plus urgente.

Les aliments déjà expirés ne sont pas proposés comme ingrédients à consommer.

Chaque recette distingue :

* les ingrédients disponibles ;
* les ingrédients manquants.

Lorsqu'une recette est ouverte depuis une alerte, le contexte de l'aliment concerné est conservé.

## Alertes d'expiration

Les récits concernés comprennent :

* **MEALSAVER-42** — Recevoir une alerte d'expiration.
* **MEALSAVER-43** — Voir les alertes dans le tableau de bord.
* **MEALSAVER-44** — Relier une alerte à une recette.

Les alertes reposent sur les dates enregistrées dans l'inventaire.

Elles permettent d'identifier les aliments :

* déjà expirés ;
* proches de leur date d'expiration.

Une alerte peut conduire vers l'inventaire ou vers le parcours de recettes.

## Liste d'épicerie collaborative

Le parcours comprend également :

* **MEALSAVER-39** — Ajouter un article à la liste d'épicerie.
* **MEALSAVER-40** — Ajouter les ingrédients manquants d'une recette à la liste.
* **MEALSAVER-41** — Cocher un article acheté.

MEALSAVER-39 et MEALSAVER-41 sont des reliquats historiquement rattachés au Sprint 1 et finalisés pendant la période du Sprint 2.

La liste d'épicerie prend en charge notamment :

* les ajouts manuels ;
* les ajouts depuis une recette ;
* les quantités et unités disponibles ;
* le partage entre membres du même foyer ;
* la gestion des doublons ;
* les articles à acheter et achetés ;
* l'achat et le désachat ;
* l'identification du membre ayant effectué l'action.

Une fusion de quantités n'est réalisée que lorsque les unités sont compatibles.

MealSaver ne réalise pas de conversion implicite pouvant modifier incorrectement une quantité.

## Profil et préférences

Le Sprint 2 comprend également :

* **MEALSAVER-48** — Consulter son profil.
* **MEALSAVER-49** — Modifier ses préférences alimentaires.
* **MEALSAVER-50** — Gérer les notifications.

Les préférences alimentaires disponibles comprennent notamment :

* aucune préférence particulière ;
* végétarien ;
* végétalien ;
* méditerranéen.

Elles peuvent influencer le classement des recettes lorsque cela est possible, sans remplacer la priorité anti-gaspillage.

L'utilisateur peut également activer ou désactiver les alertes d'expiration.

La documentation détaillée du Sprint 2 se trouve dans :

```text
documents/sprint-2/README.md
```

---

# Architecture technique

MealSaver est organisé en trois couches principales.

## Frontend

Technologies principales :

* React ;
* TypeScript ;
* Vite ;
* React Router.

Répertoire :

```text
frontend/
```

## Backend

Technologies principales :

* Node.js ;
* Express ;
* TypeScript ;
* Zod ;
* Prisma ORM ;
* JWT ;
* cookies de session.

Répertoire :

```text
backend/
```

## Base de données

MealSaver utilise :

* PostgreSQL ;
* Prisma ORM ;
* migrations Prisma versionnées.

Schéma principal :

```text
backend/prisma/schema.prisma
```

---

# Installation locale

## Prérequis

Installer :

* Git ;
* Node.js ;
* npm ;
* PostgreSQL.

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

## 3. Configurer le backend

Créer le fichier local à partir de l'exemple :

```powershell
Copy-Item backend/.env.example backend/.env
```

Configurer ensuite les variables requises dans :

```text
backend/.env
```

notamment `DATABASE_URL`, `JWT_SECRET` et les autres paramètres nécessaires à l'environnement local.

Le vrai fichier `.env` ne doit jamais être ajouté au dépôt Git.

## 4. Préparer Prisma et PostgreSQL

Après avoir créé la base PostgreSQL et configuré `DATABASE_URL` :

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
cd ..
```

## 5. Démarrer le backend

Depuis la racine :

```bash
npm --prefix backend run dev
```

Par défaut, le backend écoute sur :

```text
http://127.0.0.1:3001
```

## 6. Démarrer le frontend

Dans un second terminal :

```bash
npm --prefix frontend run dev
```

Le frontend est généralement accessible sur :

```text
http://localhost:5173
```

En développement, Vite transmet les requêtes `/api` au backend local selon la configuration du projet.

---

# Tests et validation

## Tests backend

```bash
npm --prefix backend test
```

La suite de tests actuelle couvre notamment :

* authentification ;
* inscription ;
* sessions ;
* foyers ;
* invitations ;
* membres ;
* inventaire ;
* scan ;
* alertes d'expiration ;
* recettes ;
* profil et préférences ;
* liste d'épicerie collaborative ;
* contrôles d'autorisation et isolation entre foyers.

Validation locale actuelle :

```text
Test Files  18 passed (18)
Tests       103 passed (103)
```

## Build backend

```bash
npm --prefix backend run build
```

Le backend compile avec TypeScript.

## Lint frontend

```bash
npm --prefix frontend run lint
```

Dernière validation locale :

```text
Found 0 warnings and 0 errors.
```

## Build frontend

```bash
npm --prefix frontend run build
```

Le processus exécute la compilation TypeScript puis le build Vite de production.

La dernière validation s'est terminée avec succès.

---

# Intégration continue

Le dépôt contient les workflows GitHub Actions dédiés au backend et au frontend.

Le processus de contribution repose sur :

```text
Branche de travail
        ↓
Pull Request
        ↓
Tests / build / lint
        ↓
Revue
        ↓
Fusion dans main
```

Avant une fusion dans `main`, les modifications doivent être vérifiées et les validations applicables doivent réussir.

---

# Sécurité

MealSaver applique notamment les principes suivants :

* authentification obligatoire pour les fonctions privées ;
* vérification des autorisations côté serveur ;
* isolation des données entre foyers ;
* validation des entrées côté backend ;
* contrôle des fichiers envoyés au service de scan ;
* limitation de la taille des images ;
* absence d'ajout automatique à l'inventaire après un scan ;
* conservation des secrets dans les variables d'environnement.

Les fichiers `.env`, mots de passe, secrets JWT, chaînes de connexion, identifiants de messagerie et clés privées ne doivent jamais être publiés dans le dépôt.

---

# Utilisation de l'intelligence artificielle

Des outils d'intelligence artificielle générative sont utilisés comme assistance au développement pour :

* analyser des erreurs ;
* revoir du code ;
* proposer des pistes de correction ;
* préparer ou compléter des tests ;
* améliorer la documentation.

Les résultats sont vérifiés avant intégration.

L'équipe demeure responsable :

* du code livré ;
* des choix techniques ;
* des tests ;
* de la validation fonctionnelle ;
* de la capacité à expliquer les contributions réalisées.

Pour le scan d'aliments, un service d'analyse peut proposer une identification à partir d'une image.

Cette identification reste une **proposition**. La validation ou la correction par l'utilisateur est obligatoire avant l'ajout à l'inventaire.

Les clés nécessaires aux services externes restent dans les variables d'environnement et ne sont pas versionnées.

---

# Documentation du projet

La documentation est organisée par sprint :

```text
documents/
├── sprint-0/
├── sprint-1/
│   └── README.md
└── sprint-2/
    └── README.md
```

Le Sprint 0 contient notamment les documents de :

* faisabilité commerciale ;
* cadrage du projet ;
* modélisation et conception ;
* carnet de produit et planification ;
* conventions d'équipe ;
* environnement de travail ;
* responsabilités des membres.

Les README des Sprint 1 et Sprint 2 décrivent les incréments réellement développés et les validations correspondantes.

---

# Références

* **Dépôt GitHub :** `Hafdekhil/MealSaver`
* **Branche principale :** `main`
* **Gestion du projet :** Jira MealSaver
* **Documentation Sprint 0 :** `documents/sprint-0/`
* **Documentation Sprint 1 :** `documents/sprint-1/`
* **Documentation Sprint 2 :** `documents/sprint-2/`

L'adresse active de l'environnement de démonstration peut être transmise séparément à l'enseignant avec les autres éléments du livrable.
