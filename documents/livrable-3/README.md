# MealSaver — Livrable 3 : Smart Fridge

**Cours :** 420-321-AH — Projet intégrateur
**Projet :** MealSaver
**Livrable :** Livrable 3
**Composant intelligent :** Smart Fridge
**Validation technique :** 13 septembre 2026

---

## 1. Objectif

Le Livrable 3 démontre le parcours complet d'une mesure provenant d'un objet réel ou simulé.

`Acquisition -> Transmission -> Analyse -> Persistance -> Restitution`

Le composant retenu est la caméra d'un téléphone mobile. Aucun aliment détecté n'est ajouté automatiquement à l'inventaire : une validation humaine reste obligatoire.

---

## 2. Objet intelligent

### Mode réel

La caméra du téléphone filme l'intérieur réel d'un réfrigérateur ou des aliments physiquement présents devant la caméra.

### Mode simulation

Pour la démonstration scolaire, le téléphone peut filmer un écran d'ordinateur affichant une photo de réfrigérateur ou une scène contenant plusieurs aliments.

Un aliment visuellement représenté peut être identifié. Le texte seul ne constitue jamais une preuve suffisante de la présence d'un aliment.

## 3. Acquisition

Deux méthodes d'acquisition sont disponibles :

- photo ;
- courte vidéo.

Pour une vidéo, le navigateur extrait jusqu'à cinq images représentatives.

Une séquence d'environ 5 à 10 secondes est recommandée pour la démonstration.

## 4. Chemin complet d'une mesure

```text
Caméra du téléphone
        |
        v
Photo ou vidéo
        |
        v
Frontend ScanPage
        |
        v
Extraction / normalisation JPEG
        |
        v
POST /api/smart-fridge/analyze-frame
        |
        v
Analyse et consolidation
        |
        v
POST /api/smart-fridge/scans
        |
        v
PostgreSQL / SmartFridgeScan
        |
        v
Restitution dans l'interface
        |
        v
Validation humaine
        |
        v
POST /api/inventory
        |
        v
Inventaire du foyer
```

La mesure Smart Fridge est persistée avant que l'interface considère l'analyse comme terminée avec succès.

---

## 5. Transmission et validation serveur

Route d'analyse :

`POST /api/smart-fridge/analyze-frame?mode=real`

ou

`POST /api/smart-fridge/analyze-frame?mode=simulation`

Formats acceptés :

- `image/jpeg` ;
- `image/png` ;
- `image/webp`.

La taille maximale d'une image est de 5 Mo.

Le backend vérifie l'authentification, le mode, le type MIME, la signature réelle du contenu et la taille du fichier.

Exemple de réponse :

```json
{
  "mode": "simulation",
  "foods": [
    { "name": "Tomates", "confidence": "high" },
    { "name": "Oeufs", "confidence": "medium" }
  ],
  "requiresManualValidation": true
}
```

## 6. Persistance de la mesure

La mesure consolidée est enregistrée avec :

`POST /api/smart-fridge/scans`

La table `SmartFridgeScan` conserve :

- `id` : identifiant de la mesure ;
- `householdId` : foyer concerné ;
- `userId` : utilisateur ayant effectué la mesure ;
- `source` : `REAL` ou `SIMULATION` ;
- `mediaKind` : `IMAGE` ou `VIDEO` ;
- `detectedFoods` : résultats consolidés ;
- `totalFrames` : nombre total d'images ;
- `successfulFrames` : images analysées avec succès ;
- `createdAt` : horodatage serveur.

La mesure est donc persistée, horodatée et associée à sa source, à son utilisateur et à son foyer.

Les fichiers photo, vidéo et les frames binaires ne sont pas stockés dans `SmartFridgeScan`.

Avant l'écriture, le backend vérifie que l'utilisateur appartient au foyer concerné.

Un utilisateur extérieur au foyer reçoit une réponse `403`.

## 7. Restitution et validation humaine

Après persistance, l'interface affiche les aliments candidats ainsi que leur niveau de confiance.

Pour une vidéo, elle peut également afficher le nombre d'images sur lesquelles chaque aliment a été observé.

L'interface affiche aussi l'identifiant de la mesure persistée et son heure d'enregistrement.

L'utilisateur peut ensuite :

- décocher un faux positif ;
- corriger le nom d'un aliment ;
- choisir son emplacement ;
- confirmer explicitement l'ajout à l'inventaire.

Aucun candidat n'est ajouté automatiquement à l'inventaire.

---

## 8. Conditions non idéales et défaillances

Le Smart Fridge gère plusieurs situations non idéales.

### Absence d'aliment identifiable

Une image techniquement valide sans aliment identifiable retourne une réponse `422` avec une liste vide.

MealSaver ne fabrique pas d'aliment lorsqu'aucun élément visuel suffisant n'est présent.

