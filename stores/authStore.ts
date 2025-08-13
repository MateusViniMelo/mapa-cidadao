import { defineStore } from "pinia";
import type { LoginForm } from "~/interfaces/LoginForm";
import type { RegisterForm } from "~/interfaces/RegisterForm";
import { useAuthService } from "~/composables/authService";
import type { IUser } from "~/interfaces/IUser";
import type { IUserResponse } from "~/interfaces/responses/IUserResponse";

export const useAuthStore = defineStore("auth", () => {
  // useCookie já lê/salva automaticamente no cookie
  const token = useCookie<string | null>("auth_token", {
    path: "/", // cookie válido para todo o site
    maxAge: 60 * 60 * 24 * 7, // expira em 7 dias
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const user = useCookie<IUser | null>("auth_user", {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const isAuthenticated = computed(() => !!token.value);

  const authService = useAuthService()
  async function register(form: RegisterForm) {
    const res: IUserResponse = await authService.register(form);
    user.value = res.user;
    token.value = res.token;
  }

  async function login(form: LoginForm) {
    const res: IUserResponse = await authService.login(form);
    user.value = res.user;
    token.value = res.token;
  }

  async function getUser() {
    if (!token.value) {
      user.value = null;
      return;
    }
    try {
      user.value = (await authService.getUser(token.value)).user;
    } catch {
      user.value = null;
    }
  }

  async function logout() {
    if (!token.value) return;
    try {
      await authService.logout(token.value);
    } catch (e) {
      console.error("Erro ao sair", e);
    } finally {
      user.value = null;
      token.value = null;
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    register,
    login,
    getUser,
    logout,
  };
});
