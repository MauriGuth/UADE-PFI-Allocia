"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { SCOPE, observationScope, observationTicker, type ObservationScope } from "@/lib/observations";
import type { Severity } from "@/lib/types";
import { useAsync } from "@/lib/use-async";
import { ConcentrationCard } from "../ConcentrationCard";
import { ObservationCard, SEVERITY, SEVERITY_ORDER } from "../observations";
import { Resource } from "../ui/resource";
import { Card, Footer, ScreenTitle } from "../ui/primitives";

type Filter = "todas" | Severity;

type ScopeFilter = "todas" | ObservationScope;

// Pantalla "Riesgo": observaciones de IA con su evidencia.
export function RiesgoView() {
  const state = useAsync(async () => {
    const [obs, analysis] = await Promise.all([api.observations(), api.analysis().catch(() => null)]);
    return { obs, analysis };
  });
  const [filter, setFilter] = useState<Filter>("todas");
  const [scope, setScope] = useState<ScopeFilter>("todas");
  // ≥ xl (1280 px): dos columnas de tarjetas independientes; en pantallas más angostas, una sola.
  const [twoCols, setTwoCols] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const sync = () => setTwoCols(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      <ScreenTitle
        title="Qué revisar en tu cartera"
        subtitle="Los puntos que merecen atención, explicados a partir de tus activos. Abrí cada detalle para ver el motivo."
      />
      <Resource state={state} loadingLabel="Cargando observaciones…">
        {({ obs, analysis }) => {
          const sorted = [...obs.observaciones].sort(
            (a, b) => SEVERITY_ORDER[a.severidad] - SEVERITY_ORDER[b.severidad],
          );
          if (sorted.length === 0) {
            return (
              <Card className="mx-auto max-w-xl py-10 text-center">
                <h2 className="text-base font-semibold text-ink">Sin observaciones por ahora</h2>
                <p className="mt-1.5 text-[13px] leading-[19px] text-soft">
                  Cargá activos en tu cartera y el motor de análisis va a generar observaciones
                  explicables sobre concentración, exposición y contexto.
                </p>
              </Card>
            );
          }
          const count = (s: Severity) => sorted.filter((o) => o.severidad === s).length;
          const filters: { key: Filter; label: string; n: number }[] = [
            { key: "todas", label: "Todas", n: sorted.length },
            { key: "alerta", label: SEVERITY.alerta.label, n: count("alerta") },
            { key: "atencion", label: SEVERITY.atencion.label, n: count("atencion") },
            { key: "info", label: SEVERITY.info.label, n: count("info") },
          ];
          const scopeCount = (s: ObservationScope) => sorted.filter((o) => observationScope(o) === s).length;
          const scopes: { key: ScopeFilter; label: string; n: number }[] = [
            { key: "todas", label: "Todo", n: sorted.length },
            { key: "cartera", label: SCOPE.cartera.label, n: scopeCount("cartera") },
            { key: "externo", label: SCOPE.externo.label, n: scopeCount("externo") },
          ];
          const visible = sorted
            .filter((o) => filter === "todas" || o.severidad === filter)
            .filter((o) => scope === "todas" || observationScope(o) === scope);

          return (
            <>
              {analysis && analysis.positionCount > 0 ? (
                <ConcentrationCard variant="meter" concentration={analysis.concentration} positionCount={analysis.positionCount} />
              ) : null}
              <div className="no-print space-y-3">
                {/* Dos filtros independientes, cada uno con su rótulo visible: se combinan entre sí. */}
                <div className="flex flex-wrap items-start gap-x-10 gap-y-4">
                  <div className="space-y-1.5">
                    <p className="eyebrow" aria-hidden="true">Prioridad</p>
                    <div role="group" aria-label="Filtrar por prioridad" className="flex flex-wrap gap-2">
                      {filters.map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          aria-pressed={filter === f.key}
                          onClick={() => setFilter(f.key)}
                          disabled={f.n === 0 && f.key !== "todas"}
                          className="pill !px-4 !text-sm disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {f.label} · {f.n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="eyebrow" aria-hidden="true">Origen</p>
                    <div role="group" aria-label="Filtrar por alcance" className="flex flex-wrap gap-2">
                      {scopes.map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          aria-pressed={scope === f.key}
                          onClick={() => setScope(f.key)}
                          disabled={f.n === 0 && f.key !== "todas"}
                          className="pill !px-4 !text-sm disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {f.label} · {f.n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="max-w-4xl text-caption text-soft">
                  <span className="font-semibold text-ink">{SCOPE.cartera.label}</span>: {SCOPE.cartera.description}{" "}
                  <span className="font-semibold text-ink">{SCOPE.externo.label}</span>: {SCOPE.externo.description}
                </p>
              </div>
              {visible.length === 0 ? (
                <Card tone="low">
                  <p className="text-[13px] text-soft">Ninguna observación coincide con los filtros elegidos.</p>
                </Card>
              ) : (
                // Columnas independientes (en pantallas anchas): cada tarjeta mide lo que mide su contenido, así que
                // abrir la evidencia de una no estira a su vecina ni deja huecos. El orden de lectura (por prioridad)
                // se conserva repartiendo las tarjetas de forma alternada.
                <div className="grid items-start gap-3 md:gap-4 xl:grid-cols-2">
                  {Array.from({ length: twoCols ? 2 : 1 }, (_, col) => (
                    <div key={col} className="space-y-3 md:space-y-4">
                      {visible
                        .filter((_, i) => (twoCols ? i % 2 === col : true))
                        .map((o) => {
                          const held = observationTicker(o, analysis?.positions ?? []);
                          return <ObservationCard key={o.id} obs={o} logoTicker={held?.ticker} logoAssetClass={held?.assetClass} />;
                        })}
                    </div>
                  ))}
                </div>
              )}
              <Footer />
            </>
          );
        }}
      </Resource>
    </div>
  );
}