### Image invalide

Une image dont le contenu ne correspond pas à sa signature réelle est refusée.

### Type non supporté

Un format autre que JPEG, PNG ou WebP est refusé.

### Fichier trop volumineux

Une image dépassant 5 Mo est refusée.

### Réponse d'analyse invalide

Une réponse du service d'analyse qui ne respecte pas le format JSON attendu n'est pas acceptée comme mesure valide.

### Perte de communication

Si aucune frame ne peut être analysée, l'interface indique que la mesure ne peut pas être terminée et demande de vérifier la connexion avant de réessayer.

### Échec de persistance

Si la mesure ne peut pas être enregistrée dans `SmartFridgeScan`, le frontend ne la présente pas comme une analyse terminée avec succès.

## 9. Défaillance retenue pour la démonstration

Le scénario retenu pour la démonstration en direct est l'absence d'aliment identifiable.

Procédure :

1. capturer une scène ne contenant aucun aliment identifiable ;
2. lancer l'analyse ;
3. montrer que MealSaver ne crée aucun aliment ;
4. montrer le message prévu par l'application.

Ce scénario est déterministe et également couvert par les tests automatisés.

## 10. Tests automatisés Smart Fridge

Fichier principal :

`backend/src/smart-fridge.route.test.ts`

Résultat validé : **13 tests réussis**.

La suite couvre notamment :

- accès sans session ;
- mode invalide ;
- fausse image JPEG ;
- détection de plusieurs aliments ;
- mode simulation ;
- suppression des doublons ;
- absence d'aliment identifiable ;
- réponse d'analyse invalide ;
- données de persistance incohérentes ;
- tentative d'écriture dans un foyer non autorisé ;
- persistance d'une mesure réelle ;
- persistance d'une mesure de simulation ;
- source, média et horodatage.

## 11. Test E2E automatisé

Fichier :

`backend/src/smart-fridge.e2e.test.ts`

Le test automatise le parcours suivant :

`Acquisition simulée -> Analyse -> Persistance -> Validation -> Ajout à l'inventaire -> Lecture de l'inventaire`

Résultat : **1 test E2E réussi**.

Ce test valide le parcours fonctionnel côté API. Il ne prétend pas automatiser la caméra physique du téléphone ou Safari/iOS ; cette partie reste démontrée manuellement.

---

## 12. Validation technique globale

Après intégration de la persistance Smart Fridge et du test E2E, la suite complète du backend a été exécutée.

Résultat :

```text
Test Files  20 passed (20)
Tests       118 passed (118)
```

Le build backend a également été validé avec `npm run build` et aucune erreur TypeScript n'a été signalée.

Le frontend a été validé avec :

- `npm run lint` : 0 erreur et 0 avertissement ;
- `npm run build` : compilation TypeScript et build Vite réussis.

Le schéma Prisma est valide et la base locale est synchronisée avec 8 migrations.

## 13. Intégration continue

Le dépôt contient deux workflows GitHub Actions :

- `.github/workflows/backend-ci.yml` ;
- `.github/workflows/frontend-ci.yml`.

Le workflow backend installe les dépendances, génère Prisma Client, applique les migrations, compile le backend et exécute `npm test`.

Le test E2E Smart Fridge fait donc partie de la suite automatiquement exécutée par le CI backend.

Le workflow frontend exécute le lint et le build de production.

## 14. Intelligence artificielle utilisée

Une IA générative est utilisée pour proposer les aliments visuellement présents dans les images Smart Fridge.

Le rôle de l'IA est limité à la proposition de candidats.

L'IA ne peut pas :

- ajouter automatiquement un aliment ;
- choisir un foyer ;
- contourner l'authentification ;
- écrire directement dans la base de données ;
- remplacer la validation humaine.

Le projet a également utilisé des outils d'IA générative comme assistance au développement, aux tests, à la revue de code et à la documentation.

Les résultats ont été vérifiés par compilation, tests automatisés et validations manuelles.

Aucune clé API ni valeur secrète n'est documentée ici.

## 15. Architecture mise à jour

```text
Téléphone mobile / caméra
          |
          v
Frontend ScanPage
          |
          v
POST /api/smart-fridge/analyze-frame
          |
          v
Backend Express
          |
          v
Résultats consolidés
          |
          v
POST /api/smart-fridge/scans
          |
          v
PostgreSQL / SmartFridgeScan
          |
          v
Restitution UI
          |
          v
Validation humaine
          |
          v
POST /api/inventory
          |
          v
Inventaire du foyer
```

L'inventaire reste la source de vérité pour les aliments effectivement acceptés par l'utilisateur.

`SmartFridgeScan` représente la mesure et sa traçabilité, et non une autorisation automatique de modifier l'inventaire.

---

## 12. Validation technique globale

