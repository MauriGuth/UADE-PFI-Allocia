import { describe, expect, it } from "vitest";
import { classDetails } from "./composition";

describe("classDetails", () => {
  it("agrupa por clase: cantidad de posiciones y valor en USD", () => {
    const d = classDetails([
      { assetClass: "accion", value: 100 },
      { assetClass: "accion", value: 50.5 },
      { assetClass: "etf", value: 20 },
      { assetClass: "cripto", value: 5 },
    ]);
    expect(d.accion).toEqual({ count: 2, value: 150.5 });
    expect(d.etf).toEqual({ count: 1, value: 20 });
    expect(d.cripto).toEqual({ count: 1, value: 5 });
  });

  it("una posición sin cotización cuenta como posición pero no suma USD", () => {
    const d = classDetails([
      { assetClass: "accion", value: null },
      { assetClass: "accion", value: 10 },
    ]);
    expect(d.accion).toEqual({ count: 2, value: 10 });
  });

  it("sin posiciones no inventa clases", () => {
    expect(classDetails([])).toEqual({});
  });
});

import { bucketHoldings, PREVIEW_LIMIT } from "./composition";

describe("bucketHoldings", () => {
  // Cartera de ejemplo: los pesos suman 1 y cada posición pertenece a un único grupo por dimensión.
  const P = (id: number, ticker: string, assetClass: string, sector: string, region: string, weight: number | null) => ({
    id, ticker, name: `${ticker} Inc.`, assetClass, sector, region, currency: "USD", weight,
  });
  const positions = [
    P(1, "AMZN", "accion", "Consumo discrecional", "EE.UU.", 0.256),
    P(2, "XOM", "accion", "Energía", "EE.UU.", 0.2),
    P(3, "CVX", "accion", "Energía", "EE.UU.", 0.14),
    P(4, "YPF", "accion", "Energía", "Argentina", 0.1),
    P(5, "MELI", "accion", "Consumo discrecional", "Argentina", 0.05),
    P(6, "SPY", "etf", "Diversificado", "Global", 0.14),
    P(7, "BTC", "cripto", "Infraestructura cripto", "Global", 0.114),
  ];

  it("lista de mayor a menor aporte y cuenta todas las posiciones del grupo", () => {
    const r = bucketHoldings(positions, "class", "accion", 0.746);
    expect(r.holdings.map((h) => h.ticker)).toEqual(["AMZN", "XOM", "CVX", "YPF", "MELI"]);
    expect(r.count).toBe(5);
    expect(r.hidden).toBe(0);
    expect(r.coveredWeight).toBeCloseTo(0.746, 6);
    expect(r.consistent).toBe(true);
  });

  it("usa la misma clave que las barras en cada dimensión", () => {
    expect(bucketHoldings(positions, "sector", "Energía", 0.44).holdings.map((h) => h.ticker)).toEqual(["XOM", "CVX", "YPF"]);
    expect(bucketHoldings(positions, "region", "Global", 0.254).holdings.map((h) => h.ticker)).toEqual(["SPY", "BTC"]);
    expect(bucketHoldings(positions, "currency", "USD", 1).count).toBe(7);
  });

  it("limita la lista y dice cuántas quedan fuera; la suma sigue siendo la del grupo", () => {
    const r = bucketHoldings(positions, "currency", "USD", 1);
    expect(r.holdings).toHaveLength(PREVIEW_LIMIT);
    expect(r.hidden).toBe(2);
    expect(r.coveredWeight).toBeCloseTo(1, 6);
    expect(r.consistent).toBe(true);
  });

  it("si el detalle no explica la barra, no lo da por bueno", () => {
    // El grupo pesa 30 % pero las posiciones suman 25,6 %: se muestra solo el agregado.
    expect(bucketHoldings(positions, "sector", "Consumo discrecional", 0.4).consistent).toBe(false);
    // Un grupo sin posiciones nunca es «consistente».
    expect(bucketHoldings(positions, "sector", "Salud", 0.1)).toMatchObject({ count: 0, consistent: false });
  });

  it("una posición sin peso no se cuenta ni se toma como cero", () => {
    const r = bucketHoldings([...positions, P(8, "NEW", "accion", "Energía", "EE.UU.", null)], "sector", "Energía", 0.44);
    expect(r.count).toBe(3);
    expect(r.holdings.map((h) => h.ticker)).not.toContain("NEW");
  });
});
