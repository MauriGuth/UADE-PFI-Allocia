"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, FileText, Mail, User, Wallet } from "lucide-react";
import { LogoMark } from "../logo";
import { PreviewShell } from "./portfolio-preview";
import { MARKETS_BY_REGION, MARKET_REGIONS, formatChange, type MarketRegion } from "@/lib/pub/auth-showcase-data";
import { cn } from "@/lib/pub/cn";

export function MarketsPreview({ className }: { className?: string }) {
  const [region, setRegion] = useState<MarketRegion>("EE.UU.");

  return (
    <PreviewShell className={className}>
      <div className="flex">
        <aside
          className="flex w-11 shrink-0 flex-col items-center gap-4 border-r border-pub-border/70 pt-4 text-pub-subtle"
          aria-hidden="true"
        >
          <LogoMark className="h-4" />
          <User className="mt-2 size-3.5" />
          <Mail className="size-3.5" />
          <Wallet className="size-3.5" />
          <FileText className="size-3.5" />
        </aside>
        <div className="min-w-0 flex-1 p-4">
          <p className="font-heading text-[13px] font-bold text-pub-ink">Mercados globales</p>
          <p className="text-[7.5px] text-pub-muted-foreground">
            Seguimiento de los principales índices y activos (demo).
          </p>
          <div
            role="tablist"
            aria-label="Región (demo)"
            className="mt-3 grid grid-cols-4 gap-1 rounded-pub-lg bg-pub-muted p-1"
          >
            {MARKET_REGIONS.map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={region === r}
                onClick={() => setRegion(r)}
                className={cn(
                  "rounded-pub-md py-1.5 text-[8.5px] transition-colors",
                  region === r
                    ? "bg-pub-accent font-semibold text-pub-primary ring-1 ring-pub-ring/40"
                    : "text-pub-muted-foreground hover:text-pub-ink",
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <ul className="mt-3 grid grid-cols-4 gap-1.5">
            {MARKETS_BY_REGION[region].map((m) => {
              const up = m.change >= 0;
              const Arrow = up ? ArrowUpRight : ArrowDownRight;
              return (
                <li key={m.name} className="rounded-pub-lg border border-pub-border bg-pub-card p-2 shadow-sm">
                  <p className="truncate text-[8px] font-semibold text-pub-ink">{m.name}</p>
                  <p
                    className={cn(
                      "mt-1 flex items-center gap-0.5 text-[10px] font-bold tabular-nums",
                      up ? "text-pub-success" : "text-pub-danger",
                    )}
                  >
                    {formatChange(m.change)}
                    <Arrow className="size-2.5" aria-hidden="true" />
                  </p>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 h-6 rounded-pub-md bg-pub-muted/70" aria-hidden="true" />
        </div>
      </div>
    </PreviewShell>
  );
}
