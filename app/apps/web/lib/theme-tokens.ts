// Temas de Allocia Web (claro y oscuro). El claro sale de lib/tokens.ts y lib/pub/tokens.ts (los mismos valores de siempre,
// con la paridad con la app móvil); el oscuro es el «azul noche» de la marca. tailwind.config.ts convierte cada color en una
// variable CSS (`--c-<nombre>`, `--pc-<nombre>`) y emite los dos juegos de valores, así que las clases de Tailwind
// (bg-card, text-ink, bg-pub-ink…) siguen igual y cambian con el tema.
import { categorical, colors } from "./tokens";
import { pubColors } from "./pub/tokens";

type Pair = readonly [light: string, dark: string];

/** App autenticada: [claro, oscuro]. */
export const appThemeColors = {
  // Superficies: del azul noche de la marca (#091426) hacia arriba; nunca negro puro.
  bg: [colors.bg, "#0a1122"],
  canvas: [colors.canvas, "#0d1528"],
  card: [colors.card, "#131c32"],
  low: [colors.containerLow, "#182339"],
  container: [colors.container, "#1d2a45"],
  high: [colors.containerHigh, "#243252"],
  // Tinta
  ink: [colors.ink, "#e8ecf6"],
  soft: [colors.inkSoft, "#b6bfd3"],
  muted: [colors.muted, "#8f9ab2"],
  faint: [colors.faint, "#6f7a93"],
  line: [colors.border, "#26324f"],
  outline: [colors.outlineVariant, "#3a4870"],
  // Botón principal: navy sobre claro; en oscuro se invierte (claro con texto oscuro) para que no se pierda en el fondo.
  primary: [colors.primary, "#c9d1e6"],
  "primary-container": [colors.primaryContainer, "#e8ecf6"],
  "on-primary": ["#ffffff", "#0a1122"],
  // Índigo de marca: en oscuro se aclara para leerse como texto; sus rellenos llevan texto oscuro (on-secondary).
  secondary: [colors.secondary, "#a49dff"],
  "secondary-fixed": [colors.secondaryFixed, "#262a73"],
  "on-secondary-fixed": [colors.onSecondaryFixed, "#e2dfff"],
  "on-secondary": ["#ffffff", "#0a1122"],
  brand: [colors.brand, "#a49dff"],
  "brand-dark": [colors.brandDark, "#c9c4ff"],
  // Estados
  danger: [colors.red, "#ff9a95"],
  "danger-bg": [colors.redBg, "#3b1a24"],
  "on-danger": ["#ffffff", "#1a0708"],
  warn: [colors.amber, "#f2b455"],
  "warn-bg": [colors.amberBg, "#3a2d14"],
  "warn-accent": [colors.amberAccent, "#f59e0b"],
  ok: [colors.green, "#6fd3a1"],
  "ok-bg": [colors.greenBg, "#14382b"],
} as const satisfies Record<string, Pair>;

/** Páginas públicas (landing, login, registro): [claro, oscuro]. */
export const pubThemeColors = {
  background: [pubColors.background, "#0a1022"],
  foreground: [pubColors.foreground, "#e8ecf7"],
  card: [pubColors.card, "#121a2f"],
  popover: [pubColors.popover, "#121a2f"],
  primary: [pubColors.primary, "#a99cf5"],
  secondary: [pubColors.secondary, "#171f38"],
  muted: [pubColors.muted, "#171f38"],
  "muted-foreground": [pubColors.mutedForeground, "#a3a9c4"],
  subtle: [pubColors.subtle, "#8e94b0"],
  accent: [pubColors.accent, "#221f4d"],
  destructive: [pubColors.destructive, "#ff8f94"],
  border: [pubColors.border, "#262f4d"],
  input: [pubColors.input, "#2b3556"],
  ring: [pubColors.ring, "#8f7bf3"],
  // Botón principal de las páginas públicas: navy con texto blanco; en oscuro, claro con texto oscuro.
  ink: [pubColors.ink, "#e8ecf7"],
  "ink-foreground": [pubColors.inkForeground, "#0a1022"],
  success: [pubColors.success, "#5fd39a"],
  "success-soft": [pubColors.successSoft, "#12372a"],
  warning: [pubColors.warning, "#f2b15a"],
  "warning-soft": [pubColors.warningSoft, "#3a2d14"],
  danger: [pubColors.danger, "#ff8f94"],
  "danger-soft": [pubColors.dangerSoft, "#3b1a22"],
  teal: [pubColors.teal, "#2ec4b6"],
  "teal-soft": [pubColors.tealSoft, "#11353a"],
  lilac: [pubColors.lilac, "#a99cf5"],
} as const satisfies Record<string, Pair>;

