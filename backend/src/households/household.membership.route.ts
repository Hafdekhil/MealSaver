import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const householdMembershipRouter = Router();

householdMembershipRouter.get("/", async (_req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const memberships = await prisma.householdMember.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        role: true,
        household: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
      },
    });

    return res.status(200).json({
      households: memberships.map(({ household, role }) => ({
        ...household,
        role,
      })),
    });
  } catch (error) {
    return next(error);
  }
});
