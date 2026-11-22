import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ApiError, api, isWrongPassword } from "./client";

const assign = vi.fn();
function respond(status: number, message: string) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ message }), { status })));
}
beforeEach(() => {
  assign.mockReset();
  vi.stubGlobal("window", { location: { assign } });
});
afterEach(() => vi.unstubAllGlobals());

test("Una contraseña incorrecta en la baja informa el error y no cierra la sesión", async () => {
  respond(401, "Contraseña incorrecta");
  const error = (await api.deleteAccount("mala").catch((e: unknown) => e)) as ApiError;
  expect(error).toBeInstanceOf(ApiError);
  expect(error.message).toBe("Contraseña incorrecta");
  expect(error.status).toBe(401);
  expect(assign).not.toHaveBeenCalled();
});

test("Una sesión inválida o vencida redirige al acceso", async () => {
  respond(401, "Sesión inválida o vencida");
  await api.holdings().catch(() => undefined);
  expect(assign).toHaveBeenCalledWith("/login?expired=1");
});

test("Sólo el mensaje de contraseña incorrecta se distingue de una sesión vencida", () => {
  expect(isWrongPassword("Contraseña incorrecta")).toBe(true);
  expect(isWrongPassword("contraseña incorrecta.")).toBe(true);
  for (const m of ["Sesión requerida", "Sesión inválida o vencida", "Cuenta inexistente", undefined]) expect(isWrongPassword(m)).toBe(false);
});
