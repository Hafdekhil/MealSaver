import express from "express";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../lib/prisma.js";
import { invitationRouter } from "./invitation.route.js";

const ownerEmail = "owner.invitation.test@example.com";
const memberEmail = "member.invitation.test@example.com";
const invitedEmail = "invite.invitation.test@example.com";

let ownerId: number;
let memberId: number;
let invitedUserId: number;
let householdId: number;

function createTestApp(userId?: number) {
  const testApp = express();

  testApp.use(express.json());

  testApp.use((_req, res, next) => {
    if (userId) {
      res.locals["userId"] = userId;
    }

    next();
  });

  testApp.use("/api/households", invitationRouter);

  return testApp;
}

async function cleanupTestData() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: [ownerEmail, memberEmail, invitedEmail],
      },
    },
    select: {
      id: true,
    },
  });

  const userIds = users.map((user) => user.id);

  if (userIds.length > 0) {
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

    const householdIds = [
      ...new Set(memberships.map((membership) => membership.householdId)),
    ];

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
}

describe("Invitations du foyer", () => {
  beforeEach(async () => {
    await cleanupTestData();

    const owner = await prisma.user.create({
      data: {
        name: "Owner Test",
        email: ownerEmail,
        passwordHash: "test-password-hash",
      },
    });

    const member = await prisma.user.create({
      data: {
        name: "Member Test",
        email: memberEmail,
        passwordHash: "test-password-hash",
      },
    });

    const invitedUser = await prisma.user.create({
      data: {
        name: "Invited Test",
        email: invitedEmail,
        passwordHash: "test-password-hash",
      },
    });

    const household = await prisma.household.create({
      data: {
        name: "Foyer Invitation Test",
      },
    });

    await prisma.householdMember.create({
      data: {
        householdId: household.id,
        userId: owner.id,
        role: "OWNER",
      },
    });

    await prisma.householdMember.create({
      data: {
        householdId: household.id,
        userId: member.id,
        role: "MEMBER",
      },
    });

    ownerId = owner.id;
    memberId = member.id;
    invitedUserId = invitedUser.id;
    householdId = household.id;
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it("permet au OWNER de créer une invitation en attente", async () => {
    const response = await request(createTestApp(ownerId))
      .post(`/api/households/${householdId}/invitations`)
      .send({
        email: invitedEmail,
      });

    expect(response.status).toBe(201);
    expect(response.body.invitation.email).toBe(invitedEmail);
    expect(response.body.invitation.status).toBe("PENDING");

    const invitation = await prisma.invitation.findUnique({
      where: {
        householdId_email: {
          householdId,
          email: invitedEmail,
        },
      },
    });

    expect(invitation).not.toBeNull();
    expect(invitation?.status).toBe("PENDING");
    expect(invitation?.invitedByUserId).toBe(ownerId);
  });

  it("refuse une invitation envoyée par un MEMBER", async () => {
    const response = await request(createTestApp(memberId))
      .post(`/api/households/${householdId}/invitations`)
      .send({
        email: invitedEmail,
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe(
      "Vous n'avez pas la permission d'inviter un membre",
    );
  });

  it("refuse une invitation en double", async () => {
    const app = createTestApp(ownerId);

    const firstResponse = await request(app)
      .post(`/api/households/${householdId}/invitations`)
      .send({
        email: invitedEmail,
      });

    expect(firstResponse.status).toBe(201);

    const secondResponse = await request(app)
      .post(`/api/households/${householdId}/invitations`)
      .send({
        email: invitedEmail,
      });

    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.error).toBe(
      "Une invitation existe déjà pour ce courriel",
    );
  });

  it("permet au membre invité de rejoindre le foyer", async () => {
    const invitation = await prisma.invitation.create({
      data: {
        householdId,
        email: invitedEmail,
        invitedByUserId: ownerId,
        status: "PENDING",
      },
    });

    const response = await request(createTestApp(invitedUserId)).post(
      `/api/households/invitations/${invitation.id}/accept`,
    );

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Vous avez rejoint le foyer");

    const membership = await prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId,
          userId: invitedUserId,
        },
      },
    });

    expect(membership).not.toBeNull();
    expect(membership?.role).toBe("MEMBER");

    const updatedInvitation = await prisma.invitation.findUnique({
      where: {
        id: invitation.id,
      },
    });

    expect(updatedInvitation?.status).toBe("ACCEPTED");
  });
});