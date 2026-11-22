import { describe, expect, it } from "vitest";
import { barLabel, barWidth } from "./bars";

describe("barras de exposición", () => {
  it("un 0 % real no pinta relleno", () => {
    expect(barWidth(0)).toBe(0);
    expect(barLabel(0)).toBe("0 %");
  });

  it("un dato ausente no se ve como cero", () => {
    for (const missing of [null, undefined, Number.NaN]) {
      expect(barWidth(missing)).toBe(0);
      expect(barLabel(missing)).toBe("—");
    }
  });

  it("etiqueta y barra coinciden: un valor positivo menor a 1 % no se rotula «0 %» y queda visible", () => {
    expect(barLabel(0.004)).toBe("0.4 %");
    expect(barWidth(0.004)).toBe(1.5);
    expect(barLabel(0.0005)).not.toBe("0 %");
  });

  it("el ancho sigue al peso y no se pasa de 100", () => {
    expect(barWidth(0.34)).toBeCloseTo(34);
    expect(barWidth(1)).toBe(100);
    expect(barWidth(1.2)).toBe(100);
    expect(barLabel(0.34)).toBe("34 %");
  });
});
