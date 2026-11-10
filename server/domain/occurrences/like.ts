import type { PrismaClient } from "generated/prisma/client";

export async function toggleLike(
  db: PrismaClient,
  userId: number,
  occurrenceId: number,
): Promise<"created" | "removed"> {
  const existing = await db.likeOccurrence.findFirst({
    where: { user_id: userId, occurrence_id: occurrenceId },
  });

  if (existing) {
    await db.likeOccurrence.delete({ where: { id: existing.id } });
    return "removed";
  }

  await db.likeOccurrence.create({
    data: { user_id: userId, occurrence_id: occurrenceId },
  });
  return "created";
}
