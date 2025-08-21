import { z } from "zod";
import dayjs from "dayjs";

export const registerUserSchema = z
  .object({
    name: z
      .string({ required_error: "O nome é obrigatório" })
      .max(100, "O nome deve ter no máximo 100 caracteres"),

    email: z
      .string({ required_error: "O e-mail é obrigatório" })
      .email("E-mail inválido"),

    password: z
      .string({ required_error: "A senha é obrigatória" })
      .min(8, "A senha deve ter no mínimo 8 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&^()\-_=+])[A-Za-z\d@$!%*#?&^()\-_=+]{8,}$/,
        "A senha deve conter pelo menos 1 letra minúscula, 1 letra maiúscula, 1 número e 1 caractere especial (@$!%*#?&^()-_=+)"
      ),

    password_confirmation: z.string({
      required_error: "A confirmação de senha é obrigatória",
    }),

    date_birth: z
      .string({ required_error: "A data de nascimento é obrigatória" })
      .refine(
        (val) => dayjs(val).isBefore(dayjs(), "day"),
        "A data de nascimento deve ser anterior a hoje"
      )
      .refine(
        (val) => dayjs(val).isBefore(dayjs().subtract(18, "year"), "day"),
        "Você deve ter pelo menos 18 anos"
      ),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "As senha não são iguais",
    path: ["password_confirmation"],
  });

export type RegisterUserSchema = z.infer<typeof registerUserSchema>;
