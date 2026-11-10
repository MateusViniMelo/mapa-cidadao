import type { IUser } from "~/interfaces/IUser";

export default defineNuxtPlugin(async () => {
  const auth = useAuthStore();
  const requestFetch = useRequestFetch();

  try {
    auth.user = (await requestFetch<{ user: IUser }>("/api/user/me")).user;
  } catch {
    auth.user = null;
  }
});
