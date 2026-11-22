"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Diálogo de confirmación accesible (reemplaza Alert.alert de la app móvil):
 * foco atrapado, Esc para cancelar y restauración del foco al cerrar.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = "Cancelar",
  destructive,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  // onCancel suele ser una función inline: se guarda en un ref para que el foco
  // no se reinicie en cada render del padre.
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancelRef.current();
      }
      if (e.key === "Tab" && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>("button:not([disabled])");
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 !m-0 grid place-items-center bg-primary/40 p-4 backdrop-blur-[2px]">
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dlg-title"
        aria-describedby="dlg-desc"
        className="w-full max-w-sm animate-pop-in rounded-card bg-card p-6 shadow-pop"
      >
        <h2 id="dlg-title" className="text-lg font-semibold text-ink">
          {title}
        </h2>
        <div id="dlg-desc" className="mt-2 text-sm leading-6 text-soft">
          {children}
        </div>
        <div className="mt-6 flex justify-end gap-2.5">
          <button ref={cancelRef} type="button" onClick={onCancel} className="btn-secondary btn-sm">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`${destructive ? "btn-danger" : "btn-primary"} btn-sm`}
          >
            {busy ? "Un momento…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
