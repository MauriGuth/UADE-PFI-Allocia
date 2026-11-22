"use client";

import Link from "next/link";
import { BarFill } from "../charts/BarFill";
import { Fragment, useId, useMemo, useState } from "react";
import { AssetIdentity } from "@/components/ui/AssetIdentity";
import { AssetBubble } from "../ui/AssetBubble";
import { LiveValue } from "../ui/LiveValue";
import { classLabel, fmtQty, pct, usd } from "@/lib/format";
import { PROVENANCE_HELP, provenanceLabels } from "@/lib/provenance";
import type { HoldingPosition } from "@/lib/types";
import { IconChevron, IconPencil, IconSearch, IconTrash } from "../icons";
import { Card } from "../ui/primitives";

type SortKey = "default" | "ticker" | "quantity" | "value" | "weight";

const priceText = (p: HoldingPosition) =>
  p.refPrice === null ? "No disponible" : p.refPrice.toLocaleString("es-AR", { maximumFractionDigits: 8 }) + "\u00a0" + p.currency;

const sourceNote = (p: HoldingPosition) =>
  `Fuente: ${p.priceSource ?? "No disponible"}. ${PROVENANCE_HELP} El precio puede corresponder a un cierre o tener demora. Consultar de nuevo no cambia su fecha si la fuente no informa uno más reciente.`;

// Peso: porcentaje alineado a la derecha (cifras tabulares) y, en pantallas anchas, su barra. Un peso 0 no
// pinta relleno; un dato ausente se dice con palabras y nunca se dibuja como cero.
function WeightBar({ weight }: { weight: number | null }) {
  if (weight === null) return <span className="block text-right text-sm text-soft">No disponible</span>;
  return (
    <span className="flex items-center justify-end gap-3">
      <span aria-hidden="true" className="hidden h-2 w-24 shrink-0 overflow-hidden rounded-full bg-container 2xl:block">
        {weight > 0 ? (
          <BarFill percent={Math.min(Math.max(weight * 100, 1.5), 100)} tone="secondary" />
        ) : null}
      </span>
      <span className="w-16 shrink-0 whitespace-nowrap text-right text-sm font-bold tabular-nums text-ink">{pct(weight)}</span>
    </span>
  );
}

