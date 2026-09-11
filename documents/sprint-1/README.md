# MealSaver — Documentation Sprint 1

**Cours :** 420-321-AH — Projet intégrateur
**Programme :** AEC Internet des objets et intelligence artificielle
**Sprint :** Sprint 1
**Période :** 31 août au 4 septembre 2026
**Projet :** MealSaver

---

## 1. Objectif du Sprint 1

Le Sprint 1 avait pour objectif de transformer le prototype MealSaver en une application Web fonctionnelle reposant sur un frontend, un backend et une base de données persistante.

L'incrément a établi les fondations du produit :

- création et authentification des utilisateurs ;
- gestion de la session ;
- création et consultation d'un foyer ;
- invitation et consultation des membres ;
- inventaire alimentaire partagé ;
- ajout, modification et suppression d'aliments ;
- contrôle des accès selon l'appartenance au foyer ;
- tests automatisés et intégration continue.

---

## 2. Récits réalisés

| Jira | Récit | Responsable | État |
|---|---|---|---|
| MEALSAVER-24 | Se connecter au compte | Hafedh Dekhil | Done |
| MEALSAVER-25 | Créer un compte | Hafedh Dekhil | Done |
| MEALSAVER-26 | Se déconnecter du compte | Hafedh Dekhil | Done |
| MEALSAVER-27 | Créer un foyer | Kevin Mai | Done |
| MEALSAVER-28 | Inviter un membre | Kevin Mai | Done |
| MEALSAVER-29 | Consulter les membres du foyer | Danensky Leveille | Done |
| MEALSAVER-30 | Ajouter un aliment | Danensky Leveille | Done |
| MEALSAVER-31 | Modifier un aliment | Jean Jacques Arquero | Done |
| MEALSAVER-32 | Supprimer un aliment | Jean Jacques Arquero | Done |

Les éléments de liste d'épicerie qui n'étaient pas complètement finalisés à la fin du Sprint 1 ont été conservés comme reliquats et terminés pendant le Sprint 2. Ils ne sont donc pas présentés ici comme entièrement livrés au Sprint 1.

---

## 3. Fonctionnalités livrées

### 3.1 Authentification

MealSaver permet à l'utilisateur de créer un compte, se connecter, conserver une session authentifiée et se déconnecter.

Les pages internes sont protégées : un utilisateur non authentifié ne peut pas accéder aux fonctions réservées aux membres.

### 3.2 Gestion du foyer

Un utilisateur authentifié peut :

- créer un foyer ;
- devenir propriétaire du foyer créé ;
- consulter les foyers auxquels il appartient ;
- inviter un membre ;
- consulter les membres et invitations en attente ;
- identifier le propriétaire du foyer.

Les rôles principaux sont `OWNER` et `MEMBER`.

Les contrôles d'autorisation sont effectués côté serveur.

### 3.3 Inventaire partagé

Les membres autorisés d'un foyer disposent d'un inventaire commun.

Un aliment peut comprendre :

- nom ;
- quantité ;
- unité ;
- emplacement ;
- date d'expiration ;
- auteur de l'ajout.

Les emplacements gérés sont notamment `FRIDGE`, `FREEZER` et `PANTRY`.

Un membre autorisé peut ajouter, modifier et supprimer un aliment. Les changements sont persistés et restitués aux membres du foyer.

---

## 4. Architecture technique

### Frontend

Technologies principales :

- React ;
- TypeScript ;
- Vite ;
- React Router.

Répertoire principal : `frontend/`.

### Backend

Technologies principales :

- Node.js ;
- Express ;
- TypeScript ;
- Zod ;
- Prisma ORM ;
- JWT ;
- cookies de session.

Répertoire principal : `backend/`.

### Base de données

MealSaver utilise PostgreSQL avec Prisma ORM.

Le schéma principal se trouve dans `backend/prisma/schema.prisma`. Les évolutions du schéma sont gérées avec les migrations Prisma.

---

## 5. Parcours fonctionnel principal

```text
Utilisateur
    ↓
Création du compte / connexion
    ↓
Création ou accès à un foyer
    ↓
Gestion des membres
    ↓
Inventaire partagé
    ↓
Ajout / modification / suppression
    ↓
PostgreSQL
    ↓
Restitution dans l'interface
```

---

## 6. Tests automatisés

Les tests Sprint 1 couvrent notamment :

### Authentification

- `backend/src/auth/auth.integration.test.ts`
- `backend/src/auth/register.integration.test.ts`
- `backend/src/auth/register.route.test.ts`
- `backend/src/auth/register.schema.test.ts`

Ils vérifient notamment l'inscription, l'unicité du courriel, la connexion, la session, la déconnexion et la protection des routes.

