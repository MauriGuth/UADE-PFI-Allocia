// Sistema de diseño de Allocia móvil: los mismos colores que la web (apps/web/lib/theme-tokens.ts), en claro y en el
// oscuro «azul noche» de la marca. Las pantallas no leen colores fijos: piden el tema activo con `useTheme()` y crean sus
// estilos con `makeStyles`, así todo cambia junto cuando el usuario pasa de claro a oscuro.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { StyleSheet, useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";

const lightColors = {
  // Marca
  primary: "#091426", // navy: botón principal
  onPrimary: "#ffffff",
  primaryContainer: "#1e293b",
  secondary: "#4b41e1", // índigo
  onSecondary: "#ffffff",
  secondaryFixed: "#e2dfff",
  onSecondaryFixed: "#0f0069",

  // Superficies
  bg: "#f7f9fb",
  card: "#ffffff",
  containerLow: "#f2f4f6",
  container: "#eceef0",
  containerHigh: "#e6e8ea",

  // Tinta
  ink: "#191c1e",
  inkSoft: "#45474c",
  muted: "#75777d",
  faint: "#9a9ca1",
  border: "#e0e3e5",
  outlineVariant: "#c5c6cd",

  // Estados
  red: "#ba1a1a",
  onRed: "#ffffff",
  redBg: "#ffdad6",
  amber: "#8a5a00",
  amberBg: "#f3e3c3",
  amberAccent: "#d97706",
  sky: "#3323cc",
  skyBg: "#e2dfff",
  green: "#1b6e4b",
  greenBg: "#d2ecdf",

  brand: "#4b41e1",
  brandDark: "#3323cc",

  // Vidrio (barra inferior, burbujas) y detalles de gráficos
  glass: "rgba(255,255,255,0.82)",
  glassBorder: "rgba(9,20,38,0.08)",
  glassHighlight: "rgba(255,255,255,0.95)",
  glassShadow: "#091426",
  pill: "rgba(255,255,255,0.96)",
  pillBorder: "rgba(75,65,225,0.16)",
  scrim: "rgba(9,20,38,0.36)",
  gaugeNeedle: "#1f2540",
  donutEdge: "rgba(255,255,255,0.55)",
  // Escala violeta de los medidores (sin connotación de «bueno/malo»)
  scale1: "#c8cbfb",
  scale2: "#5b3ee6",
  scale3: "#3b1478",
  // Tarjeta principal (valor total): igual en ambos temas, navy profundo con luz índigo.
  heroTop: "#0d1733",
  heroBottom: "#0a1226",
  heroGlow: "#5b50f0",
};

export type Palette = typeof lightColors;

const darkColors: Palette = {
  primary: "#c9d1e6",
  onPrimary: "#0a1122",
  primaryContainer: "#e8ecf6",
  secondary: "#a49dff",
  onSecondary: "#0a1122",
  secondaryFixed: "#262a73",
  onSecondaryFixed: "#e2dfff",

  bg: "#0a1122",
  card: "#131c32",
  containerLow: "#182339",
  container: "#1d2a45",
  containerHigh: "#243252",

  ink: "#e8ecf6",
  inkSoft: "#b6bfd3",
  muted: "#8f9ab2",
  faint: "#6f7a93",
  border: "#26324f",
  outlineVariant: "#3a4870",

  red: "#ff9a95",
  onRed: "#1a0708",
  redBg: "#3b1a24",
  amber: "#f2b455",
  amberBg: "#3a2d14",
  amberAccent: "#f59e0b",
  sky: "#c9c4ff",
  skyBg: "#262a73",
  green: "#6fd3a1",
  greenBg: "#14382b",

  brand: "#a49dff",
  brandDark: "#c9c4ff",

  glass: "rgba(22,31,54,0.86)",
  glassBorder: "rgba(255,255,255,0.10)",
  glassHighlight: "rgba(255,255,255,0.14)",
  glassShadow: "#000000",
  pill: "rgba(52,64,104,0.92)",
  pillBorder: "rgba(164,157,255,0.32)",
  scrim: "rgba(0,0,0,0.55)",
  gaugeNeedle: "#e8ecf6",
  donutEdge: "rgba(255,255,255,0.08)",
  scale1: "#3d4a7a",
  scale2: "#7b6cf6",
  scale3: "#d3a6ff",
  heroTop: "#0d1733",
  heroBottom: "#0a1226",
  heroGlow: "#5b50f0",
};

// Paleta categórica de los gráficos, en el orden fijo de los wireframes. En oscuro el grupo principal es un índigo
// luminoso (un aro casi blanco se leía como un borde de luz, no como dato).
const lightCategorical = ["#091426", "#4b41e1", "#bcc7de", "#c3c0ff", "#75777d", "#c8963e"];
const darkCategorical = ["#7b83ff", "#c7bcff", "#56679a", "#a9b8e8", "#8a93a8", "#e0a94f"];

export const palettes = { light: lightColors, dark: darkColors } as const;
export const categoricalPalettes = { light: lightCategorical, dark: darkCategorical } as const;

/** Colores del tema claro. Se conservan para código no visual y pruebas; las pantallas usan `useTheme()`. */
export const colors = lightColors;
export const categorical = lightCategorical;

export const fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
};

export type Scheme = "light" | "dark";
export type ThemePreference = "system" | Scheme;

export interface Theme {
  scheme: Scheme;
  c: Palette;
  cat: string[];
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

const THEME_KEY = "allocia.theme";

const ThemeContext = createContext<Theme>({
  scheme: "light",
  c: lightColors,
  cat: lightCategorical,
  preference: "system",
  setPreference: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPref] = useState<ThemePreference>("system");
  useEffect(() => {
    let alive = true;
    SecureStore.getItemAsync(THEME_KEY)
      .then((v) => {
        if (alive && (v === "light" || v === "dark" || v === "system")) setPref(v);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const setPreference = useCallback((p: ThemePreference) => {
    setPref(p);
    SecureStore.setItemAsync(THEME_KEY, p).catch(() => {});
  }, []);
  const scheme: Scheme = preference === "system" ? (system === "dark" ? "dark" : "light") : preference;
  const value = useMemo<Theme>(
    () => ({ scheme, c: palettes[scheme], cat: [...categoricalPalettes[scheme]], preference, setPreference }),
    [scheme, preference, setPreference],
  );
  return React.createElement(ThemeContext.Provider, { value }, children);
}

export const useTheme = () => useContext(ThemeContext);

/**
 * Estilos que dependen del tema: `const useS = makeStyles((c) => ({ ... }))` y, dentro del componente, `const s = useS()`.
 * Cada tema se calcula una sola vez.
 */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(factory: (c: Palette, scheme: Scheme) => T) {
  const cache: Partial<Record<Scheme, T>> = {};
  return function useStyles(): T {
    const { scheme, c } = useTheme();
    return (cache[scheme] ??= StyleSheet.create(factory(c, scheme)));
  };
}

/** «#4b41e1» + alfa → «rgba(75,65,225,α)». */
export function alpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${a})`;
}
