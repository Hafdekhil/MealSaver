import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";

const email = "auth.session.mealsaver@example.com";
const password = "MealSaver1";

async function cleanupTestData() {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { householdMemberships: true },
  });

  if (!user) {
    return;
  }

  const householdIds = user.householdMemberships.map(
    (membership) => membership.householdId,
  );

  await prisma.householdMember.deleteMany({
    where: { userId: user.id },
  });

  if (householdIds.length > 0) {
    await prisma.household.deleteMany({
      where: {
        id: { in: householdIds },
      },
    });
  }

  await prisma.user.delete({
    where: { id: user.id },
  });
}

describe("Authentification et session", () => {
  beforeAll(() => {
    process.env["JWT_SECRET"] =
      "mealsaver-test-secret-with-more-than-32-characters";
  });

  beforeEach(async () => {
    await cleanupTestData();

    await prisma.user.create({
      data: {
        name: "Utilisateur Session",
        email,
        passwordHash: await bcrypt.hash(password, 12),
      },
    });
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it("refuse des identifiants incorrects", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "MauvaisMotDePasse1" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Courriel ou mot de passe invalide");
  });

  it("crée une session httpOnly après une connexion valide", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(email);
    expect(response.body.user.passwordHash).toBeUndefined();

    const cookies = response.headers["set-cookie"];
    const cookieHeader = Array.isArray(cookies) ? cookies.join(";") : String(cookies);

    expect(cookieHeader).toContain("mealsaver_session=");
    expect(cookieHeader).toContain("HttpOnly");
  });

  it("retourne l'utilisateur connecté via /session", async () => {
    const agent = request.agent(app);

    const loginResponse = await agent
      .post("/api/auth/login")
      .send({ email, password });

    expect(loginResponse.status).toBe(200);

    const sessionResponse = await agent.get("/api/auth/session");

    expect(sessionResponse.status).toBe(200);
    expect(sessionResponse.body.user.email).toBe(email);
  });

  it("protège la création de foyer sans session", async () => {
    const response = await request(app)
      .post("/api/households")
      .send({ name: "Foyer protégé" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Non authentifié");
  });

  it("autorise un utilisateur connecté à créer un foyer", async () => {
    const agent = request.agent(app);

    const loginResponse = await agent
      .post("/api/auth/login")
      .send({ email, password });

    expect(loginResponse.status).toBe(200);

    const householdResponse = await agent
      .post("/api/households")
      .send({ name: "Foyer Session" });

    expect(householdResponse.status).toBe(201);
    expect(householdResponse.body.household.name).toBe("Foyer Session");
  });

  it("supprime le cookie de session à la déconnexion", async () => {
    const agent = request.agent(app);

    const loginResponse = await agent
      .post("/api/auth/login")
      .send({ email, password });

    expect(loginResponse.status).toBe(200);

    const logoutResponse = await agent.post("/api/auth/logout");

    expect(logoutResponse.status).toBe(200);

    const sessionResponse = await agent.get("/api/auth/session");
    expect(sessionResponse.status).toBe(401);
  });
});
