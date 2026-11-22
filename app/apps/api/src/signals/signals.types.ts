export interface GeoEvent {
  titulo: string;
  regiones: string[];
  sectores: string[];
  impacto: "alto" | "medio" | "bajo" | "no evaluado";
  descripcion: string;
  fuente: string;
  /** Medio que publicó la nota (proveedor o sufijo « - Medio» del titular). Ausente si no se pudo identificar con certeza. */
  medio?: string;
  /** true si título y descripción están en español; false si se muestran en el idioma original. */
  traducido?: boolean;
}

export interface GeoSignals {
  gprIndex: number | null; // Geopolitical Risk Index (media histórica ~100)
  gprLevel: "bajo" | "moderado" | "elevado" | "no disponible";
  tendencia: "ascendente" | "estable" | "descendente" | "no disponible";
  eventos: GeoEvent[];
}

export interface PredictionMarket {
  pregunta: string;
  probabilidad: number; // 0-1
  fuente: string;
  /** true si la pregunta está en español; false si se muestra en el idioma original. */
  traducido?: boolean;
}

export interface EmergingSignals {
  fearGreedIndex: number | null; // 0-100
  fearGreedLabel: string;
  btcDominance: number | null; // %
  defiTvlUsd: number | null;
  tendenciaCripto: "alcista" | "lateral" | "bajista" | "no disponible";
  predictionMarkets: PredictionMarket[];
}

export interface SignalProvenance {
  source: string;
  origin: "demostración" | "externo" | "no disponible";
  dataDate: string | null;
  fetchedAt?: string;
}

export interface SignalsSnapshot {
  provenance: Record<"geo" | "fearGreed" | "btcDominance" | "defi" | "predictionMarkets", SignalProvenance>;
  snapshotDate: string;
  origen: "en vivo" | "snapshot local" | "mixto" | "fuentes externas";
  geo: GeoSignals;
  emerging: EmergingSignals;
}
