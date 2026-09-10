# MealSaver — Revue du Sprint 2

**Date de préparation : 10 septembre 2026**  
**Revue : vendredi 11 septembre 2026**  
**Évaluation 3 : Revue de Sprint 2 — chaîne d'objets intelligents de bout en bout**

Ce document sert de checklist de livraison et de scénario de présentation. Il distingue strictement ce qui est déjà intégré de ce qui doit encore être fermé avant la revue.

---

## 1. Objectif du Sprint 2

Objectif engagé dans le carnet MealSaver :

> **Ajouter la dimension intelligente : scan MVP, recettes, liens alertes-recettes et préférences.**

La semaine du Sprint 2 compte quatre séances. Le périmètre et les écarts doivent donc être présentés de façon réaliste.

---

## 2. Exigences officielles de la revue

La revue Sprint 2 vérifie en priorité :

- une mesure produite automatiquement par un objet intelligent réel ou simulé ;
- la transmission de cette mesure jusqu'à l'API dans un format défini ;
- sa persistance en base de données avec horodatage et source ;
- sa restitution dans l'interface ;
- une démonstration en direct du parcours complet ;
- une situation de défaillance provoquée volontairement ;
- des tests d'intégration et de bout en bout exécutés automatiquement ;
- une CI verte ;
- une documentation mise à jour ;
- la déclaration des usages d'IA générative ;
- une revue de code par une autre personne avant chaque intégration ;
- un Jira fidèle à l'avancement réel ;
- une version démontrée correspondant à la version déployée ;
- une prise de parole de tous les membres.

---

## 3. État fonctionnel actuel

### Déjà intégré et validé

| Bloc | Jira | Preuve GitHub | État |
|---|---|---|---|
| Scan / téléversement | MEALSAVER-33 | PR #34 | Done |
| Validation et correction du scan | MEALSAVER-34 | PR #36 | Done |
| Recettes depuis l'inventaire | MEALSAVER-36 | PR #32 | Done |
| Ingrédients disponibles / manquants | MEALSAVER-37 | PR #32 | Done |
| Priorisation des aliments urgents | MEALSAVER-38 | PR #32 | Done |
| Alertes d'expiration | MEALSAVER-42 | PR #37 | Done |
| Alertes dans le tableau de bord | MEALSAVER-43 | PR #37 | Done |
| Alerte vers recette | MEALSAVER-44 | PR #37 | Done |

### À fermer avant la revue ou à déclarer comme écart

| Bloc | Jira / exigence | État au 10 septembre | Action |
|---|---|---|---|
| Saisie manuelle si scan échoue | MEALSAVER-35 | In Progress | Finaliser, tester, PR, revue, CI, merge |
| Ingrédients manquants → liste | MEALSAVER-40 | In Progress | Vérifier le travail de Jean Jacques et intégrer s'il est terminé |
| Profil | MEALSAVER-48 | To Do | Réaliser seulement si capacité restante, sinon écart déclaré |
| Préférences alimentaires | MEALSAVER-49 | To Do | Réaliser seulement si capacité restante, sinon écart déclaré |
| Notifications | MEALSAVER-50 | To Do | Réaliser seulement si capacité restante, sinon écart déclaré |
| Objet intelligent de bout en bout | Exigence revue Sprint 2 | **Non intégré** | Priorité critique |
| Déploiement full-stack courant | Exigence revue Sprint 2 | À valider | Priorité critique |

Les récits MEALSAVER-39 et MEALSAVER-41 proviennent du Sprint 1 dans la planification v4. Ils ne doivent pas être comptés artificiellement dans la charge engagée du Sprint 2.

---

## 4. Chaîne d'objet intelligent — bloc critique

### Constat

Le cadrage initial MealSaver retenait le scan et les recommandations comme dimension intelligente sans capteur physique. Le livrable officiel de la semaine 3 ajoute cependant une exigence explicite de **mesure issue d'un objet réel ou simulé**, avec transmission, persistance et restitution.

Le document officiel autorise la simulation. Pour éviter d'ajouter du matériel risqué la veille de la revue, le choix minimal cohérent avec MealSaver est donc un **capteur simulé de température de réfrigérateur**.

### Architecture cible minimale

```text
Simulateur de capteur
        ↓
mesure automatique de température
        ↓
POST /api/smart-fridge/measurements
        ↓
validation serveur
        ↓
PostgreSQL / Prisma
(source + valeur + horodatage)
        ↓
GET /api/smart-fridge/measurements/latest
        ↓
Dashboard / panneau État du réfrigérateur
```

