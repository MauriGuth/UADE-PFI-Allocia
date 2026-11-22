/**
 * Estado de las cotizaciones de una cartera y cada cuánto conviene volver a pedirlas.
 *
 * Proveedores (backend): Finnhub /quote para acciones y ETF de EE.UU. (último precio informado; el plan gratuito
 * limita a 60 consultas por minuto) y CoinGecko /simple/price para cripto (se actualiza alrededor de una vez por
 * minuto). El servidor guarda cada cotización 30 s y une pedidos simultáneos: varias pantallas abiertas no multiplican
 * las consultas. Ninguno de los dos se presenta como «tiempo real»: el texto dice «con demora».
 */
export interface PricedPosition {
  assetClass: string;
  priceStatus?: "recent" | "reference" | "demo";
  priceAsOf?: string;
}

export type PriceMode = "live" | "closed" | "demo" | "unknown";

export interface PriceFreshness {
  mode: PriceMode;
  /** Texto breve y honesto para mostrar junto al total. */
  label: string;
  /** Cada cuánto refrescar con la pestaña visible (ms). */
  intervalMs: number;
}

const LIVE_MS = 30_000; // igual que la caché del servidor: pedir más seguido no trae precios más nuevos
const CRYPTO_ONLY_MS = 60_000; // CoinGecko actualiza cerca de una vez por minuto
const CLOSED_MS = 5 * 60_000; // mercado cerrado y sin cripto: el último precio no cambia hasta la apertura

export function priceFreshness(positions: PricedPosition[]): PriceFreshness {
  if (!positions.length) return { mode: "unknown", label: "Sin posiciones", intervalMs: CLOSED_MS };
  if (positions.some((p) => p.priceStatus === "demo")) {
    return { mode: "demo", label: "Precios de demostración", intervalMs: LIVE_MS };
  }
  const hasCrypto = positions.some((p) => p.assetClass === "cripto");
  const recentNonCrypto = positions.some((p) => p.assetClass !== "cripto" && p.priceStatus === "recent");
  if (recentNonCrypto) {
    return { mode: "live", label: "Cotizaciones con demora de hasta 1 minuto · se actualizan solas", intervalMs: LIVE_MS };
  }
  if (hasCrypto) {
    return {
      mode: "closed",
      label: "Bolsa cerrada: acciones al último cierre · cripto se actualiza sola",
      intervalMs: CRYPTO_ONLY_MS,
    };
  }
  return { mode: "closed", label: "Bolsa cerrada: último precio disponible", intervalMs: CLOSED_MS };
}

/** Dirección del cambio entre dos valores (para marcar una suba o una baja). Ignora diferencias de redondeo. */
export function changeDirection(prev: number | null | undefined, next: number | null | undefined): "up" | "down" | null {
  if (prev == null || next == null || !Number.isFinite(prev) || !Number.isFinite(next)) return null;
  const eps = Math.max(Math.abs(prev), 1) * 1e-6;
  if (next > prev + eps) return "up";
  if (next < prev - eps) return "down";
  return null;
}
