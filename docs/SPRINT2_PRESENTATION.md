# MealSaver — Présentation Sprint 2

**Revue : vendredi 11 septembre 2026**  
**Objectif :** montrer uniquement ce qui est réellement intégré/validé, démontrer le parcours anti-gaspillage, expliquer les tests et assumer clairement les écarts.

## Règle de présentation

Ne jamais présenter un élément `To Do`, `In Progress` ou non fusionné comme une fonctionnalité livrée.

La fiche officielle demande également une chaîne d'objet intelligent de bout en bout. Aucun nouveau récit n'est ajouté au Sprint 2. Si le périmètre actuel ne couvre pas cette chaîne, l'équipe doit l'annoncer comme **écart** plutôt que de présenter le Scan manuel comme un objet intelligent.

---

# Déroulement conseillé — 15 à 18 minutes

## 1. Introduction — 1 min 30

**Intervenant conseillé : Hafedh**

À dire :

> MealSaver est une application collaborative de gestion des aliments du foyer. Après le Sprint 1 consacré à l'authentification, aux foyers et à l'inventaire partagé, le Sprint 2 ajoute le parcours anti-gaspillage : scan avec validation humaine, recettes utilisant l'inventaire et alertes d'expiration reliées aux recettes.

Afficher rapidement :

- dépôt GitHub ;
- tableau Jira Sprint 2 ;
- `README.md`.

Puis annoncer l'état réel :

- récits terminés et fusionnés ;
- MEALSAVER-35 en validation si la PR #40 n'est pas encore fusionnée ;
- récits non livrés explicitement reportés.

---

# 2. Démonstration Scan — 4 minutes

**Intervenant conseillé : Hafedh**

## Scénario A — Identification réussie

1. Se connecter.
2. Ouvrir **Scan**.
3. Téléverser une photo d'aliment.
4. Montrer la prévisualisation.
5. Cliquer sur **Identifier l'aliment**.
6. Montrer la proposition Gemini.
7. Insister : la proposition n'est pas ajoutée automatiquement.
8. Corriger le nom si nécessaire.
9. Ajouter une quantité valide.
10. Cliquer sur **Valider et ajouter à l'inventaire**.
11. Ouvrir l'inventaire et montrer l'aliment réellement créé.

Phrase importante :

> L'IA propose, mais l'utilisateur décide. Aucun aliment n'entre dans l'inventaire sans validation humaine.

## Scénario B — Valeur utilisateur invalide

Montrer rapidement qu'une quantité invalide comme `0` est refusée et ne crée aucun aliment.

## Scénario C — Échec du scan / continuité

**À montrer uniquement si MEALSAVER-35 est fusionné avant la revue.**

1. Provoquer un échec d'identification ou utiliser le bouton de saisie manuelle.
2. Montrer le message clair.
3. Cliquer **Passer à la saisie manuelle**.
4. Remplir le formulaire.
5. Ajouter l'aliment à l'inventaire.
6. Montrer que le produit reste utilisable sans résultat d'identification.

---

# 3. Recettes anti-gaspillage — 3 minutes

**Intervenant conseillé : Kevin**

Préparer dans l'inventaire au moins un aliment proche de sa date d'expiration.

1. Ouvrir **Recettes**.
2. Montrer qu'une recette utilise des aliments du foyer.
3. Montrer la distinction :
   - ingrédients disponibles ;
   - ingrédients manquants.
4. Montrer qu'un aliment urgent peut faire remonter une recette qui l'utilise réellement.
5. Lire brièvement l'explication de recommandation.
6. Montrer le comportement de repli si aucune recette exacte n'existe.

Phrase importante :

> La priorité n'est pas seulement visuelle : la recette mise en avant doit réellement utiliser l'aliment urgent.

---

# 4. Alertes → Recettes — 2 minutes 30

**Intervenant conseillé : Kevin**

1. Revenir à l'accueil connecté.
2. Montrer les alertes d'expiration.
3. Montrer l'ordre par urgence.
4. Afficher le nom et le délai restant.
5. Cliquer **Voir l'aliment**.
6. Revenir et cliquer **Voir une recette**.
7. Montrer que le contexte de l'aliment est transmis à la page Recettes.

Phrase importante :

> L'objectif n'est pas seulement d'avertir l'utilisateur, mais de lui proposer immédiatement une action anti-gaspillage liée à l'aliment concerné.

---

# 5. État du carnet et écarts — 2 minutes

**Intervenant conseillé : Jean Jacques**

Afficher Jira.

Présenter les états sans les embellir :

### Done

MEALSAVER-33, 34, 36, 37, 38, 42, 43, 44.

### En validation

MEALSAVER-35 si la PR #40 n'est pas encore fusionnée.

### Non livrés

MEALSAVER-39, 40, 41, 48, 49, 50 selon l'état Jira au moment de la revue.

Expliquer qu'un récit non terminé reste ouvert et n'est pas déclaré Done.

