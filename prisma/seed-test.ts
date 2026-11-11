import { pathToFileURL } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { pgPoolConfig } from "../server/db/pg-config";
import { assertTestDatabaseName, seedTestFixtures } from "./test-fixtures";

const TEST_DATABASE_URL =
  "postgresql://mapa_cidadao:mapa_cidadao@localhost:5432/mapa_cidadao_test";

export function assertLocalTestUrl(url: string): void {
  const parsed = new URL(url);
  const host = parsed.hostname;
  if (host !== "localhost" && host !== "127.0.0.1") {
    throw new Error(`O seed de teste recusa o host ${host}`);
  }

  const name = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  assertTestDatabaseName(name);
}

async function runCli(): Promise<void> {
  assertLocalTestUrl(TEST_DATABASE_URL);

  const adapter = new PrismaPg(pgPoolConfig(TEST_DATABASE_URL));
  const prisma = new PrismaClient({ adapter });

  try {
    const seeded = await seedTestFixtures(prisma);
    const belem = seeded.occurrences.filter((row) => row.city === "Belém").length;
    const ananindeua = seeded.occurrences.filter(
      (row) => row.city === "Ananindeua",
    ).length;

    console.log("Seed de teste aplicado em mapa_cidadao_test.");
    console.log(`Senha dos usuários: ${seeded.password}`);
    for (const user of seeded.users) {
      console.log(`${user.name} <${user.email}>`);
      console.log(`  sessão: ${user.token}`);
    }
    console.log(`Ocorrências: ${belem} em Belém e ${ananindeua} em Ananindeua.`);
  } finally {
    await prisma.$disconnect();
  }
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  runCli().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
