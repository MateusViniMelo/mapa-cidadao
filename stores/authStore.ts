import { defineStore } from "pinia";
import type { IUser } from "~/interfaces/IUser";
import type { IUserResponse } from "~/interfaces/responses/IUserResponse";
import type { RegisterUserSchema } from "~/validators/registerUserSchema";
import type { LoginUserSchema } from "~/validators/loginUserSchema";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<IUser | null>(null);
  const loading = ref(false);
  const isAuthenticated = computed(() => !!user.value);
  const requestFetch = useRequestFetch();
  const toasts = useState<
    Array<{ id: string; open: boolean; title: string; description: string; color: string }>
  >("toasts", () => []);

  function showToast(toast: { title: string; description: string; color: "success" | "error" }) {
    toasts.value = [
      ...toasts.value,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        open: true,
        ...toast,
      },
    ].slice(-5);
  }

  async function register(form: RegisterUserSchema) {
    loading.value = true;

    try {
      const res = await requestFetch<IUserResponse>("/api/register", {
        method: "POST",
        body: form,
      });
      user.value = res.user;
      showToast({
        title: "Sucesso",
        description: "Cadastro Realizado com sucesso.",
        color: "success",
      });
    } catch (err: any) {
      showToast({
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
      const res = await requestFetch<IUserResponse>("/api/user/login", {
        method: "POST",
        body: form,
      });
      user.value = res.user;
      showToast({
        title: "Sucesso",
        description: "Login realizado com sucesso.",
        color: "success",
      });
    } catch (err: any) {
      showToast({
        title: "Ocorreu um erro",
        description: err?.data?.message || "Erro ao entrar",
        color: "error",
      });
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function getUser() {
    try {
      user.value = (await requestFetch<IUserResponse>("/api/user/me")).user;
    } catch {
      user.value = null;
    }
  }

  async function logout() {
    if (!user.value) return;
    loading.value = true;
    try {
      await requestFetch("/api/user/logout", { method: "POST" });
    } catch (e) {
      console.error("Erro ao sair", e);
    } finally {
      user.value = null;
      loading.value = false;
    }
  }

  return {
    user,
    loading,
    isAuthenticated,
    register,
    login,
    getUser,
    logout,
  };
});