// Tabla de tenencias con búsqueda y orden. En pantallas medianas y grandes es una tabla compacta;
// en móvil, una lista de tarjetas con los mismos datos y acciones.
export function HoldingsTable({
  positions,
  onEdit,
  onRemove,
}: {
  positions: HoldingPosition[];
  onEdit: (p: HoldingPosition) => void;
  onRemove: (p: HoldingPosition) => void;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "default", dir: "asc" });
  const [open, setOpen] = useState<Set<number>>(new Set());
  const uid = useId();

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = term
      ? positions.filter(
          (p) =>
            p.ticker.toLowerCase().includes(term) ||
            p.name.toLowerCase().includes(term) ||
            p.sector.toLowerCase().includes(term) ||
            p.region.toLowerCase().includes(term) ||
            classLabel(p.assetClass).toLowerCase().includes(term),
        )
      : positions;
    if (sort.key === "default") return list;
    const mul = sort.dir === "asc" ? 1 : -1;
    const key = sort.key;
    return [...list].sort((a, b) =>
      key === "ticker" ? mul * a.ticker.localeCompare(b.ticker) : mul * ((a[key] ?? -Infinity) - (b[key] ?? -Infinity)),
    );
  }, [positions, query, sort]);

  const toggle = (id: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Card as="section" aria-labelledby={`${uid}-h`} className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 id={`${uid}-h`} className="section-title">
          Posiciones
        </h2>
        {positions.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] lg:w-[min(100%,520px)]">
            <label className="relative block">
              <span className="sr-only">Buscar en tu cartera</span>
              <IconSearch size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="search"
                className="input rounded-full pl-10"
                placeholder="Filtrar posiciones…"
                aria-label="Buscar en tu cartera"
                title="Busca por nombre, símbolo, clase, sector o región"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="sr-only">Ordenar por</span>
              <select
                className="select rounded-full sm:w-[210px]"
                aria-label="Ordenar por"
                value={sort.key}
                onChange={(e) => setSort({ key: e.target.value as SortKey, dir: e.target.value === "ticker" ? "asc" : "desc" })}
              >
                <option value="default">Orden original</option>
                <option value="ticker">Símbolo (A a Z)</option>
                <option value="value">Mayor valor</option>
                <option value="quantity">Mayor cantidad</option>
                <option value="weight">Mayor participación</option>
              </select>
            </label>
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <>
          {/* Tabla compacta (≥ xl) */}
          <table className="tbl hidden w-full table-fixed border-collapse text-left xl:table" aria-label="Tenencias actuales">
            <colgroup>
              <col />
              <col className="w-[104px]" />
              <col className="w-[200px]" />
              <col className="w-[124px]" />
              <col className="w-[116px] 2xl:w-[196px]" />
              <col className="w-[108px]" />
            </colgroup>
            <thead className="bg-low">
              <tr>
                <th scope="col" className="th px-3">Activo</th>
                <th scope="col" className="th px-3 text-right">Cantidad</th>
                <th scope="col" className="th px-3 text-right">Precio</th>
                <th scope="col" className="th px-3 text-right">Valor</th>
                <th scope="col" className="th px-3 text-right">Peso</th>
                <th scope="col" className="th px-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((p) => {
                const prov = provenanceLabels(p.priceAsOf, p.priceCheckedAt);
                const expanded = open.has(p.id);
                return (
                  <Fragment key={p.id}>
                    <tr>
                      <td className="td px-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <AssetBubble position={p} />
                          <Link
                            href={`/cartera/${encodeURIComponent(p.ticker)}`}
                            aria-label={`Ver detalle de ${p.ticker}`}
                            className="block min-w-0 rounded-lg"
                          >
                            <AssetIdentity ticker={p.ticker} name={p.name} assetClass={p.assetClass} hideMark />
                          </Link>
                        </div>
                      </td>
                      <td className="td px-3 text-right text-sm tabular-nums">{fmtQty(p.quantity)}</td>
                      <td className="td px-3 text-right text-sm tabular-nums">
                        <span className="block whitespace-nowrap"><LiveValue value={p.refPrice}>{priceText(p)}</LiveValue></span>
                        <button
                          type="button"
                          className="mt-0.5 inline-flex min-h-[28px] items-center gap-1 whitespace-nowrap rounded-md text-xs text-soft hover:text-secondary"
                          aria-expanded={expanded}
                          aria-controls={`${uid}-src-${p.id}`}
                          aria-label={`Fuente y actualización de ${p.ticker}`}
                          title="Ver fuente y fechas de la cotización"
                          onClick={() => toggle(p.id)}
                        >
                          {p.priceAsOf ? prov.data : "Sin cotización verificada"}
                          <IconChevron size={14} className={expanded ? "rotate-180" : ""} />
                        </button>
                        {p.priceStatus === "demo" && <span className="block whitespace-nowrap text-xs text-soft">Dato de demostración</span>}
                      </td>
                      <td className="td whitespace-nowrap px-3 text-right text-sm font-semibold tabular-nums">
                        {p.value === null ? "No disponible" : <LiveValue value={p.value}>{usd(p.value)}</LiveValue>}
                      </td>
                      <td className="td px-3"><WeightBar weight={p.weight} /></td>
                      <td className="td px-2">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" className="icon-btn" aria-label={`Editar ${p.ticker}`} title="Editar cantidad" onClick={() => onEdit(p)}>
                            <IconPencil size={18} />
                          </button>
                          <button type="button" className="icon-btn icon-btn-danger" aria-label={`Eliminar ${p.ticker}`} title="Eliminar posición" onClick={() => onRemove(p)}>
                            <IconTrash size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expanded && (
                      <tr id={`${uid}-src-${p.id}`} className="bg-low/60">
                        <td colSpan={6} className="px-4 pb-4 pt-1 text-sm leading-6 text-soft">
                          <p>
                            {p.priceAsOf ? "Precio · " + prov.data : "Sin cotización verificada"}
                            {prov.fetched ? " · " + prov.fetched : ""}
                          </p>
                          <p>{sourceNote(p)}</p>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Tarjetas (móvil y tablet) */}
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2 xl:hidden" aria-label="Tenencias actuales">
            {rows.map((p) => (
              <li key={p.id} className="flex min-w-0 flex-col rounded-2xl border border-line bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <AssetBubble position={p} />
                    <Link href={`/cartera/${encodeURIComponent(p.ticker)}`} aria-label={`Ver detalle de ${p.ticker}`} className="min-w-0 rounded-lg">
                      <AssetIdentity ticker={p.ticker} name={p.name} assetClass={p.assetClass} hideMark />
                    </Link>
                  </div>
                  <p className="shrink-0 text-sm font-bold tabular-nums text-ink">{p.weight === null ? "" : pct(p.weight)}</p>
                </div>
                <p className="mt-1 text-sm text-soft">{p.sector} · {classLabel(p.assetClass)}</p>
                <dl className="my-3 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
                  <div><dt className="text-sm text-soft">Cantidad que tenés</dt><dd className="mt-0.5 break-words text-base font-medium tabular-nums">{fmtQty(p.quantity)}</dd></div>
                  <div><dt className="text-sm text-soft">Precio por unidad</dt><dd className="mt-0.5 break-words text-base font-medium tabular-nums">{priceText(p)}</dd></div>
                  <div className="rounded-xl bg-low p-3.5 min-[400px]:col-span-2">
                    <dt className="text-sm text-soft">Valor de esta posición · USD</dt>
                    <dd className="my-1 break-words text-2xl font-extrabold tabular-nums">{p.value === null ? "No disponible" : <LiveValue value={p.value}>{usd(p.value)}</LiveValue>}</dd>
                    <dd className="text-sm text-soft">{p.weight === null ? "Participación no disponible" : pct(p.weight) + " de tu cartera"}</dd>
                  </div>
                </dl>
                <p className="text-sm text-soft" title={PROVENANCE_HELP}>
                  {p.priceAsOf ? "Precio · " + provenanceLabels(p.priceAsOf, p.priceCheckedAt).data : "Sin cotización verificada"}
                  {provenanceLabels(null, p.priceCheckedAt).fetched ? " · " + provenanceLabels(null, p.priceCheckedAt).fetched : ""}
                </p>
                {p.priceStatus === "demo" && <p className="text-sm text-soft">Dato de demostración</p>}
                <details className="mt-1">
                  <summary className="flex min-h-12 cursor-pointer items-center text-sm font-semibold text-secondary">Fuente y actualización de {p.ticker}</summary>
                  <p className="pb-3 text-sm leading-6 text-soft">{sourceNote(p)}</p>
                </details>
                <div className="mt-auto flex flex-wrap gap-3 border-t border-line pt-3">
                  <button className="btn-soft flex-1" type="button" onClick={() => onEdit(p)} aria-label={`Editar ${p.ticker}`}>Editar cantidad</button>
                  <button className="btn-danger" type="button" onClick={() => onRemove(p)} aria-label={`Eliminar ${p.ticker}`}>Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {positions.length === 0 && (
        <div className="py-6 text-center">
          <p className="text-lg font-semibold">Todavía no hay activos cargados.</p>
          <p className="mt-2 text-base text-soft">Buscá un activo e ingresá la cantidad que tenés. Podés usar decimales, por ejemplo 0,5 BTC.</p>
        </div>
      )}
      {positions.length > 0 && rows.length === 0 && (
        <div role="status" className="py-4">
          <p>Ninguna tenencia coincide con el filtro.</p>
          <button className="btn-secondary mt-3" onClick={() => setQuery("")}>Limpiar búsqueda</button>
        </div>
      )}
    </Card>
  );
}
