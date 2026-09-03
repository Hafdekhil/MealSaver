import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    foodItem: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    householdMember: {
      findUnique: vi.fn(),
    },
  },
}));

describe("DELETE /api/inventory/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne 401 si l'utilisateur n'est pas authentifié", async () => {
    const res = await request(app).delete("/api/inventory/1");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Non authentifié" });
  });
});