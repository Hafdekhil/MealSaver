import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";
import { sendHouseholdMemberLeftEmail } from "./lib/mailer.js";

vi.mock("./lib/mailer.js", () => ({
  sendHouseholdInvitationEmail: vi.fn(),
  sendHouseholdMemberLeftEmail: vi.fn(),
}));

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

describe("Membres du foyer", () => {
  beforeAll(() => {
    process.env["JWT_SECRET"] =
      "mealsaver-test-secret-with-more-than-32-characters";
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(sendHouseholdMemberLeftEmail).mockResolvedValue(undefined);
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

  it("permet au OWNER de retirer un MEMBER du foyer sans supprimer son compte", async () => {
    const memberMembership = await prisma.householdMember.findFirst({
      where: {
        householdId,
        user: {
          email: memberEmail,
        },
      },
    });

    expect(memberMembership).not.toBeNull();

    const agent = await loginAs(ownerEmail);

    const response = await agent.delete(
      `/api/households/${householdId}/members/${memberMembership!.id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Membre retiré du foyer");

    const deletedMembership = await prisma.householdMember.findUnique({
      where: {
        id: memberMembership!.id,
      },
    });

    expect(deletedMembership).toBeNull();

    const existingUser = await prisma.user.findUnique({
      where: {
        email: memberEmail,
      },
    });

    expect(existingUser).not.toBeNull();
  });

  it("refuse à un MEMBER de retirer un membre du foyer", async () => {
    const memberMembership = await prisma.householdMember.findFirst({
      where: {
        householdId,
        user: {
          email: memberEmail,
        },
      },
    });

    expect(memberMembership).not.toBeNull();

    const agent = await loginAs(memberEmail);

    const response = await agent.delete(
      `/api/households/${householdId}/members/${memberMembership!.id}`,
    );

    expect(response.status).toBe(403);

    const existingMembership = await prisma.householdMember.findUnique({
      where: {
        id: memberMembership!.id,
      },
    });

    expect(existingMembership).not.toBeNull();
  });

  it("refuse au OWNER de retirer le propriétaire du foyer", async () => {
    const ownerMembership = await prisma.householdMember.findFirst({
      where: {
        householdId,
        user: {
          email: ownerEmail,
        },
      },
    });

    expect(ownerMembership).not.toBeNull();

    const agent = await loginAs(ownerEmail);

    const response = await agent.delete(
      `/api/households/${householdId}/members/${ownerMembership!.id}`,
    );

    expect(response.status).toBe(409);

    const existingMembership = await prisma.householdMember.findUnique({
      where: {
        id: ownerMembership!.id,
      },
    });

    expect(existingMembership?.role).toBe("OWNER");
  });

  it("permet à un MEMBER de quitter lui-même le foyer sans supprimer son compte", async () => {
    const memberMembership = await prisma.householdMember.findFirst({
      where: {
        householdId,
        user: {
          email: memberEmail,
        },
      },
    });

    expect(memberMembership).not.toBeNull();

    const agent = await loginAs(memberEmail);

    const response = await agent.delete(
      `/api/households/${householdId}/membership`,
    );

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Vous avez quitté le foyer");

    const deletedMembership = await prisma.householdMember.findUnique({
      where: {
        id: memberMembership!.id,
      },
    });

    expect(deletedMembership).toBeNull();

    const existingUser = await prisma.user.findUnique({
      where: {
        email: memberEmail,
      },
    });

    expect(existingUser).not.toBeNull();

    const existingHousehold = await prisma.household.findUnique({
      where: {
        id: householdId,
      },
    });

    expect(existingHousehold).not.toBeNull();

    expect(sendHouseholdMemberLeftEmail).toHaveBeenCalledTimes(1);
    expect(sendHouseholdMemberLeftEmail).toHaveBeenCalledWith({
      to: ownerEmail,
      householdName: "Members Test Household",
      memberName: "Household Member",
      memberEmail,
    });
  });

  it("interdit au OWNER de quitter le foyer avec l'action membre", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent.delete(
      `/api/households/${householdId}/membership`,
    );

    expect(response.status).toBe(409);
    expect(response.body.error).toBe(
      "Le propriétaire ne peut pas quitter le foyer sans transférer ou supprimer le foyer",
    );

    const ownerMembership = await prisma.householdMember.findFirst({
      where: {
        householdId,
        user: {
          email: ownerEmail,
        },
      },
    });

    expect(ownerMembership?.role).toBe("OWNER");
  });});
