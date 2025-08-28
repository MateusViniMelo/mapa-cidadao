import { z } from "zod";
import { TypeOccurrenceClosure } from "@/enums/TypeOcurrenceClosure";

// Cria schema baseado no seu enum
const TypeOccurrenceClosureSchema = z
  
  .nativeEnum(TypeOccurrenceClosure)
  

export const inactiveOccurrenceSchema = z
  .object({
    type_closure: TypeOccurrenceClosureSchema,
    solution_description: z
      .string()
      .max(500, "A descrição da solução deve ter no máximo 500 caracteres.")
      .optional(),
  })
  .superRefine((val, ctx) => {
    const mustHaveDescription =
      val.type_closure === TypeOccurrenceClosure.RESOLVED ||
      val.type_closure === TypeOccurrenceClosure.OTHER;

    const empty =
      val.solution_description === undefined ||
      val.solution_description.trim().length === 0;

    if (mustHaveDescription && empty) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["solution_description"],
        message:
          "A descrição da solução é obrigatória quando o encerramento for 'Problema Resolvido' ou 'Outro motivo'.",
      });
    }
  });

export type InactivateOcurrenceSchema = z.infer<
  typeof inactiveOccurrenceSchema
>;
