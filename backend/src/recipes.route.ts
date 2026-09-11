import { Router } from "express";
import { prisma } from "./lib/prisma.js";

export const recipesRouter = Router();

type DietaryPreference = "vegetarian" | "vegan" | "mediterranean";

type RecipeDefinition = {
  id: string;
  name: string;
  ingredients: string[];
  dietaryTags: DietaryPreference[];
};

const recipeCatalog: RecipeDefinition[] = [
  {
    id: "spinach-potato-soup",
    name: "Soupe aux \u00e9pinards et pommes de terre",
    ingredients: [
      "\u00e9pinards",
      "pommes de terre",
      "oignon",
      "bouillon de légumes",
      "huile d'olive",
    ],
    dietaryTags: ["vegetarian", "vegan", "mediterranean"],
  },
  {
    id: "carrot-potato-soup",
    name: "Soupe de carottes et pommes de terre",
    ingredients: [
      "carotte",
      "pommes de terre",
      "oignon",
      "bouillon de légumes",
      "huile d'olive",
    ],
    dietaryTags: ["vegetarian", "vegan", "mediterranean"],
  },
  {
    id: "rice-tomato-eggs",
    name: "Riz aux tomates et aux \u0153ufs",
    ingredients: ["riz", "tomates", "oeufs", "oignon", "huile d'olive"],
    dietaryTags: ["vegetarian", "mediterranean"],
  },
  {
    id: "tomato-omelette",
    name: "Omelette aux tomates",
    ingredients: ["oeufs", "tomates", "fromage"],
    dietaryTags: ["vegetarian", "mediterranean"],
  },
  {
    id: "vegetable-fried-rice",
    name: "Riz saut\u00e9 aux l\u00e9gumes",
    ingredients: [
      "riz",
      "carotte",
      "oignon",
      "petits pois",
      "sauce soja",
      "huile d'olive",
    ],
    dietaryTags: ["vegetarian", "vegan"],
  },
  {
    id: "zucchini-tomato-skillet",
    name: "Po\u00eal\u00e9e de courgettes et tomates",
    ingredients: [
      "courgette",
      "tomates",
      "oignon",
      "ail",
      "huile d'olive",
    ],
    dietaryTags: ["vegetarian", "vegan", "mediterranean"],
  },
  {
    id: "mediterranean-chickpea-salad",
    name: "Salade m\u00e9diterran\u00e9enne aux pois chiches",
    ingredients: [
      "pois chiches",
      "tomates",
      "concombre",
      "oignon",
      "huile d'olive",
      "citron",
    ],
    dietaryTags: ["vegetarian", "vegan", "mediterranean"],
  },
  {
    id: "lentil-vegetable-soup",
    name: "Soupe de lentilles aux l\u00e9gumes",
    ingredients: [
      "lentilles",
      "carotte",
      "tomates",
      "oignon",
      "bouillon de légumes",
    ],
    dietaryTags: ["vegetarian", "vegan", "mediterranean"],
  },
  {
    id: "roasted-potatoes",
    name: "Pommes de terre r\u00f4ties \u00e0 l'ail",
    ingredients: [
      "pommes de terre",
      "oignon",
      "ail",
      "huile d'olive",
    ],
    dietaryTags: ["vegetarian", "vegan", "mediterranean"],
  },
  {
    id: "chickpea-tomato-rice",
    name: "Riz aux pois chiches et tomates",
    ingredients: [
      "riz",
      "pois chiches",
      "tomates",
      "oignon",
      "huile d'olive",
    ],
    dietaryTags: ["vegetarian", "vegan", "mediterranean"],
  },
];

const dietaryPreferences = new Set<DietaryPreference>([
  "vegetarian",
  "vegan",
  "mediterranean",
]);

const nameAliases: Record<string, string> = {
  carottes: "carotte",
  courgettes: "courgette",
  epinards: "epinard",
  oeufs: "oeuf",
  oignons: "oignon",
  tomates: "tomate",
  lentilles: "lentille",
  "pois chiches": "pois chiche",
  "pommes de terre": "pomme de terre",
  "petits pois": "petit pois",
  "huile olive": "huile d olive",
  "huile d olive": "huile d olive",
};

