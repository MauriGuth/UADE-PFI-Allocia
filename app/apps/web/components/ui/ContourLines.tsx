import { CONTOUR_PATHS } from "./contours";

/** Líneas de nivel sutiles para el héroe azul marino de Resumen. Puramente decorativo. */
export function ContourLines({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 800 220"
      preserveAspectRatio="xMaxYMid slice"
      className={`pointer-events-none absolute inset-y-0 right-0 h-full w-full max-w-[860px] ${className}`}
      style={{ maskImage: "linear-gradient(90deg, transparent 0%, #000 45%)", WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 45%)" }}
    >
      <g fill="none" stroke="rgb(255 255 255 / 0.16)" strokeWidth="1.1">
        {CONTOUR_PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}
