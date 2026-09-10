import { Router } from "express";
import { z } from "zod";
import { prisma } from "./lib/prisma.js";

export const preferencesRouter = Router();

const dietaryPreferencesSchema = z.object({
  preferredIngredients: z
    .array(z.string().trim().min(1).max(80))
    .max(20),
});

const notificationPreferencesSchema = z.object({
  expirationAlertsEnabled: z.boolean(),
});

function normalizePreference(value: string) {
  return value
    .toLowerCase()
    .replace(/œ/g, "oe")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .replace(/\s+/g, " ");
}

function deduplicatePreferences(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const cleanValue = value.trim();
    const normalized = normalizePreference(cleanValue);

    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(cleanValue);
    }
  }

  return result;
}

preferencesRouter.get("/", async (_req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        preferredIngredients: true,
        expirationAlertsEnabled: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Session invalide" });
    }

    return res.status(200).json({
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      preferences: {
        preferredIngredients: user.preferredIngredients,
        expirationAlertsEnabled: user.expirationAlertsEnabled,
      },
    });
  } catch (error) {
    return next(error);
  }
});

preferencesRouter.patch("/dietary", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);
    const parsed = dietaryPreferencesSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: "Préférences invalides" });
    }

    const preferredIngredients = deduplicatePreferences(
      parsed.data.preferredIngredients,
    );

    const user = await prisma.user.update({
      where: { id: userId },
      data: { preferredIngredients },
      select: { preferredIngredients: true },
    });

    return res.status(200).json({
      message: "Préférences alimentaires sauvegardées",
      preferredIngredients: user.preferredIngredients,
    });
  } catch (error) {
    return next(error);
  }
});

preferencesRouter.patch("/notifications", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);
    const parsed = notificationPreferencesSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: "Préférences invalides" });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        expirationAlertsEnabled: parsed.data.expirationAlertsEnabled,
      },
      select: { expirationAlertsEnabled: true },
    });

    return res.status(200).json({
      message: "Préférences de notification sauvegardées",
      expirationAlertsEnabled: user.expirationAlertsEnabled,
    });
  } catch (error) {
    return next(error);
  }
});
