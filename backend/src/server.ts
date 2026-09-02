import "dotenv/config";
import express from "express";
import path from "node:path";
import { app } from "./app.js";

const port = Number(process.env["PORT"] ?? 3001);
const host = "0.0.0.0";

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT doit être un entier positif");
}

if (process.env["NODE_ENV"] === "production") {
  const frontendDistPath = path.resolve(process.cwd(), "../frontend/dist");

  app.use(express.static(frontendDistPath));

  app.use((req, res, next) => {
    if (
      req.method !== "GET" ||
      req.path.startsWith("/api/") ||
      req.path === "/health"
    ) {
      next();
      return;
    }

    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

const server = app.listen(port, host, () => {
  console.log(`MealSaver écoute sur http://${host}:${port}`);
});

function shutdown(signal: string) {
  console.log(`${signal} reçu, arrêt de MealSaver...`);

  server.close((error) => {
    if (error) {
      console.error("Erreur pendant l'arrêt du serveur", error);
      process.exitCode = 1;
      return;
    }

    process.exitCode = 0;
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