### Format cible des données

Exemple de message à documenter et à utiliser dans les tests :

```json
{
  "sourceId": "sim-fridge-01",
  "metric": "temperature_c",
  "value": 4.2,
  "measuredAt": "2026-09-10T21:30:00.000Z"
}
```

Le serveur doit rejeter une structure invalide et ne doit pas faire confiance aux valeurs du frontend.

### Défaillance à démontrer

Scénario recommandé : **valeur aberrante**.

1. Le simulateur produit normalement une température plausible.
2. Une mesure aberrante est ensuite provoquée par le mode de test.
3. L'API reçoit la mesure.
4. Le système la rejette ou la signale explicitement selon la règle retenue.
5. L'interface affiche un état compréhensible au lieu de masquer l'erreur.

Un second scénario possible est une perte de signal : aucune nouvelle mesure n'arrive pendant une période définie et l'interface indique que la donnée est devenue obsolète.

### Critères de fermeture de ce bloc

Le bloc ne pourra être annoncé comme livré qu'après :

- implémentation du simulateur ;
- route API protégée ;
- validation du message ;
- modèle/migration Prisma ;
- persistance avec source et horodatage ;
- affichage de la dernière mesure ;
- scénario de défaillance ;
- test d'intégration ;
- test du parcours bout en bout côté backend ;
- lint/build/tests verts ;
- revue croisée ;
- CI verte ;
- intégration dans `main` ;
- déploiement de la même version.

---

## 5. Scénario de démonstration recommandé

### Ouverture — 30 à 45 s

Présenter l'objectif du Sprint 2 et rappeler que l'équipe montre uniquement les fonctions réellement intégrées.

### A. Objet intelligent — 2 à 3 min

1. Déclencher automatiquement une mesure depuis le simulateur.
2. Montrer le message transmis à l'API.
3. Montrer la réponse serveur.
4. Vérifier que la mesure est persistée avec sa source et son horodatage.
5. Recharger l'interface et montrer la mesure restituée.
6. Provoquer la défaillance préparée.
7. Montrer le comportement du système et expliquer la règle.

### B. Scan intelligent — 2 min

1. Ouvrir Scan.
2. Choisir/prendre une photo d'un aliment.
3. Montrer l'aperçu.
4. Obtenir la proposition d'identification.
5. Expliquer que la proposition vient de Gemini.
6. Modifier le nom ou la quantité.
7. Valider manuellement.
8. Vérifier l'apparition dans l'inventaire.
9. Si MEALSAVER-35 est fusionné : provoquer une erreur de scan et passer à la saisie manuelle.

### C. Anti-gaspillage — 2 min

1. Préparer un aliment avec une date d'expiration proche.
2. Montrer l'alerte et le nombre de jours restants.
3. Montrer le tri par urgence.
4. Cliquer vers les recettes.
5. Vérifier que l'aliment concerné est affiché comme contexte.
6. Montrer une recette qui utilise l'aliment urgent ou le fallback anti-gaspillage.
7. Montrer les ingrédients disponibles et manquants.
8. Si MEALSAVER-40 est intégré : envoyer les ingrédients manquants vers la liste.

### D. Tests et CI — 1 à 2 min

Exécuter les commandes prévues par le dépôt et expliquer ce qu'elles couvrent :

```bash
npm --prefix backend test
npm --prefix backend run build
npm --prefix frontend run lint
npm --prefix frontend run build
```

Montrer ensuite la dernière CI verte sur GitHub et une PR ayant reçu une revue croisée.

### E. Écarts et suite — 30 à 60 s

Dire explicitement ce qui n'a pas été livré parmi les récits engagés et pourquoi. Ne jamais masquer un `To Do` ou un `In Progress`.

---

## 6. Répartition de la prise de parole

La revue exige que tous les membres interviennent.

| Membre | Partie proposée |
|---|---|
| Hafedh Dekhil | Objectif Sprint 2, architecture, objet intelligent simulé, scan et validation |
| Kevin Mai | Recettes, alertes, raccordement alerte → recette, QA Sprint 2 |
| Jean Jacques Arquero | Liste collaborative / MEALSAVER-40 si livré, Jira, GitHub et traçabilité |
| Danensky Leveille | Retour sur les validations déjà réalisées au Sprint 1, continuité fonctionnelle et rétrospective d'équipe |

Cette répartition n'altère pas l'attribution réelle des commits et des récits.

