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

describe("Foyers", () => {
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

  it("permet au OWNER de supprimer son foyer sans supprimer son compte", async () => {
    const createResponse = await request(createTestApp(testUserId))
      .post("/api/households")
      .send({
        name: "Foyer à supprimer",
      });

    expect(createResponse.status).toBe(201);

    const householdId = createResponse.body.household.id as number;

    await prisma.invitation.create({
      data: {
        householdId,
        email: "invitation.delete.test@example.com",
        invitedByUserId: testUserId,
        status: "PENDING",
      },
    });

    await prisma.foodItem.create({
      data: {
        householdId,
        name: "Aliment test suppression",
        addedBy: testUserId,
      },
    });

    const response = await request(createTestApp(testUserId)).delete(
      `/api/households/${householdId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Foyer supprimé");

    const deletedHousehold = await prisma.household.findUnique({
      where: {
        id: householdId,
      },
    });

    expect(deletedHousehold).toBeNull();

    const memberships = await prisma.householdMember.count({
      where: {
        householdId,
      },
    });

    const invitations = await prisma.invitation.count({
      where: {
        householdId,
      },
    });

    const foodItems = await prisma.foodItem.count({
      where: {
        householdId,
      },
    });

    expect(memberships).toBe(0);
    expect(invitations).toBe(0);
    expect(foodItems).toBe(0);

    const existingUser = await prisma.user.findUnique({
      where: {
        id: testUserId,
      },
    });

    expect(existingUser).not.toBeNull();
  });

  it("refuse à un MEMBER de supprimer le foyer", async () => {
    const household = await prisma.household.create({
      data: {
        name: "Foyer membre sans suppression",
        members: {
          create: {
            userId: testUserId,
            role: "MEMBER",
          },
        },
      },
    });

    const response = await request(createTestApp(testUserId)).delete(
      `/api/households/${household.id}`,
    );

    expect(response.status).toBe(403);

    const existingHousehold = await prisma.household.findUnique({
      where: {
        id: household.id,
      },
    });

    expect(existingHousehold).not.toBeNull();
  });

  it("retourne 400 pour un identifiant de foyer invalide à la suppression", async () => {
    const response = await request(createTestApp(testUserId)).delete(
      "/api/households/invalide",
    );

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Foyer invalide");
  });});
