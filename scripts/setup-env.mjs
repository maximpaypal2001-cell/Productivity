// Runs automatically on `npm install` (see package.json "postinstall").
// Creates a local .env with a freshly generated AUTH_SECRET, and makes sure
// the local data folders exist, so the app runs with zero manual setup.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env");
const examplePath = path.join(root, ".env.example");

mkdirSync(path.join(root, "data", "uploads"), { recursive: true });

if (!existsSync(envPath)) {
  const fallback = 'DATABASE_URL="file:./dev.db"\nAUTH_SECRET="replace-with-a-long-random-string"\n';
  let content = existsSync(examplePath) ? readFileSync(examplePath, "utf8") : fallback;
  const secret = randomBytes(32).toString("hex");
  content = content.replace(/AUTH_SECRET=".*"/, `AUTH_SECRET="${secret}"`);
  writeFileSync(envPath, content);
  console.log("[setup] Создан файл .env со случайным ключом AUTH_SECRET.");
} else {
  console.log("[setup] Файл .env уже существует — пропускаем создание.");
}
