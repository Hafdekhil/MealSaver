# MealSaver — Documentation Sprint 2

**Cours :** 420-321-AH — Projet intégrateur
**Programme :** AEC Internet des objets et intelligence artificielle
**Sprint :** Sprint 2
**Période :** 8 au 11 septembre 2026
**Projet :** MealSaver

---

## 1. Objectif du Sprint 2

Le Sprint 2 avait pour objectif de compléter le parcours anti-gaspillage de MealSaver à partir de l'inventaire partagé déjà construit au Sprint 1.

Le parcours fonctionnel visé est :

    Inventaire
        ↓
    Scan ou saisie
        ↓
    Validation de l'aliment
        ↓
    Alertes d'expiration
        ↓
    Recettes adaptées à l'inventaire
        ↓
    Ingrédients disponibles / manquants
        ↓
    Liste d'épicerie collaborative

Le sprint comprend également le profil utilisateur, les préférences alimentaires et la gestion des notifications d'expiration.

---

## 2. Périmètre fonctionnel réalisé

### Scan et validation

- MEALSAVER-33 — Scanner ou téléverser un aliment.
- MEALSAVER-34 — Valider ou corriger le résultat du scan.
- MEALSAVER-35 — Utiliser une saisie manuelle si le scan échoue.

Le scan fournit une proposition d'identification. Aucun aliment n'est ajouté automatiquement : l'utilisateur conserve la validation finale.

En cas d'image invalide, d'absence d'aliment identifiable ou d'échec du service d'analyse, MealSaver permet de poursuivre avec la saisie manuelle.

### Recettes anti-gaspillage

- MEALSAVER-36 — Recevoir une recette.
- MEALSAVER-37 — Voir les ingrédients disponibles et manquants.
- MEALSAVER-38 — Prioriser les aliments proches de l'expiration.

Les recettes utilisent l'inventaire réel du foyer. Les aliments proches de l'expiration sont prioritaires et les aliments déjà expirés ne sont pas proposés comme ingrédients à consommer.

Les ingrédients disponibles et manquants sont distingués dans chaque suggestion.

### Alertes d'expiration

- MEALSAVER-42 — Recevoir une alerte d'expiration.
- MEALSAVER-43 — Voir les alertes dans le tableau de bord.
- MEALSAVER-44 — Relier une alerte à une recette.

Les alertes indiquent l'aliment concerné et le délai restant. Elles peuvent mener à l'inventaire ou directement vers une recette utilisant l'aliment concerné.

### Profil et préférences

- MEALSAVER-48 — Consulter son profil.
- MEALSAVER-49 — Modifier ses préférences alimentaires.
- MEALSAVER-50 — Gérer les notifications.

Le profil affiche les informations personnelles de la session et permet d'accéder aux préférences.

Les préférences alimentaires proposées sont : aucune préférence particulière, végétarien, végétalien et méditerranéen.

Le choix est persisté et peut influencer le classement des recettes lorsque cela est possible sans remplacer la priorité anti-gaspillage.

L'utilisateur peut également activer ou désactiver les alertes d'expiration.

---

## 3. Reliquats du Sprint 1 finalisés pendant le Sprint 2

Deux fonctions de la liste d'épicerie provenant du Sprint 1 ont été finalisées pendant la période de complétion du Sprint 2 :

- MEALSAVER-39 — Ajouter un article à la liste d'épicerie.
- MEALSAVER-41 — Cocher un article acheté.

Elles restent historiquement rattachées au Sprint 1 et ne sont pas reclassées comme nouveaux récits Sprint 2.

Le parcours MEALSAVER-40 — Ajouter les ingrédients manquants d'une recette à la liste — fait partie du parcours fonctionnel utilisé pendant le Sprint 2.

Les doublons sont évités ou fusionnés et les membres du foyer voient la même liste collaborative.

---

## 4. Ce qui n'est pas ajouté à ce livrable

Aucune fonctionnalité du Sprint 3 n'est ajoutée au Sprint 2.

Les fonctionnalités de budget, dépenses ou autres récits prévus pour une phase ultérieure ne font pas partie de cet incrément.

Le récit d'objet ou capteur intelligent extérieur au périmètre fonctionnel retenu pour ce Sprint 2 n'est pas implémenté ni présenté comme livré.

---

## 5. Architecture fonctionnelle du Sprint 2

Le Sprint 2 complète l'architecture existante du Sprint 1 sans remplacer l'inventaire comme source de vérité.

Le flux principal est :

    Utilisateur authentifié
            |
            v
    Foyer sélectionné
            |
            v
    Inventaire partagé
       /          \
      v            v
    Scan       Expiration
      |            |
      v            v
    Validation   Alertes
      |            |
      +-------> Recettes
                  |
                  v
       Disponibles / manquants
                  |
                  v
          Liste d'épicerie

