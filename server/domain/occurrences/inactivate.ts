import type { PrismaClient } from "generated/prisma/client";

const SUCCESS = "Ocorrência inativada com sucesso.";
const ALREADY_INACTIVE = "Ocorrência já inativada.";
const FORBIDDEN = "Você não tem permissão para inativar esta ocorrência.";
const SAVE_FAILED = "Não foi possível inativar a ocorrência.";
const SOLUTION_MAX = 500;

const CLOSURES = ["resolved", "mistake", "other"] as const;

export type ClosureKind = (typeof CLOSURES)[number];

export type OccurrenceState = {
  id: number;
  user_id: number;
  is_active: boolean;
  type_closure: ClosureKind | null;
  solution_description: string | null;
  resolution_date: string | null;
};

export type CloseData = {
  type_closure: "resolved" | "other";
  solution_description: string;
  resolution_date: string | null;
};

export type InactivateStore = {
  find(id: number): Promise<OccurrenceState | null>;
  close(id: number, data: CloseData): Promise<void>;
  remove(id: number): Promise<void>;
};

export type InactivateResult = {
  status: 200 | 403 | 404 | 422;
  body: { message: string; errors?: Record<string, string[]> };
};

type Planned =
  | { action: "delete" }
  | { action: "close"; data: CloseData };

function utcDate(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function isClosure(value: unknown): value is ClosureKind {
  return typeof value === "string" && (CLOSURES as readonly string[]).includes(value);
}

function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function reject(errors: Record<string, string[]>): InactivateResult {
  const message = Object.values(errors).find((items) => items.length > 0)?.[0]
    ?? "Não foi possível validar a ocorrência.";
  return { status: 422, body: { message, errors } };
}

function plan(body: unknown, now: Date): { ok: true; value: Planned } | InactivateResult {
  const input = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const errors: Record<string, string[]> = {};
  const typeClosure = input.type_closure;
  if (!isClosure(typeClosure)) {
    errors.type_closure = ["O campo type closure selecionado é inválido."];
  }

  const rawSolution = input.solution_description;
  const needsSolution = typeClosure === "resolved" || typeClosure === "other";
  let solution: string | null = null;
  if (rawSolution === undefined || rawSolution === null) {
    if (needsSolution) {
      errors.solution_description = ["A descrição da solução é obrigatória."];
    }
  } else if (typeof rawSolution !== "string") {
    errors.solution_description = ["A descrição da solução é obrigatória."];
  } else if (rawSolution.length > SOLUTION_MAX) {
    errors.solution_description = ["A descrição da solução deve ter no máximo 500 caracteres."];
  } else {
    solution = rawSolution;
  }

  let resolutionDate: string | null = null;
  const rawDate = input.resolution_date;
  if (rawDate !== undefined && rawDate !== null) {
    if (typeof rawDate !== "string" || !isCalendarDate(rawDate) || rawDate > utcDate(now)) {
      errors.resolution_date = ["A data de resolução não pode ser maior que hoje."];
    } else {
      resolutionDate = rawDate;
    }
  }

  if (!isClosure(typeClosure)) {
    return reject(errors);
  }

  if (Object.keys(errors).length > 0) {
    return reject(errors);
  }

  if (typeClosure === "mistake") {
    return { ok: true, value: { action: "delete" } };
  }

  if (solution === null) {
    return reject({
      solution_description: ["A descrição da solução é obrigatória."],
    });
  }

  return {
    ok: true,
    value: {
      action: "close",
      data: {
        type_closure: typeClosure,
        solution_description: solution,
        resolution_date: resolutionDate,
      },
    },
  };
}

export async function inactivateOccurrence(
  store: InactivateStore,
  userId: number,
  id: number,
  body: unknown,
  now = new Date(),
): Promise<InactivateResult> {
  const row = await store.find(id);
  if (!row) {
    return { status: 404, body: { message: "Não encontrado" } };
  }

  const planned = plan(body, now);
  if (!("ok" in planned)) {
    return planned;
  }

  if (!row.is_active) {
    return { status: 422, body: { message: ALREADY_INACTIVE } };
  }

  if (row.user_id !== userId) {
    return { status: 403, body: { message: FORBIDDEN } };
  }

  try {
    if (planned.value.action === "delete") {
      await store.remove(row.id);
    } else {
      await store.close(row.id, planned.value.data);
    }
  } catch {
    return { status: 422, body: { message: SAVE_FAILED } };
  }

  return { status: 200, body: { message: SUCCESS } };
}

type RawState = {
  id: number | bigint;
  user_id: number | bigint;
  is_active: boolean;
  type_closure: ClosureKind | null;
  solution_description: string | null;
  resolution_date: string | null;
};

export function prismaInactivateStore(db: PrismaClient): InactivateStore {
  return {
    async find(id) {
      const rows = await db.$queryRaw<RawState[]>`
        SELECT
          id,
          user_id,
          is_active,
          type_closure::text AS type_closure,
          solution_description,
          to_char(resolution_date, 'YYYY-MM-DD') AS resolution_date
        FROM occurrences
        WHERE id = ${id}
      `;
      const row = rows[0];
      if (!row) {
        return null;
      }

      return {
        id: Number(row.id),
        user_id: Number(row.user_id),
        is_active: row.is_active,
        type_closure: row.type_closure,
        solution_description: row.solution_description,
        resolution_date: row.resolution_date,
      };
    },

    async close(id, data) {
      await db.$transaction(async (tx) => {
        const updated = await tx.$executeRaw`
          UPDATE occurrences
          SET is_active = false,
              type_closure = CAST(${data.type_closure} AS "TypeClosure"),
              solution_description = ${data.solution_description}::text,
              resolution_date = ${data.resolution_date}::date,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id}::int
        `;
        if (updated !== 1) {
          throw new Error("save failed");
        }
      });
    },

    async remove(id) {
      await db.$transaction(async (tx) => {
        await tx.occurrence.delete({ where: { id } });
      });
    },
  };
}
