import type { IUser } from "~/interfaces/IUser";

export default defineNuxtPlugin(async () => {
  const auth = useAuthStore();

  if (import.meta.client && useNuxtApp().payload.serverRendered) {
    return;
  }

  if (import.meta.server) {
    const cookie = useRequestHeaders(["cookie"]).cookie ?? "";
    if (!/(?:^|;\s*)auth_token=\S/.test(cookie)) {
      auth.user = null;
      return;
    }
  }

  const requestFetch = useRequestFetch();

  try {
    auth.user = (await requestFetch<{ user: IUser }>("/api/user/me")).user;
  } catch {
    auth.user = null;
  }
});
