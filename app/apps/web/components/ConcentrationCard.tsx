"use client";

import { type ReactNode, useId } from "react";
import { capitalize } from "@/lib/format";
import {
  CONCENTRATION_EXPLANATION,
  CONCENTRATION_TITLE,
  effectiveNReading,
  hhiSegmentPosition,
} from "@/lib/concentration";
import type { Analysis } from "@/lib/types";
import { Card } from "./ui/primitives";
import { type ScaleZone, ThreeZoneScale } from "./ui/ThreeZoneScale";

/** Color del nivel de concentración (ámbar = moderada, rojo = alta, verde = baja). */
export const HHI_TONE: Record<"baja" | "moderada" | "alta", string> = {
  baja: "bg-ok-bg text-ok",
  moderada: "bg-warn-bg text-warn",
  alta: "bg-danger-bg text-danger",
};

/**
 * Indicador de concentración en lenguaje llano: nivel, HHI y la lectura
 * concreta «se comporta como si tuviera N posiciones», con la explicación
 * siempre visible (no solo en un tooltip).
 */
/**
 * Posición (0–1) del marcador sobre toda la escala, a un tercio por tramo. Se conserva por compatibilidad; el medidor usa
 * `hhiSegmentPosition` (tramo + avance dentro del tramo) para colocar el marcador sobre los segmentos reales.
 */
export function hhiMeterPosition(hhi: number): number {
  if (hhi <= 1500) return Math.max(hhi, 0) / 1500 / 3;
  if (hhi <= 2500) return 1 / 3 + ((hhi - 1500) / 1000) / 3;
  return Math.min(2 / 3 + ((hhi - 2500) / 7500) / 3, 1);
}

type Level = "baja" | "moderada" | "alta";

const BADGE_STYLE: Record<Level, string> = {
  baja: "border-ok/30",
  moderada: "border-warn-accent/40",
  alta: "border-danger/30",
};
const BADGE_DOT: Record<Level, string> = { baja: "bg-ok", moderada: "bg-warn-accent", alta: "bg-danger" };
const HHI_ZONES: [ScaleZone, ScaleZone, ScaleZone] = [
  { label: "Baja", range: "< 1500" },
  { label: "Moderada", range: "1500–2500" },
  { label: "Alta", range: "> 2500" },
];

/**
 * Escala de concentración: HHI < 1500 baja, 1500–2500 moderada, > 2500 alta. El marcador se calcula con
 * `hhiSegmentPosition` (mismos umbrales que el análisis). No es un puntaje sobre 100.
 */
function HhiScale({ level, hhi }: { level: Level; hhi: number }) {
  const { index, frac } = hhiSegmentPosition(hhi);
  return (
    <ThreeZoneScale
      zones={HHI_ZONES}
      index={index}
      frac={frac}
      valueLabel={`${hhi} HHI`}
      ariaLabel={`HHI ${hhi}: concentración ${level}. Baja, menos de 1500. Moderada, de 1500 a 2500. Alta, más de 2500.`}
    />
  );
}

export function ConcentrationCard({
  concentration,
  positionCount,
  className = "",
  variant = "card",
  footer,
}: {
  concentration: Analysis["concentration"];
  positionCount: number;
  className?: string;
  /** Enlace o acción al pie de la tarjeta de texto (variante «card»). */
  footer?: ReactNode;
  /** «meter»: encabezado de Riesgo con medidor; «card»: tarjeta de texto (Resumen). */
  variant?: "card" | "meter";
}) {
  const headingId = useId();
  const c = concentration;
  const tone = c.hhiLevel === "alta" ? "text-danger" : c.hhiLevel === "moderada" ? "text-warn" : "text-ok";
  const levelNote = (
    <p className="mt-2 text-caption text-soft">
      {capitalize(c.hhiLevel)} quiere decir que{" "}
      {c.hhiLevel === "alta"
        ? "pocos activos reúnen la mayor parte del dinero"
        : c.hhiLevel === "moderada"
          ? "algunos activos pesan bastante más que el resto"
          : "el dinero está repartido de forma pareja"}
      . Mide el reparto, no todo el riesgo ni si vas a ganar o perder.
    </p>
  );
  if (variant === "meter") {
    // Título y explicación a la izquierda, el estado en una insignia compacta arriba a la derecha, la escala con el valor
    // flotante y, bajo una línea clara, la lectura en «posiciones efectivas» y la aclaración del nivel.
    return (
      <Card
        as="section"
        aria-labelledby={headingId}
        className={`${className} !py-5 sm:!py-6`}
        style={{ backgroundImage: "linear-gradient(160deg, rgb(var(--c-card)) 45%, rgb(var(--c-secondary-fixed) / 0.45))" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="min-w-0 max-w-2xl" style={{ flex: "1 1 16rem" }}>
            <h2 id={headingId} className="font-heading text-xl font-extrabold leading-7 tracking-[-0.01em] text-ink">
              {CONCENTRATION_TITLE}
            </h2>
            <p className="mt-0.5 text-sm leading-5 text-soft">{CONCENTRATION_EXPLANATION}</p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold ${HHI_TONE[c.hhiLevel]} ${BADGE_STYLE[c.hhiLevel]}`}
          >
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${BADGE_DOT[c.hhiLevel]}`} />
            <span className="sr-only">Concentración </span>
            {capitalize(c.hhiLevel)}
          </span>
        </div>
        <div className="mt-4">
          <HhiScale level={c.hhiLevel} hhi={c.hhi} />
        </div>
        <div className="mt-5 grid gap-x-8 gap-y-1 border-t border-line/80 pt-4 lg:grid-cols-2">
          <p className="text-sm leading-5 text-ink">
            <span className="font-semibold">{effectiveNReading(c.effectiveN)}</span>
            {positionCount > 0 ? <span className="text-soft"> (tenés {positionCount}).</span> : "."}
          </p>
          <div className="[&>p]:!mt-0">{levelNote}</div>
        </div>
      </Card>
    );
  }
  return (
    <Card as="section" aria-labelledby={headingId} className={className}>
      <h2 id={headingId} className="eyebrow">
        {CONCENTRATION_TITLE}
      </h2>
      <p className="mt-1.5 text-sm leading-5 text-ink">{CONCENTRATION_EXPLANATION}</p>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className={`text-2xl font-bold tracking-[-0.3px] ${tone}`}>Concentración {c.hhiLevel}</p>
        <p className="text-[13px] tabular-nums text-soft">HHI {c.hhi}</p>
      </div>
      <p className="mt-2 text-[15px] font-semibold leading-5 text-ink">
        {effectiveNReading(c.effectiveN)}
        {positionCount > 0 ? <span className="font-normal text-soft"> (tenés {positionCount}).</span> : "."}
      </p>
      {levelNote}
      {footer ? <div className="mt-1">{footer}</div> : null}
    </Card>
  );
}
