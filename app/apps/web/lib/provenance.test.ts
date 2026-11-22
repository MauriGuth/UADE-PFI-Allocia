import { expect, test } from "vitest";
import { NO_DATA_DATE, fmtProvenanceDate, provenanceLabels, parseSourceLine, splitEventSource } from "./provenance";

test("una fecha sin hora se muestra como día/mes/año sin inventar una hora", () => {
  expect(fmtProvenanceDate("2026-08-14")).toBe("14/08/2026");
});

test("una fecha inválida o ausente no produce etiqueta", () => {
  expect(fmtProvenanceDate(null)).toBeNull();
  expect(fmtProvenanceDate("")).toBeNull();
  expect(fmtProvenanceDate("no es fecha")).toBeNull();
});

test("los rótulos distinguen la fecha del dato de la de consulta", () => {
  const l = provenanceLabels("2026-08-14", "2026-10-23T12:00:00Z");
  expect(l.data).toBe("Dato del 14/08/2026");
  expect(l.fetched).toMatch(/^Consultado el /);
});

test("sin fecha del dato se avisa que no fue informada", () => {
  const l = provenanceLabels(null, null);
  expect(l.data).toBe(NO_DATA_DATE);
  expect(l.fetched).toBeNull();
});

test("la fuente de una noticia separa la fecha de publicación del enlace", () => {
  const s = splitEventSource("2026-10-12T14:00:00Z · https://example.test/nota");
  expect(s.dataDate).toBe("2026-10-12T14:00:00Z");
  expect(s.label).toBe("https://example.test/nota");
  expect(splitEventSource("GPR Index / prensa internacional")).toEqual({ dataDate: null, label: "GPR Index / prensa internacional" });
});

test("una línea de fuente se separa en texto, fecha del dato y enlace sin perder nada", () => {
  const line = parseSourceLine("Polymarket · precio implícito de «Sí», no probabilidad calibrada · 2026-11-19T16:25:01.166Z · https://polymarket.com/market/x");
  expect(line.url).toBe("https://polymarket.com/market/x");
  expect(line.dataDate).toBe("2026-11-19T16:25:01.166Z");
  expect(line.parts).toEqual(["Polymarket", "precio implícito de «Sí», no probabilidad calibrada"]);
  // Sin enlace ni fecha: todo queda como texto.
  expect(parseSourceLine("Fuente interna")).toEqual({ parts: ["Fuente interna"], dataDate: null, url: null });
});

test("cerrar una oración no duplica el punto de «p. m.»", async () => {
  const { endSentence } = await import("./provenance");
  expect(endSentence("20/11/2026, 12:01 p. m.")).toBe("20/11/2026, 12:01 p. m.");
  expect(endSentence("14/08/2026")).toBe("14/08/2026.");
});
