import "server-only";
import { createDb, type Database } from "@ge/db";
import { env } from "./env";

let db: Database | undefined;

/**
 * Lazily created so builds and pages that never touch the database don't need DATABASE_URL.
 * On Vercel every warm instance holds its own pool, so it stays small and closes idle connections;
 * otherwise a few instances fill the pooler's client limit (EMAXCONNSESSION) and pages fail.
 */
export function getDb(): Database {
  db ??= createDb(
    env().DATABASE_URL,
    process.env.VERCEL ? { max: 3, idleTimeout: 20 } : { idleTimeout: 60 },
  );
  return db;
}
