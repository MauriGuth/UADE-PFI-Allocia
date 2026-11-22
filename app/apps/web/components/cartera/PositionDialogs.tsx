"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { api } from "@/lib/client";
import { MAX_QUANTITY, fmtQty, parseQuantity, quantityToInput, sanitizeQuantityInput } from "@/lib/format";
import type { HoldingPosition } from "@/lib/types";
import { ConfirmDialog } from "../ui/confirm-dialog";

/** Diálogo para editar la cantidad (equivalente a Alert.prompt de la app móvil). */
function QuantityDialog({
  position,
  onClose,
  onSaved,
  onError,
}: {
  position: HoldingPosition;
  onClose: () => void;
  onSaved: (quantity: number) => void;
  onError: (m: string) => void;
}) {
  const id = useId();
  const [value, setValue] = useState(quantityToInput(position.quantity));
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    input.current?.select();
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseQuantity(value);
    if (!(qty > 0)) {
      setErr("Ingresá una cantidad mayor a cero.");
      return;
    }
    if (qty > MAX_QUANTITY) {
      setErr(`La cantidad no puede superar ${fmtQty(MAX_QUANTITY)}.`);
      return;
    }
    setBusy(true);
    try {
      await api.updatePosition(position.id, qty);
      onSaved(qty);
    } catch (e2) {
      onError(e2 instanceof Error ? e2.message : "Error inesperado");
    } finally {
      setBusy(false);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 !m-0 grid place-items-center bg-primary/40 p-4 backdrop-blur-[2px]">
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        className="w-full max-w-sm animate-pop-in rounded-card bg-card p-6 shadow-pop"
      >
        <h2 id={`${id}-t`} className="text-lg font-semibold text-ink">
          Editar {position.ticker}
        </h2>
        <p className="mt-1 text-[13px] text-soft">
          {position.name} · cantidad actual {fmtQty(position.quantity)}
        </p>
        <label htmlFor={id} className="field-label mt-5">
          Nueva cantidad
        </label>
        <input
          id={id}
          ref={input}
          className="input"
          inputMode="decimal"
          pattern="[0-9]*[.,]?[0-9]*"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(sanitizeQuantityInput(e.target.value));
            setErr(null);
          }}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `${id}-e` : `${id}-h`}
        />
        <p id={`${id}-h`} className="mt-1.5 text-[11px] leading-4 text-muted">
          Cantidad de unidades del activo, no el dinero invertido (p. ej. 2 para dos acciones; 0,1 para una décima de bitcoin).
        </p>
        {err && (
          <p id={`${id}-e`} role="alert" className="alert-error mt-2">
            {err}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="btn-secondary btn-sm">
            Cancelar
          </button>
          <button type="submit" disabled={busy} className="btn-primary btn-sm">
            {busy ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Acciones de edición/eliminación de una posición, compartidas por la tabla de
 * Cartera, el Desglose y el detalle de activo.
 */
export function usePositionDialogs({
  onChanged,
  onError,
  onNotice,
  onRemoved,
}: {
  onChanged: () => void | Promise<void>;
  onError: (m: string) => void;
  /** Confirmación persistente («Cantidad actualizada…», «Posición eliminada…»). */
  onNotice?: (m: string) => void;
  onRemoved?: (p: HoldingPosition) => void;
}) {
  const [editing, setEditing] = useState<HoldingPosition | null>(null);
  const [removing, setRemoving] = useState<HoldingPosition | null>(null);
  const [busy, setBusy] = useState(false);

  const closeEdit = useCallback(() => setEditing(null), []);

  const dialogs = (
    <>
      {editing && (
        <QuantityDialog
          key={editing.id}
          position={editing}
          onClose={closeEdit}
          onSaved={(qty) => {
            // La confirmación aparece cuando la lista ya se recargó: antes salía de inmediato y, si se volvía a
            // abrir «Editar» en ese instante, el diálogo mostraba la cantidad anterior (la lista aún no se había actualizado).
            const message = `Cantidad actualizada: ahora tenés ${fmtQty(qty)} de ${editing.ticker}.`;
            void Promise.resolve(onChanged()).finally(() => onNotice?.(message));
          }}
          onError={onError}
        />
      )}
      <ConfirmDialog
        open={removing !== null}
        title="Eliminar posición"
        confirmLabel="Eliminar"
        destructive
        busy={busy}
        onCancel={() => setRemoving(null)}
        onConfirm={async () => {
          if (!removing) return;
          setBusy(true);
          try {
            await api.removePosition(removing.id);
            const done = removing;
            setRemoving(null);
            onNotice?.(`Posición eliminada: ${done.ticker} ya no está en tu cartera.`);
            await onChanged();
            onRemoved?.(done);
          } catch (e) {
            setRemoving(null);
            onError(e instanceof Error ? e.message : "Error inesperado");
          } finally {
            setBusy(false);
          }
        }}
      >
        ¿Quitar <strong className="text-ink">{removing?.ticker}</strong> de la cartera?
      </ConfirmDialog>
    </>
  );

  return { edit: setEditing, remove: setRemoving, dialogs };
}
