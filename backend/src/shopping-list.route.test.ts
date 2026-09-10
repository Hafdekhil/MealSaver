import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";

const ownerEmail = "shopping.owner.test@example.com";
const memberEmail = "shopping.member.test@example.com";
const outsiderEmail = "shopping.outsider.test@example.com";
const password = "MealSaver1";

let householdId: number;

async function cleanupTestData() {
  const users = await prisma.user.findMany({
    where: { email: { in: [ownerEmail, memberEmail, outsiderEmail] } },
    select: { id: true },
  });

  const userIds = users.map((user) => user.id);

  if (userIds.length === 0) return;

  const memberships = await prisma.householdMember.findMany({
    where: { userId: { in: userIds } },
    select: { householdId: true },
  });

  const householdIds = [...new Set(memberships.map((item) => item.householdId))];

  if (householdIds.length > 0) {
    await prisma.household.deleteMany({
      where: { id: { in: householdIds } },
    });
  }

  await prisma.user.deleteMany({
    where: { id: { in: userIds } },
  });
}

async function loginAs(email: string) {
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
  const [owner, member, outsider] = await Promise.all([
    prisma.user.create({
      data: { name: "Shopping Owner", email: ownerEmail, passwordHash },
    }),
    prisma.user.create({
      data: { name: "Shopping Member", email: memberEmail, passwordHash },
    }),
    prisma.user.create({
      data: { name: "Shopping Outsider", email: outsiderEmail, passwordHash },
    }),
  ]);

  const household = await prisma.household.create({
    data: {
      name: "Shopping Household",
      members: {
        create: [
          { userId: owner.id, role: "OWNER" },
          { userId: member.id, role: "MEMBER" },
        ],
      },
    },
  });

  await prisma.household.create({
    data: {
      name: "Outsider Household",
      members: {
        create: { userId: outsider.id, role: "OWNER" },
      },
    },
  });

  householdId = household.id;
});

afterAll(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

describe("Liste d'épicerie collaborative", () => {
  it("retourne 401 sans session", async () => {
    const response = await request(app).get(
      `/api/shopping-list?householdId=${householdId}`,
    );

    expect(response.status).toBe(401);
  });

  it("ajoute un article et le rend visible à un autre membre du foyer", async () => {
    const ownerAgent = await loginAs(ownerEmail);
    const memberAgent = await loginAs(memberEmail);

    const createResponse = await ownerAgent.post("/api/shopping-list").send({
      householdId,
      name: "Lait",
      quantity: 2,
      unit: "L",
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.item.name).toBe("Lait");

    const listResponse = await memberAgent.get(
      `/api/shopping-list?householdId=${householdId}`,
    );

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.items[0]).toMatchObject({
      name: "Lait",
      quantity: 2,
      unit: "L",
      purchased: false,
    });
  });

  it("évite les doublons et fusionne la quantité lorsque l'unité correspond", async () => {
    const agent = await loginAs(ownerEmail);

    await agent.post("/api/shopping-list").send({
      householdId,
      name: "Tomates",
      quantity: 2,
      unit: "pièces",
    });

    const duplicateResponse = await agent.post("/api/shopping-list").send({
      householdId,
      name: "  tomates  ",
      quantity: 3,
      unit: "pièces",
    });

    expect(duplicateResponse.status).toBe(200);
    expect(duplicateResponse.body.merged).toBe(true);
    expect(duplicateResponse.body.item.quantity).toBe(5);

    const count = await prisma.shoppingItem.count({
      where: { householdId },
    });

    expect(count).toBe(1);
  });

  it("refuse une fusion manuelle lorsque l'unité est incompatible", async () => {
    const agent = await loginAs(ownerEmail);

    await agent.post("/api/shopping-list").send({
      householdId,
      name: "Lait",
      quantity: 2,
      unit: "L",
    });

    const duplicateResponse = await agent.post("/api/shopping-list").send({
      householdId,
      name: "lait",
      quantity: 1,
      unit: "gallon",
    });

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.error).toMatch(/unité différente/i);

    const item = await prisma.shoppingItem.findFirstOrThrow({
      where: { householdId, normalizedName: "lait" },
    });

    expect(item.quantity).toBe(2);
    expect(item.unit).toBe("L");
  });

  it("ajoute les ingrédients manquants d'une recette avec leurs données disponibles", async () => {
    const agent = await loginAs(ownerEmail);

    const response = await agent
      .post("/api/shopping-list/from-recipe")
      .send({
        householdId,
        items: [
          { name: "Fromage", quantity: 1, unit: "paquet" },
          { name: "Oignon" },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.addedCount).toBe(2);
    expect(response.body.mergedCount).toBe(0);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Fromage",
          quantity: 1,
          unit: "paquet",
        }),
        expect.objectContaining({ name: "Oignon" }),
      ]),
    );
  });

  it("fusionne aussi les doublons provenant d'une recette", async () => {
    const agent = await loginAs(ownerEmail);

    await agent.post("/api/shopping-list").send({
      householdId,
      name: "Oignon",
      quantity: 1,
      unit: "pièce",
    });

    const response = await agent
      .post("/api/shopping-list/from-recipe")
      .send({
        householdId,
        items: [{ name: "oignon", quantity: 2, unit: "pièce" }],
      });

    expect(response.status).toBe(200);
    expect(response.body.addedCount).toBe(0);
    expect(response.body.mergedCount).toBe(1);
    expect(response.body.items[0].quantity).toBe(3);
  });

  it("refuse une fusion depuis une recette lorsque l'unité est incompatible", async () => {
    const agent = await loginAs(ownerEmail);

    await agent.post("/api/shopping-list").send({
      householdId,
      name: "Lait",
      quantity: 2,
      unit: "L",
    });

    const response = await agent
      .post("/api/shopping-list/from-recipe")
      .send({
        householdId,
        items: [{ name: "lait", quantity: 1, unit: "gallon" }],
      });

    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/unité différente/i);

    const item = await prisma.shoppingItem.findFirstOrThrow({
      where: { householdId, normalizedName: "lait" },
    });

    expect(item.quantity).toBe(2);
    expect(item.unit).toBe("L");
  });

  it("permet de cocher puis décocher un article en affichant le membre responsable", async () => {
    const ownerAgent = await loginAs(ownerEmail);
    const memberAgent = await loginAs(memberEmail);

    const created = await ownerAgent.post("/api/shopping-list").send({
      householdId,
      name: "Pain",
    });

    const itemId = created.body.item.id as number;

    const purchasedResponse = await memberAgent
      .patch(`/api/shopping-list/${itemId}/purchased`)
      .send({ purchased: true });

    expect(purchasedResponse.status).toBe(200);
    expect(purchasedResponse.body.item.purchased).toBe(true);
    expect(purchasedResponse.body.item.purchasedByUser).toMatchObject({
      name: "Shopping Member",
    });

    const unpurchasedResponse = await memberAgent
      .patch(`/api/shopping-list/${itemId}/purchased`)
      .send({ purchased: false });

    expect(unpurchasedResponse.status).toBe(200);
    expect(unpurchasedResponse.body.item.purchased).toBe(false);
    expect(unpurchasedResponse.body.item.purchasedByUser).toBeNull();

    const listResponse = await ownerAgent.get(
      `/api/shopping-list?householdId=${householdId}`,
    );

    expect(listResponse.body.items).toHaveLength(1);
  });

  it("refuse l'accès à un utilisateur extérieur au foyer", async () => {
    const agent = await loginAs(outsiderEmail);

    const response = await agent.post("/api/shopping-list").send({
      householdId,
      name: "Article interdit",
    });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Accès refusé");
  });
});
