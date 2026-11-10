import { pathToFileURL } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { pgPoolConfig } from "../server/db/pg-config";

const TYPE_NAMES = [
  "Problema de Iluminação",
  "Problema de Pavimentação",
  "Alagamento",
  "Acúmulo de Lixo",
  "Falta de Pavimentação",
] as const;

export async function seedTypeOccurrences(prisma: PrismaClient): Promise<void> {
  for (const name of TYPE_NAMES) {
    await prisma.typeOccurrence.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

async function runCli(): Promise<void> {
  const adapter = new PrismaPg(
    pgPoolConfig(process.env.DIRECT_URL || process.env.DATABASE_URL),
  );
  const prisma = new PrismaClient({ adapter });

  try {
    await seedTypeOccurrences(prisma);
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
