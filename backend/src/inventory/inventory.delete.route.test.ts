import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";

const ownerEmail = "inventory.delete.owner.test@example.com";
const outsiderEmail = "inventory.delete.outsider.test@example.com";
const password = "MealSaver1";

let householdId: number;
let foodItemId: number;

async function cleanupTestData() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: [ownerEmail, outsiderEmail],
      },
    },
    select: {
      id: true,
    },
  });

  const userIds = users.map((user) => user.id);

  if (userIds.length === 0) {
    return;
  }

  const memberships = await prisma.householdMember.findMany({
    where: {
      userId: {
        in: userIds,
      },
    },
    select: {
      householdId: true,
    },
  });

  const householdIds = memberships.map((membership) => membership.householdId);

  if (householdIds.length > 0) {
    await prisma.household.deleteMany({
      where: {
        id: {
          in: householdIds,
        },
      },
    });
  }

  await prisma.user.deleteMany({
    where: {
      id: {
        in: userIds,
      },
    },
  });
}

async function loginAs(email: string) {
  const agent = request.agent(app);

  const response = await agent
    .post("/api/auth/login")
    .send({ email, password });

  expect(response.status).toBe(200);

  return agent;
}

describe("DELETE /api/inventory/:id", () => {
  beforeAll(() => {
    process.env["JWT_SECRET"] =
      "mealsaver-test-secret-with-more-than-32-characters";
  });

  beforeEach(async () => {
    await cleanupTestData();

    const passwordHash = await bcrypt.hash(password, 12);

    const owner = await prisma.user.create({
      data: {
        name: "Inventory Delete Owner",
        email: ownerEmail,
        passwordHash,
      },
    });

    await prisma.user.create({
      data: {
        name: "Inventory Delete Outsider",
        email: outsiderEmail,
        passwordHash,
      },
    });

    const household = await prisma.household.create({
      data: {
        name: "Inventory Delete Test Household",
        members: {
          create: {
            userId: owner.id,
            role: "OWNER",
          },
        },
      },
    });

    householdId = household.id;

    const foodItem = await prisma.foodItem.create({
      data: {
        householdId,
        name: "Yaourt",
        quantity: 4,
        unit: "pots",
        expiresAt: new Date("2030-03-01T00:00:00.000Z"),
      },
    });

    foodItemId = foodItem.id;
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it("retourne 401 sans session", async () => {
    const response = await request(app).delete(`/api/inventory/${foodItemId}`);

    expect(response.status).toBe(401);
  });

  it("retourne 400 si l'identifiant est invalide", async () => {
    const agent = await loginAs(ownerEmail);
    const response = await agent.delete("/api/inventory/invalide");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Identifiant d'aliment invalide");
  });

  it("retourne 403 pour un utilisateur extérieur au foyer", async () => {
    const agent = await loginAs(outsiderEmail);
    const response = await agent.delete(`/api/inventory/${foodItemId}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Accès refusé");
  });

  it("retourne 404 si l'aliment n'existe pas", async () => {
    const agent = await loginAs(ownerEmail);
    const response = await agent.delete(`/api/inventory/${foodItemId + 1_000_000}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Aliment introuvable");
  });

  it("supprime définitivement un aliment du foyer", async () => {
    const agent = await loginAs(ownerEmail);
    const response = await agent.delete(`/api/inventory/${foodItemId}`);

    expect(response.status).toBe(204);
    expect(response.text).toBe("");

    const savedItem = await prisma.foodItem.findUnique({
      where: { id: foodItemId },
    });

    expect(savedItem).toBeNull();
  });
});
