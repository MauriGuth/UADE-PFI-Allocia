// Design tokens de Allocia Web. Los valores son los mismos que define la app
// móvil en apps/mobile/lib/theme.ts (que a su vez sigue el sistema "Portfolio
// Intelligence System" de los wireframes). Si la paleta móvil cambia, este es
// el único archivo web que hay que actualizar: tailwind.config.ts y los
// gráficos SVG leen de acá.
export const colors = {
  // Marca
  primary: "#091426", // navy
  primaryContainer: "#1e293b",
  secondary: "#4b41e1", // índigo
  secondaryFixed: "#e2dfff",
  onSecondaryFixed: "#0f0069",

  // Superficies
  bg: "#f7f9fb",
  // Lienzo del panel autenticado (gris frío del rediseño); los paneles son blancos encima.
  canvas: "#f1f3f9",
  card: "#ffffff",
  containerLow: "#f2f4f6",
  container: "#eceef0",
  containerHigh: "#e6e8ea",

  // Tinta
  ink: "#191c1e",
  inkSoft: "#45474c",
  muted: "#6a6c72",
  faint: "#9a9ca1",
  border: "#e3e6f0",
  outlineVariant: "#c5c6cd",

  // Estados
  red: "#ba1a1a",
  redBg: "#ffdad6",
  amber: "#8a5a00",
  amberBg: "#f3e3c3",
  amberAccent: "#d97706", // borde/punto de severidad moderada y evento de impacto medio
  sky: "#3323cc",
  skyBg: "#e2dfff",
  green: "#1b6e4b",
  greenBg: "#d2ecdf",

  brand: "#4b41e1",
  brandDark: "#3323cc",
} as const;

// Paleta categórica de los gráficos, en el orden fijo de los wireframes.
export const categorical = [
  "#091426",
  "#4b41e1",
  "#bcc7de",
  "#c3c0ff",
  "#75777d",
  "#c8963e",
] as const;

export const fontFamily = "Inter";
