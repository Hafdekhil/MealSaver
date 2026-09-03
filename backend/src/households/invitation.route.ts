import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { createInvitationSchema } from "./invitation.schema.js";

export const invitationRouter = Router();

/**
 * POST /api/households/:householdId/invitations
 * Le OWNER du foyer invite une personne par courriel.
 */
invitationRouter.post("/:householdId/invitations", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);
    const householdId = Number(req.params["householdId"]);

    if (!userId) {
      return res.status(401).json({
        error: "Non authentifié",
      });
    }

    if (!householdId) {
      return res.status(400).json({
        error: "Foyer invalide",
      });
    }

    const parsed = createInvitationSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Données invalides",
      });
    }

    // Vérifier que la personne qui invite est OWNER du foyer.
    const ownerMembership = await prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId,
          userId,
        },
      },
    });

    if (!ownerMembership || ownerMembership.role !== "OWNER") {
      return res.status(403).json({
        error: "Vous n'avez pas la permission d'inviter un membre",
      });
    }

    const email = parsed.data.email;

    // Vérifier si cette personne est déjà membre du foyer.
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      const existingMembership = await prisma.householdMember.findUnique({
        where: {
          householdId_userId: {
            householdId,
            userId: existingUser.id,
          },
        },
      });

      if (existingMembership) {
        return res.status(409).json({
          error: "Cet utilisateur appartient déjà au foyer",
        });
      }
    }

    // Empêcher une invitation en double.
    const existingInvitation = await prisma.invitation.findUnique({
      where: {
        householdId_email: {
          householdId,
          email,
        },
      },
    });

    if (existingInvitation) {
      return res.status(409).json({
        error: "Une invitation existe déjà pour ce courriel",
      });
    }

    const invitation = await prisma.invitation.create({
      data: {
        householdId,
        email,
        invitedByUserId: userId,
        status: "PENDING",
      },
    });

    return res.status(201).json({
      invitation,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/households/invitations/:invitationId/accept
 * La personne invitée rejoint le foyer.
 */
invitationRouter.post(
  "/invitations/:invitationId/accept",
  async (req, res, next) => {
    try {
      const userId = Number(res.locals["userId"]);
      const invitationId = Number(req.params["invitationId"]);

      if (!userId) {
        return res.status(401).json({
          error: "Non authentifié",
        });
      }

      if (!invitationId) {
        return res.status(400).json({
          error: "Invitation invalide",
        });
      }

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        return res.status(404).json({
          error: "Utilisateur introuvable",
        });
      }

      const invitation = await prisma.invitation.findUnique({
        where: {
          id: invitationId,
        },
      });

      if (!invitation) {
        return res.status(404).json({
          error: "Invitation introuvable",
        });
      }

      if (invitation.status !== "PENDING") {
        return res.status(409).json({
          error: "Cette invitation n'est plus en attente",
        });
      }

      if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
        return res.status(403).json({
          error: "Cette invitation ne vous appartient pas",
        });
      }

      await prisma.$transaction(async (tx) => {
        await tx.householdMember.create({
          data: {
            householdId: invitation.householdId,
            userId,
            role: "MEMBER",
          },
        });

        await tx.invitation.update({
          where: {
            id: invitation.id,
          },
          data: {
            status: "ACCEPTED",
          },
        });
      });

      return res.status(200).json({
        message: "Vous avez rejoint le foyer",
      });
    } catch (error) {
      return next(error);
    }
  },
);