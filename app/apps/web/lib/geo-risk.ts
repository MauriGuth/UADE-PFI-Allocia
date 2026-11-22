/**
 * Posición del índice de riesgo geopolítico (GPR, media móvil de 30 días) en la escala de tres tramos. Mismos umbrales que
 * el backend (`gprLevel`): por encima de 120 es elevado, de 80 a 120 moderado y por debajo de 80 bajo. Cada tramo ocupa un
 * tercio de la escala; el elevado se dibuja hasta 200 y un valor mayor queda en el extremo (el valor real se lee escrito).
 */
export const GPR_MODERATE_FROM = 80;
export const GPR_ELEVATED_ABOVE = 120;
const GPR_SCALE_END = 200;

export function gprSegmentPosition(gpr: number): { index: 0 | 1 | 2; frac: number } {
  const v = Number.isFinite(gpr) ? Math.max(gpr, 0) : 0;
  if (v > GPR_ELEVATED_ABOVE) return { index: 2, frac: Math.min((v - GPR_ELEVATED_ABOVE) / (GPR_SCALE_END - GPR_ELEVATED_ABOVE), 1) };
  if (v >= GPR_MODERATE_FROM) return { index: 1, frac: (v - GPR_MODERATE_FROM) / (GPR_ELEVATED_ABOVE - GPR_MODERATE_FROM) };
  return { index: 0, frac: v / GPR_MODERATE_FROM };
}
