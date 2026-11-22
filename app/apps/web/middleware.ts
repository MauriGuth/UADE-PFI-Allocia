import { NextResponse, type NextRequest } from "next/server";

const TOKEN_COOKIE = "allocia_token";
const PROTECTED = ["/market", "/account", "/resumen", "/cartera", "/desglose", "/riesgo", "/senales", "/informe", "/ajustes"];
const AUTH_ONLY = ["/", "/login", "/register"];

const matches = (pathname: string, bases: string[]) =>
  bases.some((b) => pathname === b || (b !== "/" && pathname.startsWith(b + "/")));

// Primera barrera de acceso: sin cookie de sesión no se entra a la app, y con
// cookie no se vuelve a las pantallas de bienvenida/login. La validez real del
// token la verifica el layout de la app contra el backend (GET /auth/me).
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const maintenance = process.env.APP_MAINTENANCE === "true" ||
    (process.env.NODE_ENV === "production" && !process.env.API_URL);
  if (maintenance && pathname !== "/maintenance" && pathname !== "/privacy") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Allocia está en mantenimiento. Intentá más tarde." },
        { status: 503, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/maintenance";
    url.search = "";
    return NextResponse.rewrite(url, { status: 503,
      headers: { "Retry-After": "3600", "Cache-Control": "no-store" } });
  }
  const hasSession = Boolean(req.cookies.get(TOKEN_COOKIE)?.value);

  if (!hasSession && matches(pathname, PROTECTED)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  if (hasSession && matches(pathname, AUTH_ONLY) && !req.nextUrl.searchParams.has("expired")) {
    const url = req.nextUrl.clone();
    url.pathname = "/resumen";
    url.search = "";
    return NextResponse.redirect(url);
  }
  const nonce = btoa(crypto.randomUUID());
  const dev = process.env.NODE_ENV !== "production";
  const csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${dev ? "'unsafe-eval'" : ''}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`;
  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/).*)"],
};
