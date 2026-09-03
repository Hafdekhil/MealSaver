import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { updateFoodItemSchema } from "./inventory.update.schema.js";

export const inventoryUpdateRouter = Router();

inventoryUpdateRouter.patch("/:id", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);
    if (!userId) {
      res.status(401).json({ error: "Non authentifié" });
      return;
    }

    const id = Number(req.params.id);
    
    const item = await prisma.food_item.findUnique({ where: { id } });
    if (!item) {
      res.status(404).json({ error: "Aliment introuvable" });
      return;
    }

    const membership = await prisma.householdMember.findUnique({
      where: { householdId_userId: { householdId: item.householdId, userId } },
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

    const updated = await prisma.food_item.update({ where: { id }, data: parsed.data });
    res.json({ item: updated });
    return;
  } catch (error) {
    next(error);
  }
});