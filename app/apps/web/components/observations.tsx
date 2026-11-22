"use client";

import { useId, useState } from "react";
import type { Observation, EvidenceScenario, Severity } from "@/lib/types";
import { SCOPE, observationRule, observationScope } from "@/lib/observations";
import { endSentence, fmtProvenanceDate } from "@/lib/provenance";
import { IconChevron } from "./icons";
import { AssetIdentity, AssetMark } from "./ui/AssetIdentity";
import { ScenarioEmptyState } from "./ScenarioEmptyState";
import { Card } from "./ui/primitives";

// Severidades: mismos textos y colores que components/cards.tsx de la app móvil.
export const SEVERITY: Record<
  Severity,
  { label: string; badge: string; accent: string }
> = {
  alerta: { label: "ALTA PRIORIDAD", badge: "bg-danger text-on-danger", accent: "text-danger" },
  atencion: { label: "MODERADA", badge: "bg-high text-ink", accent: "text-warn-accent" },
  info: {
    label: "INFO",
    badge: "bg-secondary-fixed text-secondary-on-fixed",
    accent: "text-secondary",
  },
};

export const SEVERITY_ORDER: Record<Severity, number> = { alerta: 0, atencion: 1, info: 2 };

/** Etiqueta «Sobre tu cartera» / «Contexto externo» con color distinto por alcance. */
export function ScopeBadge({ obs, className = "" }: { obs: Pick<Observation, "categoria" | "evidencia">; className?: string }) {
  const scope = SCOPE[observationScope(obs)];
  return (
    <span
      title={scope.description}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-micro font-semibold ${scope.badge} ${className}`}
    >
      {scope.label}
    </span>
  );
}

// Tarjeta de observación explicable: encabezado con badge de prioridad, alcance
// («Sobre tu cartera» / «Contexto externo»), la regla aplicada en una línea,
// mensaje y evidencia desplegable ("¿Por qué esta observación?").
export function ObservationCard({
  obs,
  defaultOpen = false,
  logoTicker,
  logoAssetClass,
}: {
  obs: Observation;
  defaultOpen?: boolean;
  /** Si la observación trata de un activo de la cartera, su logo reemplaza al ícono de severidad. */
  logoTicker?: string;
  logoAssetClass?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const sev = SEVERITY[obs.severidad];
  const rule = observationRule(obs);
  return (
    <Card as="article" className="flex flex-col">
      {/* Qué: alcance, prioridad y título. */}
      <div className="flex items-center justify-between gap-2">
        <ScopeBadge obs={obs} />
        <span className={`badge shrink-0 ${sev.badge}`}>{sev.label}</span>
      </div>
      <div className="mt-2.5 flex items-start gap-2.5">
        {logoTicker ? (
          <span className="mt-0.5 shrink-0">
            <AssetMark ticker={logoTicker} assetClass={logoAssetClass} size="sm" />
          </span>
        ) : null}
        <h3 className="flex-1 font-heading text-[17px] font-bold leading-6 text-ink">{obs.titulo}</h3>
      </div>
      <p className="mt-1.5 text-body-sm text-soft">{obs.mensaje}</p>
      {/* Por qué: la regla determinística que la disparó, siempre visible. */}
      {rule ? (
        <div className="mt-3 flex items-start gap-2.5 rounded-[10px] border border-line bg-low/70 px-3 py-2.5">
          <span aria-hidden="true" className="mt-[3px] h-3.5 w-1 shrink-0 rounded-full bg-secondary" />
          <p className="text-caption leading-5 text-soft">
            <span className="font-semibold text-ink">Regla aplicada</span> · <span className="tabular-nums">{rule}</span>
          </p>
        </div>
      ) : null}
      {/* Evidencia: los datos concretos que se evaluaron, con su fuente. */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className="mt-3 flex min-h-[44px] w-full items-center justify-between gap-3 rounded-[10px] px-1 text-left text-[14px] font-semibold text-secondary transition-colors hover:text-ink"
      >
        <span>
          {open ? "Ocultar evidencia" : "¿Por qué esta observación?"}
          {!open && obs.evidencia.length ? <span className="ml-1.5 font-normal text-soft">· {obs.evidencia.length} {obs.evidencia.length === 1 ? "dato" : "datos"}</span> : null}
        </span>
        <IconChevron size={18} className={`shrink-0 transition-transform duration-300 ease-soft ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div id={panelId} className="mt-1 animate-pop-in overflow-hidden rounded-[12px] border border-line">
          <p className="bg-low px-3.5 py-2 text-micro font-semibold tracking-[0.08em] text-soft">EVIDENCIA UTILIZADA</p>
          <dl className="divide-y divide-line">
            {obs.evidencia.map((e, i) => (
              <div key={i} className="grid gap-x-4 gap-y-0.5 px-3.5 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto]">
                <dt className="min-w-0 text-body-sm text-soft [overflow-wrap:anywhere]">
                  <span className="mr-1.5 inline-block rounded-md bg-low px-1.5 py-px text-[11px] font-semibold text-ink">{e.tipo}</span>
                  {e.descripcion}
                  <span className="block text-caption text-muted">Fuente: {e.fuente}</span>
                </dt>
                <dd className="text-body-sm font-bold tabular-nums text-ink sm:text-right">{e.valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </Card>
  );
}

/**
 * Escenarios con fuentes. Sin escenarios disponibles muestra un estado vacío
 * explícito con la opción de pedir el análisis desde la misma pantalla.
 */
export function ScenarioTabs({
  escenarios = [],
  ticker,
  onReady,
}: {
  escenarios?: EvidenceScenario[];
  /** Si se indica, el estado vacío y los pedidos se refieren a ese activo. */
  ticker?: string;
  /** Se invoca cuando un pedido de análisis termina, para recargar los escenarios. */
  onReady?: () => void | Promise<void>;
}) {
  if (!escenarios.length) return <ScenarioEmptyState ticker={ticker} onReady={onReady} />;
  return (
    <div className="space-y-5">
      {escenarios.map((e) => (
        <section key={e.id} className="space-y-2 text-sm">
          <h3 className="font-semibold">
            {e.ticker} · {{ up: "Posible suba", down: "Posible baja", neutral: "Posible estabilidad" }[e.direction]}
          </h3>
          <p>Si ocurre: {e.condition}</p>
          <p>{e.explanation}</p>
          <p className="text-xs text-soft">
            Análisis del {endSentence(fmtProvenanceDate(e.generatedAt) ?? e.generatedAt)} Es una interpretación condicional, no un hecho futuro confirmado ni una probabilidad calculada.
          </p>
          {e.sources.map((source) => (
            <a key={source.url} className="block text-secondary underline" href={source.url} target="_blank" rel="noopener noreferrer">
              Fuente: {source.title} · Dato del {fmtProvenanceDate(source.publishedAt) ?? "(fecha no informada)"}
            </a>
          ))}
          <details className="text-xs text-soft">
            <summary>Información faltante y limitaciones</summary>
            {e.limitations.map((l, i) => (
              <p key={i} className="mt-2">
                {l}
              </p>
            ))}
          </details>
        </section>
      ))}
    </div>
  );
}

const DIRECTION = {
  up: { label: "Posible suba", badge: "bg-ok-bg text-ok" },
  down: { label: "Posible baja", badge: "bg-danger-bg text-danger" },
  neutral: { label: "Posible estabilidad", badge: "bg-low text-soft" },
} as const;

/** Una fila de escenario: dirección, condición, explicación, fuentes con fecha y limitaciones desplegables. */
function ScenarioRow({ e }: { e: EvidenceScenario }) {
  const d = DIRECTION[e.direction];
  return (
    <section className="space-y-2 py-4 text-sm first:pt-0 last:pb-0">
      <div className="flex max-w-[72ch] flex-wrap items-center gap-x-3 gap-y-1.5">
        <h4 className="m-0">
          <span className="sr-only">{e.ticker} · </span>
          <span className={`badge ${d.badge}`}>{d.label}</span>
        </h4>
        <p className="min-w-0 flex-1 basis-64 font-semibold leading-5 text-ink">Si ocurre: {e.condition}</p>
      </div>
      <p className="max-w-[72ch] leading-6 text-ink">{e.explanation}</p>
      <p className="max-w-[72ch] text-caption text-soft">
        Análisis del {endSentence(fmtProvenanceDate(e.generatedAt) ?? e.generatedAt)} Es una interpretación condicional, no un hecho futuro confirmado ni una probabilidad calculada.
      </p>
      {e.sources.length > 0 ? (
        <ul className="space-y-1">
          {e.sources.map((source) => (
            <li key={source.url} className="text-caption leading-5 text-soft">
              Fuente:{" "}
              <a className="font-medium text-secondary underline underline-offset-2" href={source.url} target="_blank" rel="noopener noreferrer">
                {source.title}
              </a>{" "}
              · Dato del {fmtProvenanceDate(source.publishedAt) ?? "(fecha no informada)"}
            </li>
          ))}
        </ul>
      ) : null}
      <details className="group text-caption text-soft">
        <summary className="inline-flex min-h-[44px] cursor-pointer list-none items-center gap-1.5 rounded-lg font-semibold text-soft hover:text-ink [&::-webkit-details-marker]:hidden">
          <IconChevron size={14} className="shrink-0 -rotate-90 transition-transform group-open:rotate-0" />
          Información faltante y limitaciones
        </summary>
        <div className="max-w-[72ch] space-y-2 pb-1 pl-5">
          {e.limitations.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
      </details>
    </section>
  );
}

/**
 * Escenarios con fuentes en una sección ancha: agrupados por activo, cada escenario en su propia fila.
 * Mismo contenido que ScenarioTabs (condición, explicación, fuentes con fecha, limitaciones), con un
 * ancho de línea legible. Sin escenarios muestra el mismo estado vacío.
 */
export function ScenarioGroups({
  escenarios = [],
  assets = {},
  onReady,
  plain = false,
}: {
  escenarios?: EvidenceScenario[];
  /** Nombre y clase de cada activo de la cartera, para mostrar su logo en el encabezado del grupo. */
  assets?: Record<string, { name?: string; assetClass?: string }>;
  onReady?: () => void | Promise<void>;
  /** Sin tarjetas: filas simples separadas por una línea (el informe imprimible). */
  plain?: boolean;
}) {
  if (!escenarios.length) return <ScenarioEmptyState onReady={onReady} />;
  const groups: { ticker: string; items: EvidenceScenario[] }[] = [];
  for (const e of escenarios) {
    const g = groups.find((x) => x.ticker === e.ticker);
    if (g) g.items.push(e);
    else groups.push({ ticker: e.ticker, items: [e] });
  }
  const body = (g: { ticker: string; items: EvidenceScenario[] }) => (
    <>
      <div className="min-w-0">
        <AssetIdentity ticker={g.ticker} name={assets[g.ticker]?.name} assetClass={assets[g.ticker]?.assetClass} />
        <p className="mt-2 text-caption text-soft">
          {g.items.length === 1 ? "1 escenario" : `${g.items.length} escenarios`}
        </p>
      </div>
      <div className="min-w-0 divide-y divide-line">
        {g.items.map((e) => (
          <ScenarioRow key={e.id} e={e} />
        ))}
      </div>
    </>
  );
  return (
    <div className={plain ? "divide-y divide-line" : "space-y-3 md:space-y-4"}>
      {groups.map((g) =>
        plain ? (
          <article key={g.ticker} aria-label={`Escenarios de ${g.ticker}`} className="grid gap-4 py-5 first:pt-0 last:pb-0 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8 print:block print:break-inside-auto">
            {body(g)}
          </article>
        ) : (
          <Card as="article" key={g.ticker} aria-label={`Escenarios de ${g.ticker}`} className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8">
            {body(g)}
          </Card>
        ),
      )}
    </div>
  );
}
