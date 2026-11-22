import type { SignalsSnapshot } from "@/lib/types";
import { BarFill } from "../charts/BarFill";
import { themeColor } from "@/lib/theme-css";
import { PROVENANCE_HELP, fmtProvenanceDate, parseSourceLine, splitEventSource } from "@/lib/provenance";
import { sourceBrandsIn } from "@/lib/source-logos";
import { barLabel, barWidth } from "../charts/HBars";
import { IconExternal, IconLayers, IconPulse } from "../icons";
import { GlobeNews } from "../nav-icons";
import { SourceMark } from "../ui/SourceMark";
import { publisherOf } from "@/lib/source-logos";
import { Card } from "../ui/primitives";
import { ProvenanceDates } from "../ui/provenance";
import { BtcDominanceTile, DefiTvlTile } from "../signals/CompanionTiles";
import { FearGreedGauge } from "../signals/FearGreedGauge";
import { type ScaleZone, ThreeZoneScale } from "../ui/ThreeZoneScale";
import { gprSegmentPosition } from "@/lib/geo-risk";

const GPR_ZONES: [ScaleZone, ScaleZone, ScaleZone] = [
  { label: "Bajo", range: "< 80" },
  { label: "Moderado", range: "80–120" },
  { label: "Elevado", range: "> 120" },
];

const impactColor = (impacto: string) =>
  impacto === "alto" ? themeColor.danger : impacto === "medio" ? themeColor.warnAccent : themeColor.muted;

/** Fecha en que Allocia consultó la fuente: la propia del dato o, si falta, la del snapshot. */
export const fetchedAtOf = (signals: SignalsSnapshot, key: string) =>
  signals.provenance?.[key]?.fetchedAt ?? signals.snapshotDate;

