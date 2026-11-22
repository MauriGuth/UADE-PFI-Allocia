"use client";

import { type KeyboardEvent, type ReactNode, createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { BarFill } from "./BarFill";
import { createPortal } from "react-dom";
import { barLabel, barWidth } from "@/lib/bars";
import { type CompositionDimension, bucketHoldings } from "@/lib/composition";
import { classLabel, pct, usd } from "@/lib/format";
import { type Placement, placePopover } from "@/lib/popover";
import type { EnrichedPosition, ExposureItem } from "@/lib/types";
import { AssetMark } from "../ui/AssetIdentity";
import { Overline } from "../ui/primitives";

export interface CompositionGroup {
  dimension: CompositionDimension;
  title: string;
  data: ExposureItem[];
}

const HOVER_OPEN_MS = 250;
const HOVER_CLOSE_MS = 160;

interface OpenState {
  id: string;
  dimension: CompositionDimension;
  item: ExposureItem;
  /** Fijada con clic, Enter o toque: queda abierta hasta Escape, otro clic o salir del informe. */
  pinned: boolean;
  /** Se abrió con el teclado: el foco pasa a la vista previa para que sea legible con lector de pantalla. */
  focus: boolean;
}

interface PreviewApi {
  popId: string;
  openId: string | null;
  register: (id: string, el: HTMLElement | null) => void;
  hover: (id: string, dimension: CompositionDimension, item: ExposureItem) => void;
  leave: () => void;
  activate: (id: string, dimension: CompositionDimension, item: ExposureItem, viaKeyboard: boolean) => void;
}

const PreviewContext = createContext<PreviewApi | null>(null);

const rowId = (dimension: CompositionDimension, key: string) => `${dimension}:${key}`;
const labelOf = (dimension: CompositionDimension, key: string) => (dimension === "class" ? classLabel(key) : key);

/**
 * Estado y vista previa compartidos de las barras de composición: una sola vista previa abierta a la vez, flotando sobre la
 * pantalla (portal) para que ningún contenedor con scroll la recorte. Las barras (`CompositionList`) pueden estar en
 * tarjetas distintas de una misma pantalla mientras compartan este proveedor. Cada barra suma el valor de posiciones
 * completas (el análisis agrupa por `assetClass`, `sector`, `region` y `currency`), así que el aporte de cada posición es
 * su peso en la cartera y la lista explica el total de la barra. Nada se imprime: la vista previa no existe fuera de pantalla.
 */
export function CompositionPreviewProvider({ positions, children }: { positions: EnrichedPosition[]; children: ReactNode }) {
  const popId = useId();
  const [open, setOpen] = useState<OpenState | null>(null);
  const [place, setPlace] = useState<Placement | null>(null);
  const rows = useRef(new Map<string, HTMLElement>());
  const pop = useRef<HTMLDivElement | null>(null);
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);

  const clearTimers = useCallback(() => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  }, []);
  const close = useCallback(() => {
    clearTimers();
    setOpen(null);
    setPlace(null);
  }, [clearTimers]);
  useEffect(() => clearTimers, [clearTimers]);

  // Escape cierra y devuelve el foco a la fila; un toque o clic fuera, y la impresión, también la cierran.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const anchor = rows.current.get(open.id);
      const inside = pop.current?.contains(document.activeElement);
      close();
      if (inside) anchor?.focus();
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("[data-composition-row]") || pop.current?.contains(t)) return;
      close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("beforeprint", close);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("beforeprint", close);
    };
  }, [open, close]);

  // Posición junto a la fila, dentro de la ventana; se recalcula al desplazar o redimensionar.
  const reposition = useCallback(() => {
    if (!open || !pop.current) return;
    const anchor = rows.current.get(open.id);
    if (!anchor) return;
    const a = anchor.getBoundingClientRect();
    const size = { width: pop.current.offsetWidth, height: pop.current.offsetHeight };
    setPlace(placePopover(a, size, { width: window.innerWidth, height: window.innerHeight }));
  }, [open]);
  useLayoutEffect(() => {
    reposition();
  }, [reposition, open?.id]);
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const tick = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(reposition);
    };
    window.addEventListener("scroll", tick, true);
    window.addEventListener("resize", tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", tick, true);
      window.removeEventListener("resize", tick);
    };
  }, [open, reposition]);

  // Al abrir con el teclado, el foco entra a la vista previa (diálogo no modal).
  useEffect(() => {
    if (open?.focus && place) pop.current?.focus();
  }, [open?.focus, open?.id, place]);

  const scheduleClose = useCallback(() => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setOpen((o) => (o && !o.pinned ? null : o));
      setPlace(null);
    }, HOVER_CLOSE_MS);
  }, []);

  const api: PreviewApi = {
    popId,
    openId: open?.id ?? null,
    register: (id, el) => {
      if (el) rows.current.set(id, el);
      else rows.current.delete(id);
    },
    hover: (id, dimension, item) => {
      window.clearTimeout(closeTimer.current);
      window.clearTimeout(openTimer.current);
      if (open?.id === id) return;
      openTimer.current = window.setTimeout(() => setOpen({ id, dimension, item, pinned: false, focus: false }), HOVER_OPEN_MS);
    },
    leave: scheduleClose,
    activate: (id, dimension, item, viaKeyboard) => {
      clearTimers();
      if (open?.id === id && open.pinned) return close();
      setOpen({ id, dimension, item, pinned: true, focus: viaKeyboard });
    },
  };

  return (
    <PreviewContext.Provider value={api}>
      {children}
      {open && typeof document !== "undefined"
        ? createPortal(
            <HoldingsPreview
              ref={pop}
              id={popId}
              place={place}
              dimension={open.dimension}
              item={open.item}
              positions={positions}
              onEnter={() => window.clearTimeout(closeTimer.current)}
              onLeave={() => {
                if (!open.pinned) scheduleClose();
              }}
              onTab={() => {
                const anchor = rows.current.get(open.id);
                close();
                anchor?.focus();
              }}
            />,
            document.body,
          )
        : null}
    </PreviewContext.Provider>
  );
}

