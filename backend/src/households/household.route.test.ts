import express from "express";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../lib/prisma.js";
import { householdRouter } from "./household.route.js";

const testEmail = "kevin.household.test@example.com";

let testUserId: number;

function createTestApp(userId?: number) {
  const testApp = express();

  testApp.use(express.json());

  testApp.use((_req, res, next) => {
    if (userId !== undefined) {
      res.locals["userId"] = userId;
    }

    next();
  });

  testApp.use("/api/households", householdRouter);

  return testApp;
}

async function cleanupTestData() {
  const user = await prisma.user.findUnique({
    where: {
      email: testEmail,
    },
    include: {
      householdMemberships: true,
    },
  });

  if (!user) {
    return;
  }

  const householdIds = user.householdMemberships.map(
    (membership) => membership.householdId,
  );

  await prisma.householdMember.deleteMany({
    where: {
      userId: user.id,
    },
  });

  if (householdIds.length > 0) {
    await prisma.household.deleteMany({
      where: {
        id: {
          in: householdIds,
        },
      },
    });
  }

  await prisma.user.delete({
    where: {
      id: user.id,
    },
  });
}

describe("POST /api/households", () => {
  beforeEach(async () => {
    await cleanupTestData();

    const user = await prisma.user.create({
      data: {
        name: "Kevin Test",
        email: testEmail,
        passwordHash: "test-password-hash",
      },
    });

    testUserId = user.id;
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it("retourne 401 si l'utilisateur n'est pas authentifié", async () => {
    const response = await request(createTestApp())
      .post("/api/households")
      .send({
        name: "Famille Mai",
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Non authentifié");
  });

  it("retourne 401 si l'identifiant utilisateur est invalide", async () => {
    const response = await request(createTestApp(0))
      .post("/api/households")
      .send({
        name: "Famille Mai",
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Non authentifié");
  });

  it("retourne 401 si l'utilisateur authentifié n'existe plus", async () => {
    const missingUserId = testUserId + 1_000_000;

    const response = await request(createTestApp(missingUserId))
      .post("/api/households")
      .send({
        name: "Famille Mai",
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Non authentifié");
  });

  it("retourne 400 si le nom du foyer est invalide", async () => {
    const response = await request(createTestApp(testUserId))
      .post("/api/households")
      .send({
        name: "A",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Données invalides");
  });

  it("crée un foyer valide", async () => {
    const response = await request(createTestApp(testUserId))
      .post("/api/households")
      .send({
        name: "Famille Mai",
      });

    expect(response.status).toBe(201);
    expect(response.body.household.name).toBe("Famille Mai");

    const savedHousehold = await prisma.household.findUnique({
      where: {
        id: response.body.household.id,
      },
    });

    expect(savedHousehold).not.toBeNull();
    expect(savedHousehold?.name).toBe("Famille Mai");
  });

  it("ajoute le créateur du foyer comme OWNER", async () => {
    const response = await request(createTestApp(testUserId))
      .post("/api/households")
      .send({
        name: "Famille Mai",
      });

    expect(response.status).toBe(201);

    const membership = await prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId: response.body.household.id,
          userId: testUserId,
        },
      },
    });

    expect(membership).not.toBeNull();
    expect(membership?.role).toBe("OWNER");
  });
});
