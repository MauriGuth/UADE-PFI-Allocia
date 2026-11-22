// Estado de un informe de mercado, para no confundir «no hubo evidencia» con «no se pudo completar el análisis».
//   · analysis  — hay escenarios con fuentes.
//   · abstained — Allocia revisó las fuentes y no alcanzaron: no inventa escenarios (resultado válido).
//   · failed    — el análisis no se completó (proveedor de IA sin crédito, clave o modelo inválidos, demora, o citas que
//                 no coincidieron con las fuentes). Se reintenta en la próxima ejecución.
// Los informes nuevos traen `failure`; los anteriores solo traían este texto genérico en sus limitaciones.
const LEGACY_FAILURE = "El análisis no superó la validación o el proveedor no respondió.";

export type ReportState =
  | { kind: "analysis" }
  | { kind: "abstained" }
  | { kind: "failed"; reason: string; provider: boolean };

interface ReportLike {
  payload?: {
    failure?: { kind?: string; reason?: string } | null;
    report?: { status?: string; limitations?: string[] };
  };
}

export function reportState(r: ReportLike | null | undefined): ReportState {
  const p = r?.payload;
  if (p?.failure?.reason) return { kind: "failed", reason: p.failure.reason, provider: p.failure.kind !== "validation" };
  if (p?.report?.status !== "insufficient_data") return { kind: "analysis" };
  if (p.report.limitations?.includes(LEGACY_FAILURE))
    return {
      kind: "failed",
      provider: true,
      reason: "El proveedor de IA no respondió o su respuesta no superó la validación de citas. Se vuelve a intentar en la próxima ejecución.",
    };
  return { kind: "abstained" };
}

export const REPORT_STATE_LABEL: Record<ReportState["kind"], string> = {
  analysis: "Análisis de escenarios",
  abstained: "Sin escenarios: evidencia insuficiente",
  failed: "Análisis no completado",
};
