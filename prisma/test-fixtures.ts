import bcrypt from "bcryptjs";
import type { PrismaClient } from "../generated/prisma/client";
import { hashToken, sessionExpiry } from "../server/domain/auth/session";
import { seedTypeOccurrences } from "./seed";

const TEST_DATABASE_NAME = "mapa_cidadao_test";

export const TEST_SEED_PASSWORD = "Belem1!a";

export const TEST_USERS = [
  {
    name: "Ana Bezerra",
    email: "ana.bezerra@mapa-cidadao.test",
    token: "seed-ana-bezerra",
    dateBirth: "1991-08-20",
  },
  {
    name: "Paulo Nascimento",
    email: "paulo.nascimento@mapa-cidadao.test",
    token: "seed-paulo-nascimento",
    dateBirth: "1987-11-02",
  },
] as const;

export const TEST_OCCURRENCES = [
  {
    email: "ana.bezerra@mapa-cidadao.test",
    typeName: "Acúmulo de Lixo",
    description: "Sacos e restos de feira acumulados na calçada do Ver-o-Peso.",
    addressName: "Boulevard Castilhos França, Campina, Belém - PA",
    city: "Belém",
    latitude: -1.4529,
    longitude: -48.5034,
  },
  {
    email: "ana.bezerra@mapa-cidadao.test",
    typeName: "Problema de Iluminação",
    description: "Postes apagados na Praça Justo Chermont, em frente à Basílica de Nazaré.",
    addressName: "Praça Justo Chermont, Nazaré, Belém - PA",
    city: "Belém",
    latitude: -1.4521,
    longitude: -48.4817,
  },
  {
    email: "ana.bezerra@mapa-cidadao.test",
    typeName: "Alagamento",
    description: "A via interna da UFPA no Guamá fica coberta depois da chuva.",
    addressName: "Campus Guamá da UFPA, Belém - PA",
    city: "Belém",
    latitude: -1.4748,
    longitude: -48.4575,
  },
  {
    email: "paulo.nascimento@mapa-cidadao.test",
    typeName: "Problema de Pavimentação",
    description: "Buracos na Avenida Magalhães Barata, no centro de Ananindeua.",
    addressName: "Avenida Magalhães Barata, Centro, Ananindeua - PA",
    city: "Ananindeua",
    latitude: -1.3658,
    longitude: -48.3722,
  },
  {
    email: "paulo.nascimento@mapa-cidadao.test",
    typeName: "Falta de Pavimentação",
    description: "Trecho de terra na WE-21, na Cidade Nova, sem pavimento.",
    addressName: "WE-21, Cidade Nova, Ananindeua - PA",
    city: "Ananindeua",
    latitude: -1.348,
    longitude: -48.398,
  },
  {
    email: "paulo.nascimento@mapa-cidadao.test",
    typeName: "Acúmulo de Lixo",
    description: "Entulho na Rua da Guanabara, perto da BR-316.",
    addressName: "Rua da Guanabara, Guanabara, Ananindeua - PA",
    city: "Ananindeua",
    latitude: -1.3745,
    longitude: -48.3885,
  },
] as const;

const TEST_LIKES = [
  {
    email: "paulo.nascimento@mapa-cidadao.test",
    addressName: "Boulevard Castilhos França, Campina, Belém - PA",
  },
  {
    email: "ana.bezerra@mapa-cidadao.test",
    addressName: "WE-21, Cidade Nova, Ananindeua - PA",
  },
] as const;

export type SeededTestUser = {
  id: number;
  name: string;
  email: string;
  token: string;
};

export type SeededTestOccurrence = {
  id: number;
  city: "Belém" | "Ananindeua";
  email: string;
  addressName: string;
};

export type SeededTestData = {
  password: string;
  users: SeededTestUser[];
  occurrences: SeededTestOccurrence[];
};

let cachedPasswordHash: string | null = null;

export function assertTestDatabaseName(name: string): void {
  if (name !== TEST_DATABASE_NAME) {
    throw new Error(
      `O seed de teste recusa o banco ${name || "(indefinido)"}`,
    );
  }
}

