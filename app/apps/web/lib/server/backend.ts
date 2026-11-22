import "server-only";
import { allowedWebOrigin } from "../web-origin";
import { cookies, headers as requestHeaders } from "next/headers";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { TOKEN_COOKIE, apiUrl, cookieOptions } from "./config";

/**
 * Verificación CSRF para mutaciones: la cookie es SameSite=Strict y
 * exigimos un Origin que coincida con el origen configurado.
 */
export function sameOrigin(req: Request): boolean {
  const configured = process.env.WEB_ORIGINS || process.env.WEB_ORIGIN ||
    (process.env.NODE_ENV !== "production" ? new URL(req.url).origin : "");
  return allowedWebOrigin(req.headers.get("origin"), configured);
}

export const forbidden = () =>
  NextResponse.json({ message: "Origen no permitido" }, { status: 403 });

export async function getToken(): Promise<string | null> {
  return (await cookies()).get(TOKEN_COOKIE)?.value ?? null;
}

/** Llama al backend de Allocia desde el servidor de Next. */
export async function backendFetch(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<Response> {
  const { token, headers, ...rest } = init;
  const forwarding: Record<string, string> = {};
  const key = process.env.BFF_SIGNING_SECRET;
  if (key && key.length >= 32 && (process.env.RAILWAY_PROJECT_ID || process.env.VERCEL === '1')) {
    const ip = (await requestHeaders()).get("x-real-ip");
    if (ip && isIP(ip)) {
      const stamp = String(Date.now());
      forwarding["x-allocia-ip"] = ip;
      forwarding["x-allocia-time"] = stamp;
      forwarding["x-allocia-signature"] = createHmac("sha256", key).update(`${stamp}\n${ip}\n${rest.method ?? "GET"}\n${path}`).digest("hex");
    }
  }
  return fetch(`${apiUrl()}${path}`, {
    cache: "no-store",
    ...rest,
    signal: rest.signal ?? AbortSignal.timeout(15000),
    headers: {
      ...forwarding,
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
}

export function clearSession(res: NextResponse): NextResponse {
  res.cookies.set(TOKEN_COOKIE, "", cookieOptions(0));
  return res;
}

/** Describe por qué falló un fetch al backend (código de red de Node + mensaje). */
export function describeFetchError(err: unknown): string {
  const e = err as { message?: string; cause?: { code?: string; message?: string } };
  const code = e?.cause?.code ?? "";
  const msg = e?.cause?.message ?? e?.message ?? String(err);
  return code ? `${code} (${msg})` : msg;
}

/** Respuesta 502 cuando el servidor de Next no puede contactar al backend. */
export function unreachable(err?: unknown) {
  // No registrar URLs, cuerpos ni mensajes que puedan contener credenciales.
  console.error("[allocia-web] backend_unavailable", err instanceof TypeError ? "network" : "configuration_or_upstream");
  return NextResponse.json(
    { message: "El servidor no está disponible. Intentá de nuevo más tarde." },
    { status: 502 },
  );
}
