"use client";

import { useState } from "react";
import { cn } from "@/lib/pub/cn";
import { ALLOCATION, PORTFOLIO_TOTAL, formatUSD } from "@/lib/pub/demo-data";

const R = 52;
const STROKE = 20;
const C = 2 * Math.PI * R;
const GAP = 1.2;

export function AllocationDonut() {
  const [active, setActive] = useState<string | null>(null);
  const current = ALLOCATION.find((a) => a.name === active);

  let offset = 0;
  const segments = ALLOCATION.map((a) => {
    const len = (a.value / 100) * C;
    const seg = { ...a, dash: Math.max(len - GAP, 0), offset };
    offset += len;
    return seg;
  });

  return (
    <div className="flex h-full flex-col rounded-pub-xl border border-pub-border bg-pub-card p-4">
      <h3 className="text-xs font-semibold text-pub-ink">Asignación de activos</h3>
      <div className="mt-3 flex flex-1 flex-col items-center gap-4 sm:flex-row sm:gap-3">
        <div className="relative size-[132px] shrink-0">
          <svg
            viewBox="0 0 140 140"
            className="size-full -rotate-90"
            role="img"
            aria-label="Asignación de activos (datos de demostración)"
          >
            {segments.map((s) => (
              <circle
                key={s.name}
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={active === s.name ? STROKE + 5 : STROKE}
                strokeDasharray={`${s.dash} ${C - s.dash}`}
                strokeDashoffset={-s.offset}
                opacity={active && active !== s.name ? 0.45 : 1}
                className="cursor-pointer transition-all duration-300"
                onPointerEnter={() => setActive(s.name)}
                onPointerLeave={() => setActive(null)}
              />
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-bold text-pub-ink tabular-nums">
              {current ? `${current.value}%` : formatUSD(PORTFOLIO_TOTAL)}
            </span>
            <span className="text-[9px] text-pub-muted-foreground">{current ? current.name : "Total"}</span>
          </div>
        </div>
        <ul className="flex w-full flex-1 flex-col gap-2">
          {ALLOCATION.map((a) => (
            <li
              key={a.name}
              onPointerEnter={() => setActive(a.name)}
              onPointerLeave={() => setActive(null)}
              className={cn(
                "flex items-center justify-between gap-2 rounded px-1 text-[9.5px] transition-colors",
                active === a.name ? "bg-pub-muted" : "",
              )}
            >
              <span className="flex items-center gap-2 text-pub-muted-foreground">
                <span className="size-2 rounded-full" style={{ backgroundColor: a.color }} aria-hidden="true" />
                {a.name}
              </span>
              <span className="font-semibold text-pub-ink tabular-nums">{a.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
