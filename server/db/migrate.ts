import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import pg from "pg";
import type { PrismaClient } from "generated/prisma/client";
import { seedTypeOcurrences } from "../../prisma/seed";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("../..", import.meta.url));
const prismaCli = fileURLToPath(
  new URL("../../node_modules/prisma/build/index.js", import.meta.url),
);

export function assertTestDatabase(url: string): void {
  let name = "";
  try {
    name = decodeURIComponent(new URL(url).pathname.replace(/^\//, ""));
  } catch {
    name = "";
  }

  if (name !== "mapa_cidadao_test") {
    throw new Error(`Vitest recusa o banco ${name || "(indefinido)"}`);
  }
}

async function migrateDeploy(url: string): Promise<void> {
  await execFileAsync(process.execPath, [prismaCli, "migrate", "deploy"], {
    cwd: root,
    env: { ...process.env, DATABASE_URL: url },
  });
}

function commandOutput(error: unknown): string {
  if (!error || typeof error !== "object") {
    return String(error);
  }

  const stderr = "stderr" in error ? String(error.stderr ?? "") : "";
  const stdout = "stdout" in error ? String(error.stdout ?? "") : "";
  const message = error instanceof Error ? error.message : "";
  return `${stderr}\n${stdout}\n${message}`;
}

async function clearPublicSchema(url: string): Promise<void> {
  const client = new pg.Client({ connectionString: url });
  await client.connect();

  try {
    await client.query("DROP SCHEMA IF EXISTS public CASCADE");
    await client.query("CREATE SCHEMA public");
    await client.query("GRANT ALL ON SCHEMA public TO mapa_cidadao");
    await client.query("GRANT ALL ON SCHEMA public TO public");
  } finally {
    await client.end();
  }
}

export async function resetTestDatabase(prisma: PrismaClient): Promise<void> {
  const url = process.env.DATABASE_URL ?? "";
  assertTestDatabase(url);

  try {
    await migrateDeploy(url);
  } catch (error) {
    const output = commandOutput(error);
    if (!output.includes("P3005")) {
      throw new Error(output);
    }

    // PostGIS already occupies public, so Prisma refuses the first deploy.
    await clearPublicSchema(url);
    try {
      await migrateDeploy(url);
    } catch (retryError) {
      throw new Error(commandOutput(retryError));
    }
  }

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "users", "access_tokens", "types_ocurrence", "ocurrences", "like_ocurrences" RESTART IDENTITY CASCADE`,
  );
  await seedTypeOcurrences(prisma);
}
