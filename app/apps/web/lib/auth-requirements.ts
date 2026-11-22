/**
 * Requisitos del formulario de ingreso y de alta. Es la misma regla que antes habilitaba el botón
 * (nombre ≥ 2, email > 3 caracteres, contraseña ≥ 12 en el alta o ≥ 1 al ingresar, privacidad aceptada),
 * ahora expresada como la lista de lo que falta para poder avisárselo a la persona.
 */
export const PASSWORD_MIN_REGISTER = 12;

export type AuthField = "name" | "email" | "password" | "privacy";

export interface AuthInput {
  mode: "login" | "register";
  name: string;
  email: string;
  password: string;
  privacyAccepted: boolean;
}

/** Campos que faltan, en el orden en que aparecen en la pantalla. */
export function missingFields({ mode, name, email, password, privacyAccepted }: AuthInput): AuthField[] {
  const login = mode === "login";
  const out: AuthField[] = [];
  if (!login && name.trim().length < 2) out.push("name");
  if (email.trim().length <= 3) out.push("email");
  if (password.length < (login ? 1 : PASSWORD_MIN_REGISTER)) out.push("password");
  if (!login && !privacyAccepted) out.push("privacy");
  return out;
}

const LABEL: Record<AuthField, string> = {
  name: "tu nombre",
  email: "un email",
  password: "una contraseña de al menos 12 caracteres",
  privacy: "aceptar la política de privacidad",
};

/** «Para crear tu cuenta falta: tu nombre, un email y aceptar la política de privacidad.» */
export function missingMessage(mode: "login" | "register", missing: AuthField[]): string {
  const labels = missing.map((f) => (mode === "login" && f === "email" ? "tu email" : mode === "login" && f === "password" ? "tu contraseña" : LABEL[f]));
  const list = labels.length > 1 ? `${labels.slice(0, -1).join(", ")} y ${labels[labels.length - 1]}` : labels[0] ?? "";
  return `Para ${mode === "login" ? "iniciar sesión" : "crear tu cuenta"} falta: ${list}.`;
}

/** Aviso mientras se escribe la contraseña del alta: cuánto falta para el mínimo. */
export function passwordHint(password: string): string | null {
  const faltan = PASSWORD_MIN_REGISTER - password.length;
  if (password.length === 0 || faltan <= 0) return null;
  return `Te ${faltan === 1 ? "falta 1 carácter" : `faltan ${faltan} caracteres`} (mínimo ${PASSWORD_MIN_REGISTER}).`;
}
