import { Router } from "express";
import { prisma } from "./lib/prisma.js";

export const alertsRouter = Router();

const ALERT_WINDOW_DAYS = 3;
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

function startOfUtcDay(date: Date): number {
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
}

function calculateDaysRemaining(expiresAt: Date): number {
  const today = startOfUtcDay(new Date());
  const expirationDay = startOfUtcDay(expiresAt);

  return Math.round(
    (expirationDay - today) / MILLISECONDS_PER_DAY,
  );
}

function getAlertStatus(daysRemaining: number) {
  if (daysRemaining < 0) {
    return "EXPIRED" as const;
  }

  if (daysRemaining === 0) {
    return "TODAY" as const;
  }

  return "SOON" as const;
}

function getAlertMessage(name: string, daysRemaining: number): string {
  if (daysRemaining < 0) {
    const daysExpired = Math.abs(daysRemaining);

    return `${name} est expiré depuis ${daysExpired} jour${
      daysExpired > 1 ? "s" : ""
    }.`;
  }

  if (daysRemaining === 0) {
    return `${name} expire aujourd'hui.`;
  }

  if (daysRemaining === 1) {
    return `${name} expire demain.`;
  }

  return `${name} expire dans ${daysRemaining} jours.`;
}

alertsRouter.get("/", async (req, res, next) => {
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

    const membership = await prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId,
          userId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        error: "Accès refusé",
      });
    }

    const items = await prisma.foodItem.findMany({
      where: {
        householdId,
        expiresAt: {
          not: null,
        },
      },
      orderBy: {
        expiresAt: "asc",
      },
    });

    const alerts = items
      .map((item) => {
        const daysRemaining = calculateDaysRemaining(item.expiresAt!);

        return {
          foodItemId: item.id,
          name: item.name,
          expiresAt: item.expiresAt,
          daysRemaining,
          status: getAlertStatus(daysRemaining),
          message: getAlertMessage(item.name, daysRemaining),
        };
      })
      .filter(
        (alert) => alert.daysRemaining <= ALERT_WINDOW_DAYS,
      );

    return res.status(200).json({
      alerts,
    });
  } catch (error) {
    return next(error);
  }
});