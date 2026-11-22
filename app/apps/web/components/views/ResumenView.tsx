"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { classDetails } from "@/lib/composition";
import { capitalize, pct, usd } from "@/lib/format";
import { splitEventSource } from "@/lib/provenance";
import { observationRule } from "@/lib/observations";
import { useAsync } from "@/lib/use-async";
import { Donut } from "../charts/Donut";
import { CompositionList, CompositionPreviewProvider } from "../charts/CompositionBars";
import { ConcentrationCard } from "../ConcentrationCard";
import { AssetIdentity } from "../ui/AssetIdentity";
import { IconArrowRight, IconPie } from "../icons";
import { GlobeNews } from "../nav-icons";
import { AssetBubble } from "../ui/AssetBubble";
import { LiveValue } from "../ui/LiveValue";
import { priceFreshness } from "@/lib/live-prices";
import { ScenarioGroups, ScopeBadge, SEVERITY, SEVERITY_ORDER } from "../observations";
import { LiveStatus } from "../ui/LiveStatus";
import { Resource } from "../ui/resource";
import { EmptyState } from "../ui/states";
import { Card, Footer, Overline, ScreenTitle } from "../ui/primitives";
import { ProvenanceDates } from "../ui/provenance";
import { fetchedAtOf } from "./SignalsPanels";

