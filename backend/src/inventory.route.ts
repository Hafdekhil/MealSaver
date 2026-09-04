import type { Prisma } from "@prisma/client";
import { Router } from "express";
import { prisma } from "./lib/prisma.js";
import { addFoodItemSchema } from "./inventory.schema.js";

export const inventoryRouter = Router();

inventoryRouter.get("/", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const householdId = Number(req.query["householdId"]);

    if (!Number.isInteger(householdId) || householdId <= 0) {
      return res.status(400).json({ error: "Foyer invalide" });
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
      return res.status(403).json({ error: "Accès refusé" });
    }

    const items = await prisma.foodItem.findMany({
      where: { householdId },
      orderBy: [
        { expiresAt: "asc" },
        { name: "asc" },
      ],
    });

    return res.status(200).json({ items });
  } catch (error) {
    return next(error);
  }
});
inventoryRouter.post("/", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const parsed = addFoodItemSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: "Données invalides" });
    }

    const membership = await prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId: parsed.data.householdId,
          userId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const data: Prisma.FoodItemUncheckedCreateInput = {
      householdId: parsed.data.householdId,
      name: parsed.data.name,
      storageLocation: parsed.data.storageLocation,
    };

    if (parsed.data.quantity !== undefined) {
      data.quantity = parsed.data.quantity;
    }

    if (parsed.data.unit !== undefined) {
      data.unit = parsed.data.unit;
    }

    if (parsed.data.expiresAt !== undefined) {
      data.expiresAt = parsed.data.expiresAt;
    }

    const item = await prisma.foodItem.create({ data });

    return res.status(201).json({ item });
  } catch (error) {
    return next(error);
  }
});