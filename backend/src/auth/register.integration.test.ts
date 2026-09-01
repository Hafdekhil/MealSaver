import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";

describe("POST /api/auth/register - intégration", () => {
  const email = "integration.mealsaver@example.com";

  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: { email },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email },
    });
    await prisma.$disconnect();
  });

  it("crée un compte valide dans PostgreSQL", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Utilisateur Test",
        email,
        password: "MealSaver1",
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Compte créé avec succès");
    expect(response.body.user.email).toBe(email);
    expect(response.body.user.passwordHash).toBeUndefined();

    const savedUser = await prisma.user.findUnique({
      where: { email },
    });

    expect(savedUser).not.toBeNull();
    expect(savedUser?.passwordHash).not.toBe("MealSaver1");
  });

  it("refuse de créer deux comptes avec le même courriel", async () => {
    const payload = {
      name: "Utilisateur Test",
      email,
      password: "MealSaver1",
    };

    const firstResponse = await request(app)
      .post("/api/auth/register")
      .send(payload);

    const secondResponse = await request(app)
      .post("/api/auth/register")
      .send(payload);

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.error).toBe(
      "Un compte existe déjà avec ce courriel",
    );
  });
});
