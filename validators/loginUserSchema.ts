import { z } from "zod";


export const loginUserSchema = z.object({
  email: z.string({ required_error: "O e-mail é obrigatório" }),

  password: z.string({ required_error: "A senha é obrigatória" }),
});

export type LoginUserSchema = z.infer<typeof loginUserSchema>;
