import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { PrismaClient } from "generated/prisma/client";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createMemorySessions() {
  const byHash = new Map<string, { token: string; userId: number }>();

  return {
    save(token: string, userId: number) {
      byHash.set(hashToken(token), { token, userId });
    },
    read(token: string) {
      const row = byHash.get(hashToken(token));
      if (!row) {
        return null;
      }

      return { token: row.token, userId: row.userId };
    },
    logout(token: string) {
      return byHash.delete(hashToken(token));
    },
  };
}

export function createToken(): string {
  return randomBytes(32).toString("base64url");
}

export type PublicUser = {
  id: number;
  name: string;
  email: string;
  date_birth: string;
  created_at: string;
  updated_at: string;
};

export function toPublicUser(user: {
  id: number;
  name: string;
  email: string;
  date_birth: Date;
  created_at: Date;
  updated_at: Date;
}): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    date_birth: user.date_birth.toISOString().slice(0, 10),
    created_at: user.created_at.toISOString(),
    updated_at: user.updated_at.toISOString(),
  };
}

export function bearerToken(header: string | undefined): string | null {
  if (!header?.trim()) {
    return null;
  }

  const match = /^bearer\s+(\S+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}

export async function readSession(
  db: PrismaClient,
  token: string,
): Promise<{ user: PublicUser; token: string } | null> {
  const row = await db.accessToken.findUnique({
    where: { token_hash: hashToken(token) },
    include: { user: true },
  });
  if (!row) {
    return null;
  }

  return { user: toPublicUser(row.user), token };
}

export async function login(
  db: PrismaClient,
  email: string,
  password: string,
): Promise<{ user: PublicUser; token: string } | null> {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return null;
  }

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) {
    return null;
  }

  const token = createToken();
  await db.accessToken.create({
    data: { user_id: user.id, token_hash: hashToken(token) },
  });

  return { user: toPublicUser(user), token };
}

export async function logout(db: PrismaClient, token: string): Promise<boolean> {
  const row = await db.accessToken.findUnique({
    where: { token_hash: hashToken(token) },
  });
  if (!row) {
    return false;
  }

  await db.accessToken.delete({ where: { id: row.id } });
  return true;
}
