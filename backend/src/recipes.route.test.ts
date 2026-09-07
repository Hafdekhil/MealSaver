import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";

const ownerEmail = "recipes.owner.test@example.com";
const outsiderEmail = "recipes.outsider.test@example.com";
const password = "MealSaver1";

let householdId: number;

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

  const householdIds = memberships.map(
    (membership) => membership.householdId,
  );

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
    .send({
      email,
      password,
    });

  expect(response.status).toBe(200);

  return agent;
}

beforeAll(() => {
  process.env["JWT_SECRET"] =
    "mealsaver-test-secret-with-more-than-32-characters";
});

beforeEach(async () => {
  await cleanupTestData();

  const passwordHash = await bcrypt.hash(password, 12);

  const owner = await prisma.user.create({
    data: {
      name: "Recipe Owner",
      email: ownerEmail,
      passwordHash,
    },
  });

  const outsider = await prisma.user.create({
    data: {
      name: "Recipe Outsider",
      email: outsiderEmail,
      passwordHash,
    },
  });

  const household = await prisma.household.create({
    data: {
      name: "Recipe Test Household",
      members: {
        create: {
          userId: owner.id,
          role: "OWNER",
        },
      },
    },
  });

  await prisma.household.create({
    data: {
      name: "Outsider Household",
      members: {
        create: {
          userId: outsider.id,
          role: "OWNER",
        },
      },
    },
  });

  householdId = household.id;

  await prisma.foodItem.createMany({
    data: [
      {
        householdId,
        name: "Tomates",
        quantity: 4,
        unit: "unité",
        storageLocation: "FRIDGE",
        expiresAt: new Date("2026-09-09T00:00:00.000Z"),
        addedBy: owner.id,
      },
      {
        householdId,
        name: "Oeufs",
        quantity: 6,
        unit: "unité",
        storageLocation: "FRIDGE",
        expiresAt: new Date("2026-09-17T00:00:00.000Z"),
        addedBy: owner.id,
      },
      {
        householdId,
        name: "Riz",
        quantity: 1,
        unit: "kg",
        storageLocation: "PANTRY",
        expiresAt: new Date("2026-10-06T00:00:00.000Z"),
        addedBy: owner.id,
      },
    ],
  });
});

afterAll(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

describe("GET /api/recipes", () => {
  it("retourne 401 sans session", async () => {
    const response = await request(app).get(
      `/api/recipes?householdId=${householdId}`,
    );

    expect(response.status).toBe(401);
  });

  it("retourne 403 pour un utilisateur extérieur au foyer", async () => {
    const agent = await loginAs(outsiderEmail);

    const response = await agent.get(
      `/api/recipes?householdId=${householdId}`,
    );

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Accès refusé");
  });

  it("propose une recette à partir de l'inventaire du foyer", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent.get(
      `/api/recipes?householdId=${householdId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.suggestions.length).toBeGreaterThan(0);

    const suggestion = response.body.suggestions[0];

    expect(suggestion.name).toBe(
      "Riz aux tomates et aux œufs",
    );

    expect(suggestion.inventoryIngredients).toEqual(
      expect.arrayContaining([
        "riz",
        "tomates",
        "oeufs",
      ]),
    );
  });

  it("priorise une recette utilisant l'aliment le plus urgent", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent.get(
      `/api/recipes?householdId=${householdId}`,
    );

    expect(response.status).toBe(200);

    const suggestion = response.body.suggestions[0];

    expect(suggestion.ingredients).toContain("tomates");
    expect(suggestion.inventoryIngredients).toContain("tomates");
  });
});