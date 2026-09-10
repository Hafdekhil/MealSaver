import "dotenv/config";
import { app } from "./app.js";

const port = Number(process.env["PORT"] ?? 3001);
const host = "127.0.0.1";

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT doit être un entier positif");
}

app.listen(port, host, () => {
  console.log(`MealSaver backend : http://${host}:${port}`);
});
