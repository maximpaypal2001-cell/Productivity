// Compiled into Запустить.exe via Node's "single executable application"
// feature (see scripts/build-portable-win.mjs). Its only job: make sure the
// app has a .env, start the bundled server with the bundled portable Node
// runtime, wait for it to answer, then open it in the default browser.
const { spawn } = require("node:child_process");
const { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const http = require("node:http");

const PORT = "3000";
const exeDir = path.dirname(process.execPath);
const nodeExe = path.join(exeDir, "node", "node.exe");
const appDir = path.join(exeDir, "app");
const serverJs = path.join(appDir, "server.js");
const envPath = path.join(appDir, ".env");
const logPath = path.join(exeDir, "launcher.log");

function log(line) {
  const stamped = `[${new Date().toLocaleString("ru-RU")}] ${line}`;
  console.log(line);
  try {
    appendFileSync(logPath, stamped + "\n");
  } catch {
    // некритично — если лог не пишется, просто продолжаем
  }
}

function ensureEnv() {
  if (existsSync(envPath)) return;
  mkdirSync(appDir, { recursive: true });
  const secret = crypto.randomBytes(32).toString("hex");
  writeFileSync(
    envPath,
    `DATABASE_URL="file:./dev.db"\nAUTH_SECRET="${secret}"\n`,
    "utf8"
  );
  log("Создан файл настроек app/.env со случайным ключом.");
}

function waitForServer(timeoutMs) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.get({ host: "127.0.0.1", port: PORT, path: "/", timeout: 2000 }, (res) => {
        res.resume();
        resolve(true);
      });
      req.on("error", () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error("timeout"));
        } else {
          setTimeout(tryOnce, 500);
        }
      });
      req.on("timeout", () => req.destroy());
    };
    tryOnce();
  });
}

function openBrowser(url) {
  spawn("cmd", ["/c", "start", '""', url], { detached: true, stdio: "ignore" }).unref();
}

async function main() {
  console.log("========================================");
  console.log("   Учёт самозанятого — запуск программы");
  console.log("========================================\n");

  if (!existsSync(nodeExe)) {
    log(`ОШИБКА: не найден ${nodeExe}. Похоже, папку переместили не целиком.`);
    log("Убедитесь, что рядом с Запустить.exe остались папки node и app.");
    pause();
    return;
  }
  if (!existsSync(serverJs)) {
    log(`ОШИБКА: не найден ${serverJs}. Убедитесь, что рядом с Запустить.exe осталась папка app.`);
    pause();
    return;
  }

  ensureEnv();

  log("Запускаю сервер приложения...");
  const child = spawn(nodeExe, [serverJs], {
    cwd: appDir,
    env: { ...process.env, PORT, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (d) => appendFileSync(logPath, d));
  child.stderr.on("data", (d) => appendFileSync(logPath, d));

  child.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      log(`Сервер остановился с кодом ${code}. Подробности — в launcher.log.`);
      pause();
    }
  });

  const url = `http://127.0.0.1:${PORT}`;
  try {
    await waitForServer(30000);
    log("Сервер запущен. Открываю в браузере: " + url);
    openBrowser(url);
  } catch {
    log("Сервер не ответил за 30 секунд. Попробуйте открыть вручную: " + url);
    log("Если не откроется — посмотрите файл launcher.log рядом с этой программой.");
  }

  console.log("\nЭто окно можно свернуть. Чтобы ПОЛНОСТЬЮ ЗАКРЫТЬ программу — закройте это окно.");

  const shutdown = () => {
    child.kill();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

function pause() {
  console.log("\nНажмите Enter, чтобы закрыть это окно...");
  process.stdin.resume();
  process.stdin.once("data", () => process.exit(1));
}

main();
