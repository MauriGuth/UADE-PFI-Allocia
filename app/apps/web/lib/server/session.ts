import "server-only";
import { cache } from "react";
import type { AuthUser } from "../types";
import { backendFetch, describeFetchError, getToken } from "./backend";

export type SessionState =
  | { status: "ok"; user: AuthUser }
  | { status: "anonymous" }
  | { status: "unavailable" };

/**
 * Valida la sesión contra el backend (GET /auth/me) usando la cookie httpOnly.
 * Distingue "sin sesión / vencida" de "backend caído" para no desloguear al
 * usuario por una falla transitoria de red.
 */
export const getSession = cache(async (): Promise<SessionState> => {
  const token = await getToken();
  if (!token) return { status: "anonymous" };
  try {
    const res = await backendFetch("/auth/me", { token });
    if (res.status === 401) return { status: "anonymous" };
    if (!res.ok) return { status: "unavailable" };
    const user = (await res.json()) as AuthUser | null;
    return user ? { status: "ok", user } : { status: "anonymous" };
  } catch (err) {
    console.error(`[allocia-web] No se pudo validar la sesión contra el backend: ${describeFetchError(err)}`);
    return { status: "unavailable" };
  }
});
