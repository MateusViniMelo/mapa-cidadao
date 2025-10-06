// middleware/auth.ts
import { useAuthStore } from "~/stores/authStore";

export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuthStore();

  
  if (!auth.token) {
    return navigateTo("/");
  }

  try {
    await auth.getUser();

    if (!auth.user) {
      return navigateTo("/");
    }
  } catch (e) {
    await auth.logout();
    return navigateTo("/");
  }
});
