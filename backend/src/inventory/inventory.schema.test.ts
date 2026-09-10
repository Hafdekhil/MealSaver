import { describe, expect, it } from "vitest";
import { foodItemSchema } from "./inventory.schema.js";

describe("foodItemSchema", () => {
  it("accepte un aliment valide", () => {
    const result = foodItemSchema.safeParse({
      name: "Lait",
      quantity: 2,
      unit: "L",
      expiresAt: "2026-09-10",
      storageLocation: "FRIDGE",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.name).toBe("Lait");
      expect(result.data.quantity).toBe(2);
      expect(result.data.unit).toBe("L");
      expect(result.data.expiresAt).toBeInstanceOf(Date);
      expect(result.data.storageLocation).toBe("FRIDGE");
    }
  });

  it("refuse un nom vide", () => {
    const result = foodItemSchema.safeParse({
      name: "   ",
      storageLocation: "PANTRY",
    });

    expect(result.success).toBe(false);
  });

  it("refuse une quantite nulle ou negative", () => {
    const zero = foodItemSchema.safeParse({
      name: "Pommes",
      quantity: 0,
      storageLocation: "PANTRY",
    });

    const negative = foodItemSchema.safeParse({
      name: "Pommes",
      quantity: -2,
      storageLocation: "PANTRY",
    });

    expect(zero.success).toBe(false);
    expect(negative.success).toBe(false);
  });

  it("accepte un aliment sans quantite, unite ni date d'expiration", () => {
    const result = foodItemSchema.safeParse({
      name: "Riz",
      storageLocation: "PANTRY",
    });

    expect(result.success).toBe(true);
  });

  it("refuse un aliment sans emplacement de stockage", () => {
    const result = foodItemSchema.safeParse({
      name: "Poulet",
    });

    expect(result.success).toBe(false);
  });
});