import { pct } from "./format";

/**
 * Etiqueta del porcentaje de una barra. Sin decimales, salvo un valor positivo menor a 1 %: ahí un «0 %»
 * contradiría a la barra visible, así que se muestra con un decimal. Un dato ausente no se muestra como cero.
 */
export function barLabel(weight: number | null | undefined): string {
  if (weight == null || !Number.isFinite(weight)) return "—";
  return pct(weight, weight > 0 && weight < 0.01 ? 1 : 0);
}

/** Ancho de la barra en %. Un 0 real no pinta relleno; un valor positivo muy chico queda visible (mín. 1,5 %). */
export function barWidth(weight: number | null | undefined): number {
  if (weight == null || !Number.isFinite(weight) || weight <= 0) return 0;
  return Math.min(Math.max(weight * 100, 1.5), 100);
}
