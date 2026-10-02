import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export { schema };
export type Database = ReturnType<typeof createDb>;

/**
 * One client per process. Pass `max: 1` for scripts and a small `max` plus `idleTimeout` for
 * serverless functions, so many warm instances don't exhaust a hosted pooler's client limit.
 * A transaction-mode pooler (Supabase port 6543) can't hold prepared statements, so they're off there.
 */
export function createDb(url: string, options: { max?: number; idleTimeout?: number } = {}) {
  const client = postgres(url, {
    max: options.max ?? 10,
    idle_timeout: options.idleTimeout,
    prepare: !/:6543\//.test(url),
  });
  return drizzle(client, { schema, casing: "snake_case" });
}
