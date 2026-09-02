import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const inventoryDeleteRouter = Router();

inventoryDeleteRouter.delete("/:id", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);
    if (!userId) {
      res.status(401).json({ error: "Non authentifié" });
      return;
    }

    const id = Number(req.params.id);
    const item = await prisma.foodItem.findUnique({ where: { id } });
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

    await prisma.foodItem.delete({ where: { id } });
    res.status(204).send();
    return;
  } catch (error) {
    next(error);
  }
});