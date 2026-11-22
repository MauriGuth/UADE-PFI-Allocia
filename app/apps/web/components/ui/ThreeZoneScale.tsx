"use client";

import { useEffect, useState } from "react";

/** Escala de tres tramos compartida (HHI, riesgo geopolítico): lavanda suave, violeta vivo y ciruela profundo. */
const SEGMENT_COLOR = ["var(--scale-1)", "var(--scale-2)", "var(--scale-3)"] as const;
const SEGMENT_GAP = 6; // px entre tramos
const LABEL_HALF = 56; // px: mitad (con margen) del ancho de la etiqueta flotante, para que no se salga de la tarjeta
const DEEP = "var(--scale-deep)";

export interface ScaleZone {
  label: string;
  range: string;
}

/** Posición horizontal (CSS) del marcador: tramo + avance dentro del tramo, descontando los espacios entre tramos. */
function markerLeft(index: number, frac: number): string {
  return `calc((100% - ${2 * SEGMENT_GAP}px) / 3 * ${(index + frac).toFixed(4)} + ${index * SEGMENT_GAP}px)`;
}

/**
 * Escala de tres tramos finos y redondeados. El valor real va en una etiqueta flotante persistente, unida con un trazo fino
 * al marcador circular, que se coloca con el tramo (`index`) y el avance dentro de él (`frac`, 0–1) que calcula quien llama
 * a partir de los umbrales reales. Cada categoría y su umbral quedan bajo su tramo y la activa se destaca con peso tipográfico
 * además de color. Se expone como una imagen con su descripción completa; el valor, el nivel y los umbrales también están
 * escritos. La geometría (alturas, posiciones, separaciones) va en línea a propósito: no depende de que el CSS generado de
 * Tailwind esté al día; las clases solo dan tipografía.
 */
export function ThreeZoneScale({
  zones,
  index,
  frac,
  valueLabel,
  ariaLabel,
}: {
  zones: [ScaleZone, ScaleZone, ScaleZone];
  index: 0 | 1 | 2;
  frac: number;
  valueLabel: string;
  ariaLabel: string;
}) {
  // El marcador nunca se pega al borde del tramo: así no se sale de la barra en los extremos.
  const shown = Math.min(Math.max(frac, 0.03), 0.97);
  const target = markerLeft(index, shown);
  const [left, setLeft] = useState(markerLeft(0, 0.03));
  useEffect(() => {
    const id = requestAnimationFrame(() => setLeft(target));
    return () => cancelAnimationFrame(id);
  }, [target]);
  const move = "left 700ms cubic-bezier(0.22, 1, 0.36, 1)";
  const center = "translateX(-50%)";
  return (
    <div role="img" aria-label={ariaLabel} className="w-full min-w-0" style={{ position: "relative", paddingTop: 46 }}>
      {/* Etiqueta flotante con el valor real; se mantiene dentro de la tarjeta aunque el marcador esté en un extremo. */}
      <span
        className="rounded-lg border border-secondary/30 bg-card text-[13px] font-bold tabular-nums"
        style={{
          position: "absolute",
          top: 0,
          left: `clamp(${LABEL_HALF}px, ${left}, calc(100% - ${LABEL_HALF}px))`,
          transform: center,
          transition: move,
          whiteSpace: "nowrap",
          padding: "4px 12px",
          color: DEEP,
          boxShadow: "0 2px 8px rgb(75 65 225 / 0.14)",
        }}
      >
        {valueLabel}
      </span>
      {/* Trazo fino con punta, del rótulo al marcador. */}
      <span
        aria-hidden="true"
        style={{ position: "absolute", top: 29, left, width: 1, height: 11, transform: center, transition: move, backgroundColor: "rgb(75 65 225 / 0.7)" }}
      >
        <span
          style={{
            position: "absolute",
            bottom: -1,
            left: "50%",
            transform: center,
            width: 0,
            height: 0,
            borderLeft: "3.5px solid transparent",
            borderRight: "3.5px solid transparent",
            borderTop: "4.5px solid rgb(75 65 225 / 0.8)",
          }}
        />
      </span>

      <div style={{ position: "relative", display: "flex", alignItems: "center", height: 10, gap: SEGMENT_GAP }}>
        {zones.map((z, i) => (
          <span
            key={z.label}
            style={{
              flex: "1 1 0%",
              height: "100%",
              borderRadius: 9999,
              backgroundColor: SEGMENT_COLOR[i],
              // Contorno claro y un relieve sutil; el tramo actual suma un resplandor leve.
              boxShadow:
                i === index
                  ? "0 0 0 1px var(--scale-ring), 0 0 0 2px rgb(91 62 230 / 0.16), 0 2px 8px rgb(91 62 230 / 0.28)"
                  : "0 0 0 1px var(--scale-ring), 0 0 0 2px rgb(91 62 230 / 0.10)",
            }}
          />
        ))}
        <span
          style={{
            position: "absolute",
            top: "50%",
            left,
            width: 14,
            height: 14,
            transform: "translate(-50%, -50%)",
            transition: move,
            borderRadius: 9999,
            border: "2.5px solid var(--scale-dot)",
            backgroundColor: "var(--scale-dot)",
            boxSizing: "border-box",
            boxShadow: `0 0 0 1.5px ${DEEP}, 0 2px 6px rgb(59 20 120 / 0.35)`,
          }}
        />
      </div>

      <div className="text-center" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", columnGap: SEGMENT_GAP, marginTop: 10 }}>
        {zones.map((z, i) => (
          <div key={z.label} className="min-w-0">
            <p className={`text-[15px] leading-5 ${i === index ? "font-extrabold text-ink" : "font-medium text-soft"}`}>{z.label}</p>
            <p className={`text-caption ${i === index ? "font-semibold text-ink" : "text-soft"}`}>{z.range}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
