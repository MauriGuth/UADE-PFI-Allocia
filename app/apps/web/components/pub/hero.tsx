import Image from "next/image";
import Link from "next/link";
import { FlagCN, FlagEU, FlagUS, LatAmIcon } from "./flags";
import { MapDot, RegionCard } from "./region-card";

export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[820px] overflow-hidden">
      <div className="absolute top-[-120px] left-1/2 h-[700px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(237,234,255,0.95),rgba(247,247,252,0))] dark:bg-[radial-gradient(closest-side,rgba(60,50,150,0.45),rgba(10,16,34,0))]" />
      <div className="absolute top-[120px] -left-[60px] h-[620px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(170,155,250,0.45),rgba(247,247,252,0))] dark:bg-[radial-gradient(closest-side,rgba(91,62,230,0.26),rgba(10,16,34,0))]" />
      <div className="absolute top-[40px] -right-[120px] h-[600px] w-[700px] rounded-full bg-[radial-gradient(closest-side,rgba(205,196,255,0.5),rgba(247,247,252,0))] dark:bg-[radial-gradient(closest-side,rgba(120,100,240,0.2),rgba(10,16,34,0))]" />

      <div className="absolute top-[150px] left-[-180px] w-[520px] animate-float-slow opacity-40 dark:opacity-20 sm:left-[-120px] md:opacity-60 md:dark:opacity-25 xl:left-[calc(50%-840px)]">
        <div className="relative aspect-square w-full overflow-hidden rounded-full">
          <Image
            src="/brand/redesign/globe.png"
            alt=""
            fill
            priority
            sizes="560px"
            className="scale-[1.75] object-cover mix-blend-multiply"
          />
        </div>
      </div>

      <div className="absolute top-[110px] right-[-260px] w-[640px] opacity-[0.35] dark:opacity-[0.15] sm:right-[-180px] lg:opacity-60 lg:dark:opacity-20 xl:right-[calc(50%-920px)]">
        <Image
          src="/brand/redesign/world-dots.png"
          alt=""
          width={1584}
          height={672}
          className="h-auto w-full mix-blend-multiply [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]"
        />
      </div>
    </div>
  );
}

export function HeroRegions() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-[460px] xl:block">
      <div className="pointer-events-auto relative h-full w-[calc(100%-60px)] max-w-[1520px] min-[1580px]:mx-auto min-[1580px]:w-full">
        <RegionCard
          icon={<FlagUS />}
          title="EE.UU."
          subtitle="Política monetaria"
          className="top-[132px] left-[40px]"
        />
        <MapDot className="top-[163px] left-[223px]" />
        <RegionCard
          icon={<LatAmIcon />}
          title="LatAm"
          subtitle="Flujos y commodities"
          className="top-[246px] left-[14px] min-[1440px]:top-[292px]"
          delay="1.2s"
        />
        <MapDot className="top-[221px] left-[-10px] min-[1440px]:top-[267px]" />
        <RegionCard
          icon={<FlagEU />}
          title="Europa"
          subtitle="Riesgos geopolíticos"
          className="top-[73px] right-[-28px]"
          delay="0.6s"
        />
        <MapDot className="top-[112px] right-[160px]" />
        <RegionCard
          icon={<FlagCN />}
          title="Asia"
          subtitle="Crecimiento y tecnología"
          className="top-[232px] right-[-56px]"
          delay="1.8s"
        />
        <MapDot className="top-[210px] right-[-46px]" />
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative z-20 px-5 pt-6 text-center md:pt-5">
      <p
        className="animate-rise text-[11px] font-medium tracking-[0.28em] text-pub-muted-foreground sm:text-xs"
        style={{ animationDelay: "0.05s" }}
      >
        TU CARTERA, CON MÁS CONTEXTO
      </p>
      <h1
        id="hero-title"
        className="mx-auto mt-3 max-w-4xl animate-rise font-heading text-[40px] leading-[1.02] font-extrabold tracking-[-0.035em] text-balance text-pub-ink sm:text-[52px] lg:text-[56px]"
        style={{ animationDelay: "0.12s" }}
      >
        Entendé tus inversiones.
        <span className="block bg-gradient-to-r from-[#4630dd] via-[#5b3ee6] to-[#7c5df7] dark:from-[#b8adff] dark:via-[#a99cf5] dark:to-[#8f7bf3] bg-clip-text pb-1 text-transparent">
          Anticipá los riesgos.
        </span>
      </h1>
      <p
        className="mx-auto mt-3 max-w-[600px] animate-rise text-base leading-relaxed text-pretty text-pub-muted-foreground sm:text-[17px]"
        style={{ animationDelay: "0.2s" }}
      >
        Analizá tu portafolio multiactivo con contexto geopolítico, señales de mercado y recomendaciones que siempre
        explican su porqué.
      </p>
      <div
        className="mt-6 flex animate-rise flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
        style={{ animationDelay: "0.28s" }}
      >
        <Link
          href="/register"
          className="inline-flex h-11 w-full max-w-60 items-center justify-center rounded-pub-md bg-pub-ink px-7 text-sm font-semibold text-pub-ink-foreground transition-colors hover:bg-pub-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pub-ring sm:h-[45px] sm:w-auto sm:max-w-none"
        >
          Crear cuenta
        </Link>
        <Link
          href="/login"
          className="inline-flex h-11 w-full max-w-60 items-center justify-center rounded-pub-md border border-pub-ink/25 px-7 text-sm font-semibold text-pub-ink transition-colors hover:border-pub-ink hover:bg-pub-card/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pub-ring sm:h-[45px] sm:w-auto sm:max-w-none"
        >
          Ya tengo cuenta
        </Link>
      </div>
    </section>
  );
}
