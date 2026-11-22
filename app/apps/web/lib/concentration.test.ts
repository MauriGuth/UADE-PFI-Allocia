import { expect, test } from "vitest";
import { effectiveNReading, fmtEffectiveN, hhiSegmentPosition } from "./concentration";

test("las posiciones efectivas se redondean a un decimal con coma", () => {
  expect(fmtEffectiveN(4.26)).toBe("4,3");
  expect(fmtEffectiveN(2)).toBe("2");
});

test("la lectura concreta usa singular o plural según corresponda", () => {
  expect(effectiveNReading(4.26)).toBe("Tu cartera se comporta como si tuviera 4,3 posiciones");
  expect(effectiveNReading(1.04)).toBe("Tu cartera se comporta como si tuviera 1 posición");
});

test("la posición del HHI en la escala respeta los umbrales del análisis", () => {
  // 1802 cae en «moderada», poco menos de un tercio dentro del tramo.
  const mod = hhiSegmentPosition(1802);
  expect(mod.index).toBe(1);
  expect(mod.frac).toBeCloseTo(0.302, 3);
  // Los bordes pertenecen al tramo que decide el backend: 1500 es baja, 2500 es moderada.
  expect(hhiSegmentPosition(1500)).toEqual({ index: 0, frac: 1 });
  expect(hhiSegmentPosition(1501).index).toBe(1);
  expect(hhiSegmentPosition(2500)).toEqual({ index: 1, frac: 1 });
  expect(hhiSegmentPosition(2501).index).toBe(2);
  // Extremos y datos inválidos nunca salen de la escala.
  expect(hhiSegmentPosition(0)).toEqual({ index: 0, frac: 0 });
  expect(hhiSegmentPosition(10000)).toEqual({ index: 2, frac: 1 });
  expect(hhiSegmentPosition(25000)).toEqual({ index: 2, frac: 1 });
  expect(hhiSegmentPosition(Number.NaN)).toEqual({ index: 0, frac: 0 });
});
