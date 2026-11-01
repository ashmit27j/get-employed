import { defineConfig } from "vitest/config";

// unit: pure logic, always runs (CI). sandbox: needs the sandbox image running locally
// (SANDBOX_URL) or deployed (SANDBOX_FUNCTION + AWS credentials). e2e: needs the deployed
// stack (ARENA_API_URL, ARENA_WS_URL, ARENA_TOKEN_SECRET).
export default defineConfig({
  test: {
    projects: [
      { test: { name: "unit", include: ["test/unit/**/*.test.ts"] } },
      {
        test: {
          name: "sandbox",
          include: ["test/sandbox/**/*.test.ts"],
          testTimeout: 180_000,
          fileParallelism: false,
          sequence: { concurrent: false },
        },
      },
      {
        test: {
          name: "e2e",
          include: ["test/e2e/**/*.test.ts"],
          testTimeout: 300_000,
          fileParallelism: false,
        },
      },
    ],
  },
});
