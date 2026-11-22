/**
 * Colores del tema para estilos en línea y atributos SVG (donde no se pueden usar clases de Tailwind). Son las mismas variables
 * que emite tailwind.config.ts, así que cambian con el tema claro/oscuro.
 */
export const themeColor = {
  danger: "rgb(var(--c-danger))",
  warnAccent: "rgb(var(--c-warn-accent))",
  muted: "rgb(var(--c-muted))",
  ink: "rgb(var(--c-ink))",
  card: "rgb(var(--c-card))",
} as const;

/** Color i de la paleta categórica de los gráficos (--cat-0…--cat-5). */
export const categoricalVar = (i: number, size = 6): string => `var(--cat-${((i % size) + size) % size})`;
