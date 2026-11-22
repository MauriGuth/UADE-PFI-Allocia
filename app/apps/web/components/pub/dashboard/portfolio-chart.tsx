"use client";

import { pubColors } from "@/lib/pub/tokens";
import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/pub/cn";
import { PORTFOLIO_SERIES, RANGES, type RangeKey, formatUSD } from "@/lib/pub/demo-data";

const Y_MIN = 70;
const Y_MAX = 155;
const Y_TICKS = [150, 125, 100, 75];
const W = 400;
const H = 160;

function toY(v: number) {
  return H - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * H;
}

export function PortfolioChart() {
  const [range, setRange] = useState<RangeKey>("6M");
  const [hover, setHover] = useState<number | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);

  const { values, labels, change } = PORTFOLIO_SERIES[range];

  const { line, area } = useMemo(() => {
    const step = W / (values.length - 1);
    const pts = values.map((v, i) => `${(i * step).toFixed(2)},${toY(v).toFixed(2)}`);
    return {
      line: `M${pts.join(" L")}`,
      area: `M0,${H} L${pts.join(" L")} L${W},${H} Z`,
    };
  }, [values]);

  const activeIndex = hover ?? values.length - 1;
  const activeX = (activeIndex / (values.length - 1)) * 100;
  const activeY = (toY(values[activeIndex]) / H) * 100;
  const isLast = activeIndex === values.length - 1;
  const first = values[0];
  const pct = ((values[activeIndex] - first) / first) * 100;

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect) return;
    const t = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    setHover(Math.round(t * (values.length - 1)));
  }

  return (
    <div className="flex h-full flex-col rounded-pub-xl border border-pub-border bg-pub-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-pub-ink">Evolución de la cartera</h3>
        <div role="group" aria-label="Rango de tiempo" className="flex items-center gap-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRange(r);
                setHover(null);
              }}
              aria-pressed={range === r}
              className={cn(
                "rounded-full px-2.5 py-1 text-[9.5px] font-medium transition-colors",
                range === r
                  ? "bg-pub-accent font-semibold text-pub-primary ring-1 ring-pub-ring/40"
                  : "text-pub-muted-foreground hover:bg-pub-muted hover:text-pub-ink",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-1 gap-2">
        <div
          className="flex w-7 flex-col justify-between pb-6 text-[9px] text-pub-subtle tabular-nums"
          aria-hidden="true"
        >
          {Y_TICKS.map((t) => (
            <span key={t} style={{ transform: `translateY(${t === 150 ? "-2px" : "0"})` }}>
              {t}K
            </span>
          ))}
        </div>
        <div className="flex flex-1 flex-col">
          <div
            ref={plotRef}
            className="relative h-[140px] flex-1 cursor-crosshair touch-none"
            onPointerMove={handleMove}
            onPointerLeave={() => setHover(null)}
            role="img"
            aria-label={`Gráfico de evolución de la cartera (${range}, datos de demostración). Valor actual ${formatUSD(values[values.length - 1] * 1000)}.`}
          >
            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              className="absolute inset-0 size-full overflow-visible"
            >
              <defs>
                <linearGradient id="portfolio-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={pubColors.primary} stopOpacity="0.28" />
                  <stop offset="1" stopColor={pubColors.primary} stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {Y_TICKS.map((t) => (
                <line
                  key={t}
                  x1="0"
                  x2={W}
                  y1={toY(t)}
                  y2={toY(t)}
                  stroke={pubColors.border}
                  strokeDasharray="3 4"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              <path key={`a-${range}`} d={area} fill="url(#portfolio-area)" className="animate-pub-fade" />
              <path
                key={`l-${range}`}
                d={line}
                fill="none"
                stroke={pubColors.primary}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                pathLength={1}
                strokeDasharray="1"
                className="animate-draw"
              />
            </svg>

            {hover !== null && (
              <span
                aria-hidden="true"
                className="absolute top-0 bottom-0 w-px bg-pub-primary/25"
                style={{ left: `${activeX}%` }}
              />
            )}
            <span
              aria-hidden="true"
              className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-pub-ink bg-pub-card transition-[left,top] duration-150"
              style={{ left: `${activeX}%`, top: `${activeY}%` }}
            />
            <div
              aria-hidden="true"
              className="absolute z-10 rounded-pub-md bg-pub-ink px-2.5 py-1.5 text-left whitespace-nowrap text-pub-ink-foreground shadow-lg transition-[left,top] duration-150"
              style={{
                left: `${activeX}%`,
                top: `${activeY}%`,
                transform: `translate(${activeX > 70 ? "calc(-100% - 2px)" : "8px"}, calc(-100% - 10px))`,
              }}
            >
              <p className="text-[10px] font-semibold tabular-nums">{formatUSD(values[activeIndex] * 1000)}</p>
              <p className="text-[9px] font-medium text-pub-teal tabular-nums">
                {isLast && hover === null ? change : `${pct >= 0 ? "+" : ""}${pct.toFixed(1).replace(".", ",")}%`}
              </p>
            </div>
          </div>
          <div className="mt-2.5 flex justify-between px-2 text-[9px] text-pub-subtle" aria-hidden="true">
            {labels.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
