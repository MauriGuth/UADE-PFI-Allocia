import { pubColors } from "@/lib/pub/tokens";
import { TrendingUp } from "lucide-react";
import { NAV_ITEMS } from "@/lib/pub/nav-items";
import { LogoMark } from "../logo";
import { RANGES, formatUSD, PORTFOLIO_TOTAL } from "@/lib/pub/demo-data";
import { SHOWCASE_MONTHS, SHOWCASE_SERIES } from "@/lib/pub/auth-showcase-data";
import { cn } from "@/lib/pub/cn";

const W = 300;
const H = 100;
const MIN = 70;
const MAX = 155;

function toY(v: number) {
  return H - ((v - MIN) / (MAX - MIN)) * H;
}

export function PreviewShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "[perspective:1400px] [mask-image:linear-gradient(to_bottom,black_72%,transparent_100%)]",
        className,
      )}
    >
      <div
        className="origin-[0%_40%] animate-rise rounded-pub-2xl border border-white/90 dark:border-white/10 bg-pub-card/[0.96] shadow-[0_50px_90px_-30px_rgba(20,14,90,0.55),0_0_0_1px_rgba(120,100,240,0.08)] [transform:rotateX(14deg)_rotateY(-9deg)_rotateZ(3deg)] transition-transform duration-700 hover:[transform:rotateX(9deg)_rotateY(-6deg)_rotateZ(2deg)]"
        style={{ animationDelay: "250ms" }}
      >
        {children}
      </div>
    </div>
  );
}

export function PortfolioPreview({ className }: { className?: string }) {
  const step = W / (SHOWCASE_SERIES.length - 1);
  const pts = SHOWCASE_SERIES.map((v, i) => `${(i * step).toFixed(1)},${toY(v).toFixed(1)}`);
  const last = SHOWCASE_SERIES[SHOWCASE_SERIES.length - 1];

  return (
    <PreviewShell className={className}>
      <div className="flex" role="img" aria-label="Vista previa del panel de cartera con datos de demostración">
        <aside className="w-[118px] shrink-0 border-r border-pub-border/70 px-2 pt-4" aria-hidden="true">
          <LogoMark className="ml-1.5 h-5" />
          <ul className="mt-5 flex flex-col gap-0.5">
            {NAV_ITEMS.map(({ label, icon: Icon }, i) => (
              <li
                key={label}
                className={cn(
                  "flex items-center gap-1.5 rounded-pub-md px-1.5 py-1.5 text-[8.5px] whitespace-nowrap",
                  i === 0 ? "bg-pub-accent font-semibold text-pub-primary" : "text-pub-muted-foreground",
                )}
              >
                <Icon className="size-3" />
                {label}
              </li>
            ))}
          </ul>
        </aside>
        <div className="min-w-0 flex-1 p-3.5" aria-hidden="true">
          <p className="font-heading text-[13px] font-bold text-pub-ink">Resumen de tu cartera</p>
          <p className="truncate text-[7.5px] text-pub-muted-foreground">
            Una visión integral de tus inversiones, con contexto y oportunidades.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between rounded-pub-lg border border-pub-border p-2">
              <div>
                <p className="text-[7px] text-pub-muted-foreground">Valor total</p>
                <p className="text-[12px] font-bold text-pub-ink tabular-nums">{formatUSD(PORTFOLIO_TOTAL)}</p>
                <p className="text-[7px] font-medium text-pub-success">{"▲ +2,4% (30d)"}</p>
              </div>
              <span className="flex size-6 items-center justify-center rounded-pub-md bg-pub-success-soft text-pub-success">
                <TrendingUp className="size-3.5" />
              </span>
            </div>
            <div className="flex items-center justify-between rounded-pub-lg border border-pub-border p-2">
              <div>
                <p className="text-[7px] text-pub-muted-foreground">Rendimiento YTD</p>
                <p className="text-[12px] font-bold text-pub-success tabular-nums">+8,7%</p>
              </div>
              <svg viewBox="0 0 30 14" className="h-4 w-8">
                <path
                  d="M0,12 L6,9 L11,10 L17,5 L22,6 L30,1"
                  fill="none"
                  stroke={pubColors.primary}
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          </div>
          <div className="mt-2 rounded-pub-lg border border-pub-border p-2">
            <div className="flex items-center justify-between">
              <p className="text-[8.5px] font-semibold text-pub-ink">Evolución de la cartera</p>
              <div className="flex gap-0.5">
                {RANGES.map((r) => (
                  <span
                    key={r}
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[6.5px]",
                      r === "6M"
                        ? "bg-pub-accent font-semibold text-pub-primary ring-1 ring-pub-ring/40"
                        : "text-pub-muted-foreground",
                    )}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-2 flex gap-1.5">
              <div className="flex flex-col justify-between pb-3 text-[6.5px] text-pub-subtle">
                <span>150K</span>
                <span>100K</span>
                <span>50K</span>
              </div>
              <div className="relative flex-1">
                <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-[82px] w-full overflow-visible">
                  <defs>
                    <linearGradient id="preview-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor={pubColors.primary} stopOpacity="0.25" />
                      <stop offset="1" stopColor={pubColors.primary} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={`M0,${H} L${pts.join(" L")} L${W},${H} Z`} fill="url(#preview-area)" />
                  <path
                    d={`M${pts.join(" L")}`}
                    fill="none"
                    stroke={pubColors.primary}
                    strokeWidth="1.8"
                    vectorEffect="non-scaling-stroke"
                    pathLength={1}
                    strokeDasharray="1"
                    className="animate-draw"
                  />
                </svg>
                <span
                  className="absolute right-0 size-2 translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-pub-primary bg-pub-card"
                  style={{ top: `${(toY(last) / H) * 82}px` }}
                />
                <div className="absolute top-0 right-2 rounded bg-pub-ink px-1.5 py-1 text-pub-ink-foreground">
                  <p className="text-[7.5px] font-semibold">US$ 125.430</p>
                  <p className="text-[6.5px] text-pub-teal">+2,4%</p>
                </div>
                <div className="mt-1 flex justify-between text-[6.5px] text-pub-subtle">
                  {SHOWCASE_MONTHS.map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PreviewShell>
  );
}
