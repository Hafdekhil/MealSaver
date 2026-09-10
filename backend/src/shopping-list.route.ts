import type { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "./lib/prisma.js";

export const shoppingListRouter = Router();

const shoppingItemInputSchema = z.object({
  householdId: z.number().int().positive(),
  name: z.string().trim().min(1).max(120),
  quantity: z.number().positive().max(100000).optional(),
  unit: z.string().trim().min(1).max(40).optional(),
});

const recipeItemsInputSchema = z.object({
  householdId: z.number().int().positive(),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        quantity: z.number().positive().max(100000).optional(),
        unit: z.string().trim().min(1).max(40).optional(),
      }),
    )
    .min(1)
    .max(30),
});

const purchasedInputSchema = z.object({
  purchased: z.boolean(),
});

const shoppingItemInclude = {
  createdByUser: {
    select: {
      id: true,
      name: true,
    },
  },
  purchasedByUser: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

class IncompatibleShoppingUnitError extends Error {
  constructor() {
    super(
      "Cet article existe déjà avec une unité différente. Utilisez la même unité pour fusionner les quantités.",
    );
    this.name = "IncompatibleShoppingUnitError";
  }
}

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/œ/g, "oe")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeUnit(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

async function isHouseholdMember(userId: number, householdId: number) {
  const membership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId,
        userId,
      },
    },
    select: { id: true },
  });

  return membership !== null;
}

type ItemInput = {
  name: string;
  quantity?: number | undefined;
  unit?: string | undefined;
};

type ShoppingListDb = typeof prisma | Prisma.TransactionClient;

function hasIncompatibleUnit(
  existing: { quantity: number | null; unit: string | null },
  input: ItemInput,
) {
  const existingUnit = normalizeUnit(existing.unit);
  const incomingUnit = normalizeUnit(input.unit);

  if (existingUnit === incomingUnit) {
    return false;
  }

  if (existingUnit && incomingUnit) {
    return true;
  }

  return input.quantity !== undefined && existing.quantity !== null;
}

async function createOrMergeItem(
  userId: number,
  householdId: number,
  input: ItemInput,
  db: ShoppingListDb = prisma,
) {
  const normalizedName = normalizeName(input.name);

  const existing = await db.shoppingItem.findUnique({
    where: {
      householdId_normalizedName: {
        householdId,
        normalizedName,
      },
    },
  });

  if (!existing) {
    const item = await db.shoppingItem.create({
      data: {
        householdId,
        name: input.name.trim(),
        normalizedName,
        quantity: input.quantity ?? null,
        unit: input.unit ?? null,
        createdBy: userId,
      },
      include: shoppingItemInclude,
    });

    return { item, merged: false };
  }

  if (hasIncompatibleUnit(existing, input)) {
    throw new IncompatibleShoppingUnitError();
  }

  let quantity = existing.quantity;
  let unit = existing.unit;

  if (input.quantity !== undefined) {
    if (existing.quantity === null) {
      quantity = input.quantity;
      unit = input.unit ?? existing.unit;
    } else {
      quantity = existing.quantity + input.quantity;
      unit = existing.unit ?? input.unit ?? null;
    }
  }

  const item = await db.shoppingItem.update({
    where: { id: existing.id },
    data: {
      quantity,
      unit,
      purchased: false,
      purchasedBy: null,
    },
    include: shoppingItemInclude,
  });

  return { item, merged: true };
}

shoppingListRouter.get("/", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);
    const householdId = Number(req.query["householdId"]);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    if (!Number.isInteger(householdId) || householdId <= 0) {
      return res.status(400).json({ error: "Foyer invalide" });
    }

    if (!(await isHouseholdMember(userId, householdId))) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const items = await prisma.shoppingItem.findMany({
      where: { householdId },
      orderBy: [{ purchased: "asc" }, { name: "asc" }],
      include: shoppingItemInclude,
    });

    return res.status(200).json({ items });
  } catch (error) {
    return next(error);
  }
});

shoppingListRouter.post("/", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);
    const parsed = shoppingItemInputSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: "Données invalides" });
    }

    const { householdId, ...itemInput } = parsed.data;

    if (!(await isHouseholdMember(userId, householdId))) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const result = await createOrMergeItem(userId, householdId, itemInput);

    return res.status(result.merged ? 200 : 201).json(result);
  } catch (error) {
    if (error instanceof IncompatibleShoppingUnitError) {
      return res.status(409).json({ error: error.message });
    }

    return next(error);
  }
});

shoppingListRouter.post("/from-recipe", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);
    const parsed = recipeItemsInputSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: "Données invalides" });
    }

    const { householdId, items } = parsed.data;

    if (!(await isHouseholdMember(userId, householdId))) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const results = await prisma.$transaction(async (tx) => {
      const transactionResults = [];

      for (const item of items) {
        transactionResults.push(
          await createOrMergeItem(userId, householdId, item, tx),
        );
      }

      return transactionResults;
    });

    return res.status(200).json({
      items: results.map((result) => result.item),
      addedCount: results.filter((result) => !result.merged).length,
      mergedCount: results.filter((result) => result.merged).length,
    });
  } catch (error) {
    if (error instanceof IncompatibleShoppingUnitError) {
      return res.status(409).json({ error: error.message });
    }

    return next(error);
  }
});

shoppingListRouter.patch("/:id/purchased", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);
    const itemId = Number(req.params["id"]);
    const parsed = purchasedInputSchema.safeParse(req.body);

    if (!Number.isInteger(itemId) || itemId <= 0 || !parsed.success) {
      return res.status(400).json({ error: "Données invalides" });
    }

    const existing = await prisma.shoppingItem.findUnique({
      where: { id: itemId },
      select: { id: true, householdId: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Article introuvable" });
    }

    if (!(await isHouseholdMember(userId, existing.householdId))) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const item = await prisma.shoppingItem.update({
      where: { id: itemId },
      data: {
        purchased: parsed.data.purchased,
        purchasedBy: parsed.data.purchased ? userId : null,
      },
      include: shoppingItemInclude,
    });

    return res.status(200).json({ item });
  } catch (error) {
    return next(error);
  }
});
