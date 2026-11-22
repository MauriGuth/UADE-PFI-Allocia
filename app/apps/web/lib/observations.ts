import type { Observation } from "./types";

// Alcance de una observación. «Sobre tu cartera» se calcula solo con las
// posiciones (ids conc-*, exp-* sin señal externa); «Contexto externo» combina
// una señal externa (GPR, tasas, recesión, energía, noticias). Los ids,
// categorías y tipos de evidencia son los de apps/api/src/observations.
export type ObservationScope = "cartera" | "externo";

const EXTERNAL_CATEGORIES = new Set(["contexto", "señales"]);

export function observationScope(o: Pick<Observation, "categoria" | "evidencia">): ObservationScope {
  if (EXTERNAL_CATEGORIES.has(o.categoria)) return "externo";
  if (o.evidencia.some((e) => e.tipo === "señal externa")) return "externo";
  return "cartera";
}

export const SCOPE: Record<ObservationScope, { label: string; badge: string; description: string }> = {
  cartera: {
    label: "Sobre tu cartera",
    badge: "bg-secondary-fixed text-secondary-on-fixed",
    description: "Se calcula solo con tus posiciones.",
  },
  externo: {
    label: "Contexto externo",
    badge: "bg-warn-bg text-warn",
    description: "Combina tus posiciones con una señal externa (índices, mercados o noticias con fuente).",
  },
};

/** La regla aplicada (evidencia de tipo «regla»), para mostrarla en una línea corta. */
export function observationRule(o: Pick<Observation, "evidencia">): string | null {
  const rule = o.evidencia.find((e) => e.tipo === "regla");
  if (!rule) return null;
  return rule.valor.trim() || rule.descripcion.trim() || null;
}

/**
 * Activo de la cartera al que se refiere una observación (por el ticker en su título), para mostrar
 * su logo junto al texto. Devuelve null si no menciona ninguno.
 */
export function observationTicker<T extends { ticker: string }>(o: Pick<Observation, "titulo">, held: T[]): T | null {
  return (
    held.find((t) =>
      new RegExp(`(^|[^A-Za-z0-9])${t.ticker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z0-9]|$)`).test(o.titulo),
    ) ?? null
  );
}
