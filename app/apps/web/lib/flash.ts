"use client";

// Mensaje de confirmación que sobrevive a una navegación (p. ej. eliminar una
// posición desde su detalle y volver a Cartera). Vive en sessionStorage y se
// consume una sola vez; si el almacenamiento no está disponible, se ignora.
const KEY = "allocia:flash";

export function setFlash(message: string) {
  try {
    window.sessionStorage.setItem(KEY, message);
  } catch {
    /* almacenamiento no disponible */
  }
}

export function takeFlash(): string | null {
  try {
    const m = window.sessionStorage.getItem(KEY);
    if (m) window.sessionStorage.removeItem(KEY);
    return m;
  } catch {
    return null;
  }
}
