# MealSaver — Livrable Sprint 2

**Cours :** 420-321-AH — Projet intégrateur  
**Revue :** vendredi 11 septembre 2026  
**État préparé le :** 10 septembre 2026

Ce document sert de liste de contrôle pour la revue. Il reprend les exigences du document officiel **« Livrables de la semaine 3 — Étape 2 — Développement — Sprint 2 »** et les compare à l'état réel de MealSaver.

> Principe de preuve : une fonctionnalité n'est indiquée comme livrée que si elle est réellement intégrée/validée. Les éléments encore en revue ou non intégrés sont indiqués comme tels.

## 1. Résumé de l'incrément Sprint 2

### Livré et intégré

- MEALSAVER-33 — Scanner ou téléverser un aliment — PR #34 fusionnée.
- MEALSAVER-34 — Valider ou corriger le résultat du scan — PR #36 fusionnée.
- MEALSAVER-36 — Recevoir une recette — PR #32 fusionnée.
- MEALSAVER-37 — Voir les ingrédients disponibles et manquants — PR #32 fusionnée.
- MEALSAVER-38 — Prioriser les aliments proches de l'expiration — PR #32 fusionnée.
- MEALSAVER-42 — Recevoir une alerte d'expiration — PR #37 fusionnée.
- MEALSAVER-43 — Voir les alertes dans le tableau de bord — PR #37 fusionnée.
- MEALSAVER-44 — Relier une alerte à une recette — PR #37 fusionnée.

### En validation

- MEALSAVER-35 — Saisie manuelle si le scan échoue — PR #40 ouverte ; Backend CI et Frontend CI vertes ; revue croisée demandée à Kevin et Jean Jacques.

### Non livré au moment de cette mise à jour

- MEALSAVER-39 — Ajouter un article à la liste — In Progress dans Jira.
- MEALSAVER-40 — Ajouter les ingrédients manquants d'une recette à la liste — In Progress dans Jira.
- MEALSAVER-41 — Cocher un article acheté — In Progress dans Jira.
- MEALSAVER-48 — Consulter son profil — To Do dans Jira.
- MEALSAVER-49 — Modifier ses préférences alimentaires — To Do dans Jira.
- MEALSAVER-50 — Gérer les notifications — To Do dans Jira.

Aucun nouveau récit n'est ajouté au Sprint 2.

---

# A. Chaîne de l'objet intelligent, de bout en bout

| Livrable officiel | État MealSaver | Preuve / remarque | Responsable de la revue |
|---|---|---|---|
| Acquisition de la mesure par un objet réel ou simulé | **Écart** | Le Scan actuel part d'une photo choisie/prise par l'utilisateur. Il ne doit pas être présenté comme une mesure automatiquement produite par un objet intelligent. | Hafedh — déclaration de l'écart |
| Transmission jusqu'au système | **Écart pour la chaîne d'objet** | Les API du produit fonctionnent, mais aucune mesure d'objet automatique appartenant au périmètre actuel n'est transmise. | Hafedh |
| Persistance de la mesure avec source et horodatage | **Écart** | Aucune mesure d'objet intelligent du périmètre actuel n'est persistée comme telle. | Hafedh |
| Restitution de la mesure dans l'interface | **Écart** | Non couvert par les récits Sprint 2 existants. | Hafedh |
| Parcours complet démontrable en direct | **Écart** | Ne pas substituer le parcours manuel du Scan à cette exigence. | Équipe |
| Version simulée maintenue | **Écart** | Aucun nouveau simulateur n'est ajouté au Sprint 2. | Équipe |

**Décision de périmètre :** le responsable du projet a demandé de ne pas ajouter de nouveau récit/fonctionnalité au Sprint 2. Cette exigence pédagogique est donc déclarée explicitement comme écart si elle n'est pas déjà couverte par le périmètre convenu avec le client.

---

# B. Comportement en situation de défaillance

## Ce que MealSaver peut démontrer sans inventer de nouvel objet

