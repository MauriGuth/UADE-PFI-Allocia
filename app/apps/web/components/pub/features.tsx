import { pubColors } from "@/lib/pub/tokens";
import Image from "next/image";
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/pub/cn";

function FeatureCard({
  id,
  title,
  description,
  visual,
  className,
}: {
  id: string;
  title: string;
  description: string;
  visual: ReactNode;
  className?: string;
}) {
  return (
    <article
      id={id}
      className={cn(
        "group relative flex scroll-mt-8 flex-col gap-5 overflow-hidden rounded-pub-2xl border border-pub-border bg-pub-card p-5 shadow-[0_8px_30px_-22px_rgba(76,60,190,0.5)] sm:flex-row sm:items-center lg:p-6",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-heading text-[17px] leading-snug font-bold tracking-tight text-balance text-pub-ink">
          {title}
        </h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-pretty text-pub-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0 sm:w-[44%]">{visual}</div>
    </article>
  );
}

function GeoVisual() {
  return (
    <div className="relative h-36">
      <Image
        src="/brand/redesign/world-dots.png"
        alt=""
        width={1584}
        height={672}
        className="absolute top-0 right-0 h-auto w-[115%] max-w-none opacity-70 mix-blend-multiply dark:opacity-45 dark:mix-blend-screen dark:invert [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_78%)]"
      />
      <span
        className="absolute top-[34%] left-[22%] size-2 animate-pulse-dot rounded-full bg-pub-primary ring-2 ring-pub-card"
        aria-hidden="true"
      />
      <span
        className="absolute top-[28%] right-[18%] size-2 animate-pulse-dot rounded-full bg-pub-primary ring-2 ring-pub-card"
        style={{ animationDelay: "0.8s" }}
        aria-hidden="true"
      />
      <div className="absolute right-0 bottom-0 flex w-[150px] flex-col gap-1 rounded-pub-xl border border-pub-border bg-pub-card/95 p-2.5 shadow-lg backdrop-blur">
        <div className="leading-tight">
          <p className="text-[9px] text-pub-muted-foreground">Riesgo global</p>
          <p className="flex items-center gap-1.5 text-xs font-bold text-pub-warning">
            <span className="size-1.5 rounded-full bg-pub-warning" aria-hidden="true" />
            Medio
          </p>
        </div>
        <svg viewBox="0 0 120 24" className="h-5 w-full" aria-hidden="true">
          <path
            d="M2 20 L14 16 L24 18 L36 12 L48 14 L60 9 L72 12 L84 7 L96 10 L108 5 L118 6"
            fill="none"
            stroke={pubColors.lilac}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

function SignalsVisual() {
  const items = [
    { label: "BTC Dominancia", value: "+2,1%", tone: "text-pub-success" },
    { label: "Fear & Greed", value: "68 (Greed)", tone: "text-pub-success" },
    { label: "TVL DeFi", value: "US$ 102B", tone: "text-pub-ink" },
  ];
  // Tres lecturas como filas de una tabla (rótulo a la izquierda, cifra a la derecha), sin círculos con íconos.
  return (
    <dl className="divide-y divide-pub-border rounded-pub-xl border border-pub-border bg-pub-card px-3.5">
      {items.map(({ label, value, tone }) => (
        <div key={label} className="flex items-baseline justify-between gap-3 py-2.5">
          <dt className="text-[10.5px] text-pub-muted-foreground">{label}</dt>
          <dd className={cn("text-[12px] font-bold tabular-nums", tone)}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function RecommendationVisual() {
  return (
    <div className="rounded-pub-xl border border-pub-border bg-pub-card p-3.5 shadow-[0_10px_26px_-18px_rgba(76,60,190,0.6)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10.5px] font-semibold text-pub-ink">Rebalanceo sugerido</p>
        <span className="rounded-pub-md bg-pub-accent px-2 py-0.5 text-[9.5px] font-semibold text-pub-primary">
          Comprar
        </span>
      </div>
      <p className="mt-2 text-[11px] leading-snug font-medium text-pub-ink">
        Aumentar exposición a bonos del Tesoro de EE.UU.
      </p>
      <ul className="mt-2.5 flex flex-col gap-1.5">
        {["Menor correlación", "Mejora tu ratio riesgo/retorno", "Soporte en contexto actual"].map((t) => (
          <li key={t} className="flex items-center gap-2 text-[10px] text-pub-muted-foreground">
            <Check className="size-3.5 text-pub-success" strokeWidth={2.6} aria-hidden="true" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Features() {
  return (
    <section aria-label="Funcionalidades" className="relative z-20 mx-auto mt-5 max-w-[1520px] px-3 sm:px-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <FeatureCard
          id="contexto"
          title="Contexto geopolítico"
          description="Cruzamos tu composición con el índice de riesgo geopolítico y los eventos que afectan a tus sectores y regiones."
          visual={<GeoVisual />}
        />
        <FeatureCard
          id="senales"
          title="Señales de mercado"
          description="Sentimiento cripto, dominancia de BTC, TVL de DeFi y probabilidades de predicción markets en un solo lugar."
          visual={<SignalsVisual />}
        />
        <FeatureCard
          id="recomendaciones"
          title="Recomendaciones que explican su porqué"
          description="Cada observación expone la evidencia y la regla que la originó: datos de tu cartera, señales externas y criterio aplicado."
          visual={<RecommendationVisual />}
        />
      </div>
    </section>
  );
}
