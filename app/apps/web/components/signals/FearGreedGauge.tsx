"use client";

import { useEffect, useId, useState } from "react";
import { GAUGE_COLORS, gaugeSegments, scoreRotation, segmentIndex, validScore } from "@/lib/fear-greed";
import { ProvenanceDates } from "../ui/provenance";

// Geometría del dial (viewBox 300 × 158): pivote en (150, 142); el arco queda por encima del pivote y el texto (puntaje y
// sentimiento) por debajo, así la aguja —que solo gira entre −90° y +90°— nunca cruza el texto, sea cual sea el puntaje.
const CX = 150;
const CY = 142;
const R = 125;
const STROKE = 14;
const NEEDLE = 108;
const SEGMENTS = gaugeSegments(CX, CY, R);

/**
 * Fear & Greed: el ancla visual de «Señales emergentes». Escala semicircular fina de 0 a 100 con cinco tramos atenuados
 * (rojo, naranja, ámbar, salvia, verde) y una aguja afilada con un pivote chico. El ángulo sale del puntaje real.
 * El índice (Alternative.me) es del mercado cripto: el alcance se dice en la tarjeta.
 */
export function FearGreedGauge({
  score,
  label,
  dataDate,
  fetchedAt,
}: {
  score: number | null;
  label: string;
  dataDate?: string | null;
  fetchedAt?: string | null;
}) {
  const headingId = useId();
  const valid = validScore(score);
  const target = scoreRotation(score);
  const [rotation, setRotation] = useState(-90);
  useEffect(() => {
    if (target === null) return;
    const id = requestAnimationFrame(() => setRotation(target));
    return () => cancelAnimationFrame(id);
  }, [target]);
  const active = segmentIndex(score);

  return (
    <section aria-labelledby={headingId} className="flex h-full flex-col rounded-2xl border border-line bg-card p-4 sm:p-5">
      <h3 id={headingId} className="font-heading text-base font-extrabold leading-6 text-ink">
        Fear &amp; Greed · Alternative.me
      </h3>
      <p className="text-caption text-soft">Sentimiento del mercado cripto</p>

      {/* Medidor, extremos y puntaje comparten un mismo ancho (280 px, en línea) y se centran en el espacio que sobre:
          así los extremos quedan bajo las puntas del arco y no en los bordes de la tarjeta. */}
      <div className="flex flex-1 flex-col justify-center">
        <div className="mx-auto mt-3 w-full" style={{ maxWidth: 280 }}>
          <svg aria-hidden="true" viewBox="0 0 300 158" style={{ width: "100%", height: "auto" }} className="block overflow-visible">
            {SEGMENTS.map((seg, i) => (
              <path
                key={seg.color}
                d={seg.d}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE}
                style={{ opacity: active === null || i === active ? 1 : 0.4, transition: "opacity 300ms ease-out" }}
              />
            ))}
            <g transform={`translate(${CX} ${CY})`}>
              {valid !== null ? (
                <g style={{ transform: `rotate(${rotation}deg)`, transition: "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
                  <path d={`M -3.2 0 L 0 -${NEEDLE} L 3.2 0 Z`} style={{ fill: "var(--gauge-needle)" }} />
                </g>
              ) : null}
              <circle r="7" style={{ fill: "var(--gauge-needle)" }} />
              <circle r="2.6" style={{ fill: "var(--gauge-dot)" }} />
            </g>
          </svg>

          <div className="mt-1 grid items-start" style={{ gridTemplateColumns: "56px minmax(0, 1fr) 56px" }}>
            <p className="text-center text-micro leading-4 text-soft">
              <span className="block font-semibold tabular-nums text-ink">0</span>
              Miedo extremo
            </p>
            <div className="text-center">
              <p className="font-heading text-[44px] font-extrabold leading-none tabular-nums tracking-[-0.03em] text-ink">
                {valid ?? "—"}
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink">
                {active !== null ? (
                  <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: GAUGE_COLORS[active] }} />
                ) : null}
                {label}
              </p>
            </div>
            <p className="text-center text-micro leading-4 text-soft">
              <span className="block font-semibold tabular-nums text-ink">100</span>
              Codicia extrema
            </p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-caption text-soft">Es un índice de sentimiento, no una probabilidad de suba.</p>
      <ProvenanceDates className="mt-auto pt-3" source="Fear & Greed" dataDate={dataDate} fetchedAt={fetchedAt} />
    </section>
  );
}