Le parcours **Scan** comporte un mécanisme de défaillance métier prévu dans le périmètre : lorsque l'identification d'image échoue, l'utilisateur doit pouvoir continuer par saisie manuelle (MEALSAVER-35).

Ce comportement couvre la continuité d'utilisation du produit, mais **ne remplace pas** les scénarios officiels de perte de connexion / valeur aberrante / absence de mesure d'un objet intelligent.

| Cas | État |
|---|---|
| Échec du service d'identification → message clair | **Couvert dans PR #40, en revue** |
| Passage à la saisie manuelle | **Couvert dans PR #40, en revue** |
| Produit utilisable sans résultat du scan | **Couvert dans PR #40, en revue** |
| Perte de connexion d'un objet intelligent | **Écart** |
| Valeur aberrante d'une mesure d'objet | **Écart** |
| Absence de mesure d'un objet | **Écart** |

---

# C. Reste de l'incrément Sprint 2

## Fonctionnalités engagées livrées

**8 récits sont Done dans Jira et fusionnés :** 33, 34, 36, 37, 38, 42, 43, 44.

MEALSAVER-35 est techniquement validé par les CI de sa PR mais reste en attente d'une revue croisée avant fusion.

Les récits 39, 40, 41, 48, 49 et 50 ne doivent pas être présentés comme livrés.

## Critères d'acceptation

Les récits marqués Done ont leurs critères d'acceptation cochés dans Jira et leurs Pull Requests documentent les vérifications réalisées.

## Écarts relevés

- Liste d'épicerie collaborative Sprint 2 : non intégrée à `main`.
- Profil/préférences/notifications : non commencés dans Jira au moment de cette préparation.
- MEALSAVER-35 : revue croisée encore attendue.
- Chaîne d'objet intelligent demandée par la fiche pédagogique : non couverte par le périmètre Sprint 2 existant.
- Environnement full-stack publiquement déployé : adresse à fournir seulement si elle existe réellement.

---

# D. Tests réalisés pendant le sprint

## Preuves disponibles

### Scan — MEALSAVER-33

PR #34 :

- tests ciblés : 5/5 ;
- suite backend au moment de la PR : 70/70 ;
- build backend ;
- lint frontend : 0 erreur / 0 warning ;
- build frontend ;
- tests manuels desktop/mobile ;
- CI GitHub verte ;
- revue croisée avant fusion.

### Scan — MEALSAVER-34

PR #36 :

- lint frontend : 0 erreur / 0 warning ;
- build frontend ;
- correction `Carotte` → `Carotte bio`, quantité `5`, vérifiée dans l'inventaire ;
- quantité `0` rejetée et absence d'ajout ;
- CI verte et revue croisée.

### Recettes — MEALSAVER-36/37/38

PR #32 :

- tests recettes : 8/8 ;
- suite backend au moment de la PR : 64/64 sur 14 fichiers ;
- build backend ;
- lint et build frontend ;
- Backend CI verte ;
- test de régression sur la priorité des aliments urgents.

### Alertes — MEALSAVER-42/43/44

PR #37 :

- tests backend déclarés : 60 réussis ;
- build backend ;
- lint frontend : 0 erreur / 0 warning ;
- build frontend ;
- Backend CI verte ;
- test de la priorité de l'aliment transmis depuis une alerte vers les recettes.

### MEALSAVER-35

PR #40 :

- Backend CI : **success** ;
- Frontend CI : **success** ;
- revue fonctionnelle/croisée : **en attente**.

## Limite à dire devant le client

Le dépôt possède des tests d'intégration sur les fonctionnalités backend. En revanche, le test de bout en bout d'une **mesure d'objet intelligent** demandé par la fiche officielle n'existe pas dans le périmètre Sprint 2 actuel ; il ne faut pas le présenter comme couvert.

---

# E. Documentation tenue à jour

