import type { ReactNode } from "react";
import { IconRefresh, IconWifiOff, IconX } from "../icons";

/**
 * Confirmación persistente (p. ej. «Posición guardada»): queda visible hasta la
 * siguiente acción o hasta que la persona la cierre con la X. El contenedor
 * role="status" existe siempre para que los lectores de pantalla anuncien el
 * cambio; cuando no hay mensaje, es invisible.
 */
export function StatusNotice({ message, onClose }: { message: string | null; onClose: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={
        message
          ? "flex items-start justify-between gap-3 rounded-field bg-ok-bg px-3.5 py-3 text-[13px] font-medium leading-5 text-ok"
          : "sr-only"
      }
    >
      {message ? (
        <>
          <span>{message}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar aviso"
            className="-m-1 shrink-0 rounded-md p-1 text-ok transition-colors hover:bg-ok/10"
          >
            <IconX size={16} />
          </button>
        </>
      ) : null}
    </div>
  );
}

export function LoadingState({ label = "Cargando…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3 py-2">
      <span className="sr-only">{label}</span>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-[92px] rounded-card" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2" aria-hidden="true">
        <div className="skeleton h-64 rounded-card" />
        <div className="skeleton h-64 rounded-card" />
      </div>
      <p className="text-base text-soft" aria-hidden="true">
        {label}
      </p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const offline = /conexión/i.test(message);
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-card border border-line bg-card px-6 py-10 text-center shadow-card"
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-danger-bg text-danger">
        <IconWifiOff size={22} />
      </span>
      <p className="text-base font-semibold text-ink">
        {offline ? "Sin conexión con el servidor" : "No se pudo cargar la información"}
      </p>
      <p className="text-base leading-[19px] text-danger">
        {offline ? message : message}
      </p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="btn-secondary btn-sm mt-1">
          <IconRefresh size={16} /> Reintentar
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
  icon,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-14 text-center">
      {icon ? <div className="text-secondary">{icon}</div> : null}
      <h2 className="mt-3.5 text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-[13.5px] leading-5 text-soft">{children}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
