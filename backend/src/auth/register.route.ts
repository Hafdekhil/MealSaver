import { Router } from "express";
import { registerSchema } from "./register.schema.js";
import {
  EmailAlreadyExistsError,
  registerUser,
} from "./register.service.js";

export const registerRouter = Router();

registerRouter.post("/register", async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Données d'inscription invalides",
      details: parsed.error.issues.map((issue) => issue.message),
    });
  }

  try {
    const user = await registerUser(parsed.data);

    return res.status(201).json({
      message: "Compte créé avec succès",
      user,
    });
  } catch (error: unknown) {
    if (error instanceof EmailAlreadyExistsError) {
      return res.status(409).json({
        error: error.message,
      });
    }

    return next(error);
  }
});
