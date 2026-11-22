"use client";
import { ScenarioGroups, ScopeBadge } from "../observations";

import { api } from "@/lib/client";
import { CONCENTRATION_EXPLANATION, effectiveNReading } from "@/lib/concentration";
import { capitalize, classLabel, fmtQty, pct, toCsv, usd, usdExact } from "@/lib/format";
import { observationRule, observationTicker } from "@/lib/observations";
import { PROVENANCE_HELP, endSentence, fmtProvenanceDate, parseSourceLine, provenanceLabels } from "@/lib/provenance";
import { useAsync } from "@/lib/use-async";
import type { Analysis } from "@/lib/types";
import { ThemedLogo } from "@/components/theme/ThemedLogo";
import { useEffect } from "react";
import { barLabel } from "../charts/HBars";
import { CompositionGroups } from "../charts/CompositionBars";
import { AssetIdentity, AssetMark } from "../ui/AssetIdentity";
import { IconDownload, IconPrinter } from "../icons";
import { SEVERITY, SEVERITY_ORDER } from "../observations";
import { fetchedAtOf } from "./SignalsPanels";
import { useAuth } from "../shell/auth-context";
import { Resource } from "../ui/resource";
import { EmptyState } from "../ui/states";
import { Card, Footer, ScreenTitle } from "../ui/primitives";

function exportCsv(a: Analysis) {
  const rows: (string | number)[][] = [
    ["Ticker", "Nombre", "Clase", "Sector", "Región", "Moneda", "Cantidad", "Precio ref. (USD)", "Valor (USD)", "Peso (%)"],
    ...a.positions.map((p) => [
      p.ticker,
      p.name,
      classLabel(p.assetClass),
      p.sector,
      p.region,
      p.currency,
      p.quantity,
      p.refPrice,
      Math.round(p.value * 100) / 100,
      Math.round(p.weight * 10000) / 100,
    ]),
  ];
  const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `allocia-cartera-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Encabezado de sección del informe: número de orden en violeta (el documento se lee en secuencia) y un filete fino. */
function SectionHeading({ children, n }: { children: string; n?: number }) {
  return (
    <h2 className="mb-5 flex items-baseline gap-3 border-b border-line pb-2.5 font-heading text-[21px] font-extrabold tracking-[-0.015em] text-ink print:break-after-avoid">
      {n ? <span className="text-[13px] font-bold tabular-nums tracking-normal text-secondary">{String(n).padStart(2, "0")}</span> : null}
      {children}
    </h2>
  );
}

// Secciones del informe y su índice en pantalla (no se imprime).
const SECTIONS = [
  { id: "composicion", label: "Composición" },
  { id: "posiciones", label: "Posiciones" },
  { id: "observaciones", label: "Observaciones" },
  { id: "escenarios", label: "Escenarios" },
  { id: "senales", label: "Señales" },
] as const;

// Un <details> cerrado no se imprime: durante la impresión se abren los del informe (con sus fuentes y
// limitaciones) y al terminar se dejan como estaban.
function useOpenDetailsForPrint(rootId: string) {
  useEffect(() => {
    let opened: HTMLDetailsElement[] = [];
    const before = () => {
      opened = Array.from(document.querySelectorAll<HTMLDetailsElement>(`#${rootId} details:not([open])`));
      opened.forEach((d) => d.setAttribute("open", ""));
    };
    const after = () => {
      opened.forEach((d) => d.removeAttribute("open"));
      opened = [];
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, [rootId]);
}

