// Cada observación mantiene una referencia explícita a los datos y señales
// que la originaron (evidencia), para sostener la explicabilidad y la
// trazabilidad definidas en el diseño del sistema (Sección 4.4 del informe).
export interface Evidence {
  tipo: "dato del portafolio" | "señal externa" | "regla";
  descripcion: string;
  valor: string;
  fuente: string;
}

export interface Observation {
  id: string;
  severidad: "info" | "atencion" | "alerta";
  categoria: "concentración" | "diversificación" | "exposición" | "contexto" | "señales";
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

export interface EvidenceScenario {
  id: string; ticker: string; generatedAt: string; direction: 'up' | 'down' | 'neutral';
  condition: string; explanation: string; limitations: string[];
  sources: {title:string;url:string;publishedAt:string}[];
}