Les données restent isolées par foyer et les opérations sensibles sont validées côté backend.

### Frontend

Les principales interfaces concernées par l'incrément sont :

- Inventaire ;
- Scan d'un aliment ;
- Tableau de bord et alertes ;
- Recettes ;
- Liste d'épicerie ;
- Profil ;
- préférences alimentaires ;
- préférences de notification.

### Backend

Le backend Express fournit les routes nécessaires pour :

- analyser un scan ;
- consulter l'inventaire ;
- produire les alertes d'expiration ;
- proposer les recettes ;
- gérer la liste d'épicerie ;
- consulter et sauvegarder les préférences utilisateur.

PostgreSQL et Prisma assurent la persistance des données.

---

## 6. Scan et validation manuelle

Le scan constitue une aide à la saisie et non une décision automatique.

Le fonctionnement appliqué est :

    Image
      |
      v
    Validation du fichier
      |
      v
    Analyse
      |
      v
    Proposition d'aliment
      |
      v
    Confirmation ou correction utilisateur
      |
      v
    Ajout à l'inventaire

L'utilisateur peut corriger le nom et compléter les informations avant l'enregistrement.

Si aucun aliment identifiable n'est détecté, MealSaver retourne un message explicite et permet de continuer par saisie manuelle.

Le produit reste donc utilisable lorsque l'analyse automatique échoue.

Lors des validations manuelles du Sprint 2, les deux scénarios ont été vérifiés :

- échec du scan puis saisie manuelle d'un aliment ;
- scan réussi puis correction du nom proposé avant ajout à l'inventaire.

---

## 7. Alertes d'expiration et recettes

Les alertes reposent sur les dates enregistrées dans l'inventaire.

Un aliment proche de sa date d'expiration peut être mis en évidence avec son délai restant.

Le tableau de bord permet d'accéder à l'aliment concerné ou au parcours de recettes.

Lorsqu'une recette est demandée depuis une alerte, le contexte de l'aliment ciblé est conservé.

### Priorité anti-gaspillage

Les suggestions utilisent l'inventaire réel du foyer et privilégient les aliments utilisables les plus urgents.

Les aliments déjà expirés restent visibles dans les alertes mais ne sont pas recommandés comme aliments à consommer dans une recette.

Plusieurs recettes peuvent être proposées. Chaque recette conserve indépendamment ses ingrédients disponibles et manquants.

Les préférences alimentaires peuvent servir de critère de départage lorsque cela est possible, sans remplacer la priorité anti-gaspillage.

### Ingrédients disponibles et manquants

Pour chaque recette, MealSaver distingue :

- les ingrédients déjà présents dans l'inventaire ;
- les ingrédients manquants ;
- les ingrédients manquants sélectionnés par l'utilisateur pour achat.

Aucun ingrédient manquant n'est ajouté automatiquement à la liste d'épicerie sans action de l'utilisateur.

---

## 8. Liste d'épicerie collaborative

La liste d'épicerie regroupe les ajouts manuels et les ingrédients manquants choisis depuis une recette.

Le fonctionnement validé comprend :

- ajout manuel d'un article ;
- ajout depuis une recette ;
- conservation de la quantité et de l'unité lorsqu'elles sont disponibles ;
- visibilité entre membres du même foyer ;
- gestion des doublons ;
- séparation entre articles à acheter et articles achetés ;
- achat et désachat réversibles ;
- affichage du membre ayant marqué l'achat.

Lorsque deux articles utilisent des unités incompatibles, MealSaver ne réalise pas de conversion implicite et refuse une fusion qui pourrait modifier incorrectement la quantité.

Le parcours complet validé est :

    Recette
       |
       v
    Ingrédients manquants
       |
       v
    Sélection utilisateur
       |
       v
    Liste d'épicerie
       |
       v
    Article à acheter
       |
       v
    Article acheté

---

## 9. Tests automatisés

Le Sprint 2 est couvert par des tests automatisés dédiés aux nouvelles fonctions principales.

### Scan

Fichier : `backend/src/scan.route.test.ts`

Les tests couvrent notamment :

- le refus d'accès sans session ;
- le refus des types de fichiers non pris en charge ;
- la vérification de la cohérence entre le type annoncé et le contenu réel de l'image ;
- la limite de taille de 5 Mo ;
- le cas où aucun aliment n'est identifiable ;
- la production d'une proposition sans ajout automatique à l'inventaire.

### Alertes d'expiration

Fichier : `backend/src/alerts.route.test.ts`

Les tests couvrent l'authentification, la validation du foyer, l'isolation entre foyers et la détection des aliments expirés ou proches de l'expiration.

### Recettes

Fichier : `backend/src/recipes.route.test.ts`

Les tests vérifient notamment :

