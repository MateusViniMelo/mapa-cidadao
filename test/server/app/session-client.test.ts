import { existsSync, readFileSync } from "node:fs";
import { expect, test } from "vitest";

function source(path: string): string {
  return readFileSync(path, "utf8");
}

function sliceFunction(text: string, name: string): string {
  const start = text.indexOf(`async function ${name}`);
  expect(start).toBeGreaterThanOrEqual(0);
  const next = text.indexOf("async function ", start + 1);
  return text.slice(start, next === -1 ? undefined : next);
}

const authStore = source("stores/authStore.ts");
const occurrenceStore = source("stores/occurrencesStore.ts");
const map = source("components/map/OccurrenceMap.vue");
const middleware = source("middleware/authMiddleware.ts");
const plugin = source("plugins/auth.ts");

test("auth store calls the session routes", () => {
  expect(authStore).toContain('requestFetch<IUserResponse>("/api/register", {\n        method: "POST",');
  expect(authStore).toContain('requestFetch<IUserResponse>("/api/user/login", {\n        method: "POST",');
  expect(authStore).toContain('requestFetch<IUserResponse>("/api/user/me")');
  expect(authStore).toContain('requestFetch("/api/user/logout", { method: "POST" })');
});

test("auth store keeps the token out of javascript", () => {
  expect(authStore).not.toContain("Authorization");
  expect(authStore).not.toContain("useCookie");
  expect(authStore).not.toContain("auth_token");
  expect(authStore).not.toContain("auth_user");
  expect(authStore).not.toContain("apiBase");
});

test("login success toast", () => {
  const login = sliceFunction(authStore, "login");
  expect(login).toContain('description: "Login realizado com sucesso."');
  expect(login).toContain("user.value = res.user;");
});

test("login does not reload", () => {
  expect(authStore).not.toContain("window.location.reload");
});

test("login failure toast", () => {
  expect(sliceFunction(authStore, "login")).toContain(
    'err?.data?.message || "Erro ao entrar"',
  );
});

test("register failure toast", () => {
  expect(sliceFunction(authStore, "register")).toContain(
    'err?.data?.message || "Erro ao registrar"',
  );
});

test("occurrences store calls same origin", () => {
  expect(occurrenceStore).toContain('"/api/occurrences"');
  expect(occurrenceStore).toContain('await $fetch(`/api/occurrences/${id}`, { method: "DELETE" })');
  expect(occurrenceStore).toContain("`/api/occurrences/inactivate/${id}`");
  expect(occurrenceStore).toContain("`/api/occurrences/my-occurrences?page=${page}`");
  expect(occurrenceStore).toContain("`/api/occurrences/like/${id}`");
  expect(occurrenceStore).not.toContain("Authorization");
  expect(occurrenceStore).not.toContain("apiBase");
});

test("map loads types from the same origin", () => {
  expect(map).toContain('"/api/types-occurrence"');
  expect(map).not.toContain("useTypesOccurrencesService");
});

test("fetch wrappers are gone", () => {
  expect(existsSync("composables/authService.ts")).toBe(false);
  expect(existsSync("composables/occurrencesService.ts")).toBe(false);
  expect(existsSync("composables/typesOccurrencesService.ts")).toBe(false);
});

test("public api base is gone", () => {
  expect(source("nuxt.config.ts")).not.toContain("apiBase");
  expect(source(".env.example")).not.toContain("NUXT_PUBLIC_API_BASE");
});

test("plugin reloads the user", () => {
  expect(plugin).toContain("const requestFetch = useRequestFetch();");
  expect(plugin).toContain('auth.user = (await requestFetch<{ user: IUser }>("/api/user/me")).user;');
  expect(plugin).toContain("payload.serverRendered");
  expect(plugin).toContain("auth_token=\\S");
});

test("middleware follows the user", () => {
  expect(middleware).toContain("if (!auth.user) {\n    await auth.getUser();\n  }");
  expect(middleware).toContain('if (!auth.user) {\n    return navigateTo("/");\n  }');
  expect(middleware).not.toContain("auth.token");
});
