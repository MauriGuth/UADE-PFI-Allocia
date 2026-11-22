import { pubColors } from "./tokens";
// Demonstration data used only by the decorative showcase panels on /login and /registro.

export const SHOWCASE_ALLOCATION = [
  { label: "Acciones", value: 42, color: pubColors.chart1 },
  { label: "Cripto", value: 20, color: "#6d8bff" },
  { label: "Renta fija", value: 18, color: pubColors.chart4 },
  { label: "Commodities", value: 12, color: "#9aa0bf" },
  { label: "Efectivo", value: 8, color: pubColors.chart5 },
] as const;

export const MARKET_REGIONS = ["EE.UU.", "Europa", "Asia", "LatAm"] as const;
export type MarketRegion = (typeof MARKET_REGIONS)[number];

export const MARKETS_BY_REGION: Record<MarketRegion, { name: string; change: number }[]> = {
  "EE.UU.": [
    { name: "S&P 500", change: 1.2 },
    { name: "Nasdaq", change: 1.8 },
    { name: "BTC", change: 3.4 },
    { name: "Oro", change: -0.6 },
  ],
  Europa: [
    { name: "Euro Stoxx", change: 0.7 },
    { name: "DAX", change: 0.9 },
    { name: "FTSE 100", change: -0.3 },
    { name: "Brent", change: 1.1 },
  ],
  Asia: [
    { name: "Nikkei", change: 1.4 },
    { name: "Hang Seng", change: -1.2 },
    { name: "KOSPI", change: 0.5 },
    { name: "Cobre", change: 2.1 },
  ],
  LatAm: [
    { name: "Merval", change: 2.6 },
    { name: "Bovespa", change: 0.8 },
    { name: "IPC MX", change: -0.4 },
    { name: "Soja", change: 1.5 },
  ],
};

export const SHOWCASE_SERIES = [86, 92, 89, 98, 96, 104, 101, 108, 112, 109, 117, 114, 121, 119, 125.4];
export const SHOWCASE_MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago"];

export function formatChange(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1).replace(".", ",")}%`;
}
