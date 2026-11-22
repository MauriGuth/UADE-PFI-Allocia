// Geometría del medidor de Fear & Greed (semicírculo de 0 a 100). Funciones puras para poder probarlas:
// el ángulo de la aguja sale del puntaje real y los cinco tramos del arco dividen la escala en quintos iguales.

export const GAUGE_MIN = 0;
export const GAUGE_MAX = 100;

/** Puntaje válido (0–100) o null. Un dato ausente o fuera de rango no se dibuja como si fuera cero. */
export function validScore(score: number | null | undefined): number | null {
  return typeof score === "number" && Number.isFinite(score) && score >= GAUGE_MIN && score <= GAUGE_MAX ? score : null;
}

/** Rotación de la aguja en grados: −90° (0, extremo izquierdo) · 0° (50, vertical) · +90° (100, extremo derecho). */
export function scoreRotation(score: number | null | undefined): number | null {
  const s = validScore(score);
  return s === null ? null : (s / GAUGE_MAX) * 180 - 90;
}

/** Colores atenuados de los cinco tramos: rojo, naranja, ámbar, salvia y verde. */
export const GAUGE_COLORS = ["#d9776e", "#e5985c", "#e4c46a", "#a9c28f", "#67a97a"] as const;

/** Tramo (0–4) al que pertenece un puntaje: quintos iguales (0–20, 20–40, …, 80–100). */
export function segmentIndex(score: number | null | undefined): number | null {
  const s = validScore(score);
  return s === null ? null : Math.min(Math.floor(s / 20), 4);
}

/** Punto sobre un círculo; `deg` es el ángulo matemático (180° = izquierda, 0° = derecha) y el eje y crece hacia abajo. */
export function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
}

/** Arco SVG (trazo) entre dos ángulos, recorrido por arriba de izquierda a derecha. */
export function arcPath(cx: number, cy: number, r: number, fromDeg: number, toDeg: number): string {
  const [x1, y1] = polar(cx, cy, r, fromDeg);
  const [x2, y2] = polar(cx, cy, r, toDeg);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/** Los cinco tramos del arco con una pequeña separación entre ellos (los extremos no se recortan). */
export function gaugeSegments(cx: number, cy: number, r: number, gapDeg = 2): { d: string; color: string }[] {
  return GAUGE_COLORS.map((color, i) => {
    const from = 180 - i * 36 - (i > 0 ? gapDeg / 2 : 0);
    const to = 180 - (i + 1) * 36 + (i < 4 ? gapDeg / 2 : 0);
    return { d: arcPath(cx, cy, r, from, to), color };
  });
}
