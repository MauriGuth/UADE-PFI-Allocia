const fs = require("node:fs");
const failures = [];
const apiOnly = process.argv.includes("--api-only");
const required = [
  "DATABASE_URL", "REDIS_URL", "JWT_SECRET", "HOLDINGS_ENCRYPTION_KEY",
  "WEB_ORIGINS", "ANTHROPIC_API_KEY", "ANTHROPIC_MODEL", "FINNHUB_API_KEY",
  "COINGECKO_API_KEY", "MARKET_UNIVERSE_FILE",
  "PUBLIC_WEB_URL", "BFF_SIGNING_SECRET",
  ...(!apiOnly ? ["MARKET_CALENDAR_FILE", "RESEND_API_KEY", "MAIL_FROM"] : []),
];
for (const name of required) if (!process.env[name]) failures.push(`Falta ${name}`);
if ((process.env.JWT_SECRET ?? "").length < 32) failures.push("JWT_SECRET debe tener al menos 32 caracteres");
if ((process.env.BFF_SIGNING_SECRET ?? "").length < 32) failures.push("BFF_SIGNING_SECRET debe tener al menos 32 caracteres");
try {
  const url = new URL(process.env.PUBLIC_WEB_URL ?? '');
  if(url.protocol !== 'https:' || url.origin !== process.env.PUBLIC_WEB_URL) throw new Error();
} catch { failures.push('PUBLIC_WEB_URL debe ser un origen HTTPS sin ruta'); }
if (process.env.MAIL_FROM && /@(?:resend\.dev|example\.(?:com|invalid))\b/i.test(process.env.MAIL_FROM)) failures.push('MAIL_FROM requiere un remitente real de un dominio propio verificado');
try {
  if (Buffer.from(process.env.HOLDINGS_ENCRYPTION_KEY ?? "", "base64").length !== 32) throw new Error();
} catch { failures.push("HOLDINGS_ENCRYPTION_KEY debe contener 32 bytes en base64"); }
for (const origin of (process.env.WEB_ORIGINS ?? "").split(",").filter(Boolean)) {
  try { if (new URL(origin).origin !== origin || !origin.startsWith("https://")) throw new Error(); }
  catch { failures.push(`Origen web inválido: ${origin}`); }
}
for (const name of ["MARKET_UNIVERSE_FILE", "MARKET_CALENDAR_FILE"]) {
  const file = process.env[name];
  if (file && !fs.existsSync(file)) failures.push(`${name} no existe`);
  else if (file) try { JSON.parse(fs.readFileSync(file, "utf8")); } catch { failures.push(`${name} no contiene JSON válido`); }
}
if (process.env.PUSH_ENABLED === "true" && !process.env.EXPO_ACCESS_TOKEN) failures.push("Falta EXPO_ACCESS_TOKEN");
if (process.env.NODE_ENV !== "production") failures.push("NODE_ENV debe ser production");
if (process.env.DB_SYNCHRONIZE === "true") failures.push("DB_SYNCHRONIZE no puede activarse");

if (failures.length) {
  console.error(`NO APTO PARA PRODUCCIÓN (${failures.length} bloqueos)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  if (apiOnly) console.log("API únicamente: correo y scheduler requieren habilitación y validación independientes.");
  console.log("Configuración mínima de producción presente. Aún se requieren pruebas de infraestructura, dispositivos y revisión legal.");
}
