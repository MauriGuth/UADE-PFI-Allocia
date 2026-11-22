import "server-only";

export const TOKEN_COOKIE = "allocia_token";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/** URL base del backend de Allocia. Se resuelve en cada request (no en build). */
export function apiUrl(): string {
  const url = process.env.API_URL;
  if (url) return url.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error("Falta la variable de entorno API_URL (URL del backend de Allocia).");
  }
  return "http://localhost:4000";
}

export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge,
});
