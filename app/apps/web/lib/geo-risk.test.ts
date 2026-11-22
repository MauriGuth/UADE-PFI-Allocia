import { expect, test } from "vitest";
import { gprSegmentPosition } from "./geo-risk";

test("los tramos siguen los umbrales del backend: >120 elevado, 80–120 moderado, <80 bajo", () => {
  expect(gprSegmentPosition(151.5).index).toBe(2);
  expect(gprSegmentPosition(151.5).frac).toBeCloseTo(0.394, 3);
  // Los bordes los decide el backend: 120 todavía es moderado y 80 ya es moderado.
  expect(gprSegmentPosition(120)).toEqual({ index: 1, frac: 1 });
  expect(gprSegmentPosition(120.1).index).toBe(2);
  expect(gprSegmentPosition(80)).toEqual({ index: 1, frac: 0 });
  expect(gprSegmentPosition(79.9).index).toBe(0);
  expect(gprSegmentPosition(100).frac).toBeCloseTo(0.5, 6);
});

test("los extremos y los datos inválidos no salen de la escala", () => {
  expect(gprSegmentPosition(0)).toEqual({ index: 0, frac: 0 });
  expect(gprSegmentPosition(-5)).toEqual({ index: 0, frac: 0 });
  expect(gprSegmentPosition(200)).toEqual({ index: 2, frac: 1 });
  expect(gprSegmentPosition(900)).toEqual({ index: 2, frac: 1 });
  expect(gprSegmentPosition(Number.NaN)).toEqual({ index: 0, frac: 0 });
});
