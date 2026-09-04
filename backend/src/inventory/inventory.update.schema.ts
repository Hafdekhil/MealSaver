import { z } from "zod";

export const updateFoodItemSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  quantity: z.number().positive().nullable().optional(),
  unit: z.string().trim().max(30).nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  storageLocation: z.enum(["FRIDGE", "PANTRY", "FREEZER"]).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "Au moins un champ doit être modifié",
});
