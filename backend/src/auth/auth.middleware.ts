import type { RequestHandler } from "express";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "./session.js";

export const requireAuth: RequestHandler = (req, res, next) => {
  const rawToken = req.cookies?.[SESSION_COOKIE_NAME] as unknown;

  if (typeof rawToken !== "string" || rawToken.length === 0) {
    res.status(401).json({
      error: "Non authentifié",
    });
    return;
  }

  const userId = verifySessionToken(rawToken);

  if (!userId) {
    res.status(401).json({
      error: "Session invalide ou expirée",
    });
    return;
  }

  res.locals["userId"] = userId;
  next();
};
