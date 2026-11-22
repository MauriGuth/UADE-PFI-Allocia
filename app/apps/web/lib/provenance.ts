// Procedencia de un dato externo: distingue la fecha en que la fuente lo midió
// («Dato del…») de la fecha en que Allocia lo pidió («Consultado el…»). Las
// pruebas con usuarios mostraron que dos fechas sin rótulo se leían como si el
// dato fuera de hoy por el solo hecho de consultarlo hoy.
export const PROVENANCE_HELP =
  "La fecha del dato es cuándo lo midió la fuente; la de consulta, cuándo Allocia lo pidió. Consultarlo hoy no hace que el dato sea de hoy.";

export const NO_DATA_DATE = "Fecha del dato: no informada";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Formatea una fecha ISO para mostrarla. Las fechas sin hora («2026-08-14») no inventan una hora. */
/** Cierra una oración sin duplicar el punto: una fecha con «p. m.» ya termina en punto. */
export function endSentence(text: string): string {
  return text.endsWith(".") ? text : `${text}.`;
}

export function fmtProvenanceDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const s = iso.trim();
  if (DATE_ONLY.test(s)) {
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  }
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface ProvenanceLabels {
  /** «Dato del 14/08/2026» o «Fecha del dato: no informada». */
  data: string;
  /** «Consultado el 23/10/2026, 09:12» o null si no se conoce. */
  fetched: string | null;
}

export function provenanceLabels(dataDate: string | null | undefined, fetchedAt: string | null | undefined): ProvenanceLabels {
  const d = fmtProvenanceDate(dataDate);
  const f = fmtProvenanceDate(fetchedAt);
  return { data: d ? `Dato del ${d}` : NO_DATA_DATE, fetched: f ? `Consultado el ${f}` : null };
}

/**
 * Las noticias geopolíticas traen la fecha de publicación al inicio del campo
 * `fuente` («2026-10-12T14:00:00Z · https://…»). Devuelve esa fecha (o null) y
 * el resto del texto como etiqueta de la fuente.
 */
export function splitEventSource(fuente: string): { dataDate: string | null; label: string } {
  const parts = fuente.split(" · ");
  const first = parts[0]?.trim() ?? "";
  if (first && Number.isFinite(Date.parse(first)) && /^\d{4}-\d{2}-\d{2}/.test(first)) {
    return { dataDate: first, label: parts.slice(1).join(" · ").trim() };
  }
  return { dataDate: null, label: fuente };
}

/**
 * Divide una línea de fuente de la forma «Polymarket · precio implícito de «Sí»… · 2026-11-19T16:25:01.166Z · https://…»
 * en sus partes: texto descriptivo, fecha del dato (ISO) y enlace. No inventa nada: lo que no reconoce queda en `parts`.
 */
export function parseSourceLine(fuente: string): { parts: string[]; dataDate: string | null; url: string | null } {
  const raw = fuente.split(" · ").map((x) => x.trim()).filter(Boolean);
  let url: string | null = null;
  let dataDate: string | null = null;
  const parts: string[] = [];
  for (const piece of raw) {
    if (!url && /^https?:\/\//i.test(piece)) url = piece;
    else if (!dataDate && /^\d{4}-\d{2}-\d{2}/.test(piece) && Number.isFinite(Date.parse(piece))) dataDate = piece;
    else parts.push(piece);
  }
  return { parts, dataDate, url };
}
