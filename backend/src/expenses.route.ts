import { Router } from "express";
import { z } from "zod";
import { prisma } from "./lib/prisma.js";

export const expensesRouter = Router();

const expenseInputSchema = z.object({
  householdId: z.number().int().positive(),
  paidByUserId: z.number().int().positive(),
  amount: z.number().finite().positive().max(1000000),
  description: z.string().trim().max(240).optional(),
});

const expenseInclude = {
  paidByUser: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

async function isHouseholdMember(userId: number, householdId: number) {
  const membership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId,
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  return membership !== null;
}

/*
 * GET /api/expenses?householdId=1
 *
 * Retourne l'historique des dépenses du foyer.
 */
expensesRouter.get("/", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);
    const householdId = Number(req.query["householdId"]);

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

    if (!(await isHouseholdMember(userId, householdId))) {
      return res.status(403).json({
        error: "Vous devez appartenir à ce foyer pour consulter ses dépenses",
      });
    }

    const expenses = await prisma.expense.findMany({
      where: {
        householdId,
      },
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],
      include: expenseInclude,
    });

    return res.status(200).json({
      expenses,
    });
  } catch (error) {
    return next(error);
  }
});

/*
 * POST /api/expenses
 *
 * Ajoute une nouvelle dépense au foyer.
 */
expensesRouter.post("/", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        error: "Non authentifié",
      });
    }

    const parsed = expenseInputSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error:
          "Données invalides. Le foyer, le membre payeur et un montant supérieur à 0 sont obligatoires.",
      });
    }

    const { householdId, paidByUserId, amount, description } = parsed.data;

    /*
     * L'utilisateur qui fait la requête doit lui-même
     * appartenir au foyer.
     */
    if (!(await isHouseholdMember(userId, householdId))) {
      return res.status(403).json({
        error: "Vous devez appartenir à ce foyer pour ajouter une dépense",
      });
    }

    /*
     * Le membre indiqué comme payeur doit également
     * appartenir au même foyer.
     */
    if (!(await isHouseholdMember(paidByUserId, householdId))) {
      return res.status(400).json({
        error: "Le membre payeur doit appartenir au foyer",
      });
    }

    const cleanDescription = description?.trim();

    const expense = await prisma.expense.create({
      data: {
        householdId,
        paidByUserId,
        amount,
        description:
          cleanDescription && cleanDescription.length > 0
            ? cleanDescription
            : null,
      },
      include: expenseInclude,
    });

    return res.status(201).json({
      message: "Dépense ajoutée avec succès",
      expense,
    });
  } catch (error) {
    return next(error);
  }
});