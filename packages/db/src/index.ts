import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export { schema };
export type Database = ReturnType<typeof createDb>;

/** One client per process. Pass `max: 1` for scripts and short-lived functions. */
export function createDb(url: string, options: { max?: number } = {}) {
  const client = postgres(url, { max: options.max ?? 10 });
  return drizzle(client, { schema, casing: "snake_case" });
}
