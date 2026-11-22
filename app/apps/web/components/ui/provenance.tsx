import { PROVENANCE_HELP, provenanceLabels } from "@/lib/provenance";

/**
 * Línea de procedencia de un dato externo: «Dato del <fecha> · Consultado el
 * <fecha>». Si falta la fecha del dato, lo dice («Fecha del dato: no
 * informada») en lugar de mostrar solo la de consulta.
 */
export function ProvenanceDates({
  dataDate,
  fetchedAt,
  source,
  help = "title",
  className = "",
}: {
  dataDate: string | null | undefined;
  fetchedAt?: string | null;
  /** Nombre de la fuente, antepuesto a las fechas. */
  source?: string | null;
  /** «title»: tooltip + texto para lectores de pantalla. «inline»: además una línea visible. */
  help?: "title" | "inline" | "none";
  className?: string;
}) {
  const l = provenanceLabels(dataDate, fetchedAt);
  return (
    <div className={`text-caption text-soft ${className}`}>
      <p title={help === "title" ? PROVENANCE_HELP : undefined}>
        {source ? <span className="font-medium text-ink">{source} · </span> : null}
        <span>{l.data}</span>
        {l.fetched ? <span> · {l.fetched}</span> : null}
        {help === "title" ? <span className="sr-only"> {PROVENANCE_HELP}</span> : null}
      </p>
      {help === "inline" ? <p className="mt-0.5 text-muted">{PROVENANCE_HELP}</p> : null}
    </div>
  );
}
