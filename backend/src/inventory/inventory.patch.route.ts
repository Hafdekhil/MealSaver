import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { updateFoodItemSchema } from "./inventory.update.schema.js";

export const inventoryUpdateRouter = Router();

inventoryUpdateRouter.patch("/:id", async (req, res, next) => {
  try {
    const userId = Number(res.locals.userId);
    if (!userId) return res.status(401).json({ error: "Non authentifié" });

    const id = Number(req.params.id);
    const item = await prisma.foodItem.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: "Aliment introuvable" });

    const membership = await prisma.householdMember.findUnique({
      where: { householdId_userId: { householdId: item.householdId, userId } },
    });
    if (!membership) return res.status(403).json({ error: "Accès refusé" });

    const parsed = updateFoodItemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Données invalides" });

    const updated = await prisma.foodItem.update({ where: { id }, data: parsed.data });
    return res.json({ item: updated });
  } catch (error) {
    next(error);
  }
});
