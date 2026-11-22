import { pubColors } from "@/lib/pub/tokens";
import { cn } from "@/lib/pub/cn";

export function FloatingInsightCard({
  className,
  children,
  delay = 0,
}: {
  className?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div className={cn("absolute animate-rise", className)} style={{ animationDelay: `${delay}ms` }}>
      <div
        className="animate-float rounded-pub-2xl border border-white/80 dark:border-white/10 bg-pub-card/[0.97] p-4 shadow-[0_30px_60px_-24px_rgba(18,12,80,0.6),0_2px_6px_rgba(18,12,80,0.08)] backdrop-blur transition-transform duration-300 hover:-translate-y-1"
        style={{ animationDelay: `${delay * 2}ms` }}
      >
        {children}
      </div>
    </div>
  );
}

export function Sparkline({ points, className }: { points: number[]; className?: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const d = points
    .map((p, i) => `${(i / (points.length - 1)) * 100},${28 - ((p - min) / (max - min || 1)) * 24}`)
    .join(" L");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={cn("h-7 w-full", className)} aria-hidden="true">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={pubColors.primary} stopOpacity="0.25" />
          <stop offset="1" stopColor={pubColors.primary} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M0,30 L${d} L100,30 Z`} fill="url(#spark-fill)" />
      <path
        d={`M${d}`}
        fill="none"
        stroke={pubColors.primary}
        strokeWidth="1.6"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}
