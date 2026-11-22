import { Activity, ArrowUpRight, BarChart3, Globe, TrendingUp } from "lucide-react";
import { AuthShowcase } from "./auth-showcase";
import { FloatingInsightCard, Sparkline } from "./floating-insight-card";
import { PortfolioPreview } from "./portfolio-preview";
import { MarketsPreview } from "./markets-preview";
import { ScaledStage } from "./scaled-stage";
import { SHOWCASE_ALLOCATION } from "@/lib/pub/auth-showcase-data";

const LOGIN_FEATURES = ["Contexto geopolítico global", "Señales de mercado en tiempo real", "Recomendaciones que explican su porqué"];

const REGISTER_FEATURES = ["Análisis multiactivo", "Información siempre explicada", "Más confianza en tus decisiones"];

const STAGE_W = 640;
const STAGE_H = 480;

function MetricChange({ value }: { value: string }) {
  return (
    <p className="mt-1.5 flex items-center gap-1 text-[22px] leading-none font-bold text-pub-success tabular-nums">
      {value}
      <ArrowUpRight className="size-5" aria-hidden="true" />
    </p>
  );
}

export function LoginShowcase() {
  return (
    <AuthShowcase
      title={
        <>
          Tus inversiones,
          <br />
        </>
      }
      highlight="con más contexto."
      description="Analizá tu portafolio con contexto geopolítico, señales de mercado y recomendaciones que siempre explican su porqué."
      features={LOGIN_FEATURES}
      backgroundImage="/brand/redesign/auth-login-background.webp"
    >
      <ScaledStage width={STAGE_W} height={STAGE_H}>
        <FloatingInsightCard className="top-[6px] left-0 z-20 w-[238px]" delay={300}>
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-pub-accent text-pub-primary">
              <Globe className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-pub-ink">Riesgo geopolítico</p>
              <p className="text-[17px] leading-tight font-bold text-pub-warning">Medio</p>
            </div>
          </div>
          <Sparkline points={[4, 6, 5, 7, 6, 9, 8, 11, 10, 13]} className="mt-2 h-10" />
        </FloatingInsightCard>

        <FloatingInsightCard className="top-[74px] left-[322px] z-20 w-[226px]" delay={450}>
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-pub-accent text-pub-primary">
              <Activity className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-pub-ink">Señal detectada</p>
              <p className="text-[12.5px] text-pub-muted-foreground">Momentum en BTC</p>
              <MetricChange value="+8,7%" />
            </div>
          </div>
        </FloatingInsightCard>

        <div className="absolute top-[166px] left-[6px] z-10 w-[440px] origin-top-left scale-[1.24]">
          <PortfolioPreview />
        </div>
      </ScaledStage>
    </AuthShowcase>
  );
}

function AllocationCard() {
  let acc = 0;
  const stops = SHOWCASE_ALLOCATION.map((s) => {
    const from = acc;
    acc += s.value;
    return `${s.color} ${from}% ${acc}%`;
  }).join(", ");

  return (
    <>
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-pub-lg bg-pub-accent text-pub-primary">
          <BarChart3 className="size-[18px]" aria-hidden="true" />
        </span>
        <p className="text-[14px] font-semibold text-pub-ink">Asignación de activos</p>
      </div>
      <div className="mt-4 flex items-center gap-5">
        <div
          role="img"
          aria-label="Gráfico de asignación de activos con datos de demostración"
          className="relative size-[104px] shrink-0 animate-pub-spin-in rounded-full"
          style={{ background: `conic-gradient(${stops})` }}
        >
          <div className="absolute inset-[23%] rounded-full bg-pub-card shadow-[inset_0_2px_6px_rgba(30,20,110,0.08)]" />
        </div>
        <ul className="flex flex-1 flex-col gap-1.5">
          {SHOWCASE_ALLOCATION.map((s) => (
            <li key={s.label} className="flex items-center gap-2 text-[11.5px] text-pub-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: s.color }} aria-hidden="true" />
              <span className="flex-1">{s.label}</span>
              <span className="font-semibold text-pub-ink tabular-nums">{s.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export function RegisterShowcase() {
  return (
    <AuthShowcase
      title={
        <>
          Decisiones mejor
          <br />
          informadas,
        </>
      }
      highlight={
        <>
          con
          <br />
          señales explicables.
        </>
      }
      description="Combinamos datos de mercado, contexto geopolítico y análisis avanzado para ayudarte a construir una cartera más sólida."
      features={REGISTER_FEATURES}
      backgroundImage="/brand/redesign/auth-register-background.webp"
    >
      <ScaledStage width={STAGE_W} height={STAGE_H}>
        <FloatingInsightCard className="top-0 left-0 z-20 w-[290px]" delay={300}>
          <AllocationCard />
        </FloatingInsightCard>

        <FloatingInsightCard className="top-[80px] left-[316px] z-20 w-[246px]" delay={450}>
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-pub-lg bg-pub-accent text-pub-primary">
              <TrendingUp className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-pub-ink">Oportunidad detectada</p>
              <p className="text-[12.5px] text-pub-muted-foreground">Sector tecnología</p>
              <MetricChange value="+12,3%" />
            </div>
          </div>
        </FloatingInsightCard>

        <div className="absolute top-[222px] left-[22px] z-10 w-[420px] origin-top-left scale-[1.3]">
          <MarketsPreview />
        </div>
      </ScaledStage>
    </AuthShowcase>
  );
}
