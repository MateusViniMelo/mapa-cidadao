import { Prisma, type PrismaClient } from "generated/prisma/client";

function alreadyLiked(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

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

  try {
    await db.likeOccurrence.create({
      data: { user_id: userId, occurrence_id: occurrenceId },
    });
  } catch (error) {
    if (alreadyLiked(error)) return "created";
    throw error;
  }

  return "created";
}
