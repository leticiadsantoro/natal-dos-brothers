import { fork, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const cwd = fileURLToPath(new URL("../", import.meta.url));
let db;
let next;
let stopping = false;
let timer;

function waitForExit(child) {
  if (
    !child ||
    !child.pid ||
    child.exitCode !== null ||
    child.signalCode !== null
  )
    return Promise.resolve();
  return new Promise((resolve) => child.once("exit", resolve));
}

async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  clearTimeout(timer);
  const nextExit = waitForExit(next);
  if (next && next.exitCode === null && next.signalCode === null) {
    try {
      // Next.js também cria processos filhos: encerra o grupo inteiro.
      if (process.platform === "win32") next.kill("SIGTERM");
      else process.kill(-next.pid, "SIGTERM");
    } catch (error) {
      if (error.code !== "ESRCH") console.error(error);
    }
  }
  await nextExit;
  const dbExit = waitForExit(db);
  // O script do banco aguarda o desligamento normal do PostgreSQL.
  if (db && db.exitCode === null && db.signalCode === null) db.kill("SIGTERM");
  await dbExit;
  process.exitCode = code;
}

process.on("SIGINT", () => void stop());
process.on("SIGTERM", () => void stop());

console.log(
  "Iniciando PostgreSQL; o Next.js será iniciado quando o banco estiver pronto.",
);
db = fork(new URL("./local-postgres.mjs", import.meta.url), [], {
  cwd,
  execArgv: ["--env-file-if-exists=.env"],
  detached: process.platform !== "win32",
  stdio: ["inherit", "inherit", "inherit", "ipc"],
});
timer = setTimeout(() => {
  console.error("O PostgreSQL não ficou pronto em 60 segundos.");
  void stop(1);
}, 60000);

db.on("message", (message) => {
  if (message?.type !== "ready" || stopping || next) return;
  clearTimeout(timer);
  console.log("Iniciando Next.js. Use Ctrl+C para encerrar os dois.");
  next = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1"],
    {
      cwd,
      stdio: "inherit",
      detached: process.platform !== "win32",
    },
  );
  next.on("error", (error) => {
    console.error(error);
    void stop(1);
  });
  next.on("exit", (code) => {
    if (!stopping) void stop(code ?? 1);
  });
});
db.on("error", (error) => {
  console.error(error);
  void stop(1);
});
db.on("exit", (code) => {
  if (!stopping) void stop(code || 1);
});
