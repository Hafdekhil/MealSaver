import { Router } from "express";
import { prisma } from "./lib/prisma.js";

export const memberRouter = Router();

memberRouter.get("/:householdId/members", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const householdId = Number(req.params["householdId"]);

    if (!Number.isInteger(householdId) || householdId <= 0) {
      return res.status(400).json({ error: "Foyer invalide" });
    }

    const membership = await prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId,
          userId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const [members, invitations] = await Promise.all([
      prisma.householdMember.findMany({
        where: { householdId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.invitation.findMany({
        where: {
          householdId,
          status: "PENDING",
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const people = [
      ...members.map((member) => ({
        membershipId: member.id,
        userId: member.user.id,
        name: member.user.name,
        email: member.user.email,
        status: member.role,
      })),
      ...invitations.map((invitation) => ({
        invitationId: invitation.id,
        userId: null,
        name: null,
        email: invitation.email,
        status: "INVITED" as const,
      })),
    ];

    return res.status(200).json({ people });
  } catch (error) {
    return next(error);
  }
});
