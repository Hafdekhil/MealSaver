import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Le nom est obligatoire"),

  email: z
    .string()
    .trim()
    .email("Le courriel est invalide")
    .transform((email) => email.toLowerCase()),

  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[a-z]/, "Le mot de passe doit contenir une lettre minuscule")
    .regex(/[A-Z]/, "Le mot de passe doit contenir une lettre majuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir un chiffre"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
