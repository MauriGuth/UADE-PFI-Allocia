/** Detalle por clase de activo para la vista previa del donut: cuántas posiciones y cuánto valen en USD. */
export interface ClassDetail {
  count: number;
  value: number;
}

/**
 * Agrupa las posiciones por clase de activo. Una posición sin valor (cotización no disponible) cuenta como
 * posición pero no suma USD: nunca se toma como cero.
 */
export function classDetails(
  positions: { assetClass: string; value: number | null }[],
): Record<string, ClassDetail> {
  const out: Record<string, ClassDetail> = {};
  for (const p of positions) {
    const d = (out[p.assetClass] ??= { count: 0, value: 0 });
    d.count += 1;
    if (p.value != null && Number.isFinite(p.value)) d.value += p.value;
  }
  return out;
}

// ── Vista previa de posiciones por barra de Composición ─────────────────────────────────────────
// Cada posición pertenece por completo a un único grupo de cada dimensión (el backend agrupa con `groupBy` sobre
// `p.assetClass`, `p.sector`, `p.region` y `p.currency`), así que su aporte al grupo es su peso en la cartera.
export type CompositionDimension = "class" | "sector" | "region" | "currency";

/** Cantidad máxima de posiciones que se listan en la vista previa. */
export const PREVIEW_LIMIT = 5;

export interface HoldingLike {
  id: number;
  ticker: string;
  name: string;
  assetClass: string;
  sector: string;
  region: string;
  currency: string;
  weight: number | null;
}

export interface BucketHolding {
  id: number;
  ticker: string;
  name: string;
  assetClass: string;
  /** Aporte al grupo = peso de la posición en la cartera (0–1). */
  weight: number;
}

export interface BucketHoldings {
  /** Hasta `limit` posiciones, de mayor a menor aporte. */
  holdings: BucketHolding[];
  /** Cuántas posiciones aportan al grupo en total. */
  count: number;
  /** Cuántas quedaron fuera de la lista. */
  hidden: number;
  /** Suma de los aportes de todas las posiciones del grupo (0–1). */
  coveredWeight: number;
  /** El detalle explica la barra: hay posiciones y su suma coincide con el peso del grupo (±0,5 punto). */
  consistent: boolean;
}

const KEY_OF: Record<CompositionDimension, (p: HoldingLike) => string> = {
  class: (p) => p.assetClass,
  sector: (p) => p.sector,
  region: (p) => p.region,
  currency: (p) => p.currency,
};

/**
 * Posiciones que aportan a un grupo de Composición, con las mismas reglas que las barras. `bucketWeight` es el peso del
 * grupo que muestra la barra: si la suma de las posiciones no lo explica (datos incompletos), `consistent` es falso y
 * la interfaz muestra solo el agregado en vez de una lista que no cierra.
 */
export function bucketHoldings(
  positions: HoldingLike[],
  dimension: CompositionDimension,
  key: string,
  bucketWeight: number,
  limit: number = PREVIEW_LIMIT,
): BucketHoldings {
  const matching = positions
    .filter((p) => KEY_OF[dimension](p) === key && p.weight != null && Number.isFinite(p.weight))
    .map((p) => ({ id: p.id, ticker: p.ticker, name: p.name, assetClass: p.assetClass, weight: p.weight as number }))
    .sort((a, b) => b.weight - a.weight || a.ticker.localeCompare(b.ticker));
  const coveredWeight = matching.reduce((s, p) => s + p.weight, 0);
  return {
    holdings: matching.slice(0, limit),
    count: matching.length,
    hidden: Math.max(matching.length - limit, 0),
    coveredWeight,
    consistent: matching.length > 0 && Math.abs(coveredWeight - bucketWeight) <= 0.005,
  };
}
