"use client";

import type { ReactNode } from "react";
import type { AsyncState } from "@/lib/use-async";
import { ErrorState, LoadingState } from "./states";

/** Renderiza los estados de carga / error / datos de un useAsync. */
export function Resource<T>({
  state,
  loadingLabel,
  children,
}: {
  state: AsyncState<T>;
  loadingLabel?: string;
  children: (data: T) => ReactNode;
}) {
  if (state.error && state.data === null) return <ErrorState message={state.error} onRetry={state.reload} />;
  if (state.data === null) return <LoadingState label={loadingLabel} />;
  return (
    <>
      {state.error && (
        <p role="alert" className="alert-error mb-3 flex flex-wrap items-center justify-between gap-2">
          <span>No se pudo actualizar: {state.error}</span>
          <button type="button" onClick={state.reload} className="font-semibold underline">
            Reintentar
          </button>
        </p>
      )}
      {children(state.data)}
    </>
  );
}
