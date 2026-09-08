import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";

const ownerEmail = "members.owner.test@example.com";
const memberEmail = "members.member.test@example.com";
const outsiderEmail = "members.outsider.test@example.com";
const invitedEmail = "members.invited.test@example.com";
const acceptedEmail = "members.accepted.test@example.com";
const password = "MealSaver1";

let householdId: number;

async function cleanupTestData() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: [ownerEmail, memberEmail, outsiderEmail],
      },
    },
    select: { id: true },
  });

  const userIds = users.map((user) => user.id);

  if (userIds.length > 0) {
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
}

async function loginAs(email: string) {
  const agent = request.agent(app);

  const response = await agent
    .post("/api/auth/login")
    .send({ email, password });

  expect(response.status).toBe(200);

  return agent;
}

describe("GET /api/households/:householdId/members", () => {
  beforeAll(() => {
    process.env["JWT_SECRET"] =
      "mealsaver-test-secret-with-more-than-32-characters";
  });

  beforeEach(async () => {
    await cleanupTestData();

    const passwordHash = await bcrypt.hash(password, 12);

    const owner = await prisma.user.create({
      data: {
        name: "Household Owner",
        email: ownerEmail,
        passwordHash,
      },
    });

    const member = await prisma.user.create({
      data: {
        name: "Household Member",
        email: memberEmail,
        passwordHash,
      },
    });

    await prisma.user.create({
      data: {
        name: "Household Outsider",
        email: outsiderEmail,
        passwordHash,
      },
    });

    const household = await prisma.household.create({
      data: {
        name: "Members Test Household",
        members: {
          create: [
            {
              userId: owner.id,
              role: "OWNER",
            },
            {
              userId: member.id,
              role: "MEMBER",
            },
          ],
        },
      },
    });

    householdId = household.id;

    await prisma.invitation.createMany({
      data: [
        {
          householdId,
          email: invitedEmail,
          invitedByUserId: owner.id,
          status: "PENDING",
        },
        {
          householdId,
          email: acceptedEmail,
          invitedByUserId: owner.id,
          status: "ACCEPTED",
        },
      ],
    });
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it("retourne 401 sans session", async () => {
    const response = await request(app)
      .get(`/api/households/${householdId}/members`);

    expect(response.status).toBe(401);
  });

  it("retourne 400 si le foyer est invalide", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent
      .get("/api/households/invalide/members");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Foyer invalide");
  });

  it("retourne 403 pour un utilisateur extérieur au foyer", async () => {
    const agent = await loginAs(outsiderEmail);

    const response = await agent
      .get(`/api/households/${householdId}/members`);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Accès refusé");
  });

  it("retourne OWNER, MEMBER et INVITED sans données sensibles", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent
      .get(`/api/households/${householdId}/members`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.people)).toBe(true);
    expect(response.body.people).toHaveLength(3);

    expect(response.body.people).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Household Owner",
          email: ownerEmail,
          status: "OWNER",
        }),
        expect.objectContaining({
          name: "Household Member",
          email: memberEmail,
          status: "MEMBER",
        }),
        expect.objectContaining({
          name: null,
          email: invitedEmail,
          status: "INVITED",
        }),
      ]),
    );

    expect(
      response.body.people.some(
        (person: { email: string }) => person.email === acceptedEmail,
      ),
    ).toBe(false);

    expect(JSON.stringify(response.body)).not.toContain("passwordHash");
  });
});