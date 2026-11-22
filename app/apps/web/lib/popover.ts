/** Rectángulo en coordenadas de la ventana (como `getBoundingClientRect`). */
export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface Placement {
  left: number;
  top: number;
  side: "below" | "above";
}

/**
 * Coloca una vista previa flotante junto a su ancla sin salirse de la ventana: debajo si entra, arriba si no, y si no
 * entra en ninguno de los dos lados, del lado con más espacio y ajustada a los bordes. Horizontalmente se alinea con el
 * borde izquierdo del ancla y se desplaza lo necesario para quedar dentro (p. ej. la última columna).
 */
export function placePopover(
  anchor: Box,
  size: { width: number; height: number },
  viewport: { width: number; height: number },
  margin = 8,
  gap = 6,
): Placement {
  const maxLeft = Math.max(viewport.width - size.width - margin, margin);
  const left = Math.min(Math.max(anchor.left, margin), maxLeft);
  const roomBelow = viewport.height - anchor.bottom - gap - margin;
  const roomAbove = anchor.top - gap - margin;
  const side: "below" | "above" =
    size.height <= roomBelow ? "below" : size.height <= roomAbove ? "above" : roomBelow >= roomAbove ? "below" : "above";
  const raw = side === "below" ? anchor.bottom + gap : anchor.top - gap - size.height;
  const maxTop = Math.max(viewport.height - size.height - margin, margin);
  return { left, top: Math.min(Math.max(raw, margin), maxTop), side };
}