### Écart avec le document pédagogique

La fiche de revue demande une chaîne d'objet intelligent acquisition → transmission → persistance → restitution. Aucun nouveau récit n'a été ajouté au Sprint 2 pour masquer cet écart. Le déclarer clairement si cette chaîne n'est pas couverte par le périmètre convenu.

---

# 6. Tests, CI et pratiques — 2 minutes

**Intervenant conseillé : Kevin pour QA ; Jean Jacques pour Git/Jira**

Montrer :

- une PR Sprint 2 fusionnée ;
- les checks GitHub verts ;
- une partie des tests backend ;
- les critères d'acceptation cochés dans Jira pour un récit Done.

Points à expliquer :

- tests d'intégration backend ;
- lint/build frontend ;
- revue croisée avant fusion ;
- branches dédiées ;
- conservation de l'historique des contributions ;
- pas de rebase destructif / force-push pour intégrer le travail des collègues ;
- secrets hors du dépôt.

Kevin reprend les tâches de QA/vérification Sprint 2 initialement attribuées à Danensky selon l'instruction de l'enseignant. Les contributions historiques de Danensky au Sprint 1 restent attribuées à Danensky.

---

# 7. Rétrospective et suite — 1 minute

**Intervenant à répartir avec Danensky afin que chaque membre prenne la parole.**

Formulation proposée :

> Le Sprint 2 a livré le coeur Scan–Recettes–Alertes, mais tout le périmètre engagé n'est pas terminé. Notre amélioration principale est de ne plus attendre la fin du sprint pour rapprocher les branches et vérifier les dépendances entre récits. Les récits non terminés restent explicitement ouverts et seront repriorisés avec le client avant l'engagement du Sprint 3.

Ne pas annoncer un Sprint 3 définitif tant que l'objectif et les récits n'ont pas été validés avec le client.

---

# Répartition de parole proposée

| Membre | Partie proposée | Durée |
|---|---|---:|
| Hafedh | Introduction + Scan | 5 min 30 |
| Kevin | Recettes + Alertes + QA | 5 min |
| Jean Jacques | Jira/GitHub + écarts | 3 min |
| Danensky | Rétrospective / apprentissage / transition Sprint 3 | 1 min 30 |

**À ajuster ensemble avant la revue.** L'objectif est que chaque personne intervienne réellement et puisse répondre sur ses propres contributions.

---

# Données de démonstration à préparer

Utiliser uniquement des données fictives/non sensibles.

Exemple :

- foyer : `Demo MealSaver` ;
- aliment 1 : `Carotte`, quantité `5 pieces`, expiration proche ;
- aliment 2 : `Poulet`, quantité `2 portions`, expiration proche ;
- aliment 3 : `Riz`, garde-manger, expiration non urgente.

Préparer une image simple et nette d'un aliment pour la démonstration Scan.

---

# Plan B de démonstration

Avant la revue :

- conserver des captures d'écran des résultats déjà validés ;
- connaître les pages à ouvrir manuellement si une navigation échoue ;
- ne jamais afficher de `.env`, clé API, mot de passe, cookie ou secret ;
- ne jamais dépendre d'une donnée personnelle pour la démonstration.

Si Gemini est momentanément indisponible et que MEALSAVER-35 est fusionné, utiliser le fallback manuel comme démonstration de continuité du produit.

---

# Questions probables du professeur

## Pourquoi valider manuellement le résultat du scan ?

Parce qu'une identification automatique peut être erronée. MealSaver empêche donc l'IA de modifier l'inventaire sans décision humaine.

## Où est la sécurité ?

Les routes sensibles nécessitent une session authentifiée et vérifient l'appartenance au foyer. Les secrets restent dans les variables d'environnement et ne sont pas versionnés.

## Comment les recettes réduisent-elles le gaspillage ?

Elles utilisent l'inventaire du foyer et donnent une priorité aux aliments proches de l'expiration, à condition que la recette les utilise réellement.

## Que faites-vous lorsqu'une fonctionnalité n'est pas terminée ?

Elle reste ouverte dans Jira, elle n'est pas annoncée comme livrée et l'écart est expliqué avec la suite prévue.

## Le Scan est-il la chaîne d'objet intelligent demandée dans la fiche ?

Non. Le Scan utilise une image fournie par l'utilisateur et une analyse Gemini. Il ne faut pas le présenter comme une mesure automatiquement produite par un objet intelligent si ce n'est pas le cas.

---

# Juste avant d'entrer en classe

1. Synchroniser tous les postes sur le même `main`.
2. Vérifier backend et frontend.
3. Tester connexion.
4. Tester Scan.
5. Tester Recettes.
6. Tester Alertes → Recettes.
7. Vérifier Jira.
8. Vérifier GitHub Actions.
9. Fermer tous les onglets contenant des données sensibles.
10. Ouvrir à l'avance les onglets utiles à la démonstration.
