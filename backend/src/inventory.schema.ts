import { z } from "zod";
import { foodItemSchema } from "./inventory/inventory.schema.js";

export const addFoodItemSchema = foodItemSchema.extend({
  householdId: z.number().int().positive(),
});