/** Lista de barras de un grupo (clase, sector, región o moneda); cada fila completa abre la vista previa de posiciones. */
export function CompositionList({ dimension, data, max = 8 }: { dimension: CompositionDimension; data: ExposureItem[]; max?: number }) {
  const api = useContext(PreviewContext);
  if (!api) throw new Error("CompositionList debe usarse dentro de CompositionPreviewProvider");
  return (
    <ul className="space-y-0.5">
      {data.slice(0, max).map((d) => {
        const id = rowId(dimension, d.key);
        return (
          <CompositionRow
            key={id}
            id={id}
            popId={api.popId}
            label={labelOf(dimension, d.key)}
            weight={d.weight}
            isOpen={api.openId === id}
            register={(el) => api.register(id, el)}
            onHover={() => api.hover(id, dimension, d)}
            onLeave={api.leave}
            onActivate={(viaKeyboard) => api.activate(id, dimension, d, viaKeyboard)}
          />
        );
      })}
    </ul>
  );
}

/** Composición del Informe: las cuatro dimensiones en una cuadrícula, con una vista previa compartida. */
export function CompositionGroups({
  groups,
  positions,
  max = 8,
}: {
  groups: CompositionGroup[];
  positions: EnrichedPosition[];
  max?: number;
}) {
  return (
    <CompositionPreviewProvider positions={positions}>
      <div className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-4 print:grid-cols-2">
        {groups.map((g) => (
          <div key={g.dimension}>
            <Overline className="mb-2 px-2">{g.title}</Overline>
            <CompositionList dimension={g.dimension} data={g.data} max={max} />
          </div>
        ))}
      </div>
    </CompositionPreviewProvider>
  );
}

