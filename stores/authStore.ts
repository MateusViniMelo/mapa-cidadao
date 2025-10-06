import { defineStore } from "pinia";
import type { LoginForm } from "~/interfaces/LoginForm";
import { useAuthService } from "~/composables/authService";
import type { IUser } from "~/interfaces/IUser";
import type { IUserResponse } from "~/interfaces/responses/IUserResponse";
import type { RegisterUserSchema } from "~/validators/registerUserSchema";
import type { LoginUserSchema } from "~/validators/loginUserSchema";

export const useAuthStore = defineStore("auth", () => {
  // useCookie já lê/salva automaticamente no cookie
  const token = useCookie<string | null>("auth_token", {
    path: "/", // cookie válido para todo o site
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const user = useCookie<IUser | null>("auth_user", {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const isAuthenticated = computed(() => !!token.value);

  const loading = ref(false);

  const authService = useAuthService();
  const toast = useToast();

  async function register(form: RegisterUserSchema) {
    loading.value = true;

    try {
      const res: IUserResponse = await authService.register(form);
      user.value = res.user;
      token.value = res.token;
      toast.add({
        title: "Sucesso",
        description: "Cadastro Realizado com sucesso.",
        color: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "Ocorreu um erro",
        description: err?.data?.message || "Erro ao registrar",
        color: "error",
      });
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function login(form: LoginUserSchema) {
    loading.value = true;

    try {
      const res: IUserResponse = await authService.login(form);
      user.value = res.user;
      token.value = res.token;
      toast.add({
        title: "Sucesso",
        description: "Login realizado com sucesso.",
        color: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "Ocorreu um erro",
        description: err?.data?.message || "Erro ao registrar",
        color: "error",
      });
      throw err;
    } finally {
      loading.value = false;
    }
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
    loading.value = true;
    try {
      await authService.logout(token.value);
    } catch (e) {
      console.error("Erro ao sair", e);
    } finally {
      user.value = null;
      token.value = null;
      loading.value = false;
    }
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    register,
    login,
    getUser,
    logout,
  };
});