async function testPasswordHash(): Promise<string> {
  if (!cachedPasswordHash) {
    cachedPasswordHash = await bcrypt.hash(TEST_SEED_PASSWORD, 12);
  }

  return cachedPasswordHash;
}

export async function seedTestFixtures(prisma: PrismaClient): Promise<SeededTestData> {
  const current = await prisma.$queryRaw<Array<{ current_database: string }>>`
    SELECT current_database()
  `;
  assertTestDatabaseName(current[0]?.current_database ?? "");

  await seedTypeOccurrences(prisma);
  const passwordHash = await testPasswordHash();
  const types = await prisma.typeOccurrence.findMany();
  const typeIdByName = new Map(types.map((type) => [type.name, type.id]));

  return prisma.$transaction(async (tx) => {
    const users: SeededTestUser[] = [];

    for (const fixture of TEST_USERS) {
      const user = await tx.user.upsert({
        where: { email: fixture.email },
        update: {
          name: fixture.name,
          password: passwordHash,
          date_birth: new Date(`${fixture.dateBirth}T00:00:00.000Z`),
        },
        create: {
          name: fixture.name,
          email: fixture.email,
          password: passwordHash,
          date_birth: new Date(`${fixture.dateBirth}T00:00:00.000Z`),
        },
      });

      users.push({
        id: user.id,
        name: user.name,
        email: user.email,
        token: fixture.token,
      });
    }

    const userIds = users.map((user) => user.id);
    const userIdByEmail = new Map(users.map((user) => [user.email, user.id]));

    await tx.likeOccurrence.deleteMany({
      where: {
        OR: [
          { user_id: { in: userIds } },
          { occurrence: { user_id: { in: userIds } } },
        ],
      },
    });
    await tx.occurrence.deleteMany({ where: { user_id: { in: userIds } } });
    await tx.accessToken.deleteMany({ where: { user_id: { in: userIds } } });

    const createdAt = new Date();
    for (const user of users) {
      await tx.accessToken.create({
        data: {
          user_id: user.id,
          token_hash: hashToken(user.token),
          created_at: createdAt,
          expires_at: sessionExpiry(createdAt),
        },
      });
    }

    const occurrences: SeededTestOccurrence[] = [];
    for (const fixture of TEST_OCCURRENCES) {
      const typeId = typeIdByName.get(fixture.typeName);
      const userId = userIdByEmail.get(fixture.email);
      if (!typeId || !userId) {
        throw new Error(`Tipo de ocorrência ausente: ${fixture.typeName}`);
      }

      const inserted = await tx.$queryRaw<Array<{ id: number }>>`
        INSERT INTO occurrences (
          location, type_id, user_id, description, address_name, city, state, country
        ) VALUES (
          ST_SetSRID(ST_MakePoint(${fixture.longitude}::float8, ${fixture.latitude}::float8), 4326),
          ${typeId}::int,
          ${userId}::int,
          ${fixture.description}::text,
          ${fixture.addressName}::text,
          ${fixture.city}::text,
          ${"PA"}::text,
          ${"Brasil"}::text
        )
        RETURNING id
      `;

      occurrences.push({
        id: Number(inserted[0]?.id),
        city: fixture.city,
        email: fixture.email,
        addressName: fixture.addressName,
      });
    }

    const occurrenceIdByAddress = new Map(
      occurrences.map((occurrence) => [occurrence.addressName, occurrence.id]),
    );
    for (const like of TEST_LIKES) {
      const userId = userIdByEmail.get(like.email);
      const occurrenceId = occurrenceIdByAddress.get(like.addressName);
      if (!userId || !occurrenceId) {
        throw new Error(`Curtida sem ocorrência: ${like.addressName}`);
      }

      await tx.likeOccurrence.create({
        data: { user_id: userId, occurrence_id: occurrenceId },
      });
    }

    return {
      password: TEST_SEED_PASSWORD,
      users,
      occurrences,
    };
  });
}
