import { ArrowDown, ArrowRight, ArrowUp, Zap } from "lucide-react";
import Link from "next/link";

const SIGNALS = [
  {
    title: "Mayor volatilidad en tech",
    body: "Aumento de la sensibilidad a tasas en EE.UU.",
    time: "hace 2 h",
    icon: ArrowDown,
    tone: "bg-pub-danger-soft text-pub-danger",
  },
  {
    title: "Flujos positivos en LATAM",
    body: "Mayor apetito por riesgo en mercados emergentes.",
    time: "hace 6 h",
    icon: ArrowUp,
    tone: "bg-pub-teal-soft text-pub-teal",
  },
  {
    title: "Oportunidad en commodities",
    body: "Señales técnicas y contexto de oferta global.",
    time: "hace 1 día",
    icon: Zap,
    tone: "bg-pub-accent text-pub-primary",
  },
];

export function SignalsList() {
  return (
    <div className="flex h-full flex-col rounded-pub-xl border border-pub-border bg-pub-card p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10.5px] font-semibold text-pub-ink">Señales relevantes</h3>
        <Link
          href="#senales"
          className="group inline-flex items-center gap-1 text-[9px] font-medium text-pub-primary hover:underline"
        >
          Ver todas
          <ArrowRight className="size-2.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
      <ul className="mt-3 flex flex-col gap-3.5">
        {SIGNALS.map(({ title, body, time, icon: Icon, tone }) => (
          <li key={title} className="group flex gap-2.5 rounded-pub-lg transition-colors">
            <span
              className={`flex size-[30px] shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-110 ${tone}`}
            >
              <Icon
                className="size-4"
                strokeWidth={2.6}
                aria-hidden="true"
                fill={Icon === Zap ? "currentColor" : "none"}
              />
            </span>
            <div className="min-w-0">
              <p className="text-[9.5px] font-semibold text-pub-ink">{title}</p>
              <p className="text-[8.5px] leading-snug text-pub-muted-foreground">{body}</p>
              <p className="mt-0.5 text-[8px] text-pub-subtle">{time}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
