import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const inventoryDeleteRouter = Router();

inventoryDeleteRouter.delete("/:id", async (req, res, next) => {
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

    await prisma.foodItem.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});
