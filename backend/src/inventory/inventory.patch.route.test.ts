import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";

const ownerEmail = "inventory.owner.test@example.com";
const outsiderEmail = "inventory.outsider.test@example.com";
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

describe("PATCH /api/inventory/:id", () => {
  beforeAll(() => {
    process.env["JWT_SECRET"] =
      "mealsaver-test-secret-with-more-than-32-characters";
  });

  beforeEach(async () => {
    await cleanupTestData();

    const passwordHash = await bcrypt.hash(password, 12);

    const owner = await prisma.user.create({
      data: {
        name: "Inventory Owner",
        email: ownerEmail,
        passwordHash,
      },
    });

    await prisma.user.create({
      data: {
        name: "Inventory Outsider",
        email: outsiderEmail,
        passwordHash,
      },
    });

    const household = await prisma.household.create({
      data: {
        name: "Inventory Test Household",
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
        name: "Lait",
        quantity: 1,
        unit: "L",
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
      },
    });

    foodItemId = foodItem.id;
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it("retourne 401 sans session", async () => {
    const response = await request(app)
      .patch(`/api/inventory/${foodItemId}`)
      .send({ name: "Lait entier" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Non authentifié");
  });

  it("retourne 400 si l'identifiant est invalide", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent
      .patch("/api/inventory/invalide")
      .send({ name: "Lait entier" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Identifiant d'aliment invalide");
  });

  it("retourne 400 si aucune modification valide n'est fournie", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent
      .patch(`/api/inventory/${foodItemId}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Données invalides");
  });

  it("retourne 403 pour un utilisateur extérieur au foyer", async () => {
    const agent = await loginAs(outsiderEmail);

    const response = await agent
      .patch(`/api/inventory/${foodItemId}`)
      .send({ name: "Modification interdite" });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Accès refusé");
  });

  it("retourne 404 si l'aliment n'existe pas", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent
      .patch(`/api/inventory/${foodItemId + 1_000_000}`)
      .send({ name: "Aliment absent" });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Aliment introuvable");
  });

  it("modifie les champs autorisés d'un aliment du foyer", async () => {
    const agent = await loginAs(ownerEmail);
    const newExpiresAt = "2030-02-15T00:00:00.000Z";

    const response = await agent
      .patch(`/api/inventory/${foodItemId}`)
      .send({
        name: "Lait entier",
        quantity: 2,
        unit: "bouteilles",
        expiresAt: newExpiresAt,
      });

    expect(response.status).toBe(200);
    expect(response.body.item.id).toBe(foodItemId);
    expect(response.body.item.householdId).toBe(householdId);
    expect(response.body.item.name).toBe("Lait entier");
    expect(response.body.item.quantity).toBe(2);
    expect(response.body.item.unit).toBe("bouteilles");

    const savedItem = await prisma.foodItem.findUnique({
      where: {
        id: foodItemId,
      },
    });

    expect(savedItem).not.toBeNull();
    expect(savedItem?.name).toBe("Lait entier");
    expect(savedItem?.quantity).toBe(2);
    expect(savedItem?.unit).toBe("bouteilles");
    expect(savedItem?.expiresAt?.toISOString()).toBe(newExpiresAt);
  });
});