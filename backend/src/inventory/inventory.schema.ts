import { z } from "zod";

export const foodItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Le nom de l'aliment est obligatoire")
    .max(120, "Le nom de l'aliment est trop long"),

  quantity: z
    .number()
    .positive("La quantite doit etre superieure a 0")
    .optional(),

  unit: z
    .string()
    .trim()
    .max(30, "L'unite est trop longue")
    .optional(),

  expiresAt: z.coerce.date().optional(),

  storageLocation: z.enum(["FRIDGE", "PANTRY", "FREEZER"]),
});

export type FoodItemInput = z.infer<typeof foodItemSchema>;
