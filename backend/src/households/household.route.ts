import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { createHouseholdSchema } from "./household.schema.js";

export const householdRouter = Router();

householdRouter.post("/", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);

    if (!userId) {
      return res.status(401).json({
        error: "Non authentifié",
      });
    }

    const parsed = createHouseholdSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Données invalides",
      });
    }

    const household = await prisma.$transaction(async (tx) => {
      const created = await tx.household.create({
        data: {
          name: parsed.data.name,
        },
      });

      await tx.householdMember.create({
        data: {
          householdId: created.id,
          userId,
          role: "OWNER",
        },
      });

      return created;
    });

    return res.status(201).json({
      household,
    });
  } catch (error) {
    return next(error);
  }
});