export function ResumenView() {
  // El ritmo de refresco sigue al mercado: 30 s con la bolsa abierta, 1 min si solo cambia cripto, 5 min si nada cambia.
  const [every, setEvery] = useState(30_000);
  const state = useAsync(async () => {
    const [analysis, signals, obs] = await Promise.all([api.analysis(), api.signals().catch(() => null), api.observations()]);
    return { analysis, signals, obs };
  }, every);
  const freshness = state.data ? priceFreshness(state.data.analysis.positions) : null;
  useEffect(() => {
    if (freshness) setEvery(freshness.intervalMs);
  }, [freshness?.intervalMs]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4 md:space-y-6">
      <ScreenTitle
        title="Resumen"
        subtitle="Visión general de tu cartera, su composición y el contexto que la rodea."
        actions={
          <>
            <LiveStatus updatedAt={state.updatedAt} busy={state.refreshing} error={state.error} onRefresh={() => { void state.reload(); }} />
            <Link href="/informe" className="btn-soft btn-sm">
              Ver informe
            </Link>
          </>
        }
      />
      <Resource state={state} loadingLabel="Cargando análisis…">
        {({ analysis, signals, obs }) => {
          if (analysis.positionCount === 0) {
            return (
              <Card>
                <EmptyState
                  icon={<IconPie size={44} />}
                  title="Tu cartera está vacía"
                  action={
                    <Link href="/cartera" className="btn-primary">
                      Cargar mi primer activo
                    </Link>
                  }
                >
                  Cargá tu primer activo desde la pestaña Cartera y Allocia va a calcular tu composición,
                  exposiciones y observaciones al instante.
                </EmptyState>
              </Card>
            );
          }

          const conc = analysis.concentration;
          const geoEvento = signals?.geo.eventos[0];
          const geoSource = geoEvento ? splitEventSource(geoEvento.fuente) : null;
          // Una API anterior reemplazaba el titular por un aviso cuando fallaba la traducción: ese aviso no es contexto.
          const headline = geoEvento && !/traducción no disponible/i.test(geoEvento.titulo) ? geoEvento.titulo : null;
          const observaciones = [...obs.observaciones].sort(
            (a, b) => SEVERITY_ORDER[a.severidad] - SEVERITY_ORDER[b.severidad],
          );

          return (
            <>
              {/* Resumen financiero: el valor total manda; a la derecha, las cifras que lo explican (todas reales). */}
              <section aria-label="Valor total" className="portfolio-summary relative overflow-hidden rounded-card px-4 py-4 text-white sm:px-6 sm:py-5 md:px-8 md:py-7">
                <div className="relative grid gap-y-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,2fr)] lg:items-end lg:gap-x-10">
                  <div className="px-1 sm:px-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70 sm:text-[12px]">Valor total de cartera</p>
                    <p className="mt-1.5 font-heading text-[38px] font-extrabold leading-none tabular-nums tracking-[-0.035em] sm:text-[44px] md:text-[52px]">
                      <LiveValue value={analysis.totalValue}>{usd(analysis.totalValue)}</LiveValue>
                    </p>
                    <p className="mt-2.5 flex items-start gap-2 text-[13px] leading-[18px] text-white/75">
                      <span aria-hidden="true" className={`mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full ${freshness?.mode === "live" ? "bg-[#6fd3a1]" : "bg-white/50"}`} />
                      <span>{freshness?.label ?? "Precios de referencia"}</span>
                    </p>
                  </div>
                  {/* Móvil: grilla 2×2 de celdas compactas. Escritorio: una fila separada por un filo, sin celdas. */}
                  <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-x-6 sm:gap-y-0 sm:border-t sm:border-white/15 sm:pt-4 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                    {[
                      {
                        label: "Tamaño",
                        value: (
                          <>
                            {analysis.positionCount}{" "}
                            <span className="text-[13px] font-semibold text-white/70 sm:text-[15px]">{analysis.positionCount === 1 ? "posición" : "posiciones"}</span>
                          </>
                        ),
                      },
                      {
                        label: "Mayor posición",
                        value: conc.topPosition ? conc.topPosition.ticker : "—",
                        note: conc.topPosition ? `${pct(conc.topPosition.weight)} del total` : undefined,
                      },
                      { label: "3 mayores", value: <span className="tabular-nums">{pct(conc.top3Weight)}</span>, note: "del valor total" },
                      { label: "Concentración", value: capitalize(conc.hhiLevel), note: `HHI ${conc.hhi}` },
                    ].map((m) => (
                      <div key={m.label} className="min-w-0 rounded-[12px] bg-white/[0.06] px-3 py-2.5 sm:rounded-none sm:bg-transparent sm:p-0">
                        <dt className="text-[12px] text-white/65">{m.label}</dt>
                        <dd className="mt-0.5 break-words font-heading text-[19px] font-extrabold leading-6 sm:mt-1 sm:text-[22px] sm:leading-7">{m.value}</dd>
                        {m.note ? <dd className="text-[12px] tabular-nums text-white/60">{m.note}</dd> : null}
                      </div>
                    ))}
                  </dl>
                </div>
              </section>

              {/* Principales posiciones + composición */}
              <section className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[1.15fr_1fr]">
                <Card as="section" aria-labelledby="top-pos-h">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 id="top-pos-h" className="section-title">Principales posiciones</h2>
                    <Link href="/cartera" className="inline-flex min-h-[44px] items-center text-[13px] font-semibold text-secondary hover:underline">
                      Ver cartera
                    </Link>
                  </div>
                  <table className="tbl mt-2 w-full border-collapse text-left">
                    <caption className="sr-only">Principales posiciones por peso en la cartera</caption>
                    <thead className="bg-low">
                      <tr>
                        <th scope="col" className="th px-3 sm:px-4">Símbolo / empresa</th>
                        <th scope="col" className="th px-2 text-right sm:px-4">Valor</th>
                        <th scope="col" className="th px-3 text-right sm:px-4">Peso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {[...analysis.positions]
                        .sort((x, y) => y.weight - x.weight)
                        .slice(0, 4)
                        .map((p) => (
                          <tr key={p.id}>
                            <td className="td w-full max-w-0 px-3 sm:px-4">
                              {/* El logo abre la burbuja de resumen; ticker y nombre siguen llevando al detalle completo. */}
                              <div className="flex min-w-0 items-center gap-3">
                                <AssetBubble position={p} />
                                <Link href={`/cartera/${encodeURIComponent(p.ticker)}`} className="block min-w-0 rounded-lg">
                                  <AssetIdentity ticker={p.ticker} name={p.name} assetClass={p.assetClass} hideMark />
                                </Link>
                              </div>
                            </td>
                            <td className="td whitespace-nowrap px-2 text-right tabular-nums sm:px-4"><LiveValue value={p.value}>{usd(p.value)}</LiveValue></td>
                            <td className="td whitespace-nowrap px-3 text-right text-sm font-bold tabular-nums sm:px-4">{pct(p.weight)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </Card>

                <Card as="section" aria-labelledby="comp-h">
                  <h2 id="comp-h" className="section-title">Composición</h2>
                  <Overline className="mt-2">Por tipo de activo</Overline>
                  <div className="mt-4">
                    <Donut
                      data={analysis.composition.byClass}
                      useClassLabels
                      total={analysis.positionCount}
                      size={188}
                      details={classDetails(analysis.positions)}
                      holdings={analysis.positions.reduce<Record<string, { ticker: string; assetClass: string; weight: number }[]>>((acc, p) => {
                        (acc[p.assetClass] ??= []).push({ ticker: p.ticker, assetClass: p.assetClass, weight: p.weight });
                        return acc;
                      }, {})}
                    />
                  </div>
                </Card>
              </section>

              {/* Contexto externo: titular más reciente (o, si no hay uno utilizable, el índice GPR), medio, fecha y nivel. */}
              <Card as="section" aria-labelledby="ctx-h" className="card-compact">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
                  <div className="flex items-center gap-3 md:w-[250px] md:shrink-0">
                    <span aria-hidden="true" className="icon-tile h-10 w-10">
                      <GlobeNews size={20} />
                    </span>
                    <div>
                      <h2 id="ctx-h" className="font-heading text-[17px] font-extrabold leading-6 text-ink">Contexto de mercado</h2>
                      <p className="text-caption text-soft">Externo a tu cartera</p>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 md:border-l md:border-line md:pl-6">
                    {headline ? (
                      <>
                        <p lang={geoEvento?.traducido === false ? "en" : undefined} className="text-[15px] font-semibold leading-6 text-ink">
                          {headline}
                        </p>
                        <p className="mt-1 text-caption text-soft">
                          {[geoEvento?.medio ? `${geoEvento.medio}` : null, geoEvento?.traducido === false ? "texto original, sin traducir" : null].filter(Boolean).join(" · ")}
                        </p>
                      </>
                    ) : (
                      <p className="text-[15px] font-semibold leading-6 text-ink">
                        {signals?.geo.gprIndex != null
                          ? `Índice de riesgo geopolítico en ${signals.geo.gprIndex.toFixed(1)} · tendencia ${signals.geo.tendencia}`
                          : "Contexto externo no disponible por ahora"}
                      </p>
                    )}
                    {signals ? (
                      <ProvenanceDates
                        className="mt-0.5"
                        dataDate={headline ? (geoSource?.dataDate ?? signals.provenance?.geo?.dataDate) : signals.provenance?.geo?.dataDate}
                        fetchedAt={fetchedAtOf(signals, "geo")}
                      />
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-4 md:flex-col md:items-end md:gap-1">
                    <div className="text-right">
                      <p className="text-caption text-soft">Riesgo geopolítico</p>
                      <span
                        className={`mt-0.5 inline-flex rounded-md px-2 py-0.5 text-[13px] font-bold ${
                          signals?.geo.gprLevel === "elevado" ? "bg-warn-bg text-warn" : "bg-low text-soft"
                        }`}
                      >
                        {capitalize(signals?.geo.gprLevel ?? "No disponible")}
                      </span>
                    </div>
                    <Link href="/senales" className="no-print inline-flex min-h-[40px] items-center gap-1 text-sm font-semibold text-secondary hover:underline">
                      Ver señales <IconArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </Card>

              {/* En pocas palabras + concentración explicada */}
              <section className="grid grid-cols-[minmax(0,1fr)] items-start gap-3 md:gap-4 lg:grid-cols-2">
                <Card>
                  <h2 className="section-title">Tu cartera, en pocas palabras</h2>
                  <dl className="mt-4 grid grid-cols-2 gap-3">
                    {conc.topPosition ? (
                      <div className="rounded-[12px] bg-low px-4 py-3">
                        <dt className="text-caption text-soft">Mayor inversión</dt>
                        <dd className="mt-0.5 font-heading text-[22px] font-extrabold leading-7 text-ink">
                          {conc.topPosition.ticker} <span className="text-[15px] font-semibold tabular-nums text-soft">{pct(conc.topPosition.weight)}</span>
                        </dd>
                      </div>
                    ) : null}
                    <div className="rounded-[12px] bg-low px-4 py-3">
                      <dt className="text-caption text-soft">{Math.min(3, analysis.positionCount)} mayores juntas</dt>
                      <dd className="mt-0.5 font-heading text-[22px] font-extrabold tabular-nums leading-7 text-ink">{pct(conc.top3Weight)}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-sm leading-6 text-ink">
                    {conc.topPosition ? `${conc.topPosition.ticker} es tu mayor inversión: representa ${pct(conc.topPosition.weight)} del valor de tu cartera. ` : ""}
                    Tus {Math.min(3, analysis.positionCount)} inversiones más grandes reúnen el {pct(conc.top3Weight)} del total.
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-soft">Cuanto más dinero concentres en pocos activos, más depende tu cartera de lo que les pase. Esto no predice si vas a ganar o perder.</p>
                </Card>
                <ConcentrationCard
                  concentration={conc}
                  positionCount={analysis.positionCount}
                  footer={
                    <Link href="/riesgo" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-secondary hover:underline">
                      Ver riesgo
                    </Link>
                  }
                />
              </section>

              {/* Distribución de activos */}
              <h2 className="section-title pt-1">Cómo está repartido tu dinero</h2>
              <CompositionPreviewProvider positions={analysis.positions}>
                <section className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 lg:gap-4">
                  <Card>
                    <Overline className="mb-2 px-2">Por sector</Overline>
                    <CompositionList dimension="sector" data={analysis.composition.bySector} max={5} />
                  </Card>
                  <Card>
                    <Overline className="mb-2 px-2">Por región</Overline>
                    <CompositionList dimension="region" data={analysis.composition.byRegion} max={4} />
                  </Card>
                </section>
              </CompositionPreviewProvider>

              {/* Observaciones destacadas (primero: son breves) */}
              <section aria-labelledby="obs-h" className="space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 id="obs-h" className="section-title">Observaciones destacadas</h2>
                  <Link href="/riesgo" className="inline-flex min-h-[44px] items-center gap-1 text-[13px] font-semibold text-secondary hover:underline">
                    Ver todas <IconArrowRight size={14} />
                  </Link>
                </div>
                {observaciones.length === 0 ? (
                  <Card tone="low">
                    <p className="text-[13px] text-soft">Sin observaciones por ahora.</p>
                  </Card>
                ) : (
                  <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
                    {observaciones.slice(0, 3).map((o) => (
                      <li key={o.id} className="flex">
                        {/* Qué se detectó (título), de dónde sale (alcance), qué dice y, al pie, la regla que lo disparó. */}
                        <Link href="/riesgo" className="card flex w-full flex-col transition-colors hover:border-outline">
                          <div className="flex items-center justify-between gap-2">
                            <ScopeBadge obs={o} />
                            <span className={`badge shrink-0 ${SEVERITY[o.severidad].badge}`}>{SEVERITY[o.severidad].label}</span>
                          </div>
                          <p className="mt-2.5 text-[15px] font-semibold leading-5 text-ink">{o.titulo}</p>
                          <p className="mt-1.5 line-clamp-3 text-[13px] leading-[19px] text-soft">{o.mensaje}</p>
                          {observationRule(o) ? (
                            <p className="mt-auto border-t border-line pt-2.5 text-caption text-soft [margin-top:max(0.75rem,auto)]">
                              <span className="font-semibold text-ink">Regla:</span> {observationRule(o)}
                            </p>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Escenarios con fuentes: sección propia, a ancho completo y agrupada por activo */}
              <section aria-labelledby="esc-h" className="space-y-3">
                <div>
                  <h2 id="esc-h" className="section-title">Escenarios con fuentes</h2>
                  <p className="mt-1 max-w-2xl text-sm text-soft">Posibles efectos de hechos documentados sobre tus activos. Sin porcentajes de rendimiento supuestos.</p>
                </div>
                <ScenarioGroups
                  escenarios={obs.escenariosConFuentes}
                  assets={Object.fromEntries(analysis.positions.map((p) => [p.ticker, { name: p.name, assetClass: p.assetClass }]))}
                  onReady={state.reload}
                />
              </section>

              <Footer />
            </>
          );
        }}
      </Resource>
    </div>
  );
}
