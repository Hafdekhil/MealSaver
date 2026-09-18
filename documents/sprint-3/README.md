# MealSaver — Documentation Sprint 3

**Cours :** 420-321-AH — Projet intégrateur
**Programme :** AEC Internet des objets et intelligence artificielle
**Sprint :** Sprint 3
**Période :** 14 au 15 septembre 2026
**Projet :** MealSaver

---

## 1. Objectif du Sprint 3

Le Sprint 3 avait pour objectif de compléter l'expérience globale de MealSaver avec un tableau de bord synthétique et un module de suivi des dépenses du foyer.

L'incrément complète les fonctions développées dans les sprints précédents sans remplacer l'inventaire comme source principale des données alimentaires.

Les deux axes principaux sont :

- centraliser les informations importantes du foyer dans un tableau de bord ;
- permettre aux membres du foyer d'enregistrer et de consulter les dépenses partagées.

---

## 2. Récits confirmés dans l'historique du projet

Les références Jira confirmées par l'historique Git du Sprint 3 sont :

| Jira | Fonction réalisée | Contribution confirmée | État |
|---|---|---|---|
| MEALSAVER-45 / MEALSAVER-46 | Tableau de bord du foyer | Hafedh Dekhil | Done |
| MEALSAVER-52 | Budget et dépenses du foyer | Jean Jacques Arquero / Hafedh Dekhil | Done |

L'historique Git confirme notamment :

- l'intégration du tableau de bord Sprint 3 pour `MEALSAVER-45` et `MEALSAVER-46` ;
- les tests unitaires et la logique de calcul des totaux pour `MEALSAVER-52` ;
- l'intégration de l'endpoint des totaux ;
- l'intégration de l'interface Budget du foyer.

Aucun autre numéro de récit Sprint 3 n'est ajouté ici sans preuve dans le dépôt ou Jira.

---

## 3. Tableau de bord du foyer

Le tableau de bord fournit une vue synthétique des données du foyer sélectionné.

Il charge notamment :

- les foyers accessibles à l'utilisateur ;
- l'inventaire du foyer actif ;
- les alertes d'expiration.

Lorsque l'utilisateur appartient à plusieurs foyers, il peut sélectionner le foyer qu'il souhaite consulter.

### 3.1 Indicateurs

Le tableau de bord affiche quatre indicateurs principaux :

- nombre total d'aliments ;
- aliments à consommer bientôt ;
- nombre d'alertes importantes ;
- aliments expirés.

Les alertes respectent les préférences de l'utilisateur. Lorsqu'elles sont désactivées dans le profil, le tableau de bord l'indique.

### 3.2 Alertes importantes

Les alertes sont ordonnées selon l'urgence.

Pour un aliment concerné, l'utilisateur peut :

- ouvrir directement l'aliment dans l'inventaire ;
- accéder à une recette utilisant cet aliment lorsqu'il n'est pas déjà expiré.

### 3.3 Actions rapides

Le tableau de bord fournit des accès directs vers :

- Inventaire ;
- Scan ;
- Recettes ;
- Liste d'épicerie.

---

## 4. Budget et dépenses du foyer

Le Sprint 3 ajoute un module de suivi des dépenses partagées.

Il permet aux membres d'un même foyer de savoir :

- quelles dépenses ont été enregistrées ;
- quel membre a payé ;
- quel montant chaque membre a payé ;
- quel est le total général des dépenses enregistrées.

### 4.1 Ajout d'une dépense

Une dépense comprend notamment :

- le foyer concerné ;
- le membre ayant payé ;
- le montant ;
- une description facultative ;
- la date de création.

L'utilisateur doit appartenir au foyer pour ajouter une dépense.

Le membre indiqué comme payeur doit également appartenir au même foyer.

Le montant doit être supérieur à zéro.

### 4.2 Historique des dépenses

Le module Budget affiche l'historique des dépenses avec notamment :

- la description ;
- le membre ayant payé ;
- le montant ;
- la date d'enregistrement.

### 4.3 Totaux par membre

Le backend calcule :

- le total payé par chaque membre ;
- le total général du foyer.

Le calcul est centralisé dans `backend/src/expense-totals.ts`.

L'interface utilise le composant `frontend/src/components/BudgetTotals.tsx`.

---

## 5. Architecture technique du Budget

### Backend

Les principaux fichiers concernés sont :

- `backend/src/expenses.route.ts`
- `backend/src/expense-totals.ts`
- `backend/src/expense-totals.test.ts`
- `backend/src/expenses.route.test.ts`
- `backend/src/app.ts`

Les principales routes sont :

- `GET /api/expenses?householdId=...`
- `GET /api/expenses/totals?householdId=...`
- `POST /api/expenses`

### Base de données

Le Sprint 3 ajoute la migration :

`20260914165103_add_expenses`

Elle introduit la persistance des dépenses du foyer.

### Frontend

Les principaux fichiers concernés sont :

- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/pages/BudgetPage.tsx`
- `frontend/src/components/BudgetTotals.tsx`
- `frontend/src/budget-page.css`

---

## 6. Contrôles d'accès

Le backend vérifie notamment :

- qu'une session authentifiée existe ;
- que l'identifiant du foyer est valide ;
- que l'utilisateur appartient au foyer demandé ;
- que le membre déclaré comme payeur appartient au même foyer ;
- que les données de la dépense sont valides.

Un utilisateur extérieur au foyer ne peut pas consulter ou ajouter les dépenses de ce foyer.

Ces règles sont appliquées côté serveur.

---

## 7. Tests automatisés du Sprint 3

Deux fichiers concernent directement le module Budget.

### Calcul des totaux

`backend/src/expense-totals.test.ts`

Résultat validé :

- **4 tests réussis sur 4**.

### Routes de dépenses

`backend/src/expenses.route.test.ts`

Résultat validé :

- **16 tests réussis sur 16**.

Les tests couvrent notamment :

- accès sans session ;
- ajout d'une dépense valide ;
- dépense sans description ;
- refus d'un montant nul ;
- refus d'un montant négatif ;
- refus d'une dépense sans payeur ;
- isolation entre foyers ;
- validation de l'appartenance du payeur ;
- consultation de l'historique ;
- calcul des totaux ;
- cas sans dépense.

---

## 8. Validation technique globale

La branche d'intégration Sprint 3 a été validée localement le 18 septembre 2026.

### Backend

Commande : `npm test`

Résultat :

    Test Files  20 passed (20)
    Tests       124 passed (124)

Ainsi :

- **20 fichiers de tests sur 20 réussissent** ;
- **124 tests sur 124 réussissent** ;
- aucun test n'est en échec.

### Build backend

Commande : `npm run build`

Résultat :

- compilation TypeScript réussie ;
- aucune erreur signalée.

### Lint frontend

Commande : `npm run lint`

Résultat :

    Found 0 warnings and 0 errors.

Le contrôle a analysé 21 fichiers avec 116 règles.

### Build frontend

Commande : `npm run build`

Résultat :

- compilation TypeScript réussie ;
- build Vite réussi ;
- 51 modules transformés ;
- dossier `dist/` généré sans erreur.

---

## 9. Résultat global de validation

| Vérification | Résultat |
|---|---|
| Tests backend | 124 / 124 réussis |
| Fichiers de tests backend | 20 / 20 réussis |
| Build backend TypeScript | Réussi |
| Lint frontend | 0 erreur, 0 avertissement |
| Build frontend TypeScript | Réussi |
| Build Vite de production | Réussi |
| Migration dépenses | Validée dans la base académique |

---

## 10. Parcours de démonstration Sprint 3

### Tableau de bord

1. Se connecter.
2. Ouvrir le tableau de bord.
3. Montrer le nombre total d'aliments.
4. Montrer les aliments à consommer bientôt.
5. Montrer les alertes importantes.
6. Montrer les aliments expirés.
7. Ouvrir un aliment depuis une alerte.
8. Ouvrir une recette depuis une alerte non expirée.
9. Montrer les actions rapides.

### Budget

1. Ouvrir Budget.
2. Sélectionner le foyer si plusieurs foyers sont disponibles.
3. Choisir le membre ayant payé.
4. Saisir un montant.
5. Ajouter une description.
6. Enregistrer la dépense.
7. Montrer son apparition dans l'historique.
8. Montrer le total du membre.
9. Montrer le total général du foyer.

---

## 11. Définition de terminé

Une fonctionnalité Sprint 3 est considérée terminée lorsqu'elle :

- est intégrée à l'application ;
- respecte les contrôles d'accès ;
- persiste correctement ses données lorsque nécessaire ;
- réussit les tests automatisés applicables ;
- compile sans erreur ;
- passe le contrôle de qualité frontend ;
- est démontrable dans l'interface.

---

## 12. État du Sprint 3

| Élément | État |
|---|---|
| Tableau de bord | Implémenté |
| Sélection du foyer | Implémentée |
| Indicateurs d'inventaire | Implémentés |
| Alertes importantes | Implémentées |
| Actions rapides | Implémentées |
| Ajout de dépenses | Implémenté |
| Historique des dépenses | Implémenté |
| Totaux par membre | Implémentés |
| Total général | Implémenté |
| Contrôles d'accès Budget | Validés |
| Migration Prisma dépenses | Validée |
| Tests backend | 124 / 124 réussis |
| Build backend | Réussi |
| Lint frontend | 0 erreur / 0 avertissement |
| Build frontend | Réussi |

---

## 13. Références

- Dépôt GitHub : `Hafdekhil/MealSaver`
- Branche d'intégration validée : `integration/final-v3.0`
- Gestion de projet : Jira MealSaver
- Sprint 0 : `documents/sprint-0/`
- Sprint 1 : `documents/sprint-1/`
- Sprint 2 : `documents/sprint-2/`
- Sprint 3 : `documents/sprint-3/`

L'environnement Web de démonstration est présenté séparément lors du Livrable 4.
