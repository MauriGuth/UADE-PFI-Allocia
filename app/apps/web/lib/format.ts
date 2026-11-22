// Formateo y etiquetas compartidas (mismas reglas que apps/mobile/lib/api.ts).
export const CLASS_LABELS: Record<string, string> = {
  accion: "Acciones",
  etf: "ETFs",
  cripto: "Cripto",
  stablecoin: "Stablecoins",
};

export const classLabel = (k: string) => CLASS_LABELS[k] ?? k;

export const fmtUsd = (v: number) => "US$ " + Math.round(v).toLocaleString("es-AR");

export const fmtUsdExact = (v: number) =>
  "US$ " +
  v.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtPct = (w: number, digits = 1) => `${(w * 100).toFixed(digits)} %`;

export const fmtQty = (q: number) => q.toLocaleString("es-AR", { maximumFractionDigits: 8 });

// ── Formato para PANTALLA ───────────────────────────────────────────────────────────────────────
// Mismos dígitos, mismo redondeo y mismo separador decimal que fmtPct / fmtUsd (los de siempre: «26.1 %»),
// con un espacio de no separación para que el número nunca se corte de su unidad («26.1» arriba y «%» abajo).
const NBSP = " ";

/** Porcentaje para mostrar: `pct(0.261)` → «26.1 %». Un valor ausente no se muestra como cero: «—». */
export function pct(w: number | null | undefined, digits = 1): string {
  if (w == null || !Number.isFinite(w)) return "—";
  return `${(w * 100).toFixed(digits)}${NBSP}%`;
}

/** Dólares redondeados para mostrar: `usd(1962.3)` → «US$ 1.962». */
export function usd(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return `US$${NBSP}${Math.round(v).toLocaleString("es-AR")}`;
}

/** Dólares con centavos para mostrar: `usdExact(1962.3)` → «US$ 1.962,30». */
export function usdExact(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return `US$${NBSP}${v.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// La cantidad se guarda como numeric(18,8) en el backend: hasta 10 dígitos
// enteros y 8 decimales. Superarlo provoca un error 500 de la base de datos.
export const MAX_INT_DIGITS = 10;
export const MAX_DECIMALS = 8;
export const MAX_QUANTITY = 1_000_000_000;

/** Filtra lo tipeado/pegado en un campo de cantidad: solo dígitos y un separador decimal. */
export function sanitizeQuantityInput(raw: string): string {
  const s = raw.replace(/[^\d.,]/g, "");
  const i = s.search(/[.,]/);
  if (i < 0) return s.slice(0, MAX_INT_DIGITS);
  const int = s.slice(0, i).slice(0, MAX_INT_DIGITS);
  const dec = s.slice(i + 1).replace(/[.,]/g, "").slice(0, MAX_DECIMALS);
  return `${int}${s[i]}${dec}`;
}

/** Filtra un ticker: mayúsculas, dígitos, punto y guion (p. ej. BRK.B). */
export function sanitizeTickerInput(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9.\-]/g, "").slice(0, 12);
}

/** Cantidad lista para editar: sin separador de miles ni notación científica. */
export function quantityToInput(q: number): string {
  return q.toFixed(MAX_DECIMALS).replace(/\.?0+$/, "").replace(".", ",");
}

/** Acepta coma o punto decimal ("1,5" → 1.5). Devuelve NaN si no es un número. */
export function parseQuantity(raw: string): number {
  const s = raw.trim().replace(",", ".");
  if (!/^\d*\.?\d+$|^\d+\.$/.test(s)) return NaN;
  return Number(s);
}

/** Escapa un valor para CSV (RFC 4180) y neutraliza fórmulas de planilla. */
export function csvCell(value: string | number): string {
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}
