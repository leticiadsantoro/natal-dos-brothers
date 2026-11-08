import { Pool } from "pg";
const globalDb = globalThis as unknown as { natalPool?: Pool };
export const pool =
  globalDb.natalPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 8,
    connectionTimeoutMillis: 5000,
  });
if (process.env.NODE_ENV !== "production") globalDb.natalPool = pool;
