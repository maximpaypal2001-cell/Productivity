// Запускается из Запустить.bat. При первом запуске ставит зависимости,
// затем стартует сервер и открывает программу в браузере, когда она готова.
const { spawn } = require("node:child_process");
const { existsSync } = require("node:fs");
const path = require("node:path");
const http = require("node:http");

const root = path.join(__dirname, "..");
const PORT = process.env.PORT || "3000";

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd: root, stdio: "inherit", shell: true });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} завершился с ошибкой (код ${code})`))));
  });
}

function waitForServer(timeoutMs) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.get({ host: "127.0.0.1", port: PORT, path: "/", timeout: 2000 }, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - startedAt > timeoutMs) reject(new Error("timeout"));
        else setTimeout(tryOnce, 500);
      });
      req.on("timeout", () => req.destroy());
    };
    tryOnce();
  });
}

function openBrowser(url) {
  const [cmd, args] =
    process.platform === "win32"
      ? ["cmd", ["/c", "start", '""', url]]
      : process.platform === "darwin"
        ? ["open", [url]]
        : ["xdg-open", [url]];
  const child = spawn(cmd, args, { shell: true, detached: true, stdio: "ignore" });
  child.on("error", () => {
    console.log(`Не удалось открыть браузер автоматически. Перейдите вручную: ${url}`);
  });
  child.unref();
}

async function main() {
  console.log("========================================");
  console.log("   Учёт самозанятого — запуск программы");
  console.log("========================================\n");

  if (!existsSync(path.join(root, "node_modules"))) {
    console.log("Первый запуск — устанавливаю программу, подождите пару минут...\n");
    await run("npm", ["install"]);
  }

  console.log("\nЗапускаю сервер...");
  const server = spawn("npm", ["run", "dev"], { cwd: root, stdio: "inherit", shell: true });

  server.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.log(`\nСервер остановился с ошибкой (код ${code}).`);
    }
  });

  const url = `http://localhost:${PORT}`;
  try {
    await waitForServer(60000);
    console.log(`\nГотово! Открываю в браузере: ${url}`);
    openBrowser(url);
  } catch {
    console.log(`\nСервер долго не отвечает. Попробуйте открыть вручную: ${url}`);
  }

  console.log("\nЭто окно можно свернуть. Чтобы ЗАКРЫТЬ программу — закройте это окно.");

  const shutdown = () => {
    server.kill();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("\nОшибка запуска:", err.message);
  console.log("Нажмите Enter, чтобы закрыть это окно...");
  process.stdin.resume();
  process.stdin.once("data", () => process.exit(1));
});
