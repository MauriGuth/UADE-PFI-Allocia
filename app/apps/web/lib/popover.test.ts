import { expect, it } from "vitest";
import { placePopover } from "./popover";

const vp = { width: 1440, height: 900 };
const size = { width: 304, height: 260 };

it("va debajo del ancla, alineada a su borde izquierdo, cuando entra", () => {
  const p = placePopover({ left: 400, top: 300, right: 700, bottom: 340 }, size, vp);
  expect(p).toEqual({ left: 400, top: 346, side: "below" });
});

it("se desplaza para no salirse por la derecha (última columna)", () => {
  const p = placePopover({ left: 1300, top: 300, right: 1432, bottom: 340 }, size, vp);
  expect(p.left + size.width).toBeLessThanOrEqual(vp.width - 8);
  expect(p.left).toBe(vp.width - size.width - 8);
});

it("no se sale por la izquierda", () => {
  expect(placePopover({ left: -20, top: 100, right: 100, bottom: 140 }, size, vp).left).toBe(8);
});

it("pasa arriba cuando abajo no entra y arriba sí", () => {
  const p = placePopover({ left: 400, top: 800, right: 700, bottom: 840 }, size, vp);
  expect(p.side).toBe("above");
  expect(p.top).toBe(800 - 6 - size.height);
});

it("si no entra en ningún lado, queda dentro de la ventana", () => {
  const small = { width: 1440, height: 300 };
  const p = placePopover({ left: 400, top: 140, right: 700, bottom: 180 }, size, small);
  expect(p.top).toBeGreaterThanOrEqual(8);
  expect(p.top + size.height).toBeLessThanOrEqual(small.height - 8);
});
