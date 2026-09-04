import { z } from "zod";

export const addFoodItemSchema = z.object({
  householdId: z.number().int().positive(),
  name: z.string().trim().min(1).max(120),
  quantity: z.number().positive().optional(),
  unit: z.string().trim().max(30).optional(),
  expiresAt: z.coerce.date().optional(),
});
