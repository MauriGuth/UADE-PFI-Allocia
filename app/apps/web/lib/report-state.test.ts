import { describe, expect, it } from "vitest";
import { reportState } from "./report-state";

describe("reportState", () => {
  it("distingue análisis, abstención y falla", () => {
    expect(reportState({ payload: { report: { status: "analysis", limitations: [] } } }).kind).toBe("analysis");
    expect(reportState({ payload: { report: { status: "insufficient_data", limitations: ["Se requiere cotización y noticias recientes verificables."] } } }).kind).toBe("abstained");
    const failed = reportState({ payload: { failure: { kind: "provider", reason: "Sin crédito" }, report: { status: "insufficient_data", limitations: ["Sin crédito"] } } });
    expect(failed).toEqual({ kind: "failed", reason: "Sin crédito", provider: true });
  });
  it("reconoce los informes anteriores que fallaron con el mensaje genérico", () => {
    const r = reportState({ payload: { report: { status: "insufficient_data", limitations: ["El análisis no superó la validación o el proveedor no respondió."] } } });
    expect(r.kind).toBe("failed");
  });
});
