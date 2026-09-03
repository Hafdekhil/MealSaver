import { describe, expect, it } from "vitest";
import { registerSchema } from "./register.schema.js";

describe("registerSchema", () => {
  it("accepte des données d'inscription valides", () => {
    const result = registerSchema.safeParse({
      name: "Hafedh Dekhil",
      email: "HAFEDH@example.com",
      password: "MealSaver1",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe("hafedh@example.com");
    }
  });

  it("refuse un courriel invalide", () => {
    const result = registerSchema.safeParse({
      name: "Hafedh Dekhil",
      email: "courriel-invalide",
      password: "MealSaver1",
    });

    expect(result.success).toBe(false);
  });

  it("refuse un mot de passe trop faible", () => {
    const result = registerSchema.safeParse({
      name: "Hafedh Dekhil",
      email: "hafedh@example.com",
      password: "password",
    });

    expect(result.success).toBe(false);
  });
});
