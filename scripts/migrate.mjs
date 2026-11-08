import { readFile } from "node:fs/promises";
import pg from "pg";
if (!process.env.DATABASE_URL)
  throw new Error("Defina DATABASE_URL em .env. Consulte README.md.");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  await pool.query(
    await readFile(new URL("../db/001_initial.sql", import.meta.url), "utf8"),
  );
  console.log("Banco de dados pronto.");
} finally {
  await pool.end();
}
