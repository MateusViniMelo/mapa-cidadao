import { afterAll, expect, test } from "vitest";
import { disconnectPrisma, getPrisma } from "../../../server/db/client";
import { resetTestDatabase } from "../../../server/db/migrate";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

test("access token expiry defaults to seven days", async () => {
  const prisma = getPrisma();

  try {
    await resetTestDatabase(prisma);
    const user = await prisma.user.create({
      data: {
        name: "Ana Silva",
        email: "prazo@example.invalid",
        password: "not-used",
        date_birth: new Date("1990-01-15T00:00:00.000Z"),
      },
    });

    const row = await prisma.accessToken.create({
      data: { user_id: user.id, token_hash: "default-expiry-hash" },
    });

    const delta = row.expires_at.getTime() - row.created_at.getTime();
    expect(Math.abs(delta - SEVEN_DAYS_MS)).toBeLessThanOrEqual(5);
  } finally {
    await disconnectPrisma();
  }
});
