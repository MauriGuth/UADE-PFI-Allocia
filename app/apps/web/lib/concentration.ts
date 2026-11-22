// Textos en lenguaje llano para el indicador de concentración (HHI). Los
// usuarios no entendían «HHI» ni «posiciones efectivas»; la lectura concreta
// se calcula con los datos reales de la cartera.
export const CONCENTRATION_TITLE = "Concentración (HHI)";

export const CONCENTRATION_EXPLANATION =
  "Mide qué tan repartida está tu cartera. Si tenés diez activos pero uno pesa el 60 %, se comporta como si tuvieras dos.";

export const CONCENTRATION_GLOSSARY =
  `${CONCENTRATION_TITLE}: ${CONCENTRATION_EXPLANATION} Un HHI mayor a 2500 se considera concentración alta; entre 1500 y 2500, moderada.`;

/** Redondea a un decimal y lo escribe con coma decimal («4,2»). */
export function fmtEffectiveN(effectiveN: number): string {
  const n = Math.round(effectiveN * 10) / 10;
  return n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}

/** «Tu cartera se comporta como si tuviera 4,2 posiciones». */
export function effectiveNReading(effectiveN: number): string {
  const n = Math.round(effectiveN * 10) / 10;
  return `Tu cartera se comporta como si tuviera ${fmtEffectiveN(n)} ${n === 1 ? "posición" : "posiciones"}`;
}

/**
 * Posición del HHI en la escala de tres tramos: el tramo (0 baja, 1 moderada, 2 alta) y el avance (0–1) dentro de él.
 * Mismos umbrales que el análisis del backend (`hhi > 2500` alta, `hhi > 1500` moderada, el resto baja); el tramo alto
 * llega hasta 10000. El marcador se calcula siempre a partir de este valor: no hay posiciones fijas.
 */
export function hhiSegmentPosition(hhi: number): { index: 0 | 1 | 2; frac: number } {
  const v = Number.isFinite(hhi) ? Math.min(Math.max(hhi, 0), 10000) : 0;
  if (v > 2500) return { index: 2, frac: (v - 2500) / 7500 };
  if (v > 1500) return { index: 1, frac: (v - 1500) / 1000 };
  return { index: 0, frac: v / 1500 };
}
