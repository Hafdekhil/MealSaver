import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";

const ownerEmail = "recipes.owner.test@example.com";
const outsiderEmail = "recipes.outsider.test@example.com";
const password = "MealSaver1";

let householdId: number;

function dateFromToday(days: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

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
        expiresAt: dateFromToday(1),
        addedBy: owner.id,
      },
      {
        householdId,
        name: "Oeufs",
        quantity: 6,
        unit: "unité",
        storageLocation: "FRIDGE",
        expiresAt: dateFromToday(7),
        addedBy: owner.id,
      },
      {
        householdId,
        name: "Riz",
        quantity: 1,
        unit: "kg",
        storageLocation: "PANTRY",
        expiresAt: dateFromToday(25),
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

    expect(suggestion.ingredients).toContain("tomates");
    expect(suggestion.inventoryIngredients).toContain("tomates");
    expect(suggestion.isFallback).toBe(false);
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

  it("priorise l'aliment transmis depuis une alerte", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent.get(
      `/api/recipes?householdId=${householdId}&ingredient=${encodeURIComponent("Riz")}`,
    );

    expect(response.status).toBe(200);

    const suggestion = response.body.suggestions[0];

    expect(suggestion.ingredients).toContain("riz");
    expect(suggestion.priorityIngredient.name).toBe("Riz");
    expect(suggestion.recommendationReason).toContain("Riz");
  });

  it("distingue les ingrédients disponibles et manquants", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent.get(
      `/api/recipes?householdId=${householdId}&ingredient=${encodeURIComponent("Riz")}`,
    );

    expect(response.status).toBe(200);

    const suggestion = response.body.suggestions[0];

    expect(suggestion.availableIngredients).toEqual(
      expect.arrayContaining([
        "riz",
        "tomates",
        "oeufs",
      ]),
    );

    expect(suggestion.missingIngredients).toEqual([
      "oignon",
      "huile d'olive",
    ]);
  });

  it("identifie l'aliment prioritaire et explique la recommandation", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent.get(
      `/api/recipes?householdId=${householdId}`,
    );

    expect(response.status).toBe(200);

    const suggestion = response.body.suggestions[0];

    expect(suggestion.priorityIngredient.name).toBe("Tomates");
    expect(suggestion.priorityIngredient.expiresAt).not.toBeNull();
    expect(suggestion.recommendationReason).toContain("Tomates");
    expect(suggestion.isFallback).toBe(false);
  });

  it("n'attribue pas à une recette un aliment urgent qu'elle n'utilise pas", async () => {
    const ownerMembership = await prisma.householdMember.findFirstOrThrow({
      where: {
        householdId,
        role: "OWNER",
      },
    });

    await prisma.foodItem.deleteMany({
      where: {
        householdId,
      },
    });

    await prisma.foodItem.createMany({
      data: [
        {
          householdId,
          name: "Courgette",
          quantity: 2,
          unit: "unité",
          storageLocation: "FRIDGE",
          expiresAt: dateFromToday(-1),
          addedBy: ownerMembership.userId,
        },
        {
          householdId,
          name: "Oeufs",
          quantity: 6,
          unit: "unité",
          storageLocation: "FRIDGE",
          expiresAt: dateFromToday(7),
          addedBy: ownerMembership.userId,
        },
        {
          householdId,
          name: "Riz",
          quantity: 1,
          unit: "kg",
          storageLocation: "PANTRY",
          expiresAt: dateFromToday(25),
          addedBy: ownerMembership.userId,
        },
      ],
    });

    const agent = await loginAs(ownerEmail);

    const response = await agent.get(
      `/api/recipes?householdId=${householdId}`,
    );

    expect(response.status).toBe(200);

    const suggestion = response.body.suggestions[0];

    expect(suggestion.isFallback).toBe(false);
    expect(suggestion.ingredients).not.toContain("courgette");
    expect(suggestion.priorityIngredient.name).toBe("Oeufs");
    expect(suggestion.recommendationReason).toContain("Oeufs");
    expect(suggestion.recommendationReason).not.toContain("Courgette");
  });

  it("retourne aucune fausse recette lorsqu'aucune recette réelle ne correspond", async () => {
    const ownerMembership = await prisma.householdMember.findFirstOrThrow({
      where: {
        householdId,
        role: "OWNER",
      },
    });

    await prisma.foodItem.deleteMany({
      where: {
        householdId,
      },
    });

    await prisma.foodItem.create({
      data: {
        householdId,
        name: "Mangue",
        quantity: 2,
        unit: "unité",
        storageLocation: "FRIDGE",
        expiresAt: dateFromToday(5),
        addedBy: ownerMembership.userId,
      },
    });

    const agent = await loginAs(ownerEmail);

    const response = await agent.get(
      `/api/recipes?householdId=${householdId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.suggestions).toEqual([]);
  });
});
