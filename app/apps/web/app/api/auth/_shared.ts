import { NextResponse } from "next/server";
import { backendFetch, forbidden, sameOrigin, unreachable } from "@/lib/server/backend";
import { SESSION_MAX_AGE, TOKEN_COOKIE, cookieOptions } from "@/lib/server/config";
import type { AuthResult } from "@/lib/types";

/**
 * Reenvía credenciales al backend; si salen bien, guarda el JWT en una cookie
 * httpOnly (el navegador nunca lo ve) y devuelve solo el usuario.
 */
export async function authenticate(
  req: Request,
  path: "/auth/login" | "/auth/register",
  fields: string[],
): Promise<NextResponse> {
  if (!sameOrigin(req)) return forbidden();

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ message: "Solicitud inválida" }, { status: 400 });
  }
  const body: Record<string, unknown> = {};
  for (const f of fields) {
    const v = payload?.[f];
    if (typeof v !== "string" || v.length > 256) {
      return NextResponse.json({ message: "Solicitud inválida" }, { status: 400 });
    }
    body[f] = v;
  }
  if (path === "/auth/register") {
    if (payload.privacyAccepted !== true) return NextResponse.json({ message: "Debés aceptar la política de privacidad" }, { status: 400 });
    body.privacyAccepted = true;
  }

  let res: Response;
  try {
    res = await backendFetch(path, { method: "POST", body: JSON.stringify(body) });
  } catch (err) {
    return unreachable(err);
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg = (data as { message?: string | string[] } | null)?.message;
    return NextResponse.json(
      { message: (Array.isArray(msg) ? msg[0] : msg) ?? `Error ${res.status}` },
      { status: res.status },
    );
  }

  const { token, user } = data as AuthResult;
  const out = NextResponse.json({ user });
  out.cookies.set(TOKEN_COOKIE, token, cookieOptions(SESSION_MAX_AGE));
  return out;
}
