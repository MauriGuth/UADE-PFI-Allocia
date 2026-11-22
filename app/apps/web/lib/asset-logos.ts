// Logos locales de respaldo. Se usan solo si la API no devuelve el logo del activo
// (GET /catalog/:ticker/logo). Fuentes y licencias: public/brand/assets/SOURCES.md.
// Clave: ticker en mayúsculas; `assetClass` evita confundir tickers iguales de clases distintas.
export interface LocalLogo {
  src: string;
  /** Si se indica, el logo solo aplica a esa clase de activo. */
  assetClass?: string;
  source: string;
}

export const LOCAL_LOGOS: Record<string, LocalLogo> = {
  AAPL: { src: "/brand/assets/aapl.svg", assetClass: "accion", source: "Simple Icons (CC0)" },
  BTC: { src: "/brand/assets/btc.svg", assetClass: "cripto", source: "Simple Icons (CC0)" },
};

export function localLogoFor(ticker: string, assetClass?: string): LocalLogo | null {
  const hit = LOCAL_LOGOS[ticker.toUpperCase()];
  if (!hit) return null;
  if (hit.assetClass && assetClass && hit.assetClass !== assetClass) return null;
  return hit;
}
