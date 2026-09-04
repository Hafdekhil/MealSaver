import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "./auth.middleware.js";
import { loginSchema } from "./login.schema.js";
import {
  authenticateUser,
  InvalidCredentialsError,
} from "./login.service.js";
import {
  createSessionToken,
  getClearSessionCookieOptions,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "./session.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Données de connexion invalides",
      details: parsed.error.issues.map((issue) => issue.message),
    });
  }

  try {
    const user = await authenticateUser(parsed.data);
    const token = createSessionToken(user.id);

    res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions());

    return res.status(200).json({
      message: "Connexion réussie",
      user,
    });
  } catch (error: unknown) {
    if (error instanceof InvalidCredentialsError) {
      return res.status(401).json({
        error: error.message,
      });
    }

    return next(error);
  }
});

authRouter.get("/status", async (req, res, next) => {
  try {
    const rawToken = req.cookies?.[SESSION_COOKIE_NAME] as unknown;

    if (typeof rawToken !== "string" || rawToken.length === 0) {
      return res.status(200).json({
        authenticated: false,
        user: null,
      });
    }

    const userId = verifySessionToken(rawToken);

    if (!userId) {
      res.clearCookie(SESSION_COOKIE_NAME, getClearSessionCookieOptions());

      return res.status(200).json({
        authenticated: false,
        user: null,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.clearCookie(SESSION_COOKIE_NAME, getClearSessionCookieOptions());

      return res.status(200).json({
        authenticated: false,
        user: null,
      });
    }

    return res.status(200).json({
      authenticated: true,
      user,
    });
  } catch (error: unknown) {
    return next(error);
  }
});
authRouter.get("/session", requireAuth, async (_req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.clearCookie(SESSION_COOKIE_NAME, getClearSessionCookieOptions());
      return res.status(401).json({
        error: "Session invalide",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error: unknown) {
    return next(error);
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME, getClearSessionCookieOptions());

  return res.status(200).json({
    message: "Déconnexion réussie",
  });
});
