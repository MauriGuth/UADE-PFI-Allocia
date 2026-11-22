"use client";

import { useEffect, useState } from "react";
import { IconRefresh } from "../icons";

/** «recién», «hace 12 s», «hace 3 min» o la hora, según cuánto pasó desde la última carga correcta. */
export function updatedAgo(updatedAt: number, now: number): string {
  const s = Math.max(0, Math.round((now - updatedAt) / 1000));
  if (s < 10) return "recién";
  if (s < 60) return `hace ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  return `a las ${new Date(updatedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;
}

/**
 * Estado de actualización en lugar de un botón «Actualizar»: los datos se refrescan solos, así que basta con decir
 * cuándo fue la última vez. Tocarlo actualiza en el momento (en computadora no existe el gesto de deslizar). Mientras
 * carga, el ícono gira; si la última carga falló, lo dice y ofrece reintentar.
 */
export function LiveStatus({
  updatedAt,
  busy,
  error,
  onRefresh,
  label = "Actualizar ahora",
  auto = true,
}: {
  updatedAt: number | null;
  busy: boolean;
  error?: string | null;
  onRefresh: () => void;
  /** Nombre accesible de la acción (p. ej. «Actualizar cotizaciones»). */
  label?: string;
  /** false si la pantalla no se actualiza sola. */
  auto?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 5_000);
    return () => window.clearInterval(t);
  }, []);
  const failed = !!error && !busy;
  const text = busy
    ? "Actualizando…"
    : failed
      ? "No se pudo actualizar · Reintentar"
      : updatedAt
        ? `Actualizado ${updatedAgo(updatedAt, now)}${auto ? " · se actualiza solo" : ""}`
        : "Cargando…";
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={busy}
      aria-label={`${label}. ${text}`}
      title="Tocá para actualizar ahora"
      className={`live-status ${failed ? "live-status-error" : ""}`}
    >
      <IconRefresh size={14} className={busy ? "animate-spin" : ""} />
      <span aria-live="polite">{text}</span>
    </button>
  );
}
