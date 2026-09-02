import express from "express";
import { registerRouter } from "./auth/register.route.js";
import { householdRouter } from "./households/household.route.js";
import { invitationRouter } from "./households/invitation.route.js";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "mealsaver-backend",
  });
});

app.use("/api/auth", registerRouter);
app.use("/api/households", householdRouter);
app.use("/api/households", invitationRouter);

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(error);

    res.status(500).json({
      error: "Erreur interne du serveur",
    });
  },
);