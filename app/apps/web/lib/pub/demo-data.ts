import { pubColors } from "./tokens";
/**
 * DATOS DE DEMOSTRACIÓN — valores ficticios para la vista previa del landing.
 * No representan una cartera real ni constituyen asesoramiento financiero.
 */

export type RangeKey = "1M" | "3M" | "6M" | "YTD" | "1A";

export const RANGES: RangeKey[] = ["1M", "3M", "6M", "YTD", "1A"];

const SIX_MONTH_SERIES = [
  86, 92, 89.5, 90, 95.5, 94.8, 93.2, 98.6, 103.8, 101.2, 106.4, 102.8, 105.9, 110.7, 109.6, 117.8, 116.1, 119.6, 116.9,
  114.2, 116.8, 113.4, 117.2, 120.6, 120.1, 123.2, 125.43,
];

function synth(length: number, start: number, end: number, seed: number) {
  return Array.from({ length }, (_, i) => {
    const t = i / (length - 1);
    const trend = start + (end - start) * t;
    const noise = Math.sin(i * 1.7 + seed) * 2.6 + Math.cos(i * 0.9 + seed * 2) * 1.8;
    return i === length - 1 ? end : Number((trend + noise * (1 - t * 0.4)).toFixed(2));
  });
}

export const PORTFOLIO_SERIES: Record<RangeKey, { values: number[]; labels: string[]; change: string }> = {
  "1M": { values: synth(22, 121.8, 125.43, 3), labels: ["S1", "S2", "S3", "S4"], change: "+2,4%" },
  "3M": { values: synth(26, 112.5, 125.43, 1), labels: ["Jun", "Jul", "Ago"], change: "+6,1%" },
  "6M": {
    values: SIX_MONTH_SERIES,
    labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago"],
    change: "+2,4%",
  },
  YTD: {
    values: synth(28, 84, 125.43, 5),
    labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago"],
    change: "+8,7%",
  },
  "1A": {
    values: synth(30, 78, 125.43, 7),
    labels: ["Sep", "Nov", "Ene", "Mar", "May", "Jul", "Ago"],
    change: "+14,2%",
  },
};

export const ALLOCATION = [
  { name: "Acciones", value: 42, color: pubColors.chart1 },
  { name: "Bonos", value: 28, color: pubColors.chart2 },
  { name: "Criptomonedas", value: 12, color: pubColors.chart3 },
  { name: "Commodities", value: 8, color: pubColors.chart4 },
  { name: "Efectivo", value: 6, color: pubColors.chart5 },
  { name: "Otros", value: 4, color: pubColors.chart6 },
];

export const PORTFOLIO_TOTAL = 125430;

export function formatUSD(value: number) {
  return `US$ ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(value)}`;
}
