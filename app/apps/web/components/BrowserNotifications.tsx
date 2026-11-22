"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useAuth } from "@/components/shell/auth-context";
import { TEST_NOTIFICATION } from "@/lib/alert-notifications";
import {
  disableNotifications,
  enableNotifications,
  isEnabled,
  showNotification,
  subscribePrefs,
  support,
  type Support,
} from "@/lib/browser-notifications";

/** Panel para activar los avisos del navegador de las alertas y probarlos con un clic. */
export function BrowserNotifications() {
  const userId = String(useAuth().user.id);
  const enabled = useSyncExternalStore(
    subscribePrefs,
    () => isEnabled(userId),
    () => false,
  );
  // El permiso solo existe en el navegador: el primer render coincide con el del servidor ("default") y se lee
  // al montar. Leerlo durante el render provoca un error de hidratación cuando el permiso está bloqueado.
  const [state, setPermission] = useState<Support>("default");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => setPermission(support()), []);
  const active = enabled && state === "granted";

  async function turnOn() {
    setBusy(true);
    setNotice("");
    try {
      const result = await enableNotifications(userId);
      setPermission(result);
      if (result === "denied") setNotice("Tu navegador bloqueó las notificaciones de este sitio. Para activarlas, tocá el candado junto a la dirección y permití las notificaciones.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setNotice("");
    try {
      const shown = await showNotification(TEST_NOTIFICATION.title, TEST_NOTIFICATION.body, "allocia-prueba");
      setNotice(
        shown
          ? "Listo: te enviamos una notificación de prueba. Si no la ves, revisá que el modo «No molestar» esté desactivado y que tu sistema permita las notificaciones del navegador."
          : "No pudimos mostrar la notificación de prueba en este navegador. Revisá los permisos del sitio e intentá de nuevo.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card space-y-3" aria-labelledby="notif-titulo">
      <h2 id="notif-titulo" className="section-title !text-lg">
        Notificaciones del navegador
      </h2>
      <div className="space-y-1.5 text-sm leading-6">
        <p className="text-ink">
          Recibí un aviso cuando haya un análisis nuevo, aunque estés en otra pestaña. Funciona mientras Allocia esté abierta en el
          navegador.
        </p>
        <p className="text-soft">
          Los avisos nunca incluyen montos ni posiciones de tu cartera. ¿Querés recibirlos con la app cerrada? Activá las
          notificaciones en la app móvil.
        </p>
      </div>
      {state === "unsupported" ? (
        <p className="text-sm">Este navegador no admite notificaciones web. Probá con una versión actualizada de Chrome, Edge o Firefox.</p>
      ) : state === "denied" ? (
        <p role="status" className="text-sm">
          Las notificaciones están bloqueadas para este sitio. Para activarlas, tocá el candado junto a la dirección, permití las
          notificaciones y recargá la página.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {active ? (
            <>
              <span role="status" className="text-sm font-semibold text-secondary">
                Notificaciones activadas
              </span>
              <button className="btn-secondary btn-sm" disabled={busy} onClick={sendTest}>
                Enviar notificación de prueba
              </button>
              <button
                className="btn-secondary btn-sm"
                disabled={busy}
                onClick={() => {
                  disableNotifications(userId);
                  setNotice("Listo: desactivamos las notificaciones en este navegador. Podés volver a activarlas cuando quieras.");
                }}
              >
                Desactivar
              </button>
            </>
          ) : (
            <button className="btn-primary btn-sm" disabled={busy} onClick={turnOn}>
              Activar notificaciones del navegador
            </button>
          )}
        </div>
      )}
      {notice ? <p role="status" className="text-sm">{notice}</p> : null}
      <p className="text-xs text-soft">
        Para recibir análisis nuevos, mantené activadas las alertas de tu cartera en «Configuración y cobertura de las alertas».
      </p>
    </section>
  );
}
