import type { ExposureItem } from "@/lib/types";
import { BarFill } from "./BarFill";
import { barLabel, barWidth } from "@/lib/bars";
import { pct } from "@/lib/format";

export { barLabel, barWidth };

// Barras horizontales de exposición: etiqueta arriba, track fino de 6px con el
// porcentaje a la derecha (idéntico a HBars de la app móvil). Etiqueta y barra siempre coinciden.
export function HBars({
  data,
  max = 6,
  selectedKey = null,
  onSelect,
}: {
  data: ExposureItem[];
  max?: number;
  /** Con `onSelect`, la barra elegida se resalta (la elección la guarda quien llama). */
  selectedKey?: string | null;
  /** Si se pasa, cada fila completa es un botón que elige/quita ese grupo (p. ej. para filtrar una tabla). */
  onSelect?: (key: string) => void;
}) {
  const rows = data.slice(0, max);
  return (
    <ul className="space-y-2.5">
      {rows.map((d) => {
        const missing = d.weight == null || !Number.isFinite(d.weight);
        const width = barWidth(d.weight);
        const label = (
          <span className="mb-1 flex items-baseline justify-between gap-3">
            <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{d.key}</span>
            <span className="whitespace-nowrap text-right text-[13px] font-semibold tabular-nums text-ink">
              {barLabel(d.weight)}
            </span>
          </span>
        );
        const track = (
          <span
            className="block h-1.5 overflow-hidden rounded-full bg-container"
            // Como botón, el nombre accesible sale del texto de la fila; sin botón se mantiene la descripción de la barra.
            {...(onSelect ? {} : { role: "img", "aria-label": missing ? `${d.key}: dato no disponible` : `${d.key}: ${pct(d.weight)}` })}
          >
            {width > 0 ? (
              <BarFill percent={width} />
            ) : null}
          </span>
        );
        if (!onSelect) {
          return (
            <li key={d.key}>
              {label}
              {track}
            </li>
          );
        }
        const selected = selectedKey === d.key;
        return (
          <li key={d.key}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(d.key)}
              className={`-mx-2 block w-[calc(100%+1rem)] cursor-pointer rounded-xl px-2 py-1.5 text-left transition-colors duration-150 hover:bg-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-secondary ${
                selected ? "bg-secondary-fixed/40 ring-1 ring-secondary/25" : ""
              }`}
            >
              {label}
              {track}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
