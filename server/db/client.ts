import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "generated/prisma/client";
import { pgPoolConfig } from "./pg-config";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

let prisma = globalForPrisma.prisma;

export function getPrisma(): PrismaClient {
  if (!prisma) {
    const adapter = new PrismaPg(pgPoolConfig(process.env.DATABASE_URL));
    prisma = new PrismaClient({ adapter });

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prisma;
    }
  }

  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (!prisma) {
    return;
  }

  await prisma.$disconnect();
  prisma = undefined;
  globalForPrisma.prisma = undefined;
}
