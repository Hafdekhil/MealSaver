import type { Prisma } from "@prisma/client";
import { Router } from "express";
import { prisma } from "./lib/prisma.js";
import { addFoodItemSchema } from "./inventory.schema.js";

export const inventoryRouter = Router();

// MEALSAVER-30 : Ajouter un aliment
inventoryRouter.post("/", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);
    const parsed = addFoodItemSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: "Données invalides" });
    }

    const membership = await prisma.householdMember.findUnique({
      where: { householdId_userId: { householdId: parsed.data.householdId, userId } },
    });

    if (!membership) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const data: Prisma.FoodItemUncheckedCreateInput = {
      householdId: parsed.data.householdId,
      name: parsed.data.name,
      storageLocation: parsed.data.storageLocation || "Frigo",
      addedBy: userId,
      quantity: parsed.data.quantity,
      unit: parsed.data.unit,
      expiresAt: parsed.data.expiresAt,
    };

    const item = await prisma.foodItem.create({ data });
    return res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

// Route pour voir l'inventaire
inventoryRouter.get("/", async (req, res, next) => {
  try {
    const householdId = Number(req.query["householdId"]);
    const items = await prisma.foodItem.findMany({
      where: { householdId },
      orderBy: { expiresAt: "asc" },
    });
    return res.json({ items });
  } catch (error) {
    next(error);
  }
});