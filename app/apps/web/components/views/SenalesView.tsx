"use client";

import { api } from "@/lib/client";
import Link from "next/link";
import { fmtProvenanceDate } from "@/lib/provenance";
import { useAsync } from "@/lib/use-async";
import { LiveStatus } from "../ui/LiveStatus";
import { Resource } from "../ui/resource";
import { Footer, ScreenTitle } from "../ui/primitives";
import { EmergingCard, GeoRiskCard, NewsCard, PredictionMarketsCard, SourcesCard } from "./SignalsPanels";

// Pantalla "Señales": contexto geopolítico y señales emergentes.
export function SenalesView() {
  const state = useAsync(api.signals);
  const s = state.data;
  return (
    <div className="space-y-4 md:space-y-6">
      <ScreenTitle
        title="Señales de Mercado"
        subtitle={
          s
            ? `Contexto externo del portafolio · Consultado el ${fmtProvenanceDate(s.snapshotDate) ?? s.snapshotDate} · origen: ${s.origen}`
            : "Contexto externo del portafolio."
        }
        actions={<LiveStatus updatedAt={state.updatedAt} busy={state.refreshing} error={state.error} onRefresh={() => { void state.reload(); }} />}
      />
      <Resource state={state} loadingLabel="Cargando señales…">
        {(signals) => (
          <>
            {/* Cada una ocupa todo el ancho: Señales emergentes necesita lugar para el medidor y las dos señales a su lado. */}
            <div className="space-y-3 md:space-y-4">
              <GeoRiskCard signals={signals} />
              <EmergingCard signals={signals} />
            </div>
            {/* Noticias a la izquierda; mercados de predicción y fuentes en una columna a la derecha (cada tarjeta mide
                lo que mide su contenido). En pantallas angostas se apilan en este orden de lectura. */}
            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-3 md:gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
              <NewsCard signals={signals} />
              <div className="space-y-3 md:space-y-4">
                <PredictionMarketsCard signals={signals} />
                <SourcesCard signals={signals} />
              </div>
            </div>
            <Footer />
          </>
        )}
      </Resource>
      <Link href="/market" className="btn-primary inline-flex">Consultar noticias, fuentes y alertas de mi cartera</Link>
    </div>
  );
}
