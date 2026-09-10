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
    ingredients: ["riz", "tomates", "oeufs", "oignon", "huile"],
  },
  {
    id: "tomato-omelette",
    name: "Omelette aux tomates",
    ingredients: ["oeufs", "tomates", "fromage"],
  },
  {
    id: "egg-fried-rice",
    name: "Riz sauté aux œufs",
    ingredients: ["riz", "oeufs", "oignon", "sauce soja"],
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

function daysUntilExpiration(expiresAt: Date) {
  const now = new Date();

  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );

  const expirationUtc = Date.UTC(
    expiresAt.getUTCFullYear(),
    expiresAt.getUTCMonth(),
    expiresAt.getUTCDate(),
  );

  return Math.round(
    (expirationUtc - todayUtc) / (1000 * 60 * 60 * 24),
  );
}

function buildRecommendationReason(
  ingredientName: string,
  expiresAt: Date | null,
) {
  if (!expiresAt) {
    return `Cette recette utilise ${ingredientName}, un aliment déjà disponible dans votre inventaire.`;
  }

  const days = daysUntilExpiration(expiresAt);

  if (days === 0) {
    return `Cette recette est recommandée en priorité car elle utilise ${ingredientName}, qui expire aujourd'hui.`;
  }

  if (days === 1) {
    return `Cette recette est recommandée en priorité car elle utilise ${ingredientName}, qui expire demain.`;
  }

  if (days > 1) {
    return `Cette recette est recommandée en priorité car elle utilise ${ingredientName}, qui expire dans ${days} jours.`;
  }

  return `Cette recette utilise ${ingredientName}, dont la date d'expiration est la plus urgente dans votre inventaire.`;
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

    const matchingRecipes = recipeCatalog
      .map((recipe) => {
        const availableIngredients = recipe.ingredients.filter((ingredient) =>
          inventoryNames.has(normalizeName(ingredient)),
        );

        const missingIngredients = recipe.ingredients.filter(
          (ingredient) => !inventoryNames.has(normalizeName(ingredient)),
        );

        const matchingInventoryItems = inventoryItems.filter((item) =>
          recipe.ingredients.some(
            (ingredient) =>
              normalizeName(ingredient) === normalizeName(item.name),
          ),
        );

        const priorityItem =
          matchingInventoryItems.find((item) => item.expiresAt !== null) ??
          matchingInventoryItems[0] ??
          null;

        const priorityDays = priorityItem?.expiresAt
          ? daysUntilExpiration(priorityItem.expiresAt)
          : Number.MAX_SAFE_INTEGER;

        return {
          recipe,
          availableIngredients,
          missingIngredients,
          priorityItem,
          priorityDays,
        };
      })
      .filter((candidate) => candidate.availableIngredients.length > 0)
      .sort((a, b) => {
        if (a.priorityDays !== b.priorityDays) {
          return a.priorityDays - b.priorityDays;
        }

        return (
          b.availableIngredients.length - a.availableIngredients.length
        );
      });

    const priorityIngredient = {
      name: urgentItem.name,
      expiresAt: urgentItem.expiresAt,
      daysUntilExpiration: urgentItem.expiresAt
        ? daysUntilExpiration(urgentItem.expiresAt)
        : null,
    };


    if (matchingRecipes.length > 0) {
      const bestMatch = matchingRecipes[0]!;

      if (!bestMatch.priorityItem) {
        throw new Error("Recette correspondante sans ingrédient d'inventaire");
      }

      const priorityIngredient = {
        name: bestMatch.priorityItem.name,
        expiresAt: bestMatch.priorityItem.expiresAt,
        daysUntilExpiration: bestMatch.priorityItem.expiresAt
          ? daysUntilExpiration(bestMatch.priorityItem.expiresAt)
          : null,
      };

      const recommendationReason = buildRecommendationReason(
        bestMatch.priorityItem.name,
        bestMatch.priorityItem.expiresAt,
      );

      return res.status(200).json({
        suggestions: [
          {
            id: bestMatch.recipe.id,
            name: bestMatch.recipe.name,
            ingredients: bestMatch.recipe.ingredients,

            // MEALSAVER-36
            inventoryIngredients: bestMatch.availableIngredients,

            // MEALSAVER-37
            availableIngredients: bestMatch.availableIngredients,
            missingIngredients: bestMatch.missingIngredients,

            // MEALSAVER-38
            priorityIngredient,
            recommendationReason,
            isFallback: false,
          },
        ],
      });
    }

    return res.status(200).json({
      suggestions: [
        {
          id: "anti-waste-fallback",
          name: `Idée anti-gaspillage avec ${urgentItem.name}`,
          ingredients: [urgentItem.name],

          inventoryIngredients: [urgentItem.name],

          availableIngredients: [urgentItem.name],
          missingIngredients: [],

          priorityIngredient,
          recommendationReason:
            `Aucune recette exacte n'a été trouvée. ` +
            buildRecommendationReason(
              urgentItem.name,
              urgentItem.expiresAt,
            ),
          isFallback: true,
        },
      ],
    });
  } catch (error) {
    return next(error);
  }
});