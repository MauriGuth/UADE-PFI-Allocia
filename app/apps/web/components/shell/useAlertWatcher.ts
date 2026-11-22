"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import {
  ALERTS_CHANGED,
  newAlerts,
  notificationText,
  readPrefs,
  unreadOpportunities,
  unreadPortfolio,
  writePrefs,
  type AlertRef,
} from "@/lib/alert-notifications";
import { showNotification } from "@/lib/browser-notifications";

const POLL_MS = 60_000;
// El feed de oportunidades es más pesado: se consulta con menos frecuencia que las alertas de cartera.
const OPPORTUNITIES_EVERY_MS = 5 * 60_000;

/** Con la pestaña oculta o sin foco el contador no se ve: ahí corresponde el aviso del sistema. */
const pageNotVisible = () => document.visibilityState === "hidden" || !document.hasFocus();

function notifyNew(userId: string, unread: AlertRef[]) {
  const prefs = readPrefs(userId);
  if (!prefs.enabled) return;
  const ids = unread.map((alert) => alert.id);
  if (!prefs.seeded) {
    // Recién activado: lo ya pendiente no genera avisos, solo lo que llegue después.
    writePrefs(userId, { enabled: true, seeded: true, seen: ids });
    return;
  }
  const fresh = newAlerts(unread, new Set(prefs.seen));
  if (!fresh.length) return;
  // Se recuerda antes de avisar, también si la pestaña está a la vista: ya vio el contador.
  writePrefs(userId, { ...prefs, seen: [...prefs.seen, ...fresh.map((alert) => alert.id)] });
  if (!pageNotVisible()) return;
  const { title, body } = notificationText(fresh);
  void showNotification(title, body, `allocia-alerts-${fresh[fresh.length - 1].id}`);
}

/** Consulta las alertas cada minuto: devuelve el contador de sin leer y dispara los avisos del navegador. */
export function useAlertWatcher(userId: string): { unread: number } {
  const [unread, setUnread] = useState(0);
  const pathname = usePathname();
  const running = useRef(false);
  const opportunities = useRef<{ at: number; alerts: AlertRef[] }>({ at: 0, alerts: [] });

  const check = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      const portfolio = unreadPortfolio(await api.marketAlerts());
      if (Date.now() - opportunities.current.at >= OPPORTUNITIES_EVERY_MS) {
        try {
          opportunities.current = { at: Date.now(), alerts: unreadOpportunities(await api.opportunities()) };
        } catch {
          // se conserva el último resultado conocido
        }
      }
      const all = [...portfolio, ...opportunities.current.alerts];
      setUnread(all.length);
      notifyNew(userId, all);
    } catch {
      // sin conexión o sesión vencida (el cliente ya redirige al login): se reintenta en el próximo ciclo
    } finally {
      running.current = false;
    }
  }, [userId]);

  useEffect(() => {
    const timer = window.setInterval(() => void check(), POLL_MS);
    const onFocus = () => void check();
    const onAlertsChanged = () => {
      // tras leer alertas el feed de oportunidades también cambió
      opportunities.current.at = 0;
      void check();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener(ALERTS_CHANGED, onAlertsChanged);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(ALERTS_CHANGED, onAlertsChanged);
    };
  }, [check]);

  // Consulta inicial y, al navegar dentro de la app (p. ej. después de abrir Alertas), el contador se actualiza enseguida.
  useEffect(() => {
    void check();
  }, [pathname, check]);

  return { unread };
}
