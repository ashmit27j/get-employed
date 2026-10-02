import "server-only";
import { createDb, type Database } from "@ge/db";
import { env } from "./env";

let db: Database | undefined;

/** Lazily created so builds and pages that never touch the database don't need DATABASE_URL. */
export function getDb(): Database {
  db ??= createDb(env().DATABASE_URL);
  return db;
}
