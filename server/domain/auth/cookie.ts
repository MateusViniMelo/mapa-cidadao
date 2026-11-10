import { deleteCookie, getCookie, setCookie, type H3Event } from "h3";
import { SESSION_TTL_SECONDS } from "./session";

export const SESSION_COOKIE = "auth_token";

export function sessionCookieOptions(nodeEnv: string | undefined) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: nodeEnv === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function setSessionCookie(event: H3Event, token: string): void {
  setCookie(event, SESSION_COOKIE, token, sessionCookieOptions(process.env.NODE_ENV));
}

export function clearSessionCookie(event: H3Event): void {
  const { maxAge: _maxAge, ...options } = sessionCookieOptions(process.env.NODE_ENV);
  deleteCookie(event, SESSION_COOKIE, options);
}

export function readSessionCookie(event: H3Event): string | null {
  const value = getCookie(event, SESSION_COOKIE)?.trim();
  return value ? value : null;
}
