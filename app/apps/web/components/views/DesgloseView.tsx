"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { api } from "@/lib/client";
import { CONCENTRATION_EXPLANATION, effectiveNReading } from "@/lib/concentration";
import { classDetails } from "@/lib/composition";
import { CLASS_LABELS, classLabel, fmtQty, pct, usd } from "@/lib/format";
import { useAsync } from "@/lib/use-async";
import { Donut } from "../charts/Donut";
import { AssetIdentity } from "../ui/AssetIdentity";
import { HBars } from "../charts/HBars";
import { usePositionDialogs } from "../cartera/PositionDialogs";
import { LiveStatus } from "../ui/LiveStatus";
import { Resource } from "../ui/resource";
import { EmptyState, StatusNotice } from "../ui/states";
import { Card, Footer, ScreenTitle } from "../ui/primitives";
import { IconLayers, IconPencil, IconTrash } from "../icons";
import type { EnrichedPosition } from "@/lib/types";

type SortKey = "ticker" | "assetClass" | "sector" | "region" | "currency" | "weight" | "risk" | "value";

// Anchos de columna estables (table-fixed): «Activo» toma el resto y las cifras nunca se parten en dos
// líneas. `hide`/`colHide` son literales para que Tailwind genere las clases.
const COLUMNS: { key: SortKey; label: string; right?: boolean; hide?: string; colHide?: string; w: string }[] = [
  { key: "ticker", label: "Activo", w: "" },
  { key: "assetClass", label: "Clase", hide: "hidden md:table-cell", colHide: "hidden md:table-column", w: "w-[76px]" },
  { key: "sector", label: "Sector", hide: "hidden xl:table-cell", colHide: "hidden xl:table-column", w: "w-[104px]" },
  { key: "region", label: "Región", hide: "hidden xl:table-cell", colHide: "hidden xl:table-column", w: "w-[80px]" },
  { key: "currency", label: "Moneda", hide: "hidden 2xl:table-cell", colHide: "hidden 2xl:table-column", w: "w-[88px]" },
  { key: "weight", label: "Peso", right: true, w: "w-[84px]" },
  { key: "risk", label: "Contrib. concentración", right: true, hide: "hidden lg:table-cell", colHide: "hidden lg:table-column", w: "w-[144px]" },
  { key: "value", label: "Valor", right: true, hide: "hidden sm:table-cell", colHide: "hidden sm:table-column", w: "w-[100px]" },
];

const ALL = "__all__";

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-eyebrow font-semibold uppercase text-soft">{label}</span>
      <select className="select min-h-[44px] !py-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value={ALL}>Todos</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// Desglose de cartera (wireframe "Desglose de Cartera"): composición completa y
