// Contratos de la API de Allocia. Son los mismos tipos que usa la app móvil
// (apps/mobile/lib/api.ts): ambos clientes consumen el mismo backend.
export interface Instrument {
  ticker: string;
  name: string;
  assetClass: "accion" | "etf" | "cripto" | "stablecoin";
  sector: string;
  region: string;
  currency: string;
  refPrice: number;
}

export interface EnrichedPosition {
  id: number;
  ticker: string;
  name: string;
  assetClass: string;
  sector: string;
  region: string;
  currency: string;
  quantity: number;
  refPrice: number;
  priceSource?: string;
  priceAsOf?: string;
  priceCheckedAt?: string;
  priceStatus?: 'recent' | 'reference' | 'demo';
  value: number;
  weight: number;
}

export interface ExposureItem {
  key: string;
  value: number;
  weight: number;
}

export type HoldingPosition = Omit<EnrichedPosition, "refPrice" | "value" | "weight"> & {
  refPrice: number | null; value: number | null; weight: number | null;
};

export interface Analysis {
  totalValue: number;
  positionCount: number;
  composition: {
    byClass: ExposureItem[];
    bySector: ExposureItem[];
    byRegion: ExposureItem[];
    byCurrency: ExposureItem[];
  };
  concentration: {
    hhi: number;
    hhiLevel: "baja" | "moderada" | "alta";
    effectiveN: number;
    topPosition: { ticker: string; weight: number } | null;
    top3Weight: number;
  };
  positions: EnrichedPosition[];
}

export interface Evidence {
  tipo: string;
  descripcion: string;
  valor: string;
  fuente: string;
}

export type Severity = "info" | "atencion" | "alerta";

export interface Observation {
  id: string;
  severidad: Severity;
  categoria: string;
  titulo: string;
  mensaje: string;
  evidencia: Evidence[];
}

export interface ScenarioImpact {
  escenario: "favorable" | "base" | "adverso";
  descripcion: string;
  impactoTotalPct: number;
  porClase: { clase: string; shockPct: number; contribucionPct: number }[];
}

export interface ObservationsResponse {
  generadoEl: string;
  observaciones: Observation[];
  escenarios: ScenarioImpact[];
  escenariosConFuentes?: EvidenceScenario[];
}

export interface GeoEvent {
  titulo: string;
  regiones: string[];
  sectores: string[];
  impacto: string;
  descripcion: string;
  fuente: string;
  /** Medio que publicó la nota, si el backend lo identificó con certeza. */
  medio?: string;
  /** false: se muestra el texto original porque no se pudo traducir. Ausente en respuestas anteriores. */
  traducido?: boolean;
}

export interface SignalsSnapshot {
  provenance?: Record<string, {source: string; origin: string; dataDate: string | null; fetchedAt?: string}>;
  snapshotDate: string;
  origen: string;
  geo: {
    gprIndex: number | null;
    gprLevel: string;
    tendencia: string;
    eventos: GeoEvent[];
  };
  emerging: {
    fearGreedIndex: number | null;
    fearGreedLabel: string;
    btcDominance: number | null;
    defiTvlUsd: number | null;
    tendenciaCripto: string;
    predictionMarkets: { pregunta: string; probabilidad: number; fuente: string; traducido?: boolean }[];
  };
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}

export interface EvidenceScenario {
  id: string; ticker: string; generatedAt: string; direction: 'up' | 'down' | 'neutral';
  condition: string; explanation: string; limitations: string[];
  sources: {title:string;url:string;publishedAt:string}[];
}
