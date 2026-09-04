import cookieParser from "cookie-parser";
import express from "express";
import { requireAuth } from "./auth/auth.middleware.js";
import { authRouter } from "./auth/auth.route.js";
import { registerRouter } from "./auth/register.route.js";
import { householdRouter } from "./households/household.route.js";
import { invitationRouter } from "./households/invitation.route.js";
import { inventoryDeleteRouter } from "./inventory/inventory.delete.route.js";
import { inventoryUpdateRouter } from "./inventory/inventory.patch.route.js";

export const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "mealsaver-backend",
  });
});

app.use("/api/auth", registerRouter);
app.use("/api/auth", authRouter);
app.use("/api/households", requireAuth, householdRouter);
app.use("/api/households", requireAuth, invitationRouter);
app.use("/api/inventory", requireAuth, inventoryUpdateRouter);
app.use("/api/inventory", requireAuth, inventoryDeleteRouter);

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
