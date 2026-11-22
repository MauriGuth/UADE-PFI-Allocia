import { describe, expect, it } from "vitest";
import { missingFields, missingMessage, passwordHint } from "./auth-requirements";

const base = { mode: "register" as const, name: "Ana Pérez", email: "ana@example.test", password: "una-clave-de-12+", privacyAccepted: true };

describe("missingFields", () => {
  it("alta completa: no falta nada", () => {
    expect(missingFields(base)).toEqual([]);
  });

  it("lista lo que falta en el orden de la pantalla", () => {
    expect(missingFields({ ...base, name: "A", email: "a@", password: "corta", privacyAccepted: false })).toEqual(["name", "email", "password", "privacy"]);
  });

  it("la contraseña del alta necesita 12 caracteres; la de ingreso, uno", () => {
    expect(missingFields({ ...base, password: "12345678901" })).toEqual(["password"]);
    expect(missingFields({ ...base, password: "123456789012" })).toEqual([]);
    expect(missingFields({ mode: "login", name: "", email: "ana@example.test", password: "x", privacyAccepted: false })).toEqual([]);
  });

  it("espacios sobrantes no cuentan como nombre ni email", () => {
    expect(missingFields({ ...base, name: "   ", email: "  a  " })).toEqual(["name", "email"]);
  });

  it("al ingresar no se piden nombre ni privacidad", () => {
    expect(missingFields({ mode: "login", name: "", email: "", password: "", privacyAccepted: false })).toEqual(["email", "password"]);
  });
});

describe("mensajes", () => {
  it("explica qué falta, con «y» antes del último", () => {
    expect(missingMessage("register", ["name", "password", "privacy"])).toBe(
      "Para crear tu cuenta falta: tu nombre, una contraseña de al menos 12 caracteres y aceptar la política de privacidad.",
    );
    expect(missingMessage("register", ["privacy"])).toBe("Para crear tu cuenta falta: aceptar la política de privacidad.");
    expect(missingMessage("login", ["email", "password"])).toBe("Para iniciar sesión falta: tu email y tu contraseña.");
  });

  it("avisa cuánto falta para los 12 caracteres, sin molestar antes de escribir ni después de llegar", () => {
    expect(passwordHint("")).toBeNull();
    expect(passwordHint("contrasena1")).toBe("Te falta 1 carácter (mínimo 12).");
    expect(passwordHint("corta")).toBe("Te faltan 7 caracteres (mínimo 12).");
    expect(passwordHint("123456789012")).toBeNull();
  });
});
