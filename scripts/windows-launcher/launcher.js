// Started hidden by Запустить.vbs, using the bundled portable node\node.exe.
// Job: make sure the app has a .env, start the bundled server, wait for it
// to answer, then open it in the default browser. No visible window unless
// something goes wrong (then a message box explains what).
const { spawn, execFile } = require("node:child_process");
const { existsSync, readFileSync, writeFileSync, appendFileSync } = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const http = require("node:http");

const PORT = "3000";
const rootDir = __dirname;
const nodeExe = path.join(rootDir, "node", "node.exe");
const appDir = path.join(rootDir, "app");
const serverJs = path.join(appDir, "server.js");
const envPath = path.join(appDir, ".env");
const logPath = path.join(rootDir, "launcher.log");
const pidPath = path.join(rootDir, "server.pid");

function log(line) {
  const stamped = `[${new Date().toLocaleString("ru-RU")}] ${line}`;
  try {
    appendFileSync(logPath, stamped + "\n");
  } catch {
    // некритично — если лог не пишется, просто продолжаем
  }
}

function showMessage(text) {
  const escaped = text.replace(/'/g, "''");
  const ps =
    "Add-Type -AssemblyName PresentationFramework; " +
    `[System.Windows.MessageBox]::Show('${escaped}', 'Учёт самозанятого')`;
  try {
    execFile("powershell", ["-NoProfile", "-WindowStyle", "Hidden", "-Command", ps]);
  } catch {
    // если PowerShell недоступен — хотя бы в лог уже записали
  }
}

function ensureEnv() {
  if (existsSync(envPath)) return;
  const secret = crypto.randomBytes(32).toString("hex");
  writeFileSync(envPath, `DATABASE_URL="file:./dev.db"\nAUTH_SECRET="${secret}"\n`, "utf8");
  log("Создан файл настроек app/.env со случайным ключом.");
}

function pingServer() {
  return new Promise((resolve) => {
    const req = http.get({ host: "127.0.0.1", port: PORT, path: "/", timeout: 1500 }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

function waitForServer(timeoutMs) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = async () => {
      if (await pingServer()) return resolve(true);
      if (Date.now() - startedAt > timeoutMs) return reject(new Error("timeout"));
      setTimeout(tryOnce, 500);
    };
    tryOnce();
  });
}

function openBrowser(url) {
  spawn("cmd", ["/c", "start", '""', url], { detached: true, stdio: "ignore" }).unref();
}

async function main() {
  log("=== Запуск ===");

  if (!existsSync(nodeExe) || !existsSync(serverJs)) {
    log(`ОШИБКА: не найдены файлы программы рядом с launcher.js (ожидались ${nodeExe} и ${serverJs}).`);
    showMessage("Не найдены файлы программы. Похоже, папку распаковали не целиком — распакуйте архив заново.");
    return;
  }

  // Уже запущено (например, второй двойной клик) — просто открыть браузер.
  if (await pingServer()) {
    log("Сервер уже был запущен — открываю браузер.");
    openBrowser(`http://127.0.0.1:${PORT}`);
    return;
  }

  ensureEnv();

  log("Запускаю сервер приложения...");
  const child = spawn(nodeExe, [serverJs], {
    cwd: appDir,
    env: { ...process.env, PORT, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  writeFileSync(pidPath, String(child.pid), "utf8");
  child.stdout.on("data", (d) => appendFileSync(logPath, d));
  child.stderr.on("data", (d) => appendFileSync(logPath, d));
  child.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      log(`Сервер остановился с кодом ${code}. Подробности выше в этом файле.`);
    }
  });

  const url = `http://127.0.0.1:${PORT}`;
  try {
    await waitForServer(30000);
    log("Сервер запущен. Открываю в браузере: " + url);
    openBrowser(url);
  } catch {
    log("Сервер не ответил за 30 секунд.");
    showMessage(
      `Программа не запустилась за 30 секунд. Попробуйте открыть вручную: ${url}\n\nЕсли не откроется — посмотрите файл launcher.log рядом с программой и отправьте его для проверки.`
    );
  }
}

main();
