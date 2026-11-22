import { describe, expect, it } from "vitest";
import { GAUGE_COLORS, arcPath, gaugeSegments, polar, scoreRotation, segmentIndex, validScore } from "./fear-greed";

describe("medidor de Fear & Greed", () => {
  it("la aguja cubre toda la escala 0–100 de forma lineal", () => {
    expect(scoreRotation(0)).toBe(-90);
    expect(scoreRotation(50)).toBe(0);
    expect(scoreRotation(100)).toBe(90);
    expect(scoreRotation(25)).toBeCloseTo(-45);
    expect(scoreRotation(75)).toBeCloseTo(45);
    expect(scoreRotation(10)).toBeCloseTo(-72); // el puntaje real de hoy en producción
  });

  it("un puntaje ausente o fuera de rango no dibuja la aguja (no se toma como cero)", () => {
    for (const bad of [null, undefined, Number.NaN, -1, 101, Infinity]) {
      expect(validScore(bad)).toBeNull();
      expect(scoreRotation(bad)).toBeNull();
      expect(segmentIndex(bad)).toBeNull();
    }
  });

  it("los tramos son quintos iguales y 100 cae en el último", () => {
    expect(segmentIndex(0)).toBe(0);
    expect(segmentIndex(19.99)).toBe(0);
    expect(segmentIndex(20)).toBe(1);
    expect(segmentIndex(50)).toBe(2);
    expect(segmentIndex(79.9)).toBe(3);
    expect(segmentIndex(80)).toBe(4);
    expect(segmentIndex(100)).toBe(4);
  });

  it("la aguja a 0 y a 100 queda sobre la línea base (nunca debajo del pivote, donde va el texto)", () => {
    const [lx, ly] = polar(150, 140, 100, 180 - (0 / 100) * 180);
    const [rx, ry] = polar(150, 140, 100, 180 - (100 / 100) * 180);
    expect(lx).toBeCloseTo(50);
    expect(rx).toBeCloseTo(250);
    expect(ly).toBeCloseTo(140);
    expect(ry).toBeCloseTo(140);
    // en cualquier puntaje el extremo de la aguja está por encima (o sobre) la línea base
    for (let s = 0; s <= 100; s += 5) expect(polar(150, 140, 100, 180 - (s / 100) * 180)[1]).toBeLessThanOrEqual(140.0001);
  });

  it("arma cinco tramos continuos de izquierda a derecha", () => {
    const segs = gaugeSegments(150, 140, 125);
    expect(segs).toHaveLength(5);
    expect(segs.map((s) => s.color)).toEqual([...GAUGE_COLORS]);
    expect(segs[0].d.startsWith("M 25.00 140.00")).toBe(true); // extremo izquierdo del arco
    expect(segs[4].d.endsWith("275.00 140.00")).toBe(true); // extremo derecho
    expect(arcPath(150, 140, 125, 180, 0)).toBe("M 25.00 140.00 A 125 125 0 0 1 275.00 140.00");
  });
});
