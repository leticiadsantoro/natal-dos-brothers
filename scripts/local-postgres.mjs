import EmbeddedPostgres from "embedded-postgres";
import { readFile, access, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";
const url = new URL(
  process.env.DATABASE_URL ??
    "postgresql://natal:natal@127.0.0.1:54329/site_natal",
);
if (!["127.0.0.1", "localhost"].includes(url.hostname))
  throw new Error(
    "db:local exige DATABASE_URL apontando para localhost. Para banco remoto use db:migrate.",
  );
const port = Number(url.port || process.env.PG_LOCAL_PORT || 54329),
  database = decodeURIComponent(url.pathname.slice(1));
if (!/^[a-zA-Z0-9_]+$/.test(database))
  throw new Error("Nome de banco inválido.");
const databaseDir = resolve(".data/postgres");
await mkdir(databaseDir, { recursive: true });
const cluster = new EmbeddedPostgres({
  databaseDir,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  port,
  persistent: true,
  initdbFlags: ["--locale=C", "--encoding=UTF8"],
  postgresFlags: ["-h", "127.0.0.1"],
  onLog: () => {},
  onError: (msg) => console.error(String(msg)),
});
let started = false,
  stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  if (started) await cluster.stop();
  process.exit(0);
}
process.on("SIGINT", () => void stop());
process.on("SIGTERM", () => void stop());
try {
  let initialized = true;
  try {
    await access(resolve(databaseDir, "PG_VERSION"));
  } catch {
    initialized = false;
  }
  if (!initialized) await cluster.initialise();
  await cluster.start();
  started = true;
  const adminUrl = new URL(url);
  adminUrl.pathname = "/postgres";
  const admin = new pg.Pool({ connectionString: adminUrl.toString() });
  try {
    const exists = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname=$1",
      [database],
    );
    if (!exists.rowCount) await admin.query(`CREATE DATABASE "${database}"`);
  } finally {
    await admin.end();
  }
  const pool = new pg.Pool({ connectionString: url.toString() });
  try {
    await pool.query(
      await readFile(new URL("../db/001_initial.sql", import.meta.url), "utf8"),
    );
  } finally {
    await pool.end();
  }
  console.log(
    `PostgreSQL pronto em 127.0.0.1:${port}. Banco e tabelas preparados. Mantenha este terminal aberto.`,
  );
  if (process.send) process.send({ type: "ready" });
  else console.log("Em outro terminal, execute: npm run dev");
} catch (error) {
  console.error(error);
  if (started) await cluster.stop();
  process.exit(1);
}
