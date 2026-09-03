import { describe, expect, it } from "vitest";
import { foodItemSchema } from "./inventory.schema.js";

describe("foodItemSchema", () => {
  it("accepte un aliment valide", () => {
    const result = foodItemSchema.safeParse({
      name: "Lait",
      quantity: 2,
      unit: "L",
      expiresAt: "2026-09-10",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.name).toBe("Lait");
      expect(result.data.quantity).toBe(2);
      expect(result.data.unit).toBe("L");
      expect(result.data.expiresAt).toBeInstanceOf(Date);
    }
  });

  it("refuse un nom vide", () => {
    const result = foodItemSchema.safeParse({
      name: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("refuse une quantite nulle ou negative", () => {
    const zero = foodItemSchema.safeParse({
      name: "Pommes",
      quantity: 0,
    });

    const negative = foodItemSchema.safeParse({
      name: "Pommes",
      quantity: -2,
    });

    expect(zero.success).toBe(false);
    expect(negative.success).toBe(false);
  });

  it("accepte un aliment sans quantite, unite ni date d'expiration", () => {
    const result = foodItemSchema.safeParse({
      name: "Riz",
    });

    expect(result.success).toBe(true);
  });
});
