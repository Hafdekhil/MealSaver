import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";

const ownerEmail = "inventory.add.owner.test@example.com";
const outsiderEmail = "inventory.add.outsider.test@example.com";
const password = "MealSaver1";

let ownerId: number;
let householdId: number;
let outsiderHouseholdId: number;

async function cleanupTestData() {
  const users = await prisma.user.findMany({
    where: { email: { in: [ownerEmail, outsiderEmail] } },
    select: { id: true },
  });

  const userIds = users.map((user) => user.id);

  if (userIds.length === 0) return;

  const memberships = await prisma.householdMember.findMany({
    where: { userId: { in: userIds } },
    select: { householdId: true },
  });

  const householdIds = memberships.map((membership) => membership.householdId);

  if (householdIds.length > 0) {
    await prisma.household.deleteMany({
      where: { id: { in: householdIds } },
    });
  }

  await prisma.user.deleteMany({
    where: { id: { in: userIds } },
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

  ownerId = owner.id;

  const outsider = await prisma.user.create({
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

  const outsiderHousehold = await prisma.household.create({
    data: {
      name: "Other Household",
      members: {
        create: {
          userId: outsider.id,
          role: "OWNER",
        },
      },
    },
  });

  householdId = household.id;
  outsiderHouseholdId = outsiderHousehold.id;
});

afterAll(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

describe("POST /api/inventory", () => {
  it("retourne 401 sans session", async () => {
    const response = await request(app)
      .post("/api/inventory")
      .send({
        householdId,
        name: "Lait",
        storageLocation: "FRIDGE",
      });

    expect(response.status).toBe(401);
  });

  it("retourne 400 si les données sont invalides", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent
      .post("/api/inventory")
      .send({
        householdId,
        name: "Lait",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Données invalides");
  });

  it("retourne 403 pour un utilisateur extérieur au foyer", async () => {
    const agent = await loginAs(outsiderEmail);

    const response = await agent
      .post("/api/inventory")
      .send({
        householdId,
        name: "Pommes",
        quantity: 4,
        unit: "unités",
        storageLocation: "PANTRY",
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Accès refusé");
  });

  it("crée et persiste un aliment du foyer", async () => {
    const agent = await loginAs(ownerEmail);
    const expiresAt = "2030-04-15T00:00:00.000Z";

    const response = await agent
      .post("/api/inventory")
      .send({
        householdId,
        name: "Poulet",
        quantity: 2,
        unit: "paquets",
        expiresAt,
        storageLocation: "FREEZER",
      });

    expect(response.status).toBe(201);
    expect(response.body.item.householdId).toBe(householdId);
    expect(response.body.item.name).toBe("Poulet");
    expect(response.body.item.storageLocation).toBe("FREEZER");
    expect(response.body.item.addedBy).toBe(ownerId);

    const savedItem = await prisma.foodItem.findUnique({
      where: { id: response.body.item.id },
    });

    expect(savedItem).not.toBeNull();
    expect(savedItem?.householdId).toBe(householdId);
    expect(savedItem?.name).toBe("Poulet");
    expect(savedItem?.quantity).toBe(2);
    expect(savedItem?.unit).toBe("paquets");
    expect(savedItem?.addedBy).toBe(ownerId);
    expect(savedItem?.storageLocation).toBe("FREEZER");
    expect(savedItem?.expiresAt?.toISOString()).toBe(expiresAt);
  });
});

describe("GET /api/inventory", () => {
  it("retourne 401 sans session", async () => {
    const response = await request(app)
      .get(`/api/inventory?householdId=${householdId}`);

    expect(response.status).toBe(401);
  });

  it("retourne 400 si le foyer est invalide", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent
      .get("/api/inventory?householdId=invalide");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Foyer invalide");
  });

  it("retourne 403 pour un utilisateur extérieur au foyer", async () => {
    const agent = await loginAs(outsiderEmail);

    const response = await agent
      .get(`/api/inventory?householdId=${householdId}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Accès refusé");
  });

  it("retourne uniquement les aliments du foyer demandé", async () => {
    await prisma.foodItem.createMany({
      data: [
        {
          householdId,
          name: "Lait",
          quantity: 1,
          unit: "L",
          storageLocation: "FRIDGE",
        },
        {
          householdId,
          name: "Riz",
          quantity: 2,
          unit: "kg",
          storageLocation: "PANTRY",
        },
        {
          householdId: outsiderHouseholdId,
          name: "Aliment extérieur",
          storageLocation: "FREEZER",
        },
      ],
    });

    const agent = await loginAs(ownerEmail);

    const response = await agent
      .get(`/api/inventory?householdId=${householdId}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);

    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Lait",
          storageLocation: "FRIDGE",
        }),
        expect.objectContaining({
          name: "Riz",
          storageLocation: "PANTRY",
        }),
      ]),
    );

    expect(
      response.body.items.some(
        (item: { name: string }) => item.name === "Aliment extérieur",
      ),
    ).toBe(false);
  });
});