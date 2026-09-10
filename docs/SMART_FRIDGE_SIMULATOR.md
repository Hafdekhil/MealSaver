# MealSaver — Objet intelligent simulé : température du réfrigérateur

## Objectif

Ce module répond à l'exigence de la revue Sprint 2 demandant de démontrer une mesure de bout en bout : **acquisition → transmission → persistance → restitution**, avec une version simulée et un scénario de défaillance.

Le choix retenu est un **capteur logiciel simulé de température de réfrigérateur**. Aucun matériel physique n'est requis pour cette version de référence.

## Source simulée

- Identifiant : `sim-fridge-01`
- Grandeur : température
- Unité : degré Celsius
- Métrique du protocole : `temperature_c`
- Générateur : `frontend/src/lib/smart-fridge-simulator.ts`

La valeur normale est générée automatiquement par le simulateur. L'utilisateur ne saisit pas la mesure à la main; il déclenche uniquement le cycle de simulation.

## Format transmis

Route : `POST /api/smart-fridge/measurements`

Exemple :

```json
{
  "householdId": 12,
  "sourceId": "sim-fridge-01",
  "metric": "temperature_c",
  "value": 4.2,
  "measuredAt": "2026-09-10T21:30:00.000Z"
}
```

Champs :

| Champ | Type | Rôle |
|---|---|---|
| `householdId` | entier positif | rattache la mesure au foyer |
| `sourceId` | chaîne | identifie la source simulée |
| `metric` | `temperature_c` | identifie la grandeur transmise |
| `value` | nombre fini | valeur produite automatiquement |
| `measuredAt` | date ISO 8601 | horodatage de l'acquisition |

La route est protégée par la session MealSaver et vérifie que l'utilisateur appartient au foyer ciblé.

## Validation serveur

Le backend valide :

- la structure JSON ;
- le type des champs ;
- l'identifiant de foyer ;
- l'appartenance au foyer ;
- la métrique attendue ;
- le format de l'identifiant de source ;
- la validité technique de la valeur.

Le contrat technique du simulateur considère toute valeur hors de `-100 °C` à `100 °C` comme une trame manifestement aberrante. Cette plage sert uniquement à détecter un capteur ou un message manifestement invalide; **elle ne constitue pas un seuil de sécurité alimentaire**.

## Persistance

Modèle Prisma : `SmartFridgeMeasurement`.

Données enregistrées :

- identifiant de mesure ;
- foyer ;
- source ;
- température ;
- instant de mesure ;
- instant de réception serveur.

La relation au foyer utilise une suppression en cascade afin d'éviter de conserver des mesures orphelines après suppression d'un foyer.

## Restitution

Route : `GET /api/smart-fridge/measurements/latest?householdId=<id>`

La page protégée `/smart-fridge` affiche :

- la dernière valeur persistée ;
- le foyer ;
- la source ;
- l'heure d'acquisition ;
- l'heure de réception ;
- le message JSON envoyé lors de la dernière simulation.

La navigation principale expose cette page sous **Capteur**.

## Scénario de défaillance

Le bouton **Provoquer une valeur aberrante** demande au simulateur de produire automatiquement `999 °C`.

Comportement attendu :

1. le simulateur produit la trame ;
2. la trame est transmise à l'API ;
3. l'API répond `422` avec le code `OUT_OF_SENSOR_RANGE` ;
4. la valeur n'est pas persistée ;
5. l'interface explique que la mesure a été reçue puis rejetée ;
6. la dernière mesure valide reste affichée.

Ce scénario est volontairement reproductible pour la revue.

## Tests automatisés

Fichier : `backend/src/smart-fridge.route.test.ts`.

Les tests couvrent :

- absence de session ;
- accès à un foyer non autorisé ;
- format de message invalide ;
- valeur aberrante rejetée et non persistée ;
- parcours complet : authentification → transmission → base de données → restitution API.

## Démonstration

1. Se connecter à MealSaver.
2. Ouvrir **Capteur**.
3. Choisir le foyer.
4. Cliquer **Produire et transmettre une mesure**.
5. Lire le JSON généré automatiquement.
6. Vérifier le message de succès.
7. Vérifier la dernière mesure persistée avec source et horodatages.
8. Cliquer **Provoquer une valeur aberrante**.
9. Montrer le rejet explicite et le maintien de la dernière mesure valide.
10. Montrer les tests et la CI de la Pull Request correspondante.
