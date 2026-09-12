import bcrypt from "bcryptjs";
import request from "supertest";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";

const userEmail = "scan.identify.test@example.com";
const password = "MealSaver1";

let userId: number;

async function cleanupTestData() {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });

  if (!user) return;

  await prisma.user.delete({
    where: { id: user.id },
  });
}

async function login() {
  const agent = request.agent(app);

  const response = await agent
    .post("/api/auth/login")
    .send({ email: userEmail, password });

  expect(response.status).toBe(200);

  return agent;
}

beforeAll(() => {
  process.env["JWT_SECRET"] =
    "mealsaver-test-secret-with-more-than-32-characters";
  process.env["GEMINI_API_KEY"] = "test-gemini-key";
});

beforeEach(async () => {
  await cleanupTestData();

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name: "Scan Test User",
      email: userEmail,
      passwordHash,
    },
  });

  userId = user.id;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

afterAll(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

describe("POST /api/scan/identify", () => {
  it("retourne 401 sans session", async () => {
    const image = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00]);

    const response = await request(app)
      .post("/api/scan/identify")
      .set("Content-Type", "image/jpeg")
      .send(image);

    expect(response.status).toBe(401);
  });

  it("refuse un type de fichier non pris en charge", async () => {
    const agent = await login();

    const response = await agent
      .post("/api/scan/identify")
      .set("Content-Type", "text/plain")
      .send("not an image");

    expect(response.status).toBe(415);
    expect(response.body.error).toBe("Format d'image non pris en charge");
  });

  it("refuse un contenu qui ne correspond pas au type d'image annoncé", async () => {
    const agent = await login();

    const response = await agent
      .post("/api/scan/identify")
      .set("Content-Type", "image/jpeg")
      .send(Buffer.from("not a jpeg"));

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Le contenu du fichier ne correspond pas à une image valide",
    );
  });

  it("retourne 413 lorsqu'une image dépasse la limite de 5 Mo", async () => {
    const agent = await login();

    const image = Buffer.alloc(5 * 1024 * 1024 + 1);
    image[0] = 0xff;
    image[1] = 0xd8;
    image[2] = 0xff;

    const response = await agent
      .post("/api/scan/identify")
      .set("Content-Type", "image/jpeg")
      .send(image);

    expect(response.status).toBe(413);
  });
  it("retourne 422 lorsqu'aucun aliment n'est identifiable", async () => {
    const agent = await login();

    const geminiFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: "Aucun aliment visible" }],
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    vi.stubGlobal("fetch", geminiFetch);

    const countBefore = await prisma.foodItem.count({
      where: { addedBy: userId },
    });

    const image = Buffer.from([
      0xff,
      0xd8,
      0xff,
      0xdb,
      0x00,
      0x43,
      0x00,
      0x01,
    ]);

    const response = await agent
      .post("/api/scan/identify")
      .set("Content-Type", "image/jpeg")
      .send(image);

    expect(response.status).toBe(422);
    expect(response.body.error).toBe(
      "Aucun aliment identifiable dans l'image",
    );

    expect(geminiFetch).toHaveBeenCalledTimes(1);

    const countAfter = await prisma.foodItem.count({
      where: { addedBy: userId },
    });

    expect(countAfter).toBe(countBefore);
  });

  it("interdit l'identification a partir du texte ou d'une capture d'ecran", async () => {
    const agent = await login();

    const geminiFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: "NO_FOOD" }],
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    vi.stubGlobal("fetch", geminiFetch);

    const image = Buffer.from([
      0xff,
      0xd8,
      0xff,
      0xdb,
      0x00,
      0x43,
      0x00,
      0x01,
    ]);

    const response = await agent
      .post("/api/scan/identify")
      .set("Content-Type", "image/jpeg")
      .send(image);

    expect(response.status).toBe(422);
    expect(response.body.error).toBe(
      "Aucun aliment identifiable dans l'image",
    );

    expect(geminiFetch).toHaveBeenCalledTimes(1);

    const [, options] = geminiFetch.mock.calls[0] as [
      string,
      RequestInit,
    ];

    const requestBody = JSON.parse(String(options.body));
    const prompt = requestBody.contents[0].parts[1].text as string;

    expect(prompt).toContain(
      "N'utilise jamais le texte visible dans l'image pour identifier un aliment.",
    );
    expect(prompt).toContain("captures d'ecran");
    expect(prompt).toContain(
      "le contenu alimentaire lui-meme doit etre clairement visible",
    );
    expect(prompt).toContain("NO_FOOD");
  });

  it("retourne une proposition sans ajouter automatiquement un aliment", async () => {
    const agent = await login();

    const geminiFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: "Banane" }],
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    vi.stubGlobal("fetch", geminiFetch);

    const countBefore = await prisma.foodItem.count({
      where: { addedBy: userId },
    });

    const image = Buffer.from([
      0xff,
      0xd8,
      0xff,
      0xdb,
      0x00,
      0x43,
      0x00,
      0x01,
    ]);

    const response = await agent
      .post("/api/scan/identify")
      .set("Content-Type", "image/jpeg")
      .send(image);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      suggestion: "Banane",
      requiresManualValidation: true,
    });

    expect(geminiFetch).toHaveBeenCalledTimes(1);

    const countAfter = await prisma.foodItem.count({
      where: { addedBy: userId },
    });

    expect(countAfter).toBe(countBefore);
  });
});
