import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";

const email = "preferences.user.test@example.com";
const password = "MealSaver1";
let householdId: number;

async function cleanupTestData() {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) return;

  const memberships = await prisma.householdMember.findMany({
    where: { userId: user.id },
    select: { householdId: true },
  });

  if (memberships.length > 0) {
    await prisma.household.deleteMany({
      where: {
        id: { in: memberships.map((item) => item.householdId) },
      },
    });
  }

  await prisma.user.delete({ where: { id: user.id } });
}

async function login() {
  const agent = request.agent(app);
  const response = await agent.post("/api/auth/login").send({ email, password });
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
  const user = await prisma.user.create({
    data: {
      name: "Preferences User",
      email,
      passwordHash,
    },
  });

  const household = await prisma.household.create({
    data: {
      name: "Preferences Household",
      members: {
        create: { userId: user.id, role: "OWNER" },
      },
    },
  });

  householdId = household.id;
});

afterAll(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

describe("Profil et préférences", () => {
  it("retourne le nom, le courriel et les préférences par défaut", async () => {
    const agent = await login();
    const response = await agent.get("/api/preferences");

    expect(response.status).toBe(200);
    expect(response.body.profile).toMatchObject({
      name: "Preferences User",
      email,
    });
    expect(response.body.preferences).toEqual({
      preferredIngredients: [],
      expirationAlertsEnabled: true,
    });
  });

  it("sauvegarde les préférences alimentaires en supprimant les doublons", async () => {
    const agent = await login();

    const saveResponse = await agent.patch("/api/preferences/dietary").send({
      preferredIngredients: ["Tomates", " tomates ", "Fromage"],
    });

    expect(saveResponse.status).toBe(200);
    expect(saveResponse.body.preferredIngredients).toEqual([
      "Tomates",
      "Fromage",
    ]);

    const reloadResponse = await agent.get("/api/preferences");
    expect(reloadResponse.body.preferences.preferredIngredients).toEqual([
      "Tomates",
      "Fromage",
    ]);
  });

  it("utilise une préférence alimentaire pour départager les recettes lorsque possible", async () => {
    await prisma.foodItem.create({
      data: {
        householdId,
        name: "Tomates",
        storageLocation: "FRIDGE",
      },
    });

    const agent = await login();

    await agent.patch("/api/preferences/dietary").send({
      preferredIngredients: ["fromage"],
    });

    const response = await agent.get(
      `/api/recipes?householdId=${householdId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.suggestions[0].name).toBe("Omelette aux tomates");
    expect(response.body.suggestions[0].preferenceApplied).toBe(true);
  });

  it("désactive réellement les alertes d'expiration après sauvegarde", async () => {
    await prisma.foodItem.create({
      data: {
        householdId,
        name: "Yaourt",
        expiresAt: new Date(),
        storageLocation: "FRIDGE",
      },
    });

    const agent = await login();

    const saveResponse = await agent
      .patch("/api/preferences/notifications")
      .send({ expirationAlertsEnabled: false });

    expect(saveResponse.status).toBe(200);
    expect(saveResponse.body.expirationAlertsEnabled).toBe(false);

    const alertsResponse = await agent.get(
      `/api/alerts?householdId=${householdId}`,
    );

    expect(alertsResponse.status).toBe(200);
    expect(alertsResponse.body.alerts).toEqual([]);
    expect(alertsResponse.body.disabledByPreference).toBe(true);
  });
});