| Exigence | État |
|---|---|
| Documentation de l'incrément Sprint 2 | **Mise à jour dans cette PR de documentation** |
| Format des données du Scan / API | **Documenté dans le code et les PR du Scan** |
| Documentation de l'objet intelligent | **Écart — aucun nouvel objet ajouté au Sprint 2** |
| Modélisation touchée par un objet intelligent | **Sans objet tant qu'aucun objet n'est intégré** |
| Usage des outils d'IA générative déclaré | **Oui** |

## Déclaration IA

- ChatGPT : analyse, revue de code, débogage, documentation et préparation des tests.
- Google Gemini : proposition d'identification d'un aliment dans le parcours Scan.
- La décision finale d'ajout à l'inventaire reste humaine.
- Les secrets et clés ne sont pas versionnés.

---

# F. Pratiques de développement et gestion du projet

- Branches de fonctionnalité utilisées.
- Pull Requests utilisées pour les intégrations.
- Revues croisées exigées avant fusion.
- CI GitHub vérifiée avant fusion des récits validés.
- Aucun rebase destructif ni force-push utilisé pour intégrer les contributions des collègues.
- Historique original des contributions conservé.
- `.env`, mots de passe, clés API et secrets hors Git.
- Jira est réaligné avec l'état réel : les récits fusionnés sont Done ; les récits non livrés restent In Progress/To Do.
- Les tâches QA Sprint 2 initialement prévues pour Danensky sont transférées à Kevin selon l'instruction de l'enseignant ; l'historique Sprint 1 de Danensky reste inchangé.

---

# G. Rituels et préparation du Sprint 3

Les éléments suivants doivent être confirmés par l'équipe avant la revue ; ils ne doivent pas être inventés dans la documentation :

- mêlées quotidiennes effectivement tenues ;
- décision du client sur les récits reportés ;
- objectif final du Sprint 3 ;
- récits réellement engagés au Sprint 3 ;
- répartition du travail ;
- rétrospective du Sprint 2 et action retenue.

## Proposition de base à valider avec le client

Objectif possible du Sprint 3 :

> **Stabiliser le parcours anti-gaspillage collaboratif et terminer les éléments du carnet qui n'ont pas été livrés au Sprint 2, selon les priorités confirmées avec le client.**

Cette phrase est une proposition de préparation et ne doit être présentée comme un engagement qu'après validation par le client.

---

# H. Transmission et revue du 11 septembre

## Liens à transmettre

- Dépôt GitHub : `https://github.com/Hafdekhil/MealSaver`
- Projet Jira : lien du projet MEALSAVER
- Documentation : README + dossier `docs/`
- Application déployée : **[À compléter uniquement avec une vraie adresse de déploiement]**

## Message de transmission proposé

> Bonjour Mme Damas,
>
> Voici les éléments de notre revue Sprint 2 pour MealSaver :
>
> - application déployée : [adresse à compléter] ;
> - dépôt GitHub : https://github.com/Hafdekhil/MealSaver ;
> - projet Jira : [lien Jira MEALSAVER] ;
> - documentation Sprint 2 : README et dossier docs du dépôt.
>
> Nous présenterons l'incrément réellement livré, les tests/CI associés ainsi que les écarts entre le périmètre engagé et le périmètre terminé.
>
> Cordialement,  
> L'équipe MealSaver

---

# Checklist juste avant la présentation

- [ ] PR #40 revue par un autre membre.
- [ ] Si approuvée et CI verte, PR #40 fusionnée dans `main`.
- [ ] Tous les postes de démonstration synchronisés sur le même `main`.
- [ ] Base de démonstration préparée avec données non sensibles.
- [ ] Démonstration Scan répétée : succès → correction → ajout.
- [ ] Démonstration Scan répétée : échec → saisie manuelle.
- [ ] Démonstration Recettes répétée avec aliment proche de l'expiration.
- [ ] Démonstration Alertes → Recettes répétée.
- [ ] Écarts Sprint 2 expliqués sans les masquer.
- [ ] Adresse déployée ajoutée si disponible.
- [ ] Tous les membres connaissent leur prise de parole.
- [ ] Message unique à l'enseignante prêt avant le début de la revue.
