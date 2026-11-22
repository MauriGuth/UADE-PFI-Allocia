"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ExposureItem } from "@/lib/types";
import type { ClassDetail } from "@/lib/composition";
import { categoricalVar } from "@/lib/theme-css";
import { classLabel, pct, usd } from "@/lib/format";
import { AssetMark } from "../ui/AssetIdentity";
import { barLabel } from "./HBars";

/** Posición que se muestra en la vista previa de un grupo (datos reales de la cartera). */
export interface DonutHolding {
  ticker: string;
  assetClass?: string;
  weight: number;
}

// Donut de composición con el total de posiciones en el centro.
//
// Interacción (táctil primero):
//   · Un toque (o clic) en un segmento o en su fila de la leyenda lo ELIGE: el segmento se adelanta, el centro muestra
//     su nombre, su porcentaje y cuántas posiciones/USD son, y debajo aparecen sus posiciones. Otro toque lo suelta.
//   · Con mouse, pasar por encima muestra la misma vista previa sin elegir.
//   · Con teclado, el foco visible muestra la vista previa y Enter/Espacio eligen.
// Antes el primer toque en el teléfono disparaba `focus` (activaba) y luego `click` (desactivaba), así que hacía falta
// tocar dos veces. Ahora el foco solo cuenta cuando es foco de teclado (`:focus-visible`).
export function Donut({
  data,
  useClassLabels,
  total,
  size = 140,
  legendClassName = "",
  details,
  holdings,
  selectedKey = null,
  onSelect,
}: {
  data: ExposureItem[];
  useClassLabels?: boolean;
  total?: number;
  size?: number;
  legendClassName?: string;
  /** Detalle (posiciones y USD) por clave de `data`, para la vista previa del centro. */
  details?: Record<string, ClassDetail>;
  /** Posiciones de cada grupo (por clave de `data`), para la vista previa al elegirlo. */
  holdings?: Record<string, DonutHolding[]>;
  /** Con `onSelect`, el grupo elegido lo guarda quien llama (p. ej. para filtrar una tabla). */
  selectedKey?: string | null;
  onSelect?: (key: string) => void;
}) {
  const uid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const [keyFocus, setKeyFocus] = useState<number | null>(null);
  const [ownSel, setOwnSel] = useState<number | null>(null);

  const selIdx = onSelect ? (selectedKey ? data.findIndex((d) => d.key === selectedKey) : -1) : (ownSel ?? -1);
  const sel = selIdx >= 0 ? selIdx : null;
  const shown = hover ?? keyFocus ?? sel;

  const stroke = Math.round((size * 22) / 176);
  // Margen exterior para el dial de marcas y para que el segmento elegido pueda adelantarse sin recortarse.
  const r = (size - stroke) / 2 - Math.round(size * 0.075);
  const rIn = r - stroke / 2;
  const rOut = r + stroke / 2;
  // Los segmentos se dibujan una sola vez, cuando el donut entra en pantalla.
  const box = useRef<HTMLDivElement | null>(null);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setDrawn(true);
      return;
    }
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        setDrawn(true);
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(el);
    // Al imprimir, el donut se muestra completo aunque nunca haya entrado en pantalla.
    const print = () => setDrawn(true);
    window.addEventListener("beforeprint", print);
    return () => {
      io.disconnect();
      window.removeEventListener("beforeprint", print);
    };
  }, []);
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const gap = Math.max(2.5, size / 60);
  const label = (d: ExposureItem) => (useClassLabels ? classLabel(d.key) : d.key);
  const summary = data.map((d) => `${label(d)} ${pct(d.weight, 0)}`).join(", ");
  const color = (i: number) => categoricalVar(i);
  const detailLines = (d: ExposureItem): string[] => {
    const x = details?.[d.key];
    if (!x) return [];
    return [x.count === 1 ? "1 posición" : `${x.count} posiciones`, usd(x.value)];
  };
  const detailText = (d: ExposureItem): string | null => detailLines(d).join(" · ") || null;
  const choose = (i: number) => {
    if (onSelect) onSelect(data[i].key);
    else setOwnSel((s) => (s === i ? null : i));
  };

  let offset = 0;
  const segments = data.map((d, i) => {
    const valid = Number.isFinite(d.weight) && d.weight > 0;
    const start = offset;
    offset += valid ? d.weight * c : 0;
    return { d, i, valid, start, len: valid ? Math.max(d.weight * c - gap, 1.5) : 0 };
  });

  const selectedHoldings = sel !== null ? (holdings?.[data[sel].key] ?? []).slice().sort((a, b) => b.weight - a.weight) : [];

  return (
    <div onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}>
      <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-5 sm:justify-start">
        <div ref={box} className="donut relative shrink-0" style={{ width: size, height: size }}>
          {/* Luz ambiente del color elegido, detrás del aro: tenue y sin animación continua. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-[6%] rounded-full blur-xl transition-opacity duration-500"
            style={{
              background: shown !== null ? `radial-gradient(closest-side, transparent 62%, ${color(shown)} 80%, transparent 100%)` : "none",
              opacity: shown !== null ? 0.28 : 0,
            }}
          />
          <svg width={size} height={size} role="group" aria-label={`Composición: ${summary}`} className="relative overflow-visible">
            <defs>
              <radialGradient id={`${uid}-hole`} cx="50%" cy="38%" r="62%">
                <stop offset="0%" style={{ stopColor: "rgb(var(--c-card))" }} />
                <stop offset="100%" style={{ stopColor: "rgb(var(--c-low))" }} />
              </radialGradient>
              {/* Sombreado radial por segmento: más oscuro hacia el centro, el color pleno en el medio y una luz en el
                  borde exterior. Así el aro se lee como un volumen y no como un trazo plano. */}
              {segments.map(({ i }) => (
                <radialGradient key={i} id={`${uid}-g${i}`} gradientUnits="userSpaceOnUse" cx={cx} cy={cx} r={rOut + 2}>
                  <stop offset={`${((rIn - 1) / (rOut + 2)) * 100}%`} style={{ stopColor: `color-mix(in srgb, ${color(i)} 72%, black)` }} />
                  <stop offset={`${((rIn + stroke * 0.45) / (rOut + 2)) * 100}%`} style={{ stopColor: color(i) }} />
                  <stop offset="100%" style={{ stopColor: `color-mix(in srgb, ${color(i)} 70%, white)` }} />
                </radialGradient>
              ))}
            </defs>
            {/* Hueco central con un degradado muy suave: da profundidad sin competir con los datos. */}
            <circle cx={cx} cy={cx} r={rIn - 5} fill={`url(#${uid}-hole)`} style={{ filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.06))" }} />
            {/* Aro de fondo: marca la forma completa aunque haya segmentos chicos. */}
            <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgb(var(--c-line))" strokeWidth={stroke} opacity={0.4} />
            {/* Dial: marcas finas alrededor del aro; las que caen sobre el grupo visible toman su color. */}
            {Array.from({ length: 72 }, (_, k) => {
              const frac = k / 72;
              const a = frac * 2 * Math.PI - Math.PI / 2;
              const major = k % 6 === 0;
              const r1 = rOut + 5;
              const r2 = rOut + (major ? 10 : 8);
              const seg = shown !== null ? segments[shown] : null;
              const on = !!seg && seg.valid && frac * c >= seg.start && frac * c <= seg.start + seg.len;
              return (
                <line
                  key={k}
                  x1={cx + Math.cos(a) * r1}
                  y1={cx + Math.sin(a) * r1}
                  x2={cx + Math.cos(a) * r2}
                  y2={cx + Math.sin(a) * r2}
                  stroke={on && shown !== null ? color(shown) : "rgb(var(--c-outline))"}
                  strokeWidth={major ? 1.4 : 1}
                  strokeLinecap="round"
                  opacity={on ? 1 : major ? 0.55 : 0.3}
                  style={{ transition: "stroke 250ms ease, opacity 250ms ease" }}
                />
              );
            })}
            {segments.map(({ d, i, valid, start, len }) => {
              if (!valid) return null;
              const isShown = shown === i;
              const mid = ((start + len / 2) / c) * 2 * Math.PI - Math.PI / 2;
              const lift = isShown ? 4 : 0;
              return (
                <g
                  key={d.key}
                  style={{
                    transform: `translate(${Math.cos(mid) * lift}px, ${Math.sin(mid) * lift}px)`,
                    opacity: shown !== null && !isShown ? 0.38 : 1,
                    transition: "transform 380ms cubic-bezier(0.34,1.4,0.64,1), opacity 220ms ease-out",
                  }}
                >
                  <circle
                    cx={cx}
                    cy={cx}
                    r={r}
                    fill="none"
                    stroke={`url(#${uid}-g${i})`}
                    strokeWidth={isShown ? stroke + 4 : stroke}
                    strokeDasharray={`${drawn ? len : 0} ${c}`}
                    strokeDashoffset={-start}
                    transform={`rotate(-90 ${cx} ${cx})`}
                    style={{
                      transition: `stroke-width 300ms cubic-bezier(0.22,1,0.36,1), stroke-dasharray 900ms cubic-bezier(0.22,1,0.36,1) ${i * 110}ms`,
                      cursor: "pointer",
                      outline: "none",
                      filter: isShown ? `drop-shadow(0 4px 8px color-mix(in srgb, ${color(i)} 45%, transparent))` : undefined,
                    }}
                    role="button"
                    aria-pressed={sel === i}
                    aria-label={`${label(d)}: ${pct(d.weight)}${detailText(d) ? `, ${detailText(d)}` : ""}`}
                    tabIndex={0}
                    onPointerEnter={(e) => e.pointerType === "mouse" && setHover(i)}
                    onPointerMove={(e) => e.pointerType === "mouse" && hover !== i && setHover(i)}
                    onClick={() => choose(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        choose(i);
                      }
                    }}
                    onFocus={(e) => {
                      if (e.currentTarget.matches(":focus-visible")) setKeyFocus(i);
                    }}
                    onBlur={() => setKeyFocus(null)}
                  />
                </g>
              );
            })}
            {/* Filos de luz del aro: interior y exterior, muy finos. */}
            <circle cx={cx} cy={cx} r={rIn - 0.5} fill="none" className="donut-inner-edge" strokeWidth={1} pointerEvents="none" />
            <circle cx={cx} cy={cx} r={rOut + 0.5} fill="none" stroke="rgb(var(--c-ink) / 0.06)" strokeWidth={1} pointerEvents="none" />
          </svg>

          {/* Centro: total en reposo; con un grupo visible, su nombre, porcentaje y resumen. */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            {shown === null || !data[shown] ? (
              total !== undefined && (
                <div key="total" className="flex animate-pop-in flex-col items-center">
                  <span className="font-heading text-[30px] font-extrabold leading-8 tabular-nums text-ink">{total}</span>
                  <span className="text-caption text-soft">{total === 1 ? "posición" : "posiciones"}</span>
                </div>
              )
            ) : (
              <div key={data[shown].key} aria-hidden="true" className="flex max-w-[70%] animate-pop-in flex-col items-center">
                <span className="max-w-full truncate text-caption font-semibold text-soft">{label(data[shown])}</span>
                <span className="font-heading text-[28px] font-extrabold leading-8 tabular-nums text-ink">{barLabel(data[shown].weight)}</span>
                {detailLines(data[shown]).map((line) => (
                  <span key={line} className="whitespace-nowrap text-micro leading-4 text-soft">
                    {line}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <ul className={`min-w-[160px] flex-1 space-y-1 ${legendClassName}`}>
          {data.map((d, i) => (
            <li key={d.key}>
              <button
                type="button"
                aria-pressed={sel === i}
                onClick={() => choose(i)}
                onPointerEnter={(e) => e.pointerType === "mouse" && setHover(i)}
                className={`flex min-h-[40px] w-full items-center gap-2.5 rounded-xl px-2.5 text-left transition-[background-color,opacity] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
                  shown === i ? "bg-low" : ""
                } ${shown !== null && shown !== i ? "opacity-55" : ""}`}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${color(i)} 82%, white), ${color(i)})` }} />
                <span className="min-w-0 flex-1 truncate text-[14px] text-ink">{label(d)}</span>
                <span className="whitespace-nowrap text-right text-[14px] font-semibold tabular-nums text-ink">{barLabel(d.weight)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Posiciones del grupo elegido (datos reales). Aparece solo al elegir, no al pasar el cursor. */}
      {sel !== null && selectedHoldings.length > 0 ? (
        <div key={data[sel].key} className="mt-4 animate-pop-in rounded-2xl border border-line bg-low/60 p-3">
          <p className="px-1 text-caption font-semibold text-soft">
            {label(data[sel])} · {selectedHoldings.length === 1 ? "1 posición" : `${selectedHoldings.length} posiciones`}
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {selectedHoldings.slice(0, 8).map((h) => (
              <li key={h.ticker} className="flex items-center gap-2 rounded-full border border-line bg-card py-1 pl-1 pr-3">
                <AssetMark ticker={h.ticker} assetClass={h.assetClass} size="sm" />
                <span className="text-[13px] font-semibold text-ink">{h.ticker}</span>
                <span className="text-[13px] tabular-nums text-soft">{pct(h.weight)}</span>
              </li>
            ))}
            {selectedHoldings.length > 8 ? (
              <li className="flex items-center px-2 text-caption text-soft">y {selectedHoldings.length - 8} más</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
