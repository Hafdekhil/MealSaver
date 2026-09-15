import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";

const ownerEmail = "expenses.owner.test@example.com";
const memberEmail = "expenses.member.test@example.com";
const outsiderEmail = "expenses.outsider.test@example.com";
const password = "MealSaver1";

let householdId: number;
let ownerUserId: number;
let memberUserId: number;
let outsiderUserId: number;

async function cleanupTestData() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: [ownerEmail, memberEmail, outsiderEmail],
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

beforeAll(() => {
  process.env["JWT_SECRET"] =
    "mealsaver-test-secret-with-more-than-32-characters";
});

beforeEach(async () => {
  await cleanupTestData();

  const passwordHash = await bcrypt.hash(password, 12);

  const [owner, member, outsider] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Expenses Owner",
        email: ownerEmail,
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        name: "Expenses Member",
        email: memberEmail,
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        name: "Expenses Outsider",
        email: outsiderEmail,
        passwordHash,
      },
    }),
  ]);

  ownerUserId = owner.id;
  memberUserId = member.id;
  outsiderUserId = outsider.id;

  const household = await prisma.household.create({
    data: {
      name: "Expenses Household",
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

  await prisma.household.create({
    data: {
      name: "Expenses Outsider Household",
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

describe("Dépenses du foyer", () => {
  it("retourne 401 sans session", async () => {
    const response = await request(app).get(
      `/api/expenses?householdId=${householdId}`,
    );

    expect(response.status).toBe(401);
  });

  it("ajoute une dépense valide et la persiste en base de données", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent.post("/api/expenses").send({
      householdId,
      paidByUserId: ownerUserId,
      amount: 42.5,
      description: "Épicerie",
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Dépense ajoutée avec succès");

    expect(response.body.expense).toMatchObject({
      householdId,
      paidByUserId: ownerUserId,
      description: "Épicerie",
    });

    expect(Number(response.body.expense.amount)).toBe(42.5);

    expect(response.body.expense.paidByUser).toEqual({
      id: ownerUserId,
      name: "Expenses Owner",
    });

    const savedExpense = await prisma.expense.findUnique({
      where: {
        id: response.body.expense.id,
      },
    });

    expect(savedExpense).not.toBeNull();
    expect(savedExpense?.householdId).toBe(householdId);
    expect(savedExpense?.paidByUserId).toBe(ownerUserId);
    expect(Number(savedExpense?.amount)).toBe(42.5);
    expect(savedExpense?.description).toBe("Épicerie");
  });

  it("accepte une dépense sans description", async () => {
    const agent = await loginAs(memberEmail);

    const response = await agent.post("/api/expenses").send({
      householdId,
      paidByUserId: memberUserId,
      amount: 15,
    });

    expect(response.status).toBe(201);
    expect(response.body.expense.description).toBeNull();
    expect(Number(response.body.expense.amount)).toBe(15);
  });

  it("refuse un montant égal à zéro", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent.post("/api/expenses").send({
      householdId,
      paidByUserId: ownerUserId,
      amount: 0,
      description: "Montant invalide",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/montant supérieur à 0/i);

    const count = await prisma.expense.count({
      where: {
        householdId,
      },
    });

    expect(count).toBe(0);
  });

  it("refuse un montant négatif", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent.post("/api/expenses").send({
      householdId,
      paidByUserId: ownerUserId,
      amount: -10,
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/montant supérieur à 0/i);

    const count = await prisma.expense.count({
      where: {
        householdId,
      },
    });

    expect(count).toBe(0);
  });

  it("refuse une dépense sans membre payeur", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent.post("/api/expenses").send({
      householdId,
      amount: 25,
      description: "Sans payeur",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/membre payeur/i);
  });

  it("refuse un utilisateur qui n'appartient pas au foyer", async () => {
    const agent = await loginAs(outsiderEmail);

    const response = await agent.post("/api/expenses").send({
      householdId,
      paidByUserId: ownerUserId,
      amount: 30,
    });

    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/appartenir à ce foyer/i);

    const count = await prisma.expense.count({
      where: {
        householdId,
      },
    });

    expect(count).toBe(0);
  });

  it("refuse un payeur qui n'appartient pas au foyer", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent.post("/api/expenses").send({
      householdId,
      paidByUserId: outsiderUserId,
      amount: 35,
      description: "Payeur extérieur",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/payeur doit appartenir au foyer/i);

    const count = await prisma.expense.count({
      where: {
        householdId,
      },
    });

    expect(count).toBe(0);
  });

  it("retourne l'historique des dépenses du foyer", async () => {
    const agent = await loginAs(ownerEmail);

    const firstResponse = await agent.post("/api/expenses").send({
      householdId,
      paidByUserId: ownerUserId,
      amount: 20,
      description: "Pain et lait",
    });

    expect(firstResponse.status).toBe(201);

    const secondResponse = await agent.post("/api/expenses").send({
      householdId,
      paidByUserId: memberUserId,
      amount: 55.75,
      description: "Épicerie semaine",
    });

    expect(secondResponse.status).toBe(201);

    const historyResponse = await agent.get(
      `/api/expenses?householdId=${householdId}`,
    );

    expect(historyResponse.status).toBe(200);
    expect(historyResponse.body.expenses).toHaveLength(2);

    expect(
      historyResponse.body.expenses.map(
        (expense: { description: string }) => expense.description,
      ),
    ).toEqual(
      expect.arrayContaining(["Pain et lait", "Épicerie semaine"]),
    );

    expect(
      historyResponse.body.expenses.map(
        (expense: { paidByUser: { name: string } }) =>
          expense.paidByUser.name,
      ),
    ).toEqual(
      expect.arrayContaining(["Expenses Owner", "Expenses Member"]),
    );
  });

  it("interdit l'historique à un utilisateur extérieur au foyer", async () => {
    const agent = await loginAs(outsiderEmail);

    const response = await agent.get(
      `/api/expenses?householdId=${householdId}`,
    );

    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/appartenir à ce foyer/i);
  });

  it("retourne 400 lorsque le foyer demandé est invalide", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent.get(
      "/api/expenses?householdId=invalide",
    );

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Foyer invalide");
  });
  it("retourne 401 sans session pour les totaux", async () => {
    const response = await request(app).get(
      `/api/expenses/totals?householdId=${householdId}`,
    );

    expect(response.status).toBe(401);
  });

  it("retourne 400 si le foyer des totaux est invalide", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent.get(
      "/api/expenses/totals?householdId=invalide",
    );

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Foyer invalide");
  });

  it("interdit les totaux a un utilisateur exterieur au foyer", async () => {
    const agent = await loginAs(outsiderEmail);

    const response = await agent.get(
      `/api/expenses/totals?householdId=${householdId}`,
    );

    expect(response.status).toBe(403);
  });

  it("retourne zero lorsqu aucune depense n existe", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent.get(
      `/api/expenses/totals?householdId=${householdId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      memberTotals: {},
      generalTotal: 0,
    });
  });

  it("retourne les totaux de depenses par membre", async () => {
    await prisma.expense.createMany({
      data: [
        {
          householdId,
          paidByUserId: ownerUserId,
          amount: 10.1,
          description: "Owner 1",
        },
        {
          householdId,
          paidByUserId: memberUserId,
          amount: 5.25,
          description: "Member",
        },
        {
          householdId,
          paidByUserId: ownerUserId,
          amount: 2.15,
          description: "Owner 2",
        },
      ],
    });

    const agent = await loginAs(ownerEmail);

    const response = await agent.get(
      `/api/expenses/totals?householdId=${householdId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      memberTotals: {
        "Expenses Owner": 12.25,
        "Expenses Member": 5.25,
      },
      generalTotal: 17.5,
    });
  });

});