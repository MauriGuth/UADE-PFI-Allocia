import { NextResponse } from "next/server";
import { backendFetch, getToken, clearSession, forbidden, sameOrigin, unreachable } from "@/lib/server/backend";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  const token = await getToken();
  if (token) {
    try {
      const response = await backendFetch("/auth/logout", { method: "POST", token });
      if (!response.ok && response.status !== 401) return NextResponse.json({ message: "No se pudo revocar la sesión. Intentá nuevamente." }, { status: 503 });
    } catch (error) { return unreachable(error); }
  }
  return clearSession(NextResponse.json({ ok: true }));
}

// Usado por el layout cuando la sesión venció: limpia la cookie y vuelve al login.
export async function GET(req: Request) {
  const url = new URL("/login?expired=1", process.env.WEB_ORIGIN || req.url);
  return clearSession(NextResponse.redirect(url));
}
