import { describe, expect, it } from "vitest";
import { colors } from "./tokens";

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

describe("contraste de los colores de texto (WCAG 2.1 AA, 4,5:1)", () => {
  for (const fondo of ["card", "bg", "containerLow"] as const) {
    it(`el texto secundario sobre ${fondo} alcanza 4,5:1`, () => {
      expect(contrast(colors.muted, colors[fondo])).toBeGreaterThanOrEqual(4.5);
    });
    it(`la tinta suave sobre ${fondo} alcanza 4,5:1`, () => {
      expect(contrast(colors.inkSoft, colors[fondo])).toBeGreaterThanOrEqual(4.5);
    });
  }
});
