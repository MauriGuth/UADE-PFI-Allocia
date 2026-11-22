import { pubColors } from "@/lib/pub/tokens";
import { ChartColumn, Globe, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/pub/cn";

function KpiCard({
  label,
  value,
  valueClassName,
  footnote,
  icon,
  iconClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  footnote?: ReactNode;
  icon: ReactNode;
  iconClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-pub-xl border border-pub-border bg-pub-card px-3.5 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-16px_rgba(76,60,190,0.45)]">
      <div className="min-w-0">
        <p className="truncate text-[10.5px] text-pub-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-1 font-heading text-lg leading-tight font-bold tabular-nums tracking-tight text-pub-ink",
            valueClassName,
          )}
        >
          {value}
        </p>
        {footnote}
      </div>
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-pub-lg", iconClassName)}>
        {icon}
      </div>
    </div>
  );
}

function MiniSpark() {
  return (
    <svg viewBox="0 0 44 24" className="h-6 w-11" aria-hidden="true">
      <path
        d="M2 20 L9 15 L14 17 L20 10 L26 12 L32 6 L36 8 L42 2"
        fill="none"
        stroke={pubColors.primary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KpiCards() {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-[1.12fr_1fr_1fr_1.1fr]">
      <KpiCard
        label="Valor total de tu cartera"
        value="US$ 125.430"
        footnote={
          <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-pub-success">
            <span aria-hidden="true">{"▲"}</span> +2,4% (30 días)
          </p>
        }
        icon={<TrendingUp className="size-6 text-pub-success" strokeWidth={2.2} aria-hidden="true" />}
        iconClassName="bg-pub-success-soft"
      />
      <KpiCard
        label="Rendimiento YTD"
        value="+8,7%"
        valueClassName="text-pub-success"
        icon={<MiniSpark />}
        iconClassName="w-12 bg-pub-accent"
      />
      <KpiCard
        label="Riesgo (VaR 95%)"
        value="-4,2%"
        icon={<ChartColumn className="size-6 text-pub-primary" strokeWidth={2.4} aria-hidden="true" />}
        iconClassName="bg-pub-accent"
      />
      <KpiCard
        label="Índice de riesgo geopolítico"
        value="Medio"
        valueClassName="text-pub-warning"
        icon={<Globe className="size-6 text-pub-primary" strokeWidth={1.8} aria-hidden="true" />}
        iconClassName="bg-pub-muted"
      />
    </div>
  );
}
