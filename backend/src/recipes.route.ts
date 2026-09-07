import { Router } from "express";
import { prisma } from "./lib/prisma.js";

export const recipesRouter = Router();

type RecipeDefinition = {
  id: string;
  name: string;
  ingredients: string[];
};

const recipeCatalog: RecipeDefinition[] = [
  {
    id: "rice-tomato-eggs",
    name: "Riz aux tomates et aux œufs",
    ingredients: ["riz", "tomates", "oeufs"],
  },
  {
    id: "tomato-omelette",
    name: "Omelette aux tomates",
    ingredients: ["oeufs", "tomates"],
  },
  {
    id: "egg-fried-rice",
    name: "Riz sauté aux œufs",
    ingredients: ["riz", "oeufs"],
  },
];

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/œ/g, "oe")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

recipesRouter.get("/", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);
    const householdId = Number(req.query["householdId"]);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        error: "Non authentifié",
      });
    }

    if (!Number.isInteger(householdId) || householdId <= 0) {
      return res.status(400).json({
        error: "Foyer invalide",
      });
    }

    const membership = await prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId,
          userId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        error: "Accès refusé",
      });
    }

    const inventoryItems = await prisma.foodItem.findMany({
      where: {
        householdId,
      },
      orderBy: [
        {
          expiresAt: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

    if (inventoryItems.length === 0) {
      return res.status(200).json({
        suggestions: [],
      });
    }

    const inventoryNames = new Set(
      inventoryItems.map((item) => normalizeName(item.name)),
    );

    const urgentItem =
      inventoryItems.find((item) => item.expiresAt !== null) ??
      inventoryItems[0]!;

    const urgentName = normalizeName(urgentItem.name);

    const matchingRecipes = recipeCatalog
      .map((recipe) => {
        const inventoryIngredients = recipe.ingredients.filter((ingredient) =>
          inventoryNames.has(normalizeName(ingredient)),
        );

        const usesUrgentIngredient = recipe.ingredients.some(
          (ingredient) => normalizeName(ingredient) === urgentName,
        );

        return {
          recipe,
          inventoryIngredients,
          usesUrgentIngredient,
        };
      })
      .filter((candidate) => candidate.inventoryIngredients.length > 0)
      .sort((a, b) => {
        if (a.usesUrgentIngredient !== b.usesUrgentIngredient) {
          return a.usesUrgentIngredient ? -1 : 1;
        }

        return (
          b.inventoryIngredients.length - a.inventoryIngredients.length
        );
      });

    if (matchingRecipes.length > 0) {
      const bestMatch = matchingRecipes[0]!;

      return res.status(200).json({
        suggestions: [
          {
            id: bestMatch.recipe.id,
            name: bestMatch.recipe.name,
            ingredients: bestMatch.recipe.ingredients,
            inventoryIngredients: bestMatch.inventoryIngredients,
          },
        ],
      });
    }

    return res.status(200).json({
      suggestions: [
        {
          id: "anti-waste-fallback",
          name: `Recette anti-gaspillage avec ${urgentItem.name}`,
          ingredients: [urgentItem.name],
          inventoryIngredients: [urgentItem.name],
        },
      ],
    });
  } catch (error) {
    return next(error);
  }
});