// tabla filtrable/ordenable de posiciones. La "contribución a la concentración"
// es la parte del HHI que explica cada posición (peso² / Σ pesos²).
export function DesgloseView() {
  const state = useAsync(api.analysis);
  const [clase, setClase] = useState(ALL);
  const [sector, setSector] = useState(ALL);
  const [region, setRegion] = useState(ALL);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "weight", dir: -1 });
  const [error, setError] = useState<string | null>(null);
  // Confirmación persistente: queda hasta la siguiente acción o hasta cerrarla.
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    await state.reload();
  }, [state]);
  const { edit, remove, dialogs } = usePositionDialogs({ onChanged: refresh, onError: setError, onNotice: setNotice });
  const startEdit = (p: EnrichedPosition) => {
    setNotice(null);
    setError(null);
    edit(p);
  };
  const startRemove = (p: EnrichedPosition) => {
    setNotice(null);
    setError(null);
    remove(p);
  };

  const positions = state.data?.positions;
  const sumSq = useMemo(() => (positions ?? []).reduce((s, p) => s + p.weight ** 2, 0), [positions]);
  const riskOf = useCallback((p: EnrichedPosition) => (sumSq > 0 ? p.weight ** 2 / sumSq : 0), [sumSq]);

  const rows = useMemo(() => {
    const list = (positions ?? []).filter(
      (p) =>
        (clase === ALL || p.assetClass === clase) &&
        (sector === ALL || p.sector === sector) &&
        (region === ALL || p.region === region),
    );
    const val = (p: EnrichedPosition): string | number =>
      sort.key === "risk" ? riskOf(p) : (p[sort.key as keyof EnrichedPosition] as string | number);
    return [...list].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      return sort.dir * (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y)));
    });
  }, [positions, clase, sector, region, sort, riskOf]);

  const uniq = (f: (p: EnrichedPosition) => string) =>
    [...new Set((positions ?? []).map(f))].sort((a, b) => a.localeCompare(b)).map((v) => ({ value: v, label: v }));
  const filtered = clase !== ALL || sector !== ALL || region !== ALL;
  // Elegir una clase, sector o región en las barras filtra la tabla (mismos filtros de abajo); volver a elegirla lo quita.
  // Moneda no tiene filtro en la tabla, así que sus barras no son seleccionables.
  const pick = (current: string, set: (v: string) => void) => (key: string) => {
    const next = current === key ? ALL : key;
    set(next);
    if (next !== ALL) {
      // La tabla está más abajo: se acerca para que se vea el efecto (sin animar si la persona pidió menos movimiento).
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById("desglose-posiciones")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  };
  const filteredWeight = rows.reduce((s, p) => s + p.weight, 0);
  const filteredValue = rows.reduce((s, p) => s + p.value, 0);

  return (
    <div className="space-y-4 md:space-y-6">
      <ScreenTitle
        title="Desglose de Cartera"
        subtitle="Análisis detallado de asignación y contribución a la concentración de cada posición."
        actions={<LiveStatus updatedAt={state.updatedAt} busy={state.refreshing} error={state.error} onRefresh={() => { void state.reload(); }} />}
      />
      <Resource state={state} loadingLabel="Cargando desglose…">
        {(a) =>
          a.positionCount === 0 ? (
            <Card>
              <EmptyState
                icon={<IconLayers size={44} />}
                title="Todavía no hay nada para desglosar"
                action={
                  <Link href="/cartera" className="btn-primary">
                    Cargar activos
                  </Link>
                }
              >
                Cargá activos en tu cartera para ver su composición por clase, sector, región y moneda.
              </EmptyState>
            </Card>
          ) : (
            <>
              <p className="-mb-1 text-caption text-soft md:-mb-3">
                Elegí una clase, sector o región para filtrar la tabla de abajo; tocala de nuevo para quitar el filtro.
              </p>
              <section className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3 lg:gap-4" aria-label="Composición">
                <Card className="h-full">
                  <h3 className="section-title">Clase de activo</h3>
                  <div className="mt-4">
                    <Donut
                      data={a.composition.byClass}
                      useClassLabels
                      total={a.positionCount}
                      size={150}
                      details={classDetails(a.positions)}
                      selectedKey={clase === ALL ? null : clase}
                      onSelect={pick(clase, setClase)}
                    />
                  </div>
                </Card>
                <Card className="h-full">
                  <h3 className="section-title">Sector</h3>
                  <div className="mt-4">
                    <HBars data={a.composition.bySector} max={8} selectedKey={sector === ALL ? null : sector} onSelect={pick(sector, setSector)} />
                  </div>
                </Card>
                {/* Región y Moneda: dos dimensiones distintas, cada una en su tarjeta (la moneda ya no va
                    resaltada dentro de Región: un 100 % USD es una descripción, no una advertencia). */}
                <div className="flex flex-col gap-3 md:col-span-2 xl:col-span-1 lg:gap-4">
                  <Card className="flex-1">
                    <h3 className="section-title">Región</h3>
                    <div className="mt-4">
                      <HBars data={a.composition.byRegion} max={6} selectedKey={region === ALL ? null : region} onSelect={pick(region, setRegion)} />
                    </div>
                  </Card>
                  <Card className="card-compact">
                    <h3 className="section-title">Moneda</h3>
                    {/* Una sola moneda no necesita una barra llena: se dice en una línea. Con varias, barras como el resto. */}
                    {a.composition.byCurrency.length === 1 ? (
                      <p className="mt-2 flex items-baseline justify-between gap-3 text-sm text-soft">
                        <span>
                          Toda la cartera está en <strong className="font-semibold text-ink">{a.composition.byCurrency[0].key}</strong>
                        </span>
                        <span className="font-semibold tabular-nums text-ink">100 %</span>
                      </p>
                    ) : (
                      <div className="mt-4">
                        <HBars data={a.composition.byCurrency} max={4} />
                      </div>
                    )}
                  </Card>
                </div>
              </section>

              <StatusNotice message={notice} onClose={() => setNotice(null)} />
              {error && (
                <p role="alert" className="alert-error">
                  {error}
                </p>
              )}

              <Card as="section" id="desglose-posiciones" className="scroll-mt-24 space-y-5">
                <h2 className="section-title">Contribución por posición</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(3,1fr)_auto] lg:items-end">
                  <Filter
                    label="Clase de activo"
                    value={clase}
                    onChange={setClase}
                    options={Object.keys(CLASS_LABELS)
                      .filter((k) => a.positions.some((p) => p.assetClass === k))
                      .map((k) => ({ value: k, label: CLASS_LABELS[k] }))}
                  />
                  <Filter label="Sector" value={sector} onChange={setSector} options={uniq((p) => p.sector)} />
                  <Filter label="Región" value={region} onChange={setRegion} options={uniq((p) => p.region)} />
                  <button
                    type="button"
                    disabled={!filtered}
                    onClick={() => {
                      setClase(ALL);
                      setSector(ALL);
                      setRegion(ALL);
                    }}
                    className="btn-secondary btn-sm self-end"
                  >
                    Limpiar filtros
                  </button>
                </div>
                <p className="text-caption tabular-nums text-soft" aria-live="polite">
                  {rows.length} de {a.positionCount} posiciones · {pct(filteredWeight)} de la cartera ·{" "}
                  {usd(filteredValue)}
                </p>

                <div className="overflow-x-auto">
                  <table className="tbl w-full table-fixed border-collapse [&_.td]:px-2.5 [&_.th]:px-2.5 xl:[&_.td]:px-3 xl:[&_.th]:px-3">
                    <caption className="sr-only">Posiciones de la cartera</caption>
                    <colgroup>
                      {COLUMNS.map((c) => (
                        <col key={c.key} className={`${c.w} ${c.colHide ?? ""}`} />
                      ))}
                      <col className="w-[100px]" />
                    </colgroup>
                    <thead className="bg-low">
                      <tr>
                        {COLUMNS.map((c) => (
                          <th
                            key={c.key}
                            scope="col"
                            aria-sort={sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
                            className={`th ${c.right ? "text-right" : "text-left"} ${c.hide ?? ""} ${sort.key === c.key ? "!text-ink" : ""}`}
                          >
                            <button
                              type="button"
                              className={`inline-flex items-center gap-1 rounded text-left uppercase tracking-[inherit] hover:text-ink ${c.right ? "flex-row-reverse text-right" : ""}`}
                              onClick={() =>
                                setSort((s) =>
                                  s.key === c.key
                                    ? { key: c.key, dir: (s.dir * -1) as 1 | -1 }
                                    : { key: c.key, dir: c.right ? -1 : 1 },
                                )
                              }
                            >
                              {c.label}
                              <span aria-hidden="true" className={`w-3 shrink-0 text-center text-micro ${sort.key === c.key ? "text-ink" : "text-muted"}`}>
                                {sort.key === c.key ? (sort.dir === 1 ? "▲" : "▼") : "↕"}
                              </span>
                            </button>
                          </th>
                        ))}
                        <th scope="col" className="th text-right">
                          <span className="sr-only">Acciones</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {rows.map((p) => (
                        <tr key={p.id}>
                          <td className="td">
                            <Link
                              href={`/cartera/${encodeURIComponent(p.ticker)}`}
                              className="block rounded-lg hover:[&_.font-bold]:text-secondary"
                            >
                              <AssetIdentity
                                ticker={p.ticker}
                                name={`${p.name} · ${fmtQty(p.quantity)} u.`}
                                assetClass={p.assetClass}
                                size="sm"
                                nameClassName="!text-caption"
                              />
                            </Link>
                          </td>
                          <td className="td hidden md:table-cell">{classLabel(p.assetClass)}</td>
                          <td className="td hidden xl:table-cell">{p.sector}</td>
                          <td className="td hidden xl:table-cell">{p.region}</td>
                          <td className="td hidden 2xl:table-cell">{p.currency}</td>
                          <td className="td whitespace-nowrap text-right text-sm font-bold tabular-nums">{pct(p.weight)}</td>
                          <td className="td hidden whitespace-nowrap text-right tabular-nums lg:table-cell">
                            <span
                              className={
                                riskOf(p) > 0.25
                                  ? "inline-block rounded-lg bg-warn-bg px-2.5 py-1 font-bold text-warn"
                                  : ""
                              }
                            >
                              {pct(riskOf(p))}
                            </span>
                          </td>
                          <td className="td hidden whitespace-nowrap text-right tabular-nums sm:table-cell">{usd(p.value)}</td>
                          <td className="td">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => startEdit(p)}
                                aria-label={`Editar ${p.ticker}`}
                                title="Editar cantidad"
                                className="icon-btn"
                              >
                                <IconPencil size={18} />
                              </button>
                              <button
                                type="button"
                                onClick={() => startRemove(p)}
                                aria-label={`Eliminar ${p.ticker}`}
                                title="Eliminar posición"
                                className="icon-btn icon-btn-danger"
                              >
                                <IconTrash size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length === 0 && (
                  <p className="p-2 text-center text-body-sm text-muted">
                    Ninguna posición coincide con los filtros seleccionados.
                  </p>
                )}
              </Card>
              <p className="text-caption text-soft">
                Contrib. concentración = peso² ÷ Σ pesos²: la parte del índice HHI ({a.concentration.hhi}) que explica
                cada posición. {CONCENTRATION_EXPLANATION} {effectiveNReading(a.concentration.effectiveN)}.
              </p>
              <Footer />
            </>
          )
        }
      </Resource>
      {dialogs}
    </div>
  );
}
