// Se ejecuta una vez al arrancar el servidor de Next: comprueba que el backend
// configurado en API_URL responde y deja el resultado en la consola, para que un
// problema de conexión (URL mal escrita, backend caído, VPN, certificados) se vea
// al instante y no recién al intentar iniciar sesión.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const url = (process.env.API_URL ?? (process.env.NODE_ENV === "production" ? "" : "http://localhost:4000")).replace(
    /\/+$/,
    "",
  );
  if (!url) {
    console.error("[allocia-web] ✖ Falta API_URL: definila (ver apps/web/.env.example).");
    return;
  }
  try {
    const res = await fetch(`${url}/catalog`, { signal: AbortSignal.timeout(10_000), cache: "no-store" });
    if (res.ok) console.log(`[allocia-web] ✔ Backend OK: ${url} (HTTP ${res.status})`);
    else console.error(`[allocia-web] ✖ El backend respondió HTTP ${res.status} en ${url}/catalog`);
  } catch (err) {
    const e = err as { name?: string; message?: string; cause?: { code?: string; message?: string } };
    const reason = e.name === "TimeoutError" ? "timeout de 10 s" : `${e.cause?.code ?? ""} ${e.cause?.message ?? e.message ?? ""}`.trim();
    console.error(`[allocia-web] ✖ No se pudo contactar al backend ${url}: ${reason}`);
  }
}
