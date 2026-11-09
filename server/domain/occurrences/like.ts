import type { PrismaClient } from "generated/prisma/client";

export async function toggleLike(
  db: PrismaClient,
  userId: number,
  occurrenceId: number,
): Promise<"created" | "removed"> {
  const existing = await db.likeOcurrence.findFirst({
    where: { user_id: userId, ocurrence_id: occurrenceId },
  });

  if (existing) {
    await db.likeOcurrence.delete({ where: { id: existing.id } });
    return "removed";
  }

  await db.likeOcurrence.create({
    data: { user_id: userId, ocurrence_id: occurrenceId },
  });
  return "created";
}