- la protection de la route et l'isolation entre foyers ;
- l'utilisation de l'inventaire réel ;
- la priorité donnée aux aliments urgents ;
- le contexte provenant d'une alerte ;
- la distinction entre ingrédients disponibles et manquants ;
- l'absence de fausse recette lorsqu'aucune recette réelle ne correspond.

### Profil et préférences

Fichier : `backend/src/preferences.route.test.ts`

Les tests vérifient les informations du profil, la sauvegarde des préférences alimentaires, la suppression des doublons, leur influence sur les recettes et la gestion des alertes d'expiration.

### Liste d'épicerie collaborative

Fichier : `backend/src/shopping-list.route.test.ts`

Les tests couvrent notamment :

- l'authentification et l'isolation entre foyers ;
- le partage entre membres ;
- l'ajout manuel et depuis une recette ;
- la gestion des doublons ;
- la compatibilité des unités ;
- l'achat et le désachat d'un article ;
- l'identification du membre ayant effectué l'action.

## 10. Validation technique du Sprint 2

Une validation technique complète de l'incrément a été effectuée après l'intégration des fonctionnalités du Sprint 2.

Les vérifications portent sur :

* les tests automatisés du backend ;
* la compilation TypeScript du backend ;
* le contrôle de qualité du frontend ;
* la compilation TypeScript et le build de production du frontend.

### 10.1 Tests automatisés du backend

Commande exécutée depuis la racine du dépôt :

```bash
npm --prefix backend test
```

Le script `test` du backend exécute :

```text
vitest run
```

Une première exécution a révélé un problème de configuration de l'environnement de test. Les tests utilisant Prisma ne pouvaient pas accéder à `DATABASE_URL`, même si cette variable était correctement présente dans `backend/.env`.

Le problème provenait du fait que le serveur chargeait l'environnement dans `server.ts` avec :

```ts
import "dotenv/config";
```

alors que les tests Vitest importent directement l'application et ne démarrent pas `server.ts`.

La configuration de test a donc été corrigée de manière minimale dans `backend/vitest.config.ts` afin de charger les variables d'environnement avant l'initialisation de Prisma :

```ts
import "dotenv/config";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["dist/**", "node_modules/**"],
  },
});
```

Après cette correction, la suite complète a été réexécutée avec succès.

Résultat final :

```text
Test Files  18 passed (18)
Tests       103 passed (103)
```

Ainsi :

* 18 fichiers de tests sur 18 réussissent ;
* 103 tests sur 103 réussissent ;
* aucun test n'est en échec.

Les suites du Sprint 2 validées comprennent notamment :

* `alerts.route.test.ts` ;
* `preferences.route.test.ts` ;
* `recipes.route.test.ts` ;
* `scan.route.test.ts` ;
* `shopping-list.route.test.ts`.

Les tests des fonctions provenant du Sprint 1 réussissent également, ce qui permet de vérifier qu'aucune régression détectée par la suite automatisée n'a été introduite dans l'authentification, les foyers, les membres ou l'inventaire.

Lors du test simulant volontairement l'échec de l'envoi d'un courriel d'invitation, le message :

```text
Echec de l'envoi du courriel d'invitation MealSaver
```

est attendu. Le test concerné réussit et vérifie précisément le comportement de l'application lorsque l'envoi du courriel échoue.

### 10.2 Compilation du backend

Commande exécutée :

```bash
npm --prefix backend run build
```

Le script exécute :

```text
tsc
```

Résultat :

* compilation TypeScript réussie ;
* aucune erreur de compilation signalée.

### 10.3 Contrôle de qualité du frontend

Commande exécutée depuis `frontend/` :

```bash
npm run lint
```

Le frontend utilise `oxlint`.

Résultat obtenu :

```text
Found 0 warnings and 0 errors.
```

Le contrôle a analysé 18 fichiers avec 116 règles sans détecter d'erreur ni d'avertissement.

### 10.4 Build de production du frontend

Commande exécutée :

```bash
npm run build
```

Le processus exécute :

```text
tsc -b && vite build
```

Les deux étapes ont réussi :

* compilation TypeScript du frontend réussie ;
* build Vite de production réussi ;
* 47 modules transformés ;
* génération du dossier `dist/` terminée sans erreur.

### 10.5 Résultat global de validation

À la fin de la validation du Sprint 2 :

| Vérification              | Résultat                  |
| ------------------------- | ------------------------- |
| Tests backend             | 103 / 103 réussis         |
| Fichiers de tests backend | 18 / 18 réussis           |
| Build backend TypeScript  | Réussi                    |
| Lint frontend             | 0 erreur, 0 avertissement |
| Build frontend TypeScript | Réussi                    |
| Build Vite de production  | Réussi                    |

La suite automatisée valide à la fois les nouvelles fonctions du Sprint 2 et les fonctions principales héritées du Sprint 1.

Les valeurs privées de configuration, notamment `DATABASE_URL`, restent dans les fichiers d'environnement et ne sont pas inscrites dans le code ou la documentation.