// Informe integral (wireframe "Informe de Análisis"): documento imprimible con
// el análisis completo. "Imprimir / Guardar PDF" usa el diálogo del navegador.
export function InformeView() {
  const { user } = useAuth();
  const state = useAsync(async () => {
    const [analysis, signals, obs] = await Promise.all([api.analysis(), api.signals().catch(() => null), api.observations()]);
    return { analysis, signals, obs };
  });
  const d = state.data;
  useOpenDetailsForPrint("informe");

  return (
    <div className="space-y-4 md:space-y-6">
      {/* En papel el documento ya tiene su portada: el título de la pantalla no se imprime (quedaba duplicado). */}
      <div className="no-print">
      <ScreenTitle
        title="Informe Integral de Cartera"
        subtitle={
          d
            ? `Generado el ${new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })} · ${user.name}`
            : "Resumen exportable del análisis de tu cartera."
        }
        actions={
          d && d.analysis.positionCount > 0 ? (
            <>
              <button type="button" onClick={() => exportCsv(d.analysis)} className="btn-secondary btn-sm">
                <IconDownload size={16} /> Exportar CSV
              </button>
              <button type="button" onClick={() => window.print()} className="btn-primary btn-sm">
                <IconPrinter size={16} /> Imprimir / Guardar PDF
              </button>
            </>
          ) : undefined
        }
      />
      </div>
      {d && d.analysis.positionCount > 0 ? (
        <nav
          aria-label="Secciones del informe"
          className="no-print z-20 flex flex-wrap items-center gap-2 lg:sticky lg:top-[72px] lg:-mx-10 lg:bg-canvas/90 lg:px-10 lg:py-2 lg:backdrop-blur-md"
        >
          <span className="eyebrow pr-1">Ir a</span>
          {SECTIONS.map((sec) => (
            <a key={sec.id} href={`#${sec.id}`} className="pill shrink-0 !min-h-[40px] !px-4 !text-sm">
              {sec.label}
            </a>
          ))}
        </nav>
      ) : null}
      <Resource state={state} loadingLabel="Preparando informe…">
        {({ analysis: a, signals, obs }) => {
          if (a.positionCount === 0) {
            return (
              <Card>
                <EmptyState title="No hay datos para el informe">
                  Cargá activos en tu cartera para generar el informe integral.
                </EmptyState>
              </Card>
            );
          }
          const conc = a.concentration;
          const observaciones = [...obs.observaciones].sort(
            (x, y) => SEVERITY_ORDER[x.severidad] - SEVERITY_ORDER[y.severidad],
          );

          return (
            <article id="informe" className="card space-y-10 !p-5 md:!p-8 print:space-y-7 print:![break-inside:auto] print:!rounded-none print:!border-0 print:!p-0 print:!shadow-none">
              {/* Portada: marca, título del documento, para quién y cuándo; un filete violeta arriba (también en papel). */}
              <header className="relative -mx-5 -mt-5 rounded-t-card border-b border-line px-5 pb-6 pt-7 md:-mx-8 md:-mt-8 md:px-8 md:pt-9 print:mx-0 print:mt-0 print:px-0 print:pt-2">
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 rounded-t-card bg-gradient-to-r from-primary via-secondary to-secondary/40 print:rounded-none" />
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <ThemedLogo priority className="h-auto w-[150px]" />
                  <p className="text-right text-caption text-soft">
                    Generado el {new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                    <br />
                    {user.name}
                  </p>
                </div>
                <p className="mt-6 text-micro font-semibold tracking-[0.14em] text-secondary">INFORME INTEGRAL DE CARTERA</p>
                <p className="mt-1 max-w-[30ch] font-heading text-[28px] font-extrabold leading-tight tracking-[-0.025em] text-ink md:text-[34px]">Análisis de portafolio multiactivo</p>
                <p className="mt-2 max-w-[70ch] text-sm leading-6 text-soft">
                  Composición, concentración, observaciones explicables con su evidencia, escenarios con fuentes y el contexto de mercado externo.
                </p>
              </header>

              <section>
                <SectionHeading n={1}>Resumen del portafolio</SectionHeading>
                <dl className="grid grid-cols-2 gap-y-5 lg:grid-cols-4">
                  {[
                    ["Valor total", usd(a.totalValue)],
                    ["Posiciones", `${a.positionCount} (${conc.effectiveN} efectivas)`],
                    ["Concentración (HHI)", `${capitalize(conc.hhiLevel)} · HHI ${conc.hhi}`],
                    ["Mayor posición", conc.topPosition ? `${conc.topPosition.ticker} · ${pct(conc.topPosition.weight)}` : "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="border-l border-line px-4 first:border-l-0 first:pl-0 [&:nth-child(3)]:max-lg:border-l-0 [&:nth-child(3)]:max-lg:pl-0">
                      <dt className="text-caption text-soft">{k}</dt>
                      <dd className="mt-1 break-words font-heading text-[22px] font-extrabold leading-7 tabular-nums tracking-[-0.01em] text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 max-w-[78ch] text-[13px] leading-5 text-soft">
                  <strong className="text-ink">Concentración (HHI):</strong> {CONCENTRATION_EXPLANATION}{" "}
                  <strong className="text-ink">{effectiveNReading(conc.effectiveN)}</strong> (tenés {a.positionCount}).
                </p>
              </section>

              <section id="composicion" className="scroll-mt-32">
                <SectionHeading n={2}>Composición</SectionHeading>
                <CompositionGroups
                  positions={a.positions}
                  max={8}
                  groups={[
                    { dimension: "class", title: "Por clase de activo", data: a.composition.byClass },
                    { dimension: "sector", title: "Por sector", data: a.composition.bySector },
                    { dimension: "region", title: "Por región", data: a.composition.byRegion },
                    { dimension: "currency", title: "Por moneda", data: a.composition.byCurrency },
                  ]}
                />
              </section>

              <section id="posiciones" className="scroll-mt-32">
                <SectionHeading n={3}>Posiciones</SectionHeading>
                <div className="overflow-x-auto print:overflow-visible">
                  {/* En papel la tabla ocupa el ancho de la hoja con las siete columnas (porcentajes fijos) y los nombres se
                      parten en líneas: antes se cortaba a la derecha y faltaban Cantidad, Valor y Peso. */}
                  <table className="tbl w-full border-collapse text-left print:table-fixed print:[&_td]:px-1.5 print:[&_th]:px-1.5 print:[&_tr]:break-inside-avoid">
                    <colgroup>
                      <col />
                      <col className="print:w-[11%]" />
                      <col className="print:w-[16%]" />
                      <col className="print:w-[12%]" />
                      <col className="print:w-[11%]" />
                      <col className="print:w-[14%]" />
                      <col className="print:w-[9%]" />
                    </colgroup>
                    <thead className="bg-low">
                      <tr>
                        <th className="th max-sm:!px-2">Activo</th>
                        <th className="th max-sm:!px-2 hidden lg:table-cell print:table-cell">Clase</th>
                        <th className="th max-sm:!px-2 hidden xl:table-cell print:table-cell">Sector</th>
                        <th className="th max-sm:!px-2 hidden xl:table-cell print:table-cell">Región</th>
                        <th className="th max-sm:!px-2 hidden text-right md:table-cell print:table-cell">Cantidad</th>
                        <th className="th max-sm:!px-2 text-right">Valor</th>
                        <th className="th max-sm:!px-2 text-right">Peso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {[...a.positions].sort((x, y) => y.weight - x.weight).map((p) => (
                        <tr key={p.id}>
                          <td className="td max-sm:!px-2 w-full max-w-0 print:w-auto print:max-w-none">
                            <AssetIdentity ticker={p.ticker} name={p.name} assetClass={p.assetClass} size="sm" nameClassName="!text-caption" />
                          </td>
                          <td className="td max-sm:!px-2 hidden lg:table-cell print:table-cell">{classLabel(p.assetClass)}</td>
                          <td className="td max-sm:!px-2 hidden xl:table-cell print:table-cell">{p.sector}</td>
                          <td className="td max-sm:!px-2 hidden xl:table-cell print:table-cell">{p.region}</td>
                          <td className="td max-sm:!px-2 hidden whitespace-nowrap text-right tabular-nums md:table-cell print:table-cell">{fmtQty(p.quantity)}</td>
                          <td className="td max-sm:!px-2 whitespace-nowrap text-right tabular-nums">{usdExact(p.value)}</td>
                          <td className="td max-sm:!px-2 whitespace-nowrap text-right font-semibold tabular-nums">{pct(p.weight)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section id="observaciones" className="scroll-mt-32">
                <SectionHeading n={4}>Observaciones y evidencia</SectionHeading>
                {observaciones.length === 0 ? (
                  <p className="text-[13px] text-soft">Sin observaciones por ahora.</p>
                ) : (
                  <ol className="space-y-6">
                    {observaciones.map((o) => (
                      <li key={o.id} className="max-w-[92ch] break-inside-avoid">
                        <div className="flex flex-wrap items-start gap-2">
                          {(() => { const held = observationTicker(o, a.positions); return held ? <AssetMark ticker={held.ticker} assetClass={held.assetClass} size="sm" /> : null; })()}
                          <h3 className="flex-1 text-[15px] font-semibold leading-6 text-ink print:break-after-avoid">{o.titulo}</h3>
                          <span className={`badge ${SEVERITY[o.severidad].badge}`}>{SEVERITY[o.severidad].label}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          <ScopeBadge obs={o} />
                          {observationRule(o) ? (
                            <span className="text-caption text-soft">
                              <span className="font-semibold text-ink">Regla aplicada:</span> {observationRule(o)}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-soft">{o.mensaje}</p>
                        <table className="mt-2.5 w-full border-collapse overflow-hidden rounded-[10px] text-left text-caption ring-1 ring-line">
                          <thead className="bg-low text-soft">
                            <tr>
                              <th className="px-3 py-1.5 font-semibold">Dato evaluado</th>
                              <th className="px-3 py-1.5 text-right font-semibold">Valor</th>
                              <th className="hidden px-3 py-1.5 font-semibold sm:table-cell print:table-cell">Fuente</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line">
                            {o.evidencia.map((e, i) => (
                              <tr key={i} className="align-top">
                                <td className="px-3 py-1.5 text-soft [overflow-wrap:anywhere]">
                                  <span className="mr-1 font-semibold text-ink">{e.tipo}</span> {e.descripcion}
                                  <span className="block text-muted sm:hidden print:hidden">{e.fuente}</span>
                                </td>
                                <td className="px-3 py-1.5 text-right font-bold tabular-nums text-ink [overflow-wrap:anywhere] sm:whitespace-nowrap">{e.valor}</td>
                                <td className="hidden px-3 py-1.5 text-soft [overflow-wrap:anywhere] sm:table-cell print:table-cell">{e.fuente}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              <section id="escenarios" className="scroll-mt-32">
                <SectionHeading n={5}>Escenarios</SectionHeading>
                <ScenarioGroups
                  plain
                  escenarios={obs.escenariosConFuentes}
                  assets={Object.fromEntries(a.positions.map((p) => [p.ticker, { name: p.name, assetClass: p.assetClass }]))}
                  onReady={state.reload}
                />
              </section>

              {signals ? <section id="senales" className="scroll-mt-32">
                <SectionHeading n={6}>Señales de mercado externas</SectionHeading>
                <div className="max-w-[88ch] space-y-4 text-sm leading-6">
                  <div>
                    <p className="text-ink">
                      <strong>Índice de riesgo geopolítico {signals.geo.gprIndex ?? "No disponible"}</strong> — nivel {signals.geo.gprLevel}, tendencia{" "}
                      {signals.geo.tendencia} · origen {signals.origen}
                    </p>
                    <p className="mt-1 text-caption text-soft" title={PROVENANCE_HELP}>
                      {endSentence(
                        provenanceLabels(signals.provenance?.geo?.dataDate, fetchedAtOf(signals, "geo")).data +
                          (provenanceLabels(null, fetchedAtOf(signals, "geo")).fetched ? ` · ${provenanceLabels(null, fetchedAtOf(signals, "geo")).fetched}` : ""),
                      )}{" "}
                      {PROVENANCE_HELP}
                    </p>
                  </div>
                  {(() => {
                    // Una API anterior reemplazaba el titular por un aviso cuando fallaba la traducción: ese aviso no se imprime.
                    const news = signals.geo.eventos.filter((e) => !/traducción no disponible/i.test(e.titulo));
                    const hidden = signals.geo.eventos.length - news.length;
                    return (
                      <>
                        <ul className="divide-y divide-line border-y border-line">
                          {news.map((e, i) => {
                            const line = parseSourceLine(e.fuente);
                            return (
                              <li key={i} className="break-inside-avoid py-2.5">
                                <p lang={e.traducido === false ? "en" : undefined} className="font-semibold text-ink">{e.titulo}</p>
                                <p className="mt-0.5 text-soft">{e.descripcion}</p>
                                <p className="mt-0.5 text-caption text-muted">
                                  {[e.medio, fmtProvenanceDate(line.dataDate) ? `Dato del ${fmtProvenanceDate(line.dataDate)}` : null, e.traducido === false ? "texto original, sin traducir" : null].filter(Boolean).join(" · ")}
                                </p>
                              </li>
                            );
                          })}
                        </ul>
                        {hidden > 0 ? (
                          <p className="text-caption text-soft">{hidden === 1 ? "1 noticia" : `${hidden} noticias`} sin titular disponible: se consultan en Señales con su fuente original.</p>
                        ) : null}
                      </>
                    );
                  })()}
                  <p className="text-soft">
                    Fear &amp; Greed {signals.emerging.fearGreedIndex ?? "No disponible"} ({signals.emerging.fearGreedLabel}) · Dominancia BTC{" "}
                    {signals.emerging.btcDominance == null ? "No disponible" : `${signals.emerging.btcDominance} %`} · TVL DeFi US$ {signals.emerging.defiTvlUsd == null ? "No disponible" : `${(signals.emerging.defiTvlUsd / 1e9).toFixed(1)} B`}
                  </p>
                  <div>
                    <h3 className="text-sm font-semibold text-ink print:break-after-avoid">Mercados de predicción</h3>
                    <ul className="mt-1.5 list-disc space-y-2 pl-5 text-soft">
                      {signals.emerging.predictionMarkets.map((p, i) => {
                        // Sobre papel un enlace no se puede tocar: la dirección queda escrita completa (y en pantalla es un enlace).
                        const line = parseSourceLine(p.fuente);
                        const when = fmtProvenanceDate(line.dataDate);
                        return (
                          <li key={i} className="break-inside-avoid">
                            {p.pregunta} — <strong className="text-ink">{barLabel(p.probabilidad)}</strong>
                            <span className="block text-caption">
                              Fuente: {line.parts.join(" · ") || p.fuente}
                              {when ? ` · Dato del ${when}` : ""}
                              {line.url ? (
                                <>
                                  {" · "}
                                  <a className="text-secondary underline [overflow-wrap:anywhere]" href={line.url} target="_blank" rel="noopener noreferrer">
                                    {line.url}
                                  </a>
                                </>
                              ) : null}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </section> : <p>Señales externas no disponibles. Consultá los informes con fuentes en Mercados y alertas.</p>}

              <footer className="border-t border-line pt-4">
                <Footer />
              </footer>
            </article>
          );
        }}
      </Resource>
    </div>
  );
}