export function GeoRiskCard({ signals }: { signals: SignalsSnapshot }) {
  const geo = signals.provenance?.geo;
  const elevated = signals.geo.gprLevel === "elevado";
  const gpr = signals.geo.gprIndex;
  const gprPos = gprSegmentPosition(typeof gpr === "number" ? gpr : Number.NaN);
  return (
    <Card as="section" className="lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-10">
      <div>
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="icon-tile h-11 w-11">
            <GlobeNews size={22} />
          </span>
          <div>
            <h2 className="section-title">Riesgo geopolítico</h2>
            <p className="eyebrow">Contexto global y geopolítico</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
          <span className="font-heading text-[52px] font-extrabold leading-none tracking-[-0.03em] tabular-nums text-ink">
            {signals.geo.gprIndex ?? "No disponible"}
          </span>
          <span aria-hidden="true" className="hidden h-12 w-px bg-line sm:block" />
          <div className="min-w-[11rem] flex-1">
            <p className="text-body-sm font-medium text-ink">Índice de riesgo geopolítico (no se estima a partir de noticias)</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-lg px-3 py-1 text-sm font-bold ${elevated ? "bg-warn-bg text-warn" : "bg-low text-ink"}`}>
                Nivel {signals.geo.gprLevel}
              </span>
              <span className="text-caption text-soft">Tendencia {signals.geo.tendencia}</span>
            </div>
          </div>
        </div>
        {/* Escala con los umbrales reales del índice (bajo < 80, moderado 80–120, elevado > 120). Sin dato no se dibuja. */}
        {typeof gpr === "number" && Number.isFinite(gpr) ? (
          <div className="mt-5 max-w-xl">
            <ThreeZoneScale
              zones={GPR_ZONES}
              index={gprPos.index}
              frac={gprPos.frac}
              valueLabel={`${gpr} GPR`}
              ariaLabel={`Índice de riesgo geopolítico ${gpr}: nivel ${signals.geo.gprLevel}. Bajo, menos de 80. Moderado, de 80 a 120. Elevado, más de 120.`}
            />
          </div>
        ) : null}
      </div>
      <ProvenanceDates className="mt-4 lg:mt-0" source={geo?.source} dataDate={geo?.dataDate} fetchedAt={fetchedAtOf(signals, "geo")} />
    </Card>
  );
}

/** Dominio legible de un enlace («news.google.com» → «Google News»), para no mostrar «Medio no identificado». */
function hostLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host === "news.google.com") return "Google News";
    return host;
  } catch {
    return "enlace externo";
  }
}

export function NewsCard({ signals }: { signals: SignalsSnapshot }) {
  const geo = signals.provenance?.geo;
  return (
    <Card as="section">
      <h2 className="section-title">Noticias de mercado</h2>
      <ul className="mt-2 divide-y divide-line">
        {signals.geo.eventos.length === 0 && <li className="py-3 text-sm text-soft">No hay noticias recientes disponibles.</li>}
        {signals.geo.eventos.map((e, i) => {
          const src = splitEventSource(e.fuente);
          const url = e.fuente.includes("https://") ? e.fuente.slice(e.fuente.indexOf("https://")) : null;
          const publisher = publisherOf(e);
          // Orden fijo en todas las filas: medio → titular → resumen → fechas → fuente original.
          return (
            <li key={i} className="py-3.5 first:pt-2 last:pb-0">
              <div className="flex items-center gap-2.5">
                {publisher ? (
                  <>
                    <SourceMark brand={publisher} size="sm" />
                    <span className="text-caption font-semibold text-soft">Medio: {publisher.name}</span>
                  </>
                ) : (
                  <>
                    {/* Sin medio identificable: un recuadro neutro con líneas de texto (no se asigna el logo de nadie). */}
                    <span aria-hidden="true" className="icon-tile h-8 w-8 rounded-[10px]">
                      <GlobeNews size={16} />
                    </span>
                    <span className="text-caption font-semibold text-soft">{url ? `Vía ${hostLabel(url)}` : `Fuente: ${src.label}`}</span>
                  </>
                )}
              </div>
              <div className="mt-1.5 flex items-start gap-2">
                <span
                  className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: impactColor(e.impacto) }}
                  role="img"
                  aria-label={`Impacto ${e.impacto}`}
                />
                <h3 lang={e.traducido === false ? "en" : undefined} className="flex-1 text-[15px] font-bold leading-6 text-ink">{e.titulo}</h3>
              </div>
              <div className="mt-0.5 pl-[18px] text-caption text-soft">
                <p className="max-w-[75ch]">
                  {e.descripcion}
                  {e.sectores.length > 0 && <span> · Sectores: {e.sectores.join(", ")}</span>}
                </p>
                <ProvenanceDates
                  className="mt-1"
                  dataDate={src.dataDate ?? geo?.dataDate}
                  fetchedAt={fetchedAtOf(signals, "geo")}
                />
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3">
                  {url ? (
                    <span className="text-muted">
                      {e.traducido === false ? "Texto original, sin traducir" : "Traducción al español"}
                    </span>
                  ) : null}
                  {url && (
                    <a
                      className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-secondary underline underline-offset-2"
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Leer fuente original: ${e.titulo} (se abre en una pestaña nueva)`}
                    >
                      Leer fuente original <IconExternal size={13} />
                    </a>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function EmergingCard({ signals }: { signals: SignalsSnapshot }) {
  const e = signals.emerging;
  const prov = signals.provenance;
  return (
    <Card as="section">
      <div className="flex items-center gap-3">
        <IconPulse size={26} className="text-ink" />
        <h2 className="section-title">Señales emergentes</h2>
      </div>
      {/* Fear & Greed es el ancla; las otras dos señales pesan lo mismo entre sí y menos que ella. */}
      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-4">
        <FearGreedGauge
          score={e.fearGreedIndex}
          label={e.fearGreedLabel}
          dataDate={prov?.fearGreed?.dataDate}
          fetchedAt={fetchedAtOf(signals, "fearGreed")}
        />
        <div className="grid gap-3 md:grid-rows-[repeat(2,minmax(min-content,1fr))] md:gap-4">
          <BtcDominanceTile value={e.btcDominance} dataDate={prov?.btcDominance?.dataDate} fetchedAt={fetchedAtOf(signals, "btcDominance")} />
          <DefiTvlTile value={e.defiTvlUsd} dataDate={prov?.defi?.dataDate} fetchedAt={fetchedAtOf(signals, "defi")} />
        </div>
      </div>
    </Card>
  );
}

export function PredictionMarketsCard({ signals }: { signals: SignalsSnapshot }) {
  const pm = signals.provenance?.predictionMarkets;
  return (
    <Card as="section">
      <h2 className="section-title">Mercados de predicción</h2>
      <p className="mt-1 text-caption text-soft">Precio implícito de «Sí» · No es una probabilidad calibrada.</p>
      <ProvenanceDates className="mt-1.5" source={pm?.source} dataDate={pm?.dataDate} fetchedAt={fetchedAtOf(signals, "predictionMarkets")} />
      <ul className="mt-3 divide-y divide-line">
        {signals.emerging.predictionMarkets.length === 0 && <li className="py-2 text-sm text-soft">No hay mercados pertinentes con precios recientes disponibles.</li>}
        {signals.emerging.predictionMarkets.map((p, i) => {
          // La fuente viene como «Polymarket · nota · fecha ISO · https://…»: se muestra con una etiqueta
          // descriptiva y un enlace con el mismo destino, en lugar de la URL cruda.
          const line = parseSourceLine(p.fuente);
          const name = line.parts[0] ?? "la fuente";
          const when = fmtProvenanceDate(line.dataDate);
          return (
            <li key={i} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start gap-3">
                <p lang={p.traducido === false ? "en" : undefined} className="flex-1 text-[15px] font-medium leading-6 text-ink">{p.pregunta}{p.traducido === false ? <span className="ml-1.5 text-caption font-normal text-muted" lang="es">(sin traducir)</span> : null}</p>
                <p className="w-14 shrink-0 whitespace-nowrap text-right text-base font-extrabold tabular-nums text-secondary">
                  {barLabel(p.probabilidad)}
                </p>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-container"
                role="img"
                aria-label={`Precio implícito de «Sí»: ${barLabel(p.probabilidad)}`}
              >
                {barWidth(p.probabilidad) > 0 ? (
                  <BarFill percent={barWidth(p.probabilidad)} tone="secondary" />
                ) : null}
              </div>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-caption text-soft">
                <span>
                  Fuente: {line.parts.join(" · ") || p.fuente}
                  {when ? ` · Dato del ${when}` : ""}
                </span>
                {line.url ? (
                  <a
                    className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-secondary underline underline-offset-2"
                    href={line.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Ver mercado en ${name}: ${p.pregunta} (se abre en una pestaña nueva)`}
                  >
                    Ver mercado en {name} <IconExternal size={13} />
                  </a>
                ) : null}
              </p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/** Fuentes y disponibilidad: quién aportó cada dato, de qué origen y con qué fechas. Mismo contenido que antes. */
export function SourcesCard({ signals }: { signals: SignalsSnapshot }) {
  return (
    <section aria-labelledby="fuentes-h" className="card text-sm text-soft">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="icon-tile h-10 w-10">
          <IconLayers size={19} />
        </span>
        <h2 id="fuentes-h" className="section-title">
          Fuentes y disponibilidad
        </h2>
      </div>
      <p className="mt-3 text-caption">{PROVENANCE_HELP}</p>
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {Object.entries(signals.provenance ?? {}).map(([key, p]) => (
          <li key={key} className="flex gap-3 py-3">
            <span className="mt-0.5 flex shrink-0 gap-1">
              {(sourceBrandsIn(p.source).length ? sourceBrandsIn(p.source) : [null]).slice(0, 2).map((b, i) => (
                <SourceMark key={i} brand={b} fallback={p.source.slice(0, 2).toUpperCase()} size="sm" />
              ))}
            </span>
            <span className="min-w-0">
              <p className="flex flex-wrap items-center gap-x-2 text-body-sm text-ink">
                <span>{p.source}</span>
                <span className={`inline-flex items-center gap-1 text-caption ${p.origin === "no disponible" ? "text-muted" : "text-soft"}`}>
                  <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${p.origin === "no disponible" ? "bg-faint" : "bg-ok"}`} />
                  {p.origin === "no disponible" ? "No disponible" : "Disponible"} · {p.origin}
                </span>
              </p>
              <ProvenanceDates dataDate={p.dataDate} fetchedAt={fetchedAtOf(signals, key)} help="none" />
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-caption">
        «—» indica un dato no disponible, no un valor cero. Los precios de mercados de predicción no son probabilidades calibradas.
      </p>
    </section>
  );
}
