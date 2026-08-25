# MealSaver — site statique GitHub Pages

Prototype statique commercialisable pour le projet MealSaver.

## Contenu

- `index.html` : application statique complète
- `styles.css` : design responsive Web + mobile
- `app.js` : navigation, inventaire, scan démo, recettes, liste collaborative avec `localStorage`
- `assets/` : logo, illustrations produits et recettes
- `.nojekyll` : évite les problèmes de publication GitHub Pages

## Déploiement rapide

1. Créer un dépôt GitHub, par exemple `MealSaver`.
2. Copier tous les fichiers à la racine du dépôt.
3. Pousser sur la branche `main`.
4. Dans GitHub : Settings → Pages → Build and deployment → Deploy from a branch → `main` → `/root`.

## Commandes Git

```powershell
git init
git add .
git commit -m "Ajout du site statique MealSaver"
git branch -M main
git remote add origin https://github.com/VOTRE_USER/MealSaver.git
git push -u origin main
```

Remplacer `VOTRE_USER` par le nom du compte GitHub.
