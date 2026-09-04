import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const memberRouter = Router();

memberRouter.get("/:householdId/members", async (req, res, next) => {
  try {
    const userId = Number(res.locals.userId);
    if (!userId) return res.status(401).json({ error: "Non authentifié" });

    const householdId = Number(req.params.householdId);
    const membership = await prisma.householdMember.findUnique({
      where: { householdId_userId: { householdId, userId } },
    });
    if (!membership) return res.status(403).json({ error: "Accès refusé" });

    const members = await prisma.householdMember.findMany({
      where: { householdId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });

    return res.json({
      members: members.map((m) => ({
        id: m.user.id, name: m.user.name, email: m.user.email, role: m.role,
      })),
    });
  } catch (error) {
    next(error);
  }
});
