import { expect, test } from "vitest";
import { observationRule, observationScope } from "./observations";
import type { Evidence } from "./types";

const dato: Evidence = { tipo: "dato del portafolio", descripcion: "Peso de AAPL", valor: "32 %", fuente: "Módulo de análisis" };
const regla: Evidence = { tipo: "regla", descripcion: "Umbral aplicado", valor: "peso de una posición > 25 %", fuente: "Motor" };
const senal: Evidence = { tipo: "señal externa", descripcion: "GPR", valor: "130", fuente: "GPR Index" };

test("las observaciones calculadas solo con la cartera son «Sobre tu cartera»", () => {
  expect(observationScope({ categoria: "concentración", evidencia: [dato, regla] })).toBe("cartera");
  expect(observationScope({ categoria: "diversificación", evidencia: [dato, regla] })).toBe("cartera");
  expect(observationScope({ categoria: "exposición", evidencia: [dato, regla] })).toBe("cartera");
});

test("las que combinan una señal externa son «Contexto externo»", () => {
  expect(observationScope({ categoria: "contexto", evidencia: [senal, regla] })).toBe("externo");
  expect(observationScope({ categoria: "señales", evidencia: [senal, regla] })).toBe("externo");
  expect(observationScope({ categoria: "exposición", evidencia: [dato, senal, regla] })).toBe("externo");
});

test("la regla aplicada se extrae de la evidencia de tipo «regla»", () => {
  expect(observationRule({ evidencia: [dato, regla] })).toBe("peso de una posición > 25 %");
  expect(observationRule({ evidencia: [dato] })).toBeNull();
});
