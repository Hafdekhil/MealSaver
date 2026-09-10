import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";

const ownerEmail = "alerts.owner.test@example.com";
const outsiderEmail = "alerts.outsider.test@example.com";
const password = "MealSaver1";

let householdId: number;

function dateFromToday(days: number): Date {
  const now = new Date();

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + days,
    ),
  );
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

describe("GET /api/alerts", () => {
  beforeAll(() => {
    process.env["JWT_SECRET"] =
      "mealsaver-test-secret-with-more-than-32-characters";
  });

  beforeEach(async () => {
    await cleanupTestData();

    const passwordHash = await bcrypt.hash(password, 12);

    const owner = await prisma.user.create({
      data: {
        name: "Alerts Owner",
        email: ownerEmail,
        passwordHash,
      },
    });

    const outsider = await prisma.user.create({
      data: {
        name: "Alerts Outsider",
        email: outsiderEmail,
        passwordHash,
      },
    });

    const household = await prisma.household.create({
      data: {
        name: "Alerts Test Household",
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
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it("retourne 401 sans session", async () => {
    const response = await request(app).get(
      `/api/alerts?householdId=${householdId}`,
    );

    expect(response.status).toBe(401);
  });

  it("retourne 400 si le foyer est invalide", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent.get(
      "/api/alerts?householdId=invalide",
    );

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Foyer invalide");
  });

  it("retourne 403 pour un utilisateur extérieur au foyer", async () => {
    const agent = await loginAs(outsiderEmail);

    const response = await agent.get(
      `/api/alerts?householdId=${householdId}`,
    );

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Accès refusé");
  });

  it("retourne les aliments expirés ou proches de l'expiration", async () => {
    await prisma.foodItem.createMany({
      data: [
        {
          householdId,
          name: "Lait",
          expiresAt: dateFromToday(-1),
          storageLocation: "FRIDGE",
        },
        {
          householdId,
          name: "Yaourt",
          expiresAt: dateFromToday(0),
          storageLocation: "FRIDGE",
        },
        {
          householdId,
          name: "Poulet",
          expiresAt: dateFromToday(2),
          storageLocation: "FRIDGE",
        },
        {
          householdId,
          name: "Riz",
          expiresAt: dateFromToday(4),
          storageLocation: "PANTRY",
        },
        {
          householdId,
          name: "Sel",
          storageLocation: "PANTRY",
        },
      ],
    });

    const agent = await loginAs(ownerEmail);

    const response = await agent.get(
      `/api/alerts?householdId=${householdId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.alerts).toHaveLength(3);

    expect(response.body.alerts[0]).toMatchObject({
      name: "Lait",
      daysRemaining: -1,
      status: "EXPIRED",
      message: "Lait est expiré depuis 1 jour.",
    });

    expect(response.body.alerts[1]).toMatchObject({
      name: "Yaourt",
      daysRemaining: 0,
      status: "TODAY",
      message: "Yaourt expire aujourd'hui.",
    });

    expect(response.body.alerts[2]).toMatchObject({
      name: "Poulet",
      daysRemaining: 2,
      status: "SOON",
      message: "Poulet expire dans 2 jours.",
    });

    expect(
      response.body.alerts.some(
        (alert: { name: string }) => alert.name === "Riz",
      ),
    ).toBe(false);

    expect(
      response.body.alerts.some(
        (alert: { name: string }) => alert.name === "Sel",
      ),
    ).toBe(false);
  });
});