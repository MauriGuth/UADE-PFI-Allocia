"use client";

import { useState } from "react";
import type { SourceBrand } from "@/lib/source-logos";

type Size = "sm" | "md" | "lg";

// Los logos de medios son casi siempre «wordmarks» muy anchos: van en un recuadro ancho para que se lean.
// Sin logo, un monograma en recuadro cuadrado.
const CHIP: Record<Size, string> = { sm: "h-8 w-[72px] rounded-lg", md: "h-11 w-[104px] rounded-xl", lg: "h-12 w-[112px] rounded-xl" };
const TILE: Record<Size, { box: string; text: string }> = {
  sm: { box: "h-8 w-8 rounded-lg", text: "text-[9px]" },
  md: { box: "h-11 w-11 rounded-xl", text: "text-[11px]" },
  lg: { box: "h-12 w-12 rounded-xl", text: "text-xs" },
};

/**
 * Identidad de una fuente (proveedor de datos o medio). Muestra su logo local; si no hay archivo o
 * no carga, un monograma. Es decorativo: el nombre de la fuente va siempre como texto al lado.
 */
export function SourceMark({
  brand,
  fallback,
  size = "md",
  className = "",
}: {
  brand: SourceBrand | null;
  /** Texto del monograma si la fuente no está en el registro. */
  fallback?: string;
  size?: Size;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const src = brand?.src && !broken ? brand.src : null;
  if (src) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden border border-line bg-white px-2 ${CHIP[size]} ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="max-h-[70%] max-w-full object-contain" onError={() => setBroken(true)} />
      </span>
    );
  }
  const t = TILE[size];
  const mono = (brand?.monogram ?? fallback ?? "•").slice(0, 4);
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden border border-line bg-card ${t.box} ${className}`}
    >
      <span className={`px-0.5 font-extrabold italic tracking-tight text-ink ${t.text}`}>{mono}</span>
    </span>
  );
}
