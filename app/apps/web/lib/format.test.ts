import { describe, expect, it } from "vitest";
import {
  capitalize,
  csvCell,
  fmtPct,
  fmtUsd,
  parseQuantity,
  pct,
  quantityToInput,
  sanitizeQuantityInput,
  sanitizeTickerInput,
  toCsv,
  usd,
  usdExact,
} from "./format";

describe("format", () => {
  it("formatea USD y porcentajes como la app móvil", () => {
    expect(fmtUsd(39961.4)).toBe("US$ " + (39961).toLocaleString("es-AR"));
    expect(fmtPct(0.5123)).toBe("51.2 %");
    expect(fmtPct(0.5123, 0)).toBe("51 %");
  });

  it("formatea para pantalla con locale es-AR, sin separar el número de su unidad", () => {
    // Mismos dígitos que fmtPct / fmtUsd; mismo separador decimal; solo cambia el espacio no separable.
    expect(pct(0.261)).toBe("26.1 %");
    expect(pct(0.5123, 0)).toBe("51 %");
    expect(pct(0)).toBe("0.0 %");
    expect(pct(1)).toBe("100.0 %");
    expect(pct(0.5123).replace(/ /g, " ")).toBe(fmtPct(0.5123));
    expect(usd(1962.3)).toBe("US$ 1.962");
    expect(usdExact(349.4)).toBe("US$ 349,40");
    // Un dato ausente nunca se muestra como 0.
    expect(pct(null)).toBe("—");
    expect(pct(undefined)).toBe("—");
    expect(pct(Number.NaN)).toBe("—");
    expect(usd(null)).toBe("—");
  });

  it("parsea cantidades con coma o punto", () => {
    expect(parseQuantity("1,5")).toBe(1.5);
    expect(parseQuantity(" 10 ")).toBe(10);
    expect(parseQuantity("0.25")).toBe(0.25);
    expect(parseQuantity("")).toBeNaN();
    expect(parseQuantity("abc")).toBeNaN();
    expect(parseQuantity("-3")).toBeNaN();
    expect(parseQuantity("1e3")).toBeNaN();
  });

  it("capitaliza", () => {
    expect(capitalize("moderada")).toBe("Moderada");
    expect(capitalize("")).toBe("");
  });

  it("escapa CSV y neutraliza fórmulas", () => {
    expect(csvCell('a"b')).toBe('"a""b"');
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(toCsv([["a", 1], ["b,c", 2]])).toBe('a,1\r\n"b,c",2');
  });

  it("sanitiza cantidades: solo dígitos y un separador decimal", () => {
    expect(sanitizeQuantityInput("d")).toBe("");
    expect(sanitizeQuantityInput("12abc3")).toBe("123");
    expect(sanitizeQuantityInput("1,5")).toBe("1,5");
    expect(sanitizeQuantityInput("1.5.7")).toBe("1.57");
    expect(sanitizeQuantityInput("-5")).toBe("5");
    expect(sanitizeQuantityInput("1e3")).toBe("13");
    expect(sanitizeQuantityInput("12345678901")).toBe("1234567890"); // 10 dígitos enteros máx.
    expect(sanitizeQuantityInput("0,123456789")).toBe("0,12345678"); // 8 decimales máx.
    expect(sanitizeQuantityInput("1,2,3")).toBe("1,23");
  });

  it("sanitiza tickers", () => {
    expect(sanitizeTickerInput("aapl ")).toBe("AAPL");
    expect(sanitizeTickerInput("brk.b")).toBe("BRK.B");
    expect(sanitizeTickerInput("a$p<l>")).toBe("APL");
  });

  it("convierte cantidades al formato de edición", () => {
    expect(quantityToInput(10)).toBe("10");
    expect(quantityToInput(100)).toBe("100");
    expect(quantityToInput(0.12)).toBe("0,12");
    expect(quantityToInput(1.5)).toBe("1,5");
    expect(quantityToInput(0.00000001)).toBe("0,00000001");
  });
});