---

## 7. Tests, revue et traçabilité déjà obtenus

### PR #32 — Recettes

- tests recettes : 8/8 ;
- suite backend : 64/64 au moment de la PR ;
- backend build : réussi ;
- frontend lint : réussi ;
- frontend build : réussi ;
- CI : verte ;
- revue mainteneur et test de régression sur la priorité des aliments urgents.

### PR #34 — Scan initial

- tests ciblés : 5/5 ;
- suite backend : 70/70 au moment de la PR ;
- build backend/frontend : réussi ;
- lint frontend : réussi ;
- validation manuelle desktop/mobile ;
- CI et revue croisée avant fusion.

### PR #36 — Validation du scan

- correction du nom et de la quantité ;
- validation explicite avant création ;
- quantité invalide bloquée ;
- lint/build réussis ;
- validation fonctionnelle manuelle ;
- CI et revue croisée avant fusion.

### PR #37 — Alertes

- logique d'expiration ;
- affichage dans le tableau de bord ;
- lien vers recettes ;
- correctif mainteneur pour transmettre foyer + aliment ;
- test de régression sur la priorité de l'aliment transmis ;
- CI verte et revue croisée avant fusion.

Les nombres de tests sont des instantanés au moment de chaque PR; le total final doit être repris de la dernière exécution sur la version présentée.

---

## 8. Usage de l'IA générative

### IA intégrée au produit

**Google Gemini** est utilisé côté serveur pour proposer l'identification d'un aliment à partir d'une image. La réponse n'est jamais considérée comme une vérité automatique : l'utilisateur doit confirmer ou corriger avant l'ajout à l'inventaire.

### IA utilisée comme aide au développement

**ChatGPT** a été utilisé pour :

- analyser le code ;
- préparer des correctifs ;
- aider au débogage ;
- préparer et interpréter des tests ;
- revoir les Pull Requests ;
- mettre à jour la documentation et la préparation de revue.

Chaque membre reste responsable de comprendre et défendre les contributions soumises sous son nom.

Aucun secret applicatif ne doit apparaître dans le dépôt ou dans les captures de présentation.

---

## 9. Déploiement

La revue officielle ne considère comme livré que ce qui fonctionne sur **l'environnement déployé**. Le prototype statique historique ne remplace donc pas le déploiement de la version full-stack actuelle.

Avant la présentation :

- vérifier l'URL de l'application déployée ;
- vérifier que le commit déployé correspond au `main` présenté ;
- tester connexion, foyer, inventaire, scan, alertes, recettes et objet intelligent sur cette URL ;
- préparer une solution de démonstration simulée pour l'objet intelligent ;
- ne jamais dépendre d'un fichier `.env` visible pendant la présentation.

---

## 10. Checklist finale avant envoi à l'enseignant

- [ ] MEALSAVER-35 terminé ou déclaré comme écart.
- [ ] MEALSAVER-40 terminé ou déclaré comme écart.
- [ ] MEALSAVER-48/49/50 réalisés si capacité, sinon écarts explicités.
- [ ] Chaîne d'objet intelligent simulé intégrée et testée.
- [ ] Défaillance répétée au moins une fois avant la revue.
- [ ] Tests finaux exécutés sur le `main` présenté.
- [ ] CI finale verte.
- [ ] Toutes les PR intégrées ont une revue croisée.
- [ ] Jira correspond exactement à GitHub.
- [ ] README à jour.
- [ ] Modélisation mise à jour pour les éléments réellement modifiés.
- [ ] Usage d'IA documenté.
- [ ] Application full-stack déployée et accessible.
- [ ] Démonstration répétée dans le temps imparti.
- [ ] Tous les membres savent quelle partie ils présentent.
- [ ] Un seul message de transmission est préparé avec : URL application, dépôt GitHub, Jira et documentation.

---

## 11. Message à transmettre à l'enseignant — modèle

**Objet : MealSaver — Revue Sprint 2 — Équipe**

Bonjour,

Voici les liens de l'équipe MealSaver pour la revue du Sprint 2 :

- Application déployée : `[URL À INSÉRER]`
- Dépôt GitHub : `https://github.com/Hafdekhil/MealSaver`
- Projet Jira : `https://hafedhdekhil36.atlassian.net`
- Documentation : README du dépôt et présent document de revue Sprint 2

Les écarts éventuels entre le périmètre engagé et la version livrée seront présentés explicitement pendant la revue.

Merci.
