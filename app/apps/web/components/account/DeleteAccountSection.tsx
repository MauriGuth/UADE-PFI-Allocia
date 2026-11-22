"use client";

import { type FormEvent, useId, useState } from "react";
import { api } from "@/lib/client";
import { Download, Lock, UserRoundX } from "lucide-react";

/** Descarga la exportación existente (GET /auth/export) como JSON. */
export async function downloadExport() {
  const data = await api.exportData();
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "allocia-mis-datos.json";
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Sección «Eliminar tu cuenta», separada de «Cerrar sesión». Mantiene el flujo
 * de baja existente (contraseña + casilla + DELETE /auth/me); solo cambia la
 * presentación: explicación, recordatorio de exportar y luego la confirmación.
 */
export function DeleteAccountSection({
  className = "",
  layout = "stacked",
}: {
  className?: string;
  /** «stacked»: una columna (páginas angostas como Cuenta y privacidad); «wide»: cada paso en una fila con la acción a la derecha (Ajustes). */
  layout?: "stacked" | "wide";
}) {
  const wide = layout === "wide";
  const id = useId();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  async function exportFirst() {
    setExportMessage("");
    setError("");
    try {
      await downloadExport();
      setExportMessage("Listo: descargamos «allocia-mis-datos.json» con tus posiciones y preferencias.");
    } catch {
      setError("No se pudieron exportar tus datos.");
    }
  }

  async function remove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const password = String(new FormData(event.currentTarget).get("password"));
    try {
      await api.deleteAccount(password);
      window.location.assign("/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar la cuenta");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      id="eliminar-cuenta"
      aria-labelledby={`${id}-h`}
      className={`overflow-hidden rounded-card border border-line bg-card shadow-card ${className}`}
    >
      {/* Encabezado sobrio: el rojo queda solo en el ícono y en el botón final, no en toda la tarjeta. */}
      <header className="flex items-center gap-4 p-5 sm:p-6">
        {/* Ícono: una persona con una cruz (se borra la cuenta, no un archivo), en un círculo con aro y luz suave. */}
        <span aria-hidden="true" className="danger-badge relative grid h-12 w-12 shrink-0 place-items-center rounded-full text-danger">
          <UserRoundX className="relative size-[22px]" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h2 id={`${id}-h`} className="font-heading text-xl font-extrabold leading-7 text-ink">
            Eliminar tu cuenta
          </h2>
          <p className="mt-0.5 text-sm leading-5 text-soft">
            Borra tu cuenta, tus posiciones, alertas y dispositivos. No se puede deshacer.
          </p>
        </div>
      </header>

      <div className="divide-y divide-line border-t border-line">
        {/* Paso 1 (opcional): guardar una copia. */}
        <div className={`p-5 sm:p-6 ${wide ? "lg:flex lg:items-center lg:justify-between lg:gap-8" : ""}`}>
          <div className="flex items-start gap-3">
            <Download aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-soft" />
            <p className="text-sm leading-5 text-ink">Antes de seguir, podés guardar una copia de tu información.</p>
          </div>
          <button type="button" onClick={exportFirst} className={`btn-secondary btn-sm mt-3 w-full sm:w-auto ${wide ? "lg:mt-0 lg:shrink-0" : ""}`}>
            Exportar mis datos antes de eliminar
          </button>
        </div>
        {exportMessage ? <p className="px-5 pb-4 text-xs leading-4 text-soft sm:px-6">{exportMessage}</p> : null}

        {/* Paso 2: confirmar y eliminar. */}
        <form onSubmit={remove} className={`p-5 sm:p-6 ${wide ? "lg:flex lg:items-end lg:justify-between lg:gap-8" : ""}`}>
          <div className="space-y-3.5 lg:min-w-0 lg:flex-1">
            <label className="block text-sm font-medium text-ink">
              Confirmá tu contraseña
              <span className="relative mt-1.5 block max-w-sm">
                <Lock aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input name="password" type="password" required autoComplete="current-password" className="input pl-10 font-normal" />
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink">
              <input type="checkbox" required className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer accent-danger" />
              Entiendo que se eliminarán la cuenta y sus posiciones.
            </label>
            {error ? (
              <p role="alert" className="alert-error">
                {error}
              </p>
            ) : null}
          </div>
          <button disabled={busy} className={`btn-danger btn-sm mt-4 w-full sm:w-auto ${wide ? "lg:mt-0 lg:shrink-0" : ""}`}>
            {busy ? "Eliminando…" : "Eliminar mi cuenta y datos"}
          </button>
        </form>
      </div>
    </section>
  );
}
