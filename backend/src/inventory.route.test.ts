import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";

const ownerEmail = "inventory.add.owner.test@example.com";
const outsiderEmail = "inventory.add.outsider.test@example.com";
const password = "MealSaver1";

let householdId: number;

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

describe("POST /api/inventory", () => {
  beforeAll(() => {
    process.env["JWT_SECRET"] =
      "mealsaver-test-secret-with-more-than-32-characters";
  });

  beforeEach(async () => {
    await cleanupTestData();

    const passwordHash = await bcrypt.hash(password, 12);

    const owner = await prisma.user.create({
      data: {
        name: "Inventory Add Owner",
        email: ownerEmail,
        passwordHash,
      },
    });

    await prisma.user.create({
      data: {
        name: "Inventory Add Outsider",
        email: outsiderEmail,
        passwordHash,
      },
    });

    const household = await prisma.household.create({
      data: {
        name: "Inventory Add Test Household",
        members: {
          create: {
            userId: owner.id,
            role: "OWNER",
          },
        },
      },
    });

    householdId = household.id;
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

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

    const savedItem = await prisma.foodItem.findUnique({
      where: { id: response.body.item.id },
    });

    expect(savedItem).not.toBeNull();
    expect(savedItem?.householdId).toBe(householdId);
    expect(savedItem?.name).toBe("Poulet");
    expect(savedItem?.quantity).toBe(2);
    expect(savedItem?.unit).toBe("paquets");
    expect(savedItem?.storageLocation).toBe("FREEZER");
    expect(savedItem?.expiresAt?.toISOString()).toBe(expiresAt);
  });
});