### Foyers et membres

- `backend/src/households/household.route.test.ts`
- `backend/src/households/household.membership.route.test.ts`
- `backend/src/households/invitation.route.test.ts`
- `backend/src/member.route.test.ts`

Ils couvrent la création du foyer, l'appartenance au foyer, les invitations, les rôles, les contrôles d'accès et la gestion des membres.

### Inventaire

- `backend/src/inventory.route.test.ts`
- `backend/src/inventory/inventory.schema.test.ts`
- `backend/src/inventory/inventory.patch.route.test.ts`
- `backend/src/inventory/inventory.delete.route.test.ts`

Ils couvrent l'ajout, la consultation, la validation, la modification, la suppression et l'isolation des données entre foyers.

---

## 7. Commandes de validation

Depuis la racine du dépôt :

```bash
npm --prefix backend test
npm --prefix backend run build
npm --prefix frontend run lint
npm --prefix frontend run build
```

---

## 8. Intégration continue et revue

Le dépôt contient :

- `.github/workflows/backend-ci.yml`
- `.github/workflows/frontend-ci.yml`

Le processus appliqué est : branche de travail → Pull Request → tests/build/lint → revue par un autre membre → fusion dans `main`.

Les contributions sont intégrées par petits incréments et validées avant fusion.

---

## 9. Contrôles d'accès et qualité

Le backend vérifie notamment :

- qu'une session existe ;
- que les identifiants transmis sont valides ;
- que l'utilisateur appartient au foyer demandé ;
- que la ressource existe ;
- que l'opération demandée est autorisée.

Ces contrôles sont effectués côté serveur et ne reposent pas uniquement sur le frontend.

---

## 10. Installation locale

Les instructions détaillées sont centralisées dans le README.md à la racine du dépôt.

Prérequis : Git, Node.js, npm et PostgreSQL.

Installation des dépendances :

    npm --prefix backend install
    npm --prefix frontend install

Créer backend/.env à partir de backend/.env.example, puis préparer Prisma :

    cd backend
    npx prisma generate
    npx prisma migrate deploy
    cd ..

Démarrer le backend :

    npm --prefix backend run dev

Le backend écoute par défaut sur http://127.0.0.1:3001.

Dans un second terminal, démarrer le frontend :

    npm --prefix frontend run dev

Le frontend est généralement accessible sur http://localhost:5173.

---

## 11. Sécurité et secrets

Le fichier backend/.env est exclu du dépôt. Les mots de passe, JWT_SECRET, DATABASE_URL, identifiants de messagerie et autres clés privées ne doivent jamais être publiés.

Le fichier backend/.env.example documente uniquement les variables nécessaires avec des valeurs d'exemple.

Les autorisations sur les foyers et les ressources sont contrôlées côté serveur.

---

## 12. Écarts constatés

Le Sprint 1 a livré les fondations fonctionnelles : authentification, foyer collaboratif et inventaire partagé.

Les éléments de liste d'épicerie qui n'étaient pas complètement finalisés à la fin du Sprint 1 ont été conservés comme reliquats et terminés au Sprint 2. Ils ne sont donc pas présentés comme entièrement livrés au Sprint 1.

---

## 13. Utilisation de l'intelligence artificielle générative

Des outils d'IA générative ont servi d'aide pour analyser des erreurs, proposer des corrections, revoir du code, structurer des tests et améliorer la documentation.

Les résultats ont été vérifiés avant intégration. L'équipe demeure responsable du code, des choix techniques, des tests et de la capacité à expliquer chaque contribution.

Aucun secret réel ne doit être transmis dans la documentation ou ajouté au dépôt.

---

## 14. Scénario de démonstration Sprint 1

1. Créer un compte et se connecter.
2. Créer un foyer et vérifier le rôle OWNER.
3. Inviter un membre.
4. Consulter les membres et invitations en attente.
5. Ajouter un aliment.
6. Vérifier sa présence dans l'inventaire partagé.
7. Modifier l'aliment et vérifier la mise à jour.
8. Supprimer l'aliment après confirmation.
9. Exécuter les tests automatisés.
10. Montrer la CI GitHub.

---

## 15. Définition de terminé

Un récit livré doit satisfaire ses critères d'acceptation, être intégré, testé, validé, ne contenir aucun secret et être documenté lorsque nécessaire.

---

## 16. Références

- Dépôt GitHub : Hafdekhil/MealSaver
- Gestion de projet : Jira MealSaver
- Sprint 0 : documents/sprint-0/
- Sprint 1 : documents/sprint-1/
- Sprint 2 : documents/sprint-2/

L'adresse active de l'environnement de démonstration est transmise à l'enseignant avec les autres liens du livrable.
