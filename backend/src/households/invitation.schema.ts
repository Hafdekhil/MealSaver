import { z } from "zod";

export const createInvitationSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Le courriel est invalide")
    .transform((email) => email.toLowerCase()),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;