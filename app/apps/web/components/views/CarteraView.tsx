"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { priceFreshness } from "@/lib/live-prices";
import { api } from "@/lib/client";
import { takeFlash } from "@/lib/flash";
import { usd } from "@/lib/format";
import type { HoldingPosition } from "@/lib/types";
import { useAsync } from "@/lib/use-async";
import { HoldingsTable } from "../cartera/HoldingsTable";
import { usePositionDialogs } from "../cartera/PositionDialogs";
import { PositionForm } from "../cartera/PositionForm";
import { IconArrowRight, IconPlus } from "../icons";
import { Resource } from "../ui/resource";
import { Footer, ScreenTitle } from "../ui/primitives";
import { LiveStatus } from "../ui/LiveStatus";
import { StatusNotice } from "../ui/states";

// Pantalla "Cartera": alta de posiciones y tenencias actuales.
export function CarteraView() {
  const forceRefresh = useRef(false);
  // Ritmo de refresco según el mercado (ver lib/live-prices.ts).
  const [every, setEvery] = useState(30_000);
  const state = useAsync(async () => {
    const force = forceRefresh.current; forceRefresh.current = false;
    const [catalog, holdings, portfolio] = await Promise.all([api.catalog(), api.holdings(), api.portfolio(force).catch(() => null)]);
    return { catalog, positions: portfolio?.positions ?? holdings, totalValue: portfolio?.totalValue ?? null };
  }, every);
  const freshness = state.data && state.data.totalValue !== null ? priceFreshness(state.data.positions) : null;
  useEffect(() => {
    if (freshness) setEvery(freshness.intervalMs);
  }, [freshness?.intervalMs]); // eslint-disable-line react-hooks/exhaustive-deps
  const [error, setError] = useState<string | null>(null);
  // null = automático: el formulario de alta se muestra abierto solo si todavía no hay posiciones.
  const [formOpen, setFormOpen] = useState<boolean | null>(null);
  const formPanel = useRef<HTMLDivElement>(null);
  const effectiveOpen = formOpen ?? false;
  // Con la cartera vacía el formulario arranca abierto y se queda abierto al agregar el primer activo.
  useEffect(() => {
    if (formOpen === null && state.data && state.data.positions.length === 0) setFormOpen(true);
  }, [formOpen, state.data]);
  function toggleForm() {
    const next = !effectiveOpen;
    setFormOpen(next);
    if (next) requestAnimationFrame(() => { formPanel.current?.scrollIntoView({ block: "nearest" }); formPanel.current?.querySelector("input")?.focus(); });
  }
  // Confirmación persistente: queda hasta la siguiente acción o hasta cerrarla.
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    const flash = takeFlash();
    if (flash) setNotice(flash);
  }, []);

  const refresh = useCallback(async () => {
    await state.reload();
  }, [state]);

  const { edit, remove, dialogs } = usePositionDialogs({ onChanged: refresh, onError: setError, onNotice: setNotice });
  const startEdit = (p: HoldingPosition) => {
    setNotice(null);
    setError(null);
    edit(p);
  };
  const startRemove = (p: HoldingPosition) => {
    setNotice(null);
    setError(null);
    remove(p);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <ScreenTitle
        title="Mi cartera"
        subtitle="Consultá cuánto tenés, cuánto vale cada activo y cómo se reparte tu dinero."
        actions={
          <>
            <Link href="/desglose" className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-sm font-semibold text-secondary hover:underline">
              Ver desglose <IconArrowRight size={14} />
            </Link>
            <LiveStatus label="Actualizar cotizaciones" updatedAt={state.updatedAt} busy={state.refreshing} error={state.error} onRefresh={() => { forceRefresh.current = true; void state.reload(); }} />
            <button type="button" className="btn-accent btn-sm" aria-expanded={effectiveOpen} aria-controls="agregar-activo" onClick={toggleForm}>
              <IconPlus size={16} /> Agregar activo
            </button>
          </>
        }
      />

      <Resource state={state} loadingLabel="Cargando cartera…">
        {({ catalog, positions, totalValue }) => (
          <>
            <StatusNotice message={notice} onClose={() => setNotice(null)} />
            {error && (
              <p role="alert" className="alert-error">
                {error}
              </p>
            )}

            <section
              aria-labelledby="holdings-h"
              className="rounded-card border border-line bg-gradient-to-br from-card to-secondary-fixed/40 px-5 py-4 shadow-card sm:px-6"
            >
              <div className="grid gap-3 md:grid-cols-[auto_1px_auto_1px_minmax(0,28rem)] md:items-center md:gap-6">
                <div className="min-w-0">
                  <h2 id="holdings-h" className="eyebrow">Valor total de tu cartera</h2>
                  <p className="mt-0.5 break-words font-heading text-4xl font-extrabold tabular-nums tracking-[-0.03em] text-ink md:text-[40px] md:leading-tight">
                    {totalValue === null ? "Valuación no disponible" : usd(totalValue)}
                  </p>
                </div>
                <span aria-hidden="true" className="hidden h-12 bg-line md:block" />
                <p className="font-heading text-2xl font-extrabold text-ink">
                  {positions.length} {positions.length === 1 ? "posición" : "posiciones"}
                </p>
                <span aria-hidden="true" className="hidden h-12 bg-line md:block" />
                <div>
                  <p className="text-base font-semibold text-ink">{freshness?.label ?? "Precios de referencia"}</p>
                  <p className="mt-0.5 text-caption text-soft">
                    Total y posiciones usan los mismos precios. Si la bolsa está cerrada, el último precio puede ser el del cierre.
                  </p>
                </div>
              </div>
            </section>

            {/* Alta de posición: se abre con «Agregar activo» (abierta de entrada si la cartera está vacía) */}
            <div id="agregar-activo" ref={formPanel} hidden={!effectiveOpen} className="max-w-2xl">
              <PositionForm
                catalog={catalog}
                positions={positions}
                onAdded={refresh}
                onError={setError}
                onNotice={setNotice}
                onEditExisting={startEdit}
              />
            </div>

            <HoldingsTable positions={positions} onEdit={startEdit} onRemove={startRemove} />

            <div className="space-y-2">
              <p className="text-sm leading-6 text-soft">
                Actualización automática cada 30 segundos mientras esta pestaña está visible. Si faltan cotizaciones verificables, podés administrar tus cantidades; la valuación permanece no disponible.
              </p>
              <p className="text-caption text-muted">Clase, sector, región y moneda provienen del catálogo de Allocia.</p>
              <Footer />
            </div>
          </>
        )}
      </Resource>
      {dialogs}
    </div>
  );
}
