import { NextResponse } from "next/server";
import {
  backendFetch,
  clearSession,
  forbidden,
  getToken,
  sameOrigin,
  unreachable,
} from "@/lib/server/backend";

export const dynamic = "force-dynamic";

// Solo se reenvían las rutas que consume el producto (las mismas que usa la
// app móvil). Cualquier otra ruta del backend queda inaccesible desde el navegador.
const ROUTES: { pattern: RegExp; methods: string[] }[] = [
  { pattern: /^market\/opportunities$/, methods: ["GET"] },
  { pattern: /^market\/opportunities\/(watchlist|analyze)$/, methods: ["POST"] },
  { pattern: /^market\/opportunities\/preferences$/, methods: ["PATCH"] },
  { pattern: /^market\/opportunities\/watchlist\/[A-Z0-9.^=-]{1,24}$/, methods: ["DELETE"] },
  { pattern: /^auth\/export$/, methods: ["GET"] },
  { pattern: /^auth\/request-verification$/, methods: ["POST"] },
  { pattern: /^auth\/me$/, methods: ["DELETE"] },
  { pattern: /^market\/(status|reports|alerts)$/, methods: ["GET"] },
  { pattern: /^market\/alerts\/\d+$/, methods: ["PATCH"] },
  { pattern: /^market\/analyze$/, methods: ["POST"] },
  { pattern: /^market\/preferences$/, methods: ["PATCH"] },
  { pattern: /^catalog\/(search|import)$/, methods: ["POST"] },
  { pattern: /^catalog\/[A-Za-z0-9.^=-]{1,24}\/logo$/, methods: ["GET"] },
  { pattern: /^catalog$/, methods: ["GET"] },
  { pattern: /^portfolio$/, methods: ["GET"] },
  { pattern: /^portfolio\/holdings$/, methods: ["GET"] },
  { pattern: /^portfolio\/positions$/, methods: ["POST"] },
  { pattern: /^portfolio\/positions\/\d+$/, methods: ["PATCH", "DELETE"] },
  { pattern: /^analysis$/, methods: ["GET"] },
  { pattern: /^signals$/, methods: ["GET"] },
  { pattern: /^observations$/, methods: ["GET"] },
];

async function handle(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const joined = path.join("/");
  const route = ROUTES.find((r) => r.pattern.test(joined));
  if (!route) return NextResponse.json({ message: "No encontrado" }, { status: 404 });
  if (!route.methods.includes(req.method)) {
    return NextResponse.json({ message: "Método no permitido" }, { status: 405 });
  }
  if (req.method !== "GET" && !sameOrigin(req)) return forbidden();

  const token = await getToken();
  if (!token) return NextResponse.json({ message: "Sesión requerida" }, { status: 401 });

  let upstream: Response;
  try {
    const hasBody = ["POST", "PATCH", "DELETE"].includes(req.method);
    const body = hasBody ? await req.text() : undefined;
    if (body && Buffer.byteLength(body) > 32768) return NextResponse.json({ message: "Solicitud demasiado grande" }, { status: 413 });
    const refresh = joined === "portfolio" && new URL(req.url).searchParams.get("refresh") === "true";
    upstream = await backendFetch(`/${joined}${refresh ? "?refresh=true" : ""}`, {
      method: req.method,
      token,
      ...(joined === "signals" ? { signal: AbortSignal.timeout(45000) } : {}),
      body: body || undefined,
    });
  } catch (err) {
    return unreachable(err);
  }

  const text = await upstream.text();
  const res = new NextResponse(text || null, {
    status: upstream.status,
    headers: text ? { "Content-Type": "application/json" } : undefined,
  });
  // Sesión vencida o inválida: se limpia la cookie para forzar un nuevo login.
  // Una contraseña incorrecta al eliminar la cuenta también responde 401, pero la
  // sesión sigue vigente: se conserva la cookie para que la persona pueda reintentar.
  res.headers.set("Cache-Control", "no-store");
  const wrongPassword = upstream.status === 401 && joined === "auth/me" && req.method === "DELETE" && /contraseña incorrecta/i.test(text);
  return (upstream.status === 401 && !wrongPassword) || (joined === "auth/me" && upstream.ok) ? clearSession(res) : res;
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
