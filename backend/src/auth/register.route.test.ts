import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../app.js";

describe("POST /api/auth/register", () => {
  it("refuse une inscription avec des données invalides", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "",
        email: "courriel-invalide",
        password: "faible",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Données d'inscription invalides");
    expect(response.body.details).toBeInstanceOf(Array);
  });
});
