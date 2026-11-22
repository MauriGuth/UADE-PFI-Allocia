"use client";

import { readPrefs, writePrefs, type NotificationPrefs } from "./alert-notifications";

export type Support = "unsupported" | NotificationPermission;

/** Estado del permiso en este navegador (`unsupported` si no existe la API, p. ej. Safari sin instalar). */
export function support(): Support {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

// Store mínimo para que el panel de la pantalla Alertas y el vigía del layout se mantengan sincronizados.
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export function subscribePrefs(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener); // otra pestaña activó o desactivó
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export const isEnabled = (userId: string) => readPrefs(userId).enabled;

export function updatePrefs(userId: string, change: (prefs: NotificationPrefs) => NotificationPrefs) {
  writePrefs(userId, change(readPrefs(userId)));
  emit();
}

async function registerWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

/** Debe llamarse desde un clic: el navegador solo muestra el pedido de permiso tras un gesto del usuario. */
export async function enableNotifications(userId: string): Promise<Support> {
  if (support() === "unsupported") return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;
  await registerWorker();
  updatePrefs(userId, () => ({ enabled: true, seeded: false, seen: [] }));
  return "granted";
}

export function disableNotifications(userId: string) {
  updatePrefs(userId, () => ({ enabled: false, seeded: false, seen: [] }));
}

// El service worker hace falta en Chrome de Android (no admite `new Notification`) y permite enfocar la
// pestaña abierta al tocar el aviso. Si no hay uno activo todavía, se espera un momento a que se active.
async function activeRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const registration = (await navigator.serviceWorker.getRegistration("/")) ?? (await registerWorker());
    if (!registration) return null;
    if (registration.active) return registration;
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);
  } catch {
    return null;
  }
}

export async function showNotification(title: string, body: string, tag: string): Promise<boolean> {
  if (support() !== "granted") return false;
  const options = { body, tag, icon: "/brand/allocia-mark.png", data: { url: "/market" } };
  const registration = await activeRegistration();
  if (registration) {
    try {
      await registration.showNotification(title, options);
      return true;
    } catch {
      // cae al constructor clásico
    }
  }
  try {
    const notification = new Notification(title, options);
    notification.onclick = () => {
      window.focus();
      window.location.assign("/market");
      notification.close();
    };
    return true;
  } catch {
    return false;
  }
}
