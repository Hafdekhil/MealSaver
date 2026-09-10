import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";

const ownerEmail = "smart-fridge.owner.test@example.com";
const outsiderEmail = "smart-fridge.outsider.test@example.com";
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

function validMeasurement() {
  return {
    householdId,
    sourceId: "sim-fridge-01",
    metric: "temperature_c",
    value: 4.2,
    measuredAt: new Date().toISOString(),
  };
}

describe("Smart fridge measurement flow", () => {
  beforeAll(() => {
    process.env["JWT_SECRET"] =
      "mealsaver-test-secret-with-more-than-32-characters";
  });

  beforeEach(async () => {
    await cleanupTestData();

    const passwordHash = await bcrypt.hash(password, 12);

    const owner = await prisma.user.create({
      data: {
        name: "Smart Fridge Owner",
        email: ownerEmail,
        passwordHash,
      },
    });

    const outsider = await prisma.user.create({
      data: {
        name: "Smart Fridge Outsider",
        email: outsiderEmail,
        passwordHash,
      },
    });

    const household = await prisma.household.create({
      data: {
        name: "Smart Fridge Test Household",
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
        name: "Smart Fridge Outsider Household",
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

  it("refuse une mesure sans session", async () => {
    const response = await request(app)
      .post("/api/smart-fridge/measurements")
      .send(validMeasurement());

    expect(response.status).toBe(401);
  });

  it("refuse une mesure pour un foyer auquel l'utilisateur n'appartient pas", async () => {
    const agent = await loginAs(outsiderEmail);

    const response = await agent
      .post("/api/smart-fridge/measurements")
      .send(validMeasurement());

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Accès refusé");
  });

  it("refuse un message dont le format n'est pas valide", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent
      .post("/api/smart-fridge/measurements")
      .send({
        ...validMeasurement(),
        sourceId: "",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Mesure invalide");
  });

  it("rejette une valeur manifestement aberrante sans la persister", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent
      .post("/api/smart-fridge/measurements")
      .send({
        ...validMeasurement(),
        value: 999,
      });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({
      error: "Mesure aberrante",
      code: "OUT_OF_SENSOR_RANGE",
    });

    const count = await prisma.smartFridgeMeasurement.count({
      where: {
        householdId,
      },
    });

    expect(count).toBe(0);
  });

  it("transmet, persiste et restitue une mesure avec sa source et son horodatage", async () => {
    const agent = await loginAs(ownerEmail);
    const measurement = validMeasurement();

    const createResponse = await agent
      .post("/api/smart-fridge/measurements")
      .send(measurement);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.measurement).toMatchObject({
      householdId,
      sourceId: measurement.sourceId,
      metric: measurement.metric,
      value: measurement.value,
    });

    const stored = await prisma.smartFridgeMeasurement.findFirst({
      where: {
        householdId,
        sourceId: measurement.sourceId,
      },
    });

    expect(stored).not.toBeNull();
    expect(stored?.temperatureC).toBe(measurement.value);
    expect(stored?.measuredAt.toISOString()).toBe(measurement.measuredAt);

    const latestResponse = await agent.get(
      `/api/smart-fridge/measurements/latest?householdId=${householdId}`,
    );

    expect(latestResponse.status).toBe(200);
    expect(latestResponse.body.measurement).toMatchObject({
      householdId,
      sourceId: measurement.sourceId,
      metric: measurement.metric,
      value: measurement.value,
    });
    expect(latestResponse.body.measurement.measuredAt).toBe(
      measurement.measuredAt,
    );
  });
});
