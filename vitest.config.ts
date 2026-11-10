import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const TEST_DATABASE_URL =
  "postgresql://mapa_cidadao:mapa_cidadao@localhost:5432/mapa_cidadao_test";

function databaseName(url: string): string {
  try {
    return decodeURIComponent(new URL(url).pathname.replace(/^\//, ""));
  } catch {
    return "";
  }
}

function assertTestDatabase(url: string): void {
  const name = databaseName(url);
  if (name !== "mapa_cidadao_test") {
    throw new Error(`Vitest recusa o banco ${name || "(indefinido)"}`);
  }
}

assertTestDatabase(TEST_DATABASE_URL);

const fromEnv = process.env.DATABASE_URL;
if (fromEnv) {
  assertTestDatabase(fromEnv);
}

export default defineConfig({
  resolve: {
    alias: {
      generated: fileURLToPath(new URL("./generated", import.meta.url)),
    },
  },
  test: {
    include: ["test/server/**/*.test.ts"],
    passWithNoTests: true,
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
    },
  },
});
