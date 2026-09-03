import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import type { LoginInput } from "./login.schema.js";

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Courriel ou mot de passe invalide");
    this.name = "InvalidCredentialsError";
  }
}

export async function authenticateUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
  });

  if (!user) {
    throw new InvalidCredentialsError();
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new InvalidCredentialsError();
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}
