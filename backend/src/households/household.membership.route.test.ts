import express from "express";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../lib/prisma.js";
import { householdMembershipRouter } from "./household.membership.route.js";

const testEmail = "household.membership.mealsaver@example.com";

let testUserId: number;

function createTestApp(userId?: number) {
  const testApp = express();

  testApp.use((_req, res, next) => {
    if (userId !== undefined) {
      res.locals["userId"] = userId;
    }
    next();
  });

  testApp.use("/api/households", householdMembershipRouter);

  return testApp;
}

async function cleanupTestData() {
  const user = await prisma.user.findUnique({
    where: { email: testEmail },
    include: { householdMemberships: true },
  });

  if (!user) return;

  const householdIds = user.householdMemberships.map(
    (membership) => membership.householdId,
  );

  await prisma.householdMember.deleteMany({
    where: { userId: user.id },
  });

  if (householdIds.length > 0) {
    await prisma.household.deleteMany({
      where: { id: { in: householdIds } },
    });
  }

  await prisma.user.delete({
    where: { id: user.id },
  });
}

describe("GET /api/households", () => {
  beforeEach(async () => {
    await cleanupTestData();

    const user = await prisma.user.create({
      data: {
        name: "Household Membership Test",
        email: testEmail,
        passwordHash: "test-password-hash",
      },
    });

    testUserId = user.id;

    await prisma.household.create({
      data: {
        name: "Foyer Test",
        members: {
          create: {
            userId: testUserId,
            role: "OWNER",
          },
        },
      },
    });
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it("retourne 401 sans utilisateur authentifié", async () => {
    const response = await request(createTestApp()).get("/api/households");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Non authentifié");
  });

  it("retourne uniquement les foyers auxquels l'utilisateur appartient", async () => {
    const response = await request(createTestApp(testUserId)).get(
      "/api/households",
    );

    expect(response.status).toBe(200);
    expect(response.body.households).toHaveLength(1);
    expect(response.body.households[0].name).toBe("Foyer Test");
    expect(response.body.households[0].role).toBe("OWNER");
    expect(response.body.households[0].members).toBeUndefined();
  });
});
