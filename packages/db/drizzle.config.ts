import { defineConfig } from "drizzle-kit";
import { loadRootEnv } from "./src/load-env";

loadRootEnv();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./drizzle",
  casing: "snake_case",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ?? "postgres://getemployed:getemployed@localhost:5432/getemployed",
  },
});
