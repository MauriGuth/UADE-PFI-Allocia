import type { ReactNode } from "react";
import { cn } from "@/lib/pub/cn";

type RegionCardProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  className?: string;
  delay?: string;
};

export function RegionCard({ icon, title, subtitle, className, delay = "0s" }: RegionCardProps) {
  return (
    <div className={cn("absolute z-10", className)}>
      <div className="animate-float" style={{ animationDelay: delay }}>
        <div className="flex items-center gap-3 rounded-pub-xl border border-white/80 dark:border-white/10 bg-pub-card/75 py-2.5 pr-5 pl-3.5 shadow-[0_10px_30px_-12px_rgba(76,60,190,0.28)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-pub-card hover:shadow-[0_16px_36px_-14px_rgba(76,60,190,0.4)]">
          {icon}
          <div className="leading-tight">
            <p className="text-[13px] font-semibold text-pub-ink">{title}</p>
            <p className="text-[11px] text-pub-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MapDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute z-10 size-2.5 animate-pulse-dot rounded-full bg-pub-primary ring-[3px] ring-pub-card",
        className,
      )}
    />
  );
}