Après intégration de la persistance Smart Fridge et du test E2E, la suite complète du backend a été exécutée.

Résultat :

```text
Test Files  20 passed (20)
Tests       118 passed (118)
```

Le build backend a également été validé avec `npm run build` et aucune erreur TypeScript n'a été signalée.

Le frontend a été validé avec :

- `npm run lint` : 0 erreur et 0 avertissement ;
- `npm run build` : compilation TypeScript et build Vite réussis.

Le schéma Prisma est valide et la base locale est synchronisée avec 8 migrations.

## 13. Intégration continue

Le dépôt contient deux workflows GitHub Actions :

- `.github/workflows/backend-ci.yml` ;
- `.github/workflows/frontend-ci.yml`.

Le workflow backend installe les dépendances, génère Prisma Client, applique les migrations, compile le backend et exécute `npm test`.

Le test E2E Smart Fridge fait donc partie de la suite automatiquement exécutée par le CI backend.

Le workflow frontend exécute le lint et le build de production.

## 14. Intelligence artificielle utilisée

Une IA générative est utilisée pour proposer les aliments visuellement présents dans les images Smart Fridge.

Le rôle de l'IA est limité à la proposition de candidats.

L'IA ne peut pas :

- ajouter automatiquement un aliment ;
- choisir un foyer ;
- contourner l'authentification ;
- écrire directement dans la base de données ;
- remplacer la validation humaine.

Le projet a également utilisé des outils d'IA générative comme assistance au développement, aux tests, à la revue de code et à la documentation.

Les résultats ont été vérifiés par compilation, tests automatisés et validations manuelles.

Aucune clé API ni valeur secrète n'est documentée ici.

## 15. Architecture mise à jour

```text
Téléphone mobile / caméra
          |
          v
Frontend ScanPage
          |
          v
POST /api/smart-fridge/analyze-frame
          |
          v
Backend Express
          |
          v
Résultats consolidés
          |
          v
POST /api/smart-fridge/scans
          |
          v
PostgreSQL / SmartFridgeScan
          |
          v
Restitution UI
          |
          v
Validation humaine
          |
          v
POST /api/inventory
          |
          v
Inventaire du foyer
```

L'inventaire reste la source de vérité pour les aliments effectivement acceptés par l'utilisateur.

`SmartFridgeScan` représente la mesure et sa traçabilité, et non une autorisation automatique de modifier l'inventaire.

---

## 16. État du Livrable 3

| Élément | État |
|---|---|
| Acquisition photo | Validée |
| Acquisition vidéo | Validée |
| Mode réel | Implémenté |
| Mode simulation | Implémenté |
| Extraction multi-frame | Implémentée |
| Transmission API | Validée |
| Persistance de la mesure | Validée |
| Horodatage serveur | Validé |
| Source persistée | Validée |
| Liaison utilisateur / foyer | Validée |
| Restitution UI | Validée |
| Validation humaine | Validée |
| Cas sans aliment identifiable | Testé |
| Test E2E automatisé | Réussi |
| Tests backend | 118 / 118 réussis |
| Build backend | Réussi |
| Lint frontend | 0 erreur / 0 avertissement |
| Build frontend | Réussi |
| Migration Prisma | Validée |
| CI backend | Configurée |
| CI frontend | Configurée |
| Déclaration IA | Documentée |
| Démonstration finale en direct | À exécuter lors de la présentation |

## 17. Scénario recommandé pour la démonstration

### Parcours nominal

1. ouvrir MealSaver sur le téléphone ;
2. se connecter ;
3. ouvrir **Scanner les aliments** ;
4. choisir **Simulation école** ;
5. filmer pendant environ 5 à 10 secondes une scène alimentaire affichée sur l'ordinateur ;
6. lancer l'analyse ;
7. montrer les candidats consolidés ;
8. montrer le numéro et l'heure de la mesure persistée ;
9. décocher ou corriger un résultat si nécessaire ;
10. ajouter les aliments sélectionnés ;
11. ouvrir l'inventaire et montrer que seuls les aliments validés sont présents.

### Défaillance

1. reprendre une acquisition ;
2. filmer ou photographier une scène sans aliment identifiable ;
3. lancer l'analyse ;
4. montrer que MealSaver ne fabrique aucun aliment ;
5. expliquer le comportement prévu.

## 18. Résumé

Le Smart Fridge permet désormais de démontrer le chemin complet suivant :

`Objet réel ou simulé -> Acquisition -> Transmission -> Analyse -> Persistance horodatée avec source -> Restitution -> Validation utilisateur -> Inventaire`

Le Livrable 3 possède ainsi un parcours complet démontrable, une version simulée fonctionnelle, une persistance dédiée, des comportements d'échec définis et une couverture automatisée comprenant un test E2E.

---
