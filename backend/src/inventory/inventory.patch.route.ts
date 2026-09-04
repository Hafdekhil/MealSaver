import type { Prisma } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { updateFoodItemSchema } from "./inventory.update.schema.js";

export const inventoryUpdateRouter = Router();

inventoryUpdateRouter.patch("/:id", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);

    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(401).json({ error: "Non authentifié" });
      return;
    }

    const id = Number(req.params["id"]);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Identifiant d'aliment invalide" });
      return;
    }

    const item = await prisma.foodItem.findUnique({ where: { id } });

    if (!item) {
      res.status(404).json({ error: "Aliment introuvable" });
      return;
    }

    const membership = await prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId: item.householdId,
          userId,
        },
      },
    });

    if (!membership) {
      res.status(403).json({ error: "Accès refusé" });
      return;
    }

    const parsed = updateFoodItemSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Données invalides" });
      return;
    }

    const updateData: Prisma.FoodItemUpdateInput = {};

    if (parsed.data.name !== undefined) {
      updateData.name = parsed.data.name;
    }

    if (parsed.data.quantity !== undefined) {
      updateData.quantity = parsed.data.quantity;
    }

    if (parsed.data.unit !== undefined) {
      updateData.unit = parsed.data.unit;
    }

    if (parsed.data.expiresAt !== undefined) {
      updateData.expiresAt = parsed.data.expiresAt;
    }

    if (parsed.data.storageLocation !== undefined) {
      updateData.storageLocation = parsed.data.storageLocation;
    }

    const updated = await prisma.foodItem.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({ item: updated });
  } catch (error) {
    next(error);
  }
});
