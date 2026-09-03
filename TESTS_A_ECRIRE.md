# Tests à écrire — MEALSAVER-29

- retourne `200` avec les membres et leurs rôles pour un utilisateur appartenant au foyer ;
- retourne `403` pour un utilisateur authentifié extérieur au foyer ;
- couvre le cas du foyer inexistant si la route le distingue ;
- vérifie qu’aucune donnée sensible inutile n’est exposée ;
- utilise la session existante via `res.locals.userId` ;
- laisse MEALSAVER-30 hors de cette branche, car il est attribué à Kevin.
