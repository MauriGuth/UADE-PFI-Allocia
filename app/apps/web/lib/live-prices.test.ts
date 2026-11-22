import { describe, expect, it } from "vitest";
import { changeDirection, priceFreshness } from "./live-prices";

describe("priceFreshness", () => {
  it("never claims real time and polls every 30 s while stocks trade", () => {
    const f = priceFreshness([{ assetClass: "accion", priceStatus: "recent" }, { assetClass: "cripto", priceStatus: "recent" }]);
    expect(f.mode).toBe("live");
    expect(f.label).toMatch(/demora/);
    expect(f.label).not.toMatch(/tiempo real/i);
    expect(f.intervalMs).toBe(30_000);
  });
  it("slows down when the market is closed but keeps crypto updating", () => {
    const f = priceFreshness([{ assetClass: "accion", priceStatus: "reference" }, { assetClass: "cripto", priceStatus: "recent" }]);
    expect(f.mode).toBe("closed");
    expect(f.label).toMatch(/cripto/);
    expect(f.intervalMs).toBe(60_000);
  });
  it("polls rarely when nothing can change", () => {
    const f = priceFreshness([{ assetClass: "etf", priceStatus: "reference" }]);
    expect(f.intervalMs).toBe(300_000);
    expect(f.label).toMatch(/último precio/);
  });
  it("labels demonstration prices", () => {
    expect(priceFreshness([{ assetClass: "accion", priceStatus: "demo" }]).mode).toBe("demo");
  });
});

describe("changeDirection", () => {
  it("detects up, down and ignores equal or missing values", () => {
    expect(changeDirection(100, 101)).toBe("up");
    expect(changeDirection(100, 99.5)).toBe("down");
    expect(changeDirection(100, 100)).toBeNull();
    expect(changeDirection(null, 5)).toBeNull();
  });
});
