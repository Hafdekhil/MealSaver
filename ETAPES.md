# Étapes Danensky — MEALSAVER-29

Objectif : permettre à un utilisateur authentifié de consulter les membres d’un foyer auquel il appartient.

1. Partir du `main` actuel.
2. Implémenter `GET /api/households/:id/members`.
3. Vérifier que l’utilisateur authentifié appartient au foyer demandé.
4. Retourner `403` si l’utilisateur n’appartient pas au foyer.
5. Retourner les informations nécessaires à l’affichage des membres et de leur rôle.
6. Ajouter les tests automatisés : accès autorisé, accès refusé, foyer absent si applicable.
7. Ne pas modifier `backend/src/auth/**`.
8. Ne pas implémenter MEALSAVER-30 sur cette branche : ce récit est attribué à Kevin.
9. Relancer `npm run build` et `npm test`.
10. Passer la PR en Ready for review seulement quand le code et les tests sont terminés et la CI verte.
