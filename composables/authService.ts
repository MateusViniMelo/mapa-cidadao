// composables/useAuthService.ts
import type { LoginForm } from "~/interfaces/LoginForm";
import type { RegisterForm } from "~/interfaces/RegisterForm";
import type { IUserResponse } from "~/interfaces/responses/IUserResponse";
import type { LoginUserSchema } from "~/validators/loginUserSchema";
import type { RegisterUserSchema } from "~/validators/registerUserSchema";

export const useAuthService = () => {
  const config = useRuntimeConfig();
  const baseURL = config.public.apiBase;

  async function register(form: RegisterUserSchema) {
    return await $fetch<IUserResponse>("/register", {
      method: "POST",
      body: form,
      baseURL,
    });
  }

  async function login(form: LoginUserSchema) {
    return await $fetch<IUserResponse>("/user/login", {
      method: "POST",
      body: form,
      baseURL,
    });
  }

  async function getUser(token: string) {
    return await $fetch<IUserResponse>("/user/me", {
      method: "GET",
      baseURL,

      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async function logout(token: string) {
    return await $fetch("/user/logout", {
      method: "POST",
      baseURL,

      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return {
    register,
    login,
    getUser,
    logout,
  };
};
