import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const inventoryDeleteRouter = Router();

inventoryDeleteRouter.delete("/:id", async (req, res, next) => {
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

    await prisma.foodItem.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
