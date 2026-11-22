"use client";

import Link from "next/link";
import { IconChevronLeft } from "../icons";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { api } from "@/lib/client";
import { setFlash } from "@/lib/flash";
import { classLabel, fmtPct, fmtQty, fmtUsd } from "@/lib/format";
import { splitEventSource } from "@/lib/provenance";
import type { HoldingPosition } from "@/lib/types";
import { useAsync } from "@/lib/use-async";
import { usePositionDialogs } from "../cartera/PositionDialogs";
import { ObservationCard, ScenarioTabs, SEVERITY_ORDER } from "../observations";
import { AssetMark } from "../ui/AssetIdentity";
import { Resource } from "../ui/resource";
import { Card, Footer, Overline } from "../ui/primitives";
import { ProvenanceDates } from "../ui/provenance";
import { StatusNotice } from "../ui/states";
import { fetchedAtOf } from "./SignalsPanels";
import { themeColor } from "@/lib/theme-css";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Detalle de un activo (wireframe "Detalle de Activo"): clasificación, peso,
// contribución a la concentración, observaciones que lo mencionan y eventos
// geopolíticos que afectan su sector o región. Todo con datos reales del análisis.
export function ActivoView({ ticker }: { ticker: string }) {
  const router = useRouter();
  const state = useAsync(async () => {
    const [analysis, obs, signals, catalog] = await Promise.all([
      api.analysis(),
      api.observations(),
      api.signals().catch(() => null),
      api.catalog(),
    ]);
    return { analysis, obs, signals, catalog };
  });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    await state.reload();
  }, [state]);
  const { edit, remove, dialogs } = usePositionDialogs({
    onChanged: refresh,
    onError: setError,
    onNotice: setNotice,
    onRemoved: (p) => {
      // La confirmación se muestra en Cartera, adonde vuelve la persona.
      setFlash(`Posición eliminada: ${p.ticker} ya no está en tu cartera.`);
      router.replace("/cartera");
    },
  });
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

  const data = state.data;
  const position = useMemo(
    () => data?.analysis.positions.find((p) => p.ticker === ticker),
    [data, ticker],
  );
  const instrument = useMemo(() => data?.catalog.find((c) => c.ticker === ticker), [data, ticker]);

  return (
    <div className="space-y-4 md:space-y-6">
      <Link href="/cartera" aria-label="Volver a Cartera" className="ios-back no-print md:hidden">
        <IconChevronLeft size={26} />
        Cartera
      </Link>
      <nav aria-label="Ruta de navegación" className="hidden flex-wrap items-center gap-1.5 text-[13px] text-soft md:flex">
        <Link href="/cartera" className="hover:text-ink hover:underline">
          Cartera
        </Link>
        <span aria-hidden="true">›</span>
        <Link href="/desglose" className="hover:text-ink hover:underline">
          Desglose
        </Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page" className="font-medium text-ink">
          {ticker}
        </span>
      </nav>

      <Resource state={state} loadingLabel="Cargando activo…">
        {({ analysis, obs, signals }) => {
          if (!position) {
            return (
              <Card className="mx-auto max-w-xl py-10 text-center">
                <h1 className="text-xl font-semibold text-ink">
                  {instrument ? `${instrument.ticker} no está en tu cartera` : "Activo no encontrado"}
                </h1>
                <p className="mt-2 text-[13.5px] leading-5 text-soft">
                  {instrument
                    ? `${instrument.name} (${classLabel(instrument.assetClass)} · ${instrument.sector} · ${instrument.region}) figura en el catálogo, pero todavía no lo cargaste. Agregalo desde Cartera para analizarlo.`
                    : `No existe un activo con el ticker ${ticker} en el catálogo de clasificación.`}
                </p>
                <Link href="/cartera" className="btn-primary mt-5">
                  Ir a Cartera
                </Link>
              </Card>
            );
          }

          const sumSq = analysis.positions.reduce((s, p) => s + p.weight ** 2, 0);
          const risk = sumSq > 0 ? position.weight ** 2 / sumSq : 0;
          const rank = [...analysis.positions].sort((a, b) => b.weight - a.weight).findIndex((p) => p.id === position.id) + 1;
          const re = new RegExp(`(^|[^A-Za-z0-9])${ticker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z0-9]|$)`);
          const related = obs.observaciones
            .filter((o) =>
              [o.titulo, o.mensaje, ...o.evidencia.flatMap((e) => [e.descripcion, e.valor])].some((t) => re.test(t)),
            )
            .sort((a, b) => SEVERITY_ORDER[a.severidad] - SEVERITY_ORDER[b.severidad]);
          const scenarios = (obs.escenariosConFuentes ?? []).filter((e) => e.ticker === ticker);
          const events = (signals?.geo.eventos ?? []).filter(
            (e) =>
              e.sectores.some((s) => norm(s) === norm(position.sector)) ||
              e.regiones.some((r) => norm(r) === norm(position.region)),
          );
          const crypto = position.assetClass === "cripto" || position.assetClass === "stablecoin";

          const facts: [string, string][] = [
            ["Tipo", classLabel(position.assetClass)],
            ["Sector", position.sector],
            ["Región", position.region],
            ["Moneda", position.currency],
            ["Cantidad", fmtQty(position.quantity)],
            ["Precio de referencia", fmtUsd(position.refPrice)],
            ["Valor de la posición", fmtUsd(position.value)],
          ];

          return (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="flex min-w-0 items-center gap-4">
                  <AssetMark ticker={position.ticker} assetClass={position.assetClass} size="lg" />
                  <div className="min-w-0">
                    <h1 className="font-heading text-[22px] font-extrabold tracking-[-0.3px] text-ink md:text-[28px] md:tracking-[-0.02em]">
                      Análisis detallado de {position.name}
                    </h1>
                    <p className="mt-1 text-sm text-soft">
                      {position.ticker} · {classLabel(position.assetClass)} · {position.sector}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => startEdit(position)} className="btn-secondary btn-sm">
                    Editar cantidad
                  </button>
                  <button type="button" onClick={() => startRemove(position)} className="btn-danger btn-sm">
                    Eliminar
                  </button>
                </div>
              </div>

              <StatusNotice message={notice} onClose={() => setNotice(null)} />
              {error && (
                <p role="alert" className="alert-error">
                  {error}
                </p>
              )}

              <div className="grid items-start gap-3 md:gap-4 lg:grid-cols-[minmax(300px,380px)_1fr]">
                <Card>
                  <div className="flex items-start justify-between gap-3">
                    <span className="chip !min-w-[64px] !py-2 !text-sm">{position.ticker}</span>
                    <div className="text-right">
                      <Overline>Peso en cartera</Overline>
                      <p className="text-5xl font-semibold leading-none tracking-[-0.02em] tabular-nums text-ink">
                        {(position.weight * 100).toFixed(1)}
                        <span className="text-2xl text-soft">%</span>
                      </p>
                    </div>
                  </div>
                  <dl className="mt-5">
                    {facts.map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 border-t border-line py-2.5">
                        <dt className="text-[13px] text-soft">{k}</dt>
                        <dd className="text-right text-[13px] font-medium text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {position.priceAsOf || position.priceCheckedAt ? (
                    <ProvenanceDates
                      className="mt-2"
                      source={position.priceSource ? `Precio · ${position.priceSource}` : "Precio"}
                      dataDate={position.priceAsOf}
                      fetchedAt={position.priceCheckedAt}
                    />
                  ) : null}
                  <div className="mt-3 rounded-xl bg-low p-3.5 text-[13px] leading-5 text-soft">
                    Es la <strong className="text-ink">posición n.º {rank}</strong> de {analysis.positionCount} por peso y
                    explica el <strong className="text-ink">{fmtPct(risk)}</strong> de la concentración de tu cartera (HHI{" "}
                    {analysis.concentration.hhi}).
                  </div>
                </Card>

                <div className="space-y-3 md:space-y-4">
                  <section aria-labelledby="esc-h" className="space-y-3">
                    <h2 id="esc-h" className="section-title">
                      Escenarios para {position.ticker}
                    </h2>
                    <Card>
                      <p className="mb-3 text-sm text-soft">
                        Posibles efectos de hechos documentados sobre este activo. Sin porcentajes de rendimiento supuestos.
                      </p>
                      <ScenarioTabs escenarios={scenarios} ticker={position.ticker} onReady={refresh} />
                    </Card>
                  </section>

                  <section aria-labelledby="rel-h" className="space-y-3">
                    <h2 id="rel-h" className="section-title">
                      Observaciones que mencionan a {position.ticker}
                    </h2>
                    {related.length === 0 ? (
                      <Card tone="low">
                        <p className="text-[13px] leading-5 text-soft">
                          Ninguna observación actual hace referencia directa a este activo. Revisá todas en{" "}
                          <Link href="/riesgo" className="font-semibold text-secondary hover:underline">
                            Riesgo
                          </Link>
                          .
                        </p>
                      </Card>
                    ) : (
                      <div className="grid gap-3">
                        {related.map((o) => (
                          <ObservationCard key={o.id} obs={o} />
                        ))}
                      </div>
                    )}
                  </section>

                  <section aria-labelledby="geo-h" className="space-y-3">
                    <h2 id="geo-h" className="section-title">
                      Señales geopolíticas relevantes
                    </h2>
                    <Card>
                      {events.length === 0 ? (
                        <p className="text-[13px] text-soft">
                          Sin eventos geopolíticos asociados al sector ({position.sector}) o la región (
                          {position.region}) de este activo.
                        </p>
                      ) : (
                        <ul className="divide-y divide-line">
                          {events.map((e, i) => {
                            const src = splitEventSource(e.fuente);
                            return (
                              <li key={i} className="py-3 first:pt-0 last:pb-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-2 w-2 shrink-0 rounded-full"
                                    style={{
                                      backgroundColor:
                                        e.impacto === "alto"
                                          ? themeColor.danger
                                          : e.impacto === "medio"
                                            ? themeColor.warnAccent
                                            : themeColor.muted,
                                    }}
                                  />
                                  <h3 className="text-[13.5px] font-semibold text-ink">{e.titulo}</h3>
                                </div>
                                <p className="ml-4 mt-1 text-xs leading-[18px] text-soft">
                                  {e.descripcion}{" "}
                                  <span className="text-[10.5px] text-muted">· Fuente: {src.label}</span>
                                </p>
                                {signals ? (
                                  <ProvenanceDates
                                    className="ml-4 mt-1"
                                    dataDate={src.dataDate ?? signals.provenance?.geo?.dataDate}
                                    fetchedAt={fetchedAtOf(signals, "geo")}
                                  />
                                ) : null}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </Card>
                  </section>

                  {crypto && signals && (
                    <section aria-labelledby="cr-h" className="space-y-3">
                      <h2 id="cr-h" className="section-title">
                        Contexto del mercado cripto
                      </h2>
                      <Card>
                        <dl className="grid grid-cols-3 gap-2.5 text-center">
                          {[
                            [String(signals.emerging.fearGreedIndex ?? "—"), `Fear & Greed · Alternative.me · ${signals.emerging.fearGreedLabel}`],
                            [signals.emerging.btcDominance == null ? "—" : `${signals.emerging.btcDominance} %`, "Dominancia BTC"],
                            [signals.emerging.defiTvlUsd == null ? "—" : `${(signals.emerging.defiTvlUsd / 1e9).toFixed(1)} B`, "TVL DeFi (USD)"],
                          ].map(([v, l]) => (
                            <div key={l} className="rounded-xl bg-low px-1 py-3">
                              <dd className="text-xl font-semibold tabular-nums text-ink">{v}</dd>
                              <dt className="mt-1 text-[10.5px] leading-[13px] text-soft">{l}</dt>
                            </div>
                          ))}
                        </dl>
                        <ul className="mt-3 space-y-1.5" aria-label="Procedencia de las señales cripto">
                          {(
                            [
                              ["fearGreed", "Fear & Greed"],
                              ["btcDominance", "Dominancia BTC"],
                              ["defi", "TVL DeFi"],
                            ] as const
                          ).map(([key, name]) => (
                            <li key={key}>
                              <ProvenanceDates
                                source={name}
                                dataDate={signals.provenance?.[key]?.dataDate}
                                fetchedAt={fetchedAtOf(signals, key)}
                              />
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </section>
                  )}
                </div>
              </div>
              <Footer />
            </>
          );
        }}
      </Resource>
      {dialogs}
    </div>
  );
}
