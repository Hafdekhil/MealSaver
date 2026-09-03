import type { CookieOptions } from "express";
import jwt from "jsonwebtoken";

export const SESSION_COOKIE_NAME = "mealsaver_session";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function getJwtSecret() {
  const secret = process.env["JWT_SECRET"];

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET doit contenir au moins 32 caractères");
  }

  return secret;
}

export function createSessionToken(userId: number) {
  return jwt.sign({}, getJwtSecret(), {
    subject: String(userId),
    expiresIn: "7d",
    issuer: "mealsaver",
    audience: "mealsaver-web",
  });
}

export function verifySessionToken(token: string) {
  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      issuer: "mealsaver",
      audience: "mealsaver-web",
    });

    if (typeof payload === "string") {
      return null;
    }

    const userId = Number(payload.sub);

    if (!Number.isInteger(userId) || userId <= 0) {
      return null;
    }

    return userId;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    maxAge: SESSION_DURATION_MS,
    path: "/",
  };
}

export function getClearSessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
  };
}
