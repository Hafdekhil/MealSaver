import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { addFoodItemSchema } from "./inventory.schema.js";

export const inventoryRouter = Router();

inventoryRouter.post("/", async (req, res, next) => {
  try {
    const userId = Number(res.locals.userId);
    if (!userId) return res.status(401).json({ error: "Non authentifié" });

    const parsed = addFoodItemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Données invalides" });

    const membership = await prisma.householdMember.findUnique({
      where: { householdId_userId: { householdId: parsed.data.householdId, userId } },
    });
    if (!membership) return res.status(403).json({ error: "Accès refusé" });

    const item = await prisma.foodItem.create({ data: parsed.data });
    return res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});
