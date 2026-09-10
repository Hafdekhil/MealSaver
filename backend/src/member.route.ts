import { Router } from "express";
import { prisma } from "./lib/prisma.js";
import { sendHouseholdMemberLeftEmail } from "./lib/mailer.js";

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
memberRouter.delete("/:householdId/members/:membershipId", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);
    const householdId = Number(req.params["householdId"]);
    const membershipId = Number(req.params["membershipId"]);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    if (
      !Number.isInteger(householdId) ||
      householdId <= 0 ||
      !Number.isInteger(membershipId) ||
      membershipId <= 0
    ) {
      return res.status(400).json({ error: "Membre invalide" });
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
        error: "Vous n'avez pas la permission de retirer ce membre",
      });
    }

    const targetMembership = await prisma.householdMember.findUnique({
      where: {
        id: membershipId,
      },
      select: {
        householdId: true,
        role: true,
      },
    });

    if (!targetMembership || targetMembership.householdId !== householdId) {
      return res.status(404).json({
        error: "Membre introuvable",
      });
    }

    if (targetMembership.role !== "MEMBER") {
      return res.status(409).json({
        error: "Le propriétaire du foyer ne peut pas être retiré",
      });
    }

    const deletion = await prisma.householdMember.deleteMany({
      where: {
        id: membershipId,
        householdId,
        role: "MEMBER",
      },
    });

    if (deletion.count !== 1) {
      return res.status(409).json({
        error: "Ce membre ne peut plus être retiré",
      });
    }

    return res.status(200).json({
      message: "Membre retiré du foyer",
    });
  } catch (error) {
    return next(error);
  }
});
memberRouter.delete("/:householdId/membership", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);
    const householdId = Number(req.params["householdId"]);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: "Non authentifié" });
    }

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
      select: {
        id: true,
        role: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        household: {
          select: {
            name: true,
            members: {
              where: {
                role: "OWNER",
              },
              select: {
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!membership) {
      return res.status(404).json({
        error: "Vous n'appartenez pas à ce foyer",
      });
    }

    if (membership.role === "OWNER") {
      return res.status(409).json({
        error:
          "Le propriétaire ne peut pas quitter le foyer sans transférer ou supprimer le foyer",
      });
    }

    const deletion = await prisma.householdMember.deleteMany({
      where: {
        id: membership.id,
        householdId,
        userId,
        role: "MEMBER",
      },
    });

    if (deletion.count !== 1) {
      return res.status(409).json({
        error: "Vous ne pouvez plus quitter ce foyer",
      });
    }

    const notificationResults = await Promise.allSettled(
      membership.household.members.map((owner) =>
        sendHouseholdMemberLeftEmail({
          to: owner.user.email,
          householdName: membership.household.name,
          memberName: membership.user.name,
          memberEmail: membership.user.email,
        }),
      ),
    );

    if (notificationResults.some((result) => result.status === "rejected")) {
      console.error(
        "Echec de l'envoi d'une notification de départ d'un membre MealSaver",
      );
    }

    return res.status(200).json({
      message: "Vous avez quitté le foyer",
    });
  } catch (error) {
    return next(error);
  }
});
