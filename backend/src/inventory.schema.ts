import { z } from "zod";
<<<<<<< HEAD

export const addFoodItemSchema = z.object({
  householdId: z.number().int().positive(),
  name: z.string().trim().min(1).max(120),
  quantity: z.number().positive().optional(),
  unit: z.string().trim().max(30).optional(),
  expiresAt: z.coerce.date().optional(),
=======
import { foodItemSchema } from "./inventory/inventory.schema.js";

export const addFoodItemSchema = foodItemSchema.extend({
  householdId: z.number().int().positive(),
>>>>>>> origin/main
});
