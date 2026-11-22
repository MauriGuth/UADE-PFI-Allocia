import { SignalsSnapshot } from "./signals.types";

// Snapshot local de señales externas (14/08/2026), utilizado como respaldo
// cuando los proveedores en vivo no están disponibles. En el MVP final estas
// señales se actualizarán periódicamente desde la capa de integración
// (GPR Index, API de Polymarket, métricas cripto; Sección 4.9 del informe).
export const SIGNALS_SEED: SignalsSnapshot = {
  provenance: {
    geo: { source: "Ejemplo local de contexto", origin: "demostración", dataDate: "2026-08-14" },
    fearGreed: { source: "Ejemplo local Fear & Greed", origin: "demostración", dataDate: "2026-08-14" },
    btcDominance: { source: "Ejemplo local de dominancia", origin: "demostración", dataDate: "2026-08-14" },
    defi: { source: "Ejemplo local TVL", origin: "demostración", dataDate: "2026-08-14" },
    predictionMarkets: { source: "Ejemplos locales de mercados", origin: "demostración", dataDate: "2026-08-14" },
  },
  snapshotDate: "2026-08-14",
  origen: "snapshot local",
  geo: {
    gprIndex: 142,
    gprLevel: "elevado",
    tendencia: "ascendente",
    eventos: [
      {
        titulo: "Controles a exportaciones de semiconductores EE.UU.–China",
        regiones: ["EE.UU.", "Global"],
        sectores: ["Tecnología"],
        impacto: "alto",
        descripcion:
          "Nuevas restricciones cruzadas al comercio de chips avanzados aumentan la incertidumbre sobre las cadenas de suministro tecnológicas.",
        fuente: "GPR Index / prensa internacional",
      },
      {
        titulo: "Tensión en Medio Oriente presiona el precio del petróleo",
        regiones: ["Global"],
        sectores: ["Energía"],
        impacto: "medio",
        descripcion:
          "Los episodios de conflicto en la región sostienen una prima de riesgo sobre el crudo y la energía.",
        fuente: "GPR Index / prensa internacional",
      },
      {
        titulo: "Año electoral legislativo en Argentina",
        regiones: ["Argentina"],
        sectores: ["Financiero", "Energía"],
        impacto: "medio",
        descripcion:
          "La proximidad electoral incrementa la volatilidad esperada de los activos argentinos.",
        fuente: "Calendario electoral / prensa local",
      },
    ],
  },
  emerging: {
    fearGreedIndex: 34,
    fearGreedLabel: "Miedo",
    btcDominance: 58.2,
    defiTvlUsd: 118_000_000_000,
    tendenciaCripto: "lateral",
    predictionMarkets: [
      {
        pregunta: "¿La Reserva Federal recorta tasas antes de diciembre de 2026?",
        probabilidad: 0.62,
        fuente: "Polymarket (snapshot)",
      },
      {
        pregunta: "¿Bitcoin supera los USD 150.000 durante 2026?",
        probabilidad: 0.31,
        fuente: "Polymarket (snapshot)",
      },
      {
        pregunta: "¿Recesión en EE.UU. durante 2026?",
        probabilidad: 0.27,
        fuente: "Polymarket (snapshot)",
      },
    ],
  },
};
