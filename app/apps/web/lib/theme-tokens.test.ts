import { describe, expect, it } from "vitest";
import { categorical, colors } from "./tokens";
import { pubColors } from "./pub/tokens";
import { appThemeColors, categoricalThemeColors, hexToRgb, pubThemeColors, themeVars } from "./theme-tokens";

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) =>
    v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const HEX = /^#[0-9a-f]{6}$/i;
const dark = (name: keyof typeof appThemeColors) => appThemeColors[name][1];
const pdark = (name: keyof typeof pubThemeColors) => pubThemeColors[name][1];

describe("temas: paridad del tema claro con los tokens de siempre", () => {
  it("el claro de la app sale de lib/tokens.ts", () => {
    expect(appThemeColors.card[0]).toBe(colors.card);
    expect(appThemeColors.ink[0]).toBe(colors.ink);
    expect(appThemeColors.secondary[0]).toBe(colors.secondary);
    expect(appThemeColors.danger[0]).toBe(colors.red);
  });
  it("el claro de las páginas públicas sale de lib/pub/tokens.ts", () => {
    expect(pubThemeColors.ink[0]).toBe(pubColors.ink);
    expect(pubThemeColors.primary[0]).toBe(pubColors.primary);
  });
  it("la paleta categórica clara conserva el orden y los valores de los wireframes", () => {
    expect(categoricalThemeColors.map((p) => p[0])).toEqual([...categorical]);
  });
  it("todos los valores son hex válidos", () => {
    for (const [, [l, d]] of [...Object.entries(appThemeColors), ...Object.entries(pubThemeColors), ...Object.entries(categoricalThemeColors)]) {
      expect(l).toMatch(HEX);
      expect(d).toMatch(HEX);
    }
  });
  it("hexToRgb y themeVars emiten el formato de las variables", () => {
    expect(hexToRgb("#4b41e1")).toBe("75 65 225");
    expect(themeVars(0)["--c-card"]).toBe("255 255 255");
    expect(themeVars(1)["--c-card"]).toBe(hexToRgb("#131c32"));
    expect(themeVars(1)["--cat-0"]).toBe("#7b83ff");
  });
});

describe("tema oscuro de la app: contraste de los pares de texto (WCAG AA, 4,5:1)", () => {
  const sobre = ["card", "canvas", "bg", "low"] as const;
  for (const fondo of sobre) {
    it(`tinta, tinta suave y texto secundario sobre ${fondo}`, () => {
      expect(contrast(dark("ink"), dark(fondo))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(dark("soft"), dark(fondo))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(dark("muted"), dark(fondo))).toBeGreaterThanOrEqual(4.5);
    });
    it(`enlaces índigo y estados (peligro, aviso, ok) sobre ${fondo}`, () => {
      for (const c of ["secondary", "danger", "warn", "ok"] as const) expect(contrast(dark(c), dark(fondo))).toBeGreaterThanOrEqual(4.5);
    });
  }
  it("los rellenos llevan texto legible", () => {
    expect(contrast(dark("on-primary"), dark("primary"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark("on-secondary"), dark("secondary"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark("on-danger"), dark("danger"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark("on-secondary-fixed"), dark("secondary-fixed"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark("secondary"), dark("secondary-fixed"))).toBeGreaterThanOrEqual(4.5);
  });
  it("los estados sobre su fondo suave", () => {
    expect(contrast(dark("danger"), dark("danger-bg"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark("warn"), dark("warn-bg"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark("ok"), dark("ok-bg"))).toBeGreaterThanOrEqual(4.5);
  });
});

describe("tema oscuro de las páginas públicas: contraste", () => {
  it("texto sobre fondo y tarjeta", () => {
    for (const fondo of ["background", "card", "muted"] as const) {
      expect(contrast(pdark("foreground"), pdark(fondo))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(pdark("muted-foreground"), pdark(fondo))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(pdark("subtle"), pdark(fondo))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(pdark("primary"), pdark(fondo))).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("botón principal y estados", () => {
    expect(contrast(pdark("ink-foreground"), pdark("ink"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(pdark("ink-foreground"), pdark("primary"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(pdark("success"), pdark("success-soft"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(pdark("warning"), pdark("warning-soft"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(pdark("danger"), pdark("danger-soft"))).toBeGreaterThanOrEqual(4.5);
  });
});