function normalizeName(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/\u0153/g, "oe")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[']/g, " ")
    .replace(/\b(?:bio|biologique|biologiques)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return nameAliases[normalized] ?? normalized;
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

function isUsableInventoryItem(item: { expiresAt: Date | null }) {
  return item.expiresAt === null || daysUntilExpiration(item.expiresAt) >= 0;
}

function expirationPriority(item: { expiresAt: Date | null }) {
  return item.expiresAt
    ? daysUntilExpiration(item.expiresAt)
    : Number.MAX_SAFE_INTEGER;
}

function buildRecommendationReason(
  ingredientName: string,
  expiresAt: Date | null,
) {
  if (!expiresAt) {
    return `Cette recette utilise ${ingredientName}, d\u00e9j\u00e0 disponible dans votre inventaire.`;
  }

  const days = daysUntilExpiration(expiresAt);

  if (days === 0) {
    return `Cette recette utilise en priorit\u00e9 ${ingredientName}, qui expire aujourd'hui.`;
  }

  if (days === 1) {
    return `Cette recette utilise en priorit\u00e9 ${ingredientName}, qui expire demain.`;
  }

  return `Cette recette utilise en priorit\u00e9 ${ingredientName}, qui expire dans ${days} jours.`;
}

function getRequestedIngredient(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const ingredient = value.trim();

  if (!ingredient || ingredient.length > 120) {
    return null;
  }

  return ingredient;
}

function isDietaryPreference(value: string): value is DietaryPreference {
  return dietaryPreferences.has(value as DietaryPreference);
}

recipesRouter.get("/", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);
    const householdId = Number(req.query["householdId"]);
    const requestedIngredient = getRequestedIngredient(
      req.query["ingredient"],
    );

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        error: "Non authentifi\u00e9",
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
        error: "Acc\u00e8s refus\u00e9",
      });
    }

    const userPreferences = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredIngredients: true },
    });

    const storedPreferences =
      userPreferences?.preferredIngredients ?? [];

    const dietaryPreference =
      storedPreferences.find(isDietaryPreference) ?? null;

    const preferredIngredientNames = new Set(
      storedPreferences
        .filter((value) => !isDietaryPreference(value))
        .map(normalizeName),
    );

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

    const usableInventoryItems = inventoryItems.filter(
      isUsableInventoryItem,
    );

    if (usableInventoryItems.length === 0) {
      return res.status(200).json({
        suggestions: [],
      });
    }

    const inventoryNames = new Set(
      usableInventoryItems.map((item) => normalizeName(item.name)),
    );

    let requestedItem = null as
      | (typeof usableInventoryItems)[number]
      | null;

    if (requestedIngredient) {
      const requestedName = normalizeName(requestedIngredient);

      const matchingRequestedItems = inventoryItems.filter(
        (item) => normalizeName(item.name) === requestedName,
      );

      if (matchingRequestedItems.length === 0) {
        return res.status(200).json({
          suggestions: [],
        });
      }

      requestedItem =
        matchingRequestedItems
          .filter(isUsableInventoryItem)
          .sort(
            (a, b) =>
              expirationPriority(a) - expirationPriority(b),
          )[0] ?? null;

      if (!requestedItem) {
        return res.status(200).json({
          suggestions: [],
        });
      }
    }

    const candidates = recipeCatalog
      .map((recipe) => {
        const recipeIngredientNames = new Set(
          recipe.ingredients.map(normalizeName),
        );

        const availableIngredients = recipe.ingredients.filter(
          (ingredient) => inventoryNames.has(normalizeName(ingredient)),
        );

        const missingIngredients = recipe.ingredients.filter(
          (ingredient) => !inventoryNames.has(normalizeName(ingredient)),
        );

        const matchingInventoryItems = usableInventoryItems
          .filter((item) =>
            recipeIngredientNames.has(normalizeName(item.name)),
          )
          .sort(
            (a, b) =>
              expirationPriority(a) - expirationPriority(b),
          );

        const usesRequestedItem =
          requestedItem !== null &&
          recipeIngredientNames.has(normalizeName(requestedItem.name));

        const priorityItem = usesRequestedItem
          ? requestedItem
          : matchingInventoryItems[0] ?? null;

        const priorityDays = priorityItem
          ? expirationPriority(priorityItem)
          : Number.MAX_SAFE_INTEGER;

        const matchedPreferredIngredients = recipe.ingredients.filter(
          (ingredient) =>
            preferredIngredientNames.has(normalizeName(ingredient)),
        );

        const dietaryPreferenceApplied =
          dietaryPreference !== null &&
          recipe.dietaryTags.includes(dietaryPreference);

        const preferenceApplied =
          dietaryPreferenceApplied ||
          matchedPreferredIngredients.length > 0;

        return {
          recipe,
          availableIngredients,
          missingIngredients,
          priorityItem,
          priorityDays,
          usesRequestedItem,
          matchedPreferredIngredients,
          dietaryPreferenceApplied,
          preferenceApplied,
        };
      })
      .filter(
        (candidate) =>
          candidate.availableIngredients.length > 0 &&
          candidate.priorityItem !== null,
      )
      .filter(
        (candidate) =>
          requestedItem === null || candidate.usesRequestedItem,
      )
      .sort((a, b) => {
        if (
          a.dietaryPreferenceApplied !== b.dietaryPreferenceApplied
        ) {
          return a.dietaryPreferenceApplied ? -1 : 1;
        }

        if (a.priorityDays !== b.priorityDays) {
          return a.priorityDays - b.priorityDays;
        }

        if (
          a.missingIngredients.length !== b.missingIngredients.length
        ) {
          return (
            a.missingIngredients.length - b.missingIngredients.length
          );
        }

        return (
          b.availableIngredients.length -
          a.availableIngredients.length
        );
      })
      .slice(0, 3);

    const suggestions = candidates.map((candidate) => {
      const priorityItem = candidate.priorityItem!;

      const priorityIngredient = {
        name: priorityItem.name,
        expiresAt: priorityItem.expiresAt,
        daysUntilExpiration: priorityItem.expiresAt
          ? daysUntilExpiration(priorityItem.expiresAt)
          : null,
      };

      let preferenceReason = "";

      if (
        dietaryPreference !== null &&
        candidate.dietaryPreferenceApplied
      ) {
        preferenceReason =
          " Cette recette correspond aussi \u00e0 votre pr\u00e9f\u00e9rence alimentaire.";
      } else if (candidate.matchedPreferredIngredients.length > 0) {
        preferenceReason =
          ` Elle utilise aussi vos ingr\u00e9dients pr\u00e9f\u00e9r\u00e9s (${candidate.matchedPreferredIngredients.join(", ")}).`;
      }

      return {
        id: candidate.recipe.id,
        name: candidate.recipe.name,
        ingredients: candidate.recipe.ingredients,
        inventoryIngredients: candidate.availableIngredients,
        availableIngredients: candidate.availableIngredients,
        missingIngredients: candidate.missingIngredients,
        priorityIngredient,
        recommendationReason:
          buildRecommendationReason(
            priorityItem.name,
            priorityItem.expiresAt,
          ) + preferenceReason,
        preferenceApplied: candidate.preferenceApplied,
        isFallback: false,
      };
    });

    return res.status(200).json({
      suggestions,
    });
  } catch (error) {
    return next(error);
  }
});
