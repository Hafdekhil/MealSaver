import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { createHouseholdSchema } from "./household.schema.js";

export const householdRouter = Router();

householdRouter.post("/", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        error: "Non authentifié",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
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

householdRouter.delete("/:householdId", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);
    const householdId = Number(req.params["householdId"]);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        error: "Non authentifié",
      });
    }

    if (!Number.isInteger(householdId) || householdId <= 0) {
      return res.status(400).json({
        error: "Foyer invalide",
      });
    }

    const ownerMembership = await prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId,
          userId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!ownerMembership || ownerMembership.role !== "OWNER") {
      return res.status(403).json({
        error: "Seul le propriétaire peut supprimer ce foyer",
      });
    }

    await prisma.household.delete({
      where: {
        id: householdId,
      },
    });

    return res.status(200).json({
      message: "Foyer supprimé",
    });
  } catch (error) {
    return next(error);
  }
});