/** Paleta categórica de los gráficos (mismo orden fijo que los wireframes): [claro, oscuro]. */
export const categoricalThemeColors: readonly Pair[] = [
  // En oscuro el grupo principal es un índigo luminoso (antes casi blanco: en un aro grande se veía como un anillo de
  // luz, no como dato). Lavanda y pizarra completan la familia navy/violeta.
  [categorical[0], "#7b83ff"],
  [categorical[1], "#c7bcff"],
  [categorical[2], "#56679a"],
  [categorical[3], "#a9b8e8"],
  [categorical[4], "#8a93a8"],
  [categorical[5], "#e0a94f"],
];

/** Variables sueltas por tema (superficies de vidrio, aguja del medidor, desvanecido del panel de ingreso, etc.). */
export const extraThemeVars = {
  light: {
    "--glass-bg": "rgb(255 255 255 / 0.74)",
    "--glass-ring": "rgb(9 20 38 / 0.07)",
    "--glass-shadow-1": "rgb(9 20 38 / 0.4)",
    "--glass-shadow-2": "rgb(9 20 38 / 0.22)",
    "--glass-light": "rgb(255 255 255 / 0.95)",
    "--glass-caustic": "rgb(75 65 225 / 0.14)",
    "--glass-edge": "rgb(255 255 255 / 0.6)",
    "--glass-sheen": "rgb(255 255 255 / 0.55)",
    "--glass-pill-bg": "rgb(255 255 255 / 0.94)",
    "--glass-pill-shadow": "rgb(9 20 38 / 0.3)",
    "--glass-pill-edge": "rgb(75 65 225 / 0.14)",
    "--glass-solid": "#ffffff",
    "--gauge-needle": "#1f2540",
    "--gauge-dot": "#ffffff",
    "--scale-1": "#c8cbfb",
    "--scale-2": "#5b3ee6",
    "--scale-3": "#3b1478",
    "--scale-deep": "#3b1478",
    "--scale-ring": "rgb(255 255 255 / 0.9)",
    "--scale-dot": "#ffffff",
    "--showcase-fade": "247 246 254",
    "--hero-ring": "rgb(255 255 255 / 0)",
  },
  dark: {
    "--glass-bg": "rgb(22 31 54 / 0.62)",
    "--glass-ring": "rgb(255 255 255 / 0.1)",
    "--glass-shadow-1": "rgb(0 0 0 / 0.6)",
    "--glass-shadow-2": "rgb(0 0 0 / 0.4)",
    "--glass-light": "rgb(255 255 255 / 0.2)",
    "--glass-caustic": "rgb(164 157 255 / 0.18)",
    "--glass-edge": "rgb(255 255 255 / 0.08)",
    "--glass-sheen": "rgb(255 255 255 / 0.1)",
    "--glass-pill-bg": "rgb(52 64 104 / 0.85)",
    "--glass-pill-shadow": "rgb(0 0 0 / 0.5)",
    "--glass-pill-edge": "rgb(164 157 255 / 0.3)",
    "--glass-solid": "#131c32",
    "--gauge-needle": "#e8ecf6",
    "--gauge-dot": "#0a1122",
    "--scale-1": "#3d4a7a",
    "--scale-2": "#7b6cf6",
    "--scale-3": "#d3a6ff",
    "--scale-deep": "#e8ecf6",
    "--scale-ring": "rgb(19 28 50 / 0.9)",
    "--scale-dot": "#131c32",
    "--showcase-fade": "10 16 34",
    "--hero-ring": "rgb(255 255 255 / 0.08)",
  },
} as const;

/** «#4b41e1» → «75 65 225» (formato de las variables, para poder usar `rgb(var(--x) / <alpha>)`). */
export const hexToRgb = (hex: string): string => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(" ");
};

/** Variables CSS de un tema: 0 = claro, 1 = oscuro. */
export function themeVars(index: 0 | 1): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(appThemeColors)) out[`--c-${k}`] = hexToRgb(v[index]);
  for (const [k, v] of Object.entries(pubThemeColors)) out[`--pc-${k}`] = hexToRgb(v[index]);
  categoricalThemeColors.forEach((v, i) => (out[`--cat-${i}`] = v[index]));
  Object.assign(out, index === 0 ? extraThemeVars.light : extraThemeVars.dark);
  return out;
}