/** Fila completa (nombre, porcentaje y barra) como un solo objetivo: abre la vista previa del grupo. */
function CompositionRow({
  id,
  popId,
  label,
  weight,
  isOpen,
  register,
  onHover,
  onLeave,
  onActivate,
}: {
  id: string;
  popId: string;
  label: string;
  weight: number;
  isOpen: boolean;
  register: (el: HTMLElement | null) => void;
  onHover: () => void;
  onLeave: () => void;
  onActivate: (viaKeyboard: boolean) => void;
}) {
  const missing = weight == null || !Number.isFinite(weight);
  const width = barWidth(weight);
  return (
    <li>
      <button
        type="button"
        ref={register}
        data-composition-row={id}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? popId : undefined}
        onPointerEnter={(e) => e.pointerType === "mouse" && onHover()}
        onPointerLeave={(e) => e.pointerType === "mouse" && onLeave()}
        // detail === 0: el clic lo generó el teclado (Enter o Espacio).
        onClick={(e) => onActivate(e.detail === 0)}
        className={`block w-full cursor-pointer rounded-xl px-2 py-2 text-left transition-colors duration-150 hover:bg-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-secondary print:p-0 ${
          isOpen ? "bg-secondary-fixed/40 ring-1 ring-secondary/25" : ""
        }`}
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{label}</span>
          <span className="whitespace-nowrap text-right text-[13px] font-semibold tabular-nums text-ink">{barLabel(weight)}</span>
        </span>
        <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-container">
          {!missing && width > 0 ? (
            <BarFill percent={width} />
          ) : null}
        </span>
      </button>
    </li>
  );
}

function HoldingsPreview({
  ref,
  id,
  place,
  dimension,
  item,
  positions,
  onEnter,
  onLeave,
  onTab,
}: {
  ref: React.Ref<HTMLDivElement>;
  id: string;
  place: Placement | null;
  dimension: CompositionDimension;
  item: ExposureItem;
  positions: EnrichedPosition[];
  onEnter: () => void;
  onLeave: () => void;
  onTab: () => void;
}) {
  const label = labelOf(dimension, item.key);
  const r = bucketHoldings(positions, dimension, item.key, item.weight);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") onTab();
  };
  let body: ReactNode;
  if (r.consistent) {
    body = (
      <>
        <p className="mt-3 text-micro font-semibold uppercase tracking-[0.06em] text-soft">Peso en la cartera</p>
        <ul className="mt-1 divide-y divide-line/70">
          {r.holdings.map((h) => (
            <li key={h.id} className="flex items-center gap-2.5 py-2">
              <AssetMark ticker={h.ticker} assetClass={h.assetClass} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold leading-4 text-ink">{h.ticker}</span>
                <span title={h.name} className="block truncate text-caption text-soft">
                  {h.name}
                </span>
              </span>
              <span className="whitespace-nowrap text-right text-sm font-bold tabular-nums text-ink">{pct(h.weight)}</span>
            </li>
          ))}
        </ul>
        {r.hidden > 0 ? (
          <p className="mt-0.5 border-t border-line/70 pt-2 text-caption text-soft">
            + {r.hidden} {r.hidden === 1 ? "posición más" : "posiciones más"}
          </p>
        ) : null}
      </>
    );
  } else {
    // Sin detalle por posición que explique la barra: se muestra el agregado real y se dice por qué no hay lista.
    body = (
      <p className="mt-3 text-caption leading-4 text-soft">
        Este grupo pesa {barLabel(item.weight)} de tu cartera ({usd(item.value)}). No pudimos reconstruir el detalle por
        posición con exactitud, así que mostramos solo el total.
      </p>
    );
  }
  return (
    <div
      ref={ref}
      id={id}
      role="dialog"
      aria-label={`Posiciones en ${label}`}
      tabIndex={-1}
      onPointerEnter={(e) => e.pointerType === "mouse" && onEnter()}
      onPointerLeave={(e) => e.pointerType === "mouse" && onLeave()}
      onKeyDown={onKeyDown}
      className="no-print animate-pop-in rounded-2xl border border-line bg-card p-4 shadow-pop outline-none print:hidden"
      // Posición, ancho y capa en línea: la vista previa flota sobre el informe aunque el CSS generado esté desactualizado.
      style={{
        position: "fixed",
        zIndex: 50,
        width: 304,
        maxWidth: "calc(100vw - 16px)",
        left: place?.left ?? 0,
        top: place?.top ?? 0,
        visibility: place ? "visible" : "hidden",
      }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate font-heading text-base font-extrabold text-ink">{label}</p>
        <p className="shrink-0 font-heading text-xl font-extrabold tabular-nums text-secondary">{barLabel(item.weight)}</p>
      </div>
      <p className="text-caption text-soft">
        {r.count} {r.count === 1 ? "posición" : "posiciones"}
      </p>
      {body}
    </div>
  );
}
