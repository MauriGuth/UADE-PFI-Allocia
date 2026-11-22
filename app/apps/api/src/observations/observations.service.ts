import { DataSource } from "typeorm";
import { evidenceScenarios } from "./scenarios.evidence";
import { Injectable } from "@nestjs/common";
import { AnalysisService, PortfolioAnalysis } from "../analysis/analysis.service";
import { SignalsService } from "../signals/signals.service";
import { SignalsSnapshot } from "../signals/signals.types";
import {
  Evidence,
  Observation,
  ObservationsResponse,
} from "./observations.types";

const pct = (x: number) => `${(x * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })} %`;
const source = (s: SignalsSnapshot, key: keyof SignalsSnapshot["provenance"]) => {
  const p = s.provenance[key];
  return `${p.source} (${p.origin}; fecha del dato: ${p.dataDate ?? "no informada"}${p.fetchedAt ? `; consultado: ${p.fetchedAt}` : ""})`;
};

// Motor de reglas que integra el análisis estructural con las señales externas
// y genera observaciones explicables. Cada regla deja constancia de la
// evidencia utilizada (datos del portafolio, señales y umbral aplicado).
@Injectable()
export class ObservationsService {
  constructor(
    private readonly analysisService: AnalysisService,
    private readonly signalsService: SignalsService,
    private readonly db: DataSource,
  ) {}

  async generate(userId: number): Promise<ObservationsResponse> {
    const production = process.env.NODE_ENV === "production";
    const [analysis, signals] = await Promise.all([
      this.analysisService.analyze(userId),
      this.signalsService.getSignals(),
    ]);
    // En producción solo se admiten reglas apoyadas en señales externas verificadas;
    // los conjuntos locales de demostración nunca generan observaciones publicadas.
    const signalRules = !production || signals.origen === "fuentes externas";
    const observaciones: Observation[] = [];
    if (analysis.positionCount > 0) {
      observaciones.push(...this.concentrationRules(analysis));
      if (signalRules) {
        observaciones.push(
          ...this.exposureRules(analysis, signals),
          ...this.contextRules(analysis, signals),
          ...this.emergingRules(analysis, signals),
        );
      }
    }
    if (production) {
      return {
        generadoEl: new Date().toISOString(),
        observaciones: observaciones.filter(o => !o.evidencia.some(e => e.fuente.includes("demostración") || e.fuente.includes("no disponible"))),
        escenarios: [],
        escenariosConFuentes: analysis.positionCount ? await this.sourcedScenarios(userId) : [],
      };
    }
    for (const observation of observaciones) {
      if (observation.evidencia.some(e => e.fuente.includes("demostración"))) {
        observation.mensaje += " Contexto de demostración: no representa información actual.";
      }
    }
    return {
      generadoEl: new Date().toISOString(),
      observaciones,
      escenarios: [],
      escenariosConFuentes: [],
    };
  }

  // ---------- Reglas de concentración y diversificación ----------

  private concentrationRules(a: PortfolioAnalysis): Observation[] {
    const out: Observation[] = [];
    const { hhi, hhiLevel, topPosition, top3Weight } = a.concentration;

    if (hhiLevel !== "baja") {
      out.push({
        id: "conc-hhi",
        severidad: hhiLevel === "alta" ? "alerta" : "atencion",
        categoria: "concentración",
        titulo: `Concentración ${hhiLevel} del portafolio`,
        mensaje:
          `Tu dinero está repartido de forma desigual entre los activos. ` +
          `Los de mayor peso influyen más en las subas y bajas del total. Revisá cuánto dependés de ellos; tener muchos activos no garantiza un reparto equilibrado.`,
        evidencia: [
          {
            tipo: "dato del portafolio",
            descripcion: "HHI calculado sobre los pesos de las posiciones",
            valor: String(hhi),
            fuente: "Módulo de análisis estructural",
          },
          {
            tipo: "regla",
            descripcion: "Umbral aplicado",
            valor: "HHI > 2500 alta; 1500-2500 moderada",
            fuente: "Motor de observaciones",
          },
        ],
      });
    }

    if (topPosition && topPosition.weight > 0.25) {
      out.push({
        id: "conc-top",
        severidad: "atencion",
        categoria: "concentración",
        titulo: `Posición dominante en ${topPosition.ticker}`,
        mensaje:
          `${topPosition.ticker} representa el ${pct(topPosition.weight)} de la cartera. ` +
          `Una caída específica de este activo tendría un impacto proporcionalmente alto en el total.`,
        evidencia: [
          {
            tipo: "dato del portafolio",
            descripcion: `Peso de ${topPosition.ticker}`,
            valor: pct(topPosition.weight),
            fuente: "Módulo de análisis estructural",
          },
          {
            tipo: "regla",
            descripcion: "Umbral aplicado",
            valor: "peso de una posición > 25 %",
            fuente: "Motor de observaciones",
          },
        ],
      });
    }

    if (top3Weight > 0.6 && a.positionCount > 3) {
      out.push({
        id: "conc-top3",
        severidad: "info",
        categoria: "diversificación",
        titulo: "Las tres mayores posiciones dominan la cartera",
        mensaje:
          `Las tres posiciones principales concentran el ${pct(top3Weight)} del portafolio; ` +
          `el resto de los activos tiene un efecto diversificador limitado.`,
        evidencia: [
          {
            tipo: "dato del portafolio",
            descripcion: "Peso conjunto de las 3 mayores posiciones",
            valor: pct(top3Weight),
            fuente: "Módulo de análisis estructural",
          },
          {
            tipo: "regla",
            descripcion: "Umbral aplicado",
            valor: "peso conjunto top 3 > 60 %",
            fuente: "Motor de observaciones",
          },
        ],
      });
    }

    return out;
  }

  // ---------- Reglas de exposición ----------

  private exposureRules(a: PortfolioAnalysis, s: SignalsSnapshot): Observation[] {
    const out: Observation[] = [];
    const cripto =
      (a.composition.byClass.find((c) => c.key === "cripto")?.weight ?? 0) +
      (a.composition.byClass.find((c) => c.key === "stablecoin")?.weight ?? 0);
    const tech = a.composition.bySector.find((x) => x.key === "Tecnología")?.weight ?? 0;

    if (cripto > 0.25) {
      out.push({
        id: "exp-cripto",
        severidad: cripto > 0.4 ? "alerta" : "atencion",
        categoria: "exposición",
        titulo: "Exposición elevada al ecosistema cripto",
        mensaje:
          `Los activos digitales representan el ${pct(cripto)} de la cartera. En este segmento la ` +
          `volatilidad histórica es sensiblemente mayor que en los activos tradicionales` +
          (s.emerging.fearGreedIndex !== null ? `, y el sentimiento de mercado actual es «${s.emerging.fearGreedLabel}» (${s.emerging.fearGreedIndex}/100).` : "."),
        evidencia: [
          {
            tipo: "dato del portafolio",
            descripcion: "Peso conjunto de cripto y stablecoins",
            valor: pct(cripto),
            fuente: "Módulo de análisis estructural",
          },
          ...(s.emerging.fearGreedIndex !== null ? [{
            tipo: "señal externa" as const,
            descripcion: "Índice Fear & Greed cripto",
            valor: `${s.emerging.fearGreedIndex}/100 (${s.emerging.fearGreedLabel})`,
            fuente: source(s, "fearGreed"),
          }] : []),
          {
            tipo: "regla",
            descripcion: "Umbral aplicado",
            valor: "exposición cripto > 25 % (alerta > 40 %)",
            fuente: "Motor de observaciones",
          },
        ],
      });
    }

    if (tech > 0.35) {
      const evento = s.geo.eventos.find((e) => e.sectores.includes("Tecnología"));
      const evidencia: Evidence[] = [
        {
          tipo: "dato del portafolio",
          descripcion: "Exposición al sector Tecnología",
          valor: pct(tech),
          fuente: "Módulo de análisis estructural",
        },
        {
          tipo: "regla",
          descripcion: "Umbral aplicado",
          valor: "exposición sectorial > 35 %",
          fuente: "Motor de observaciones",
        },
      ];
      if (evento) {
        evidencia.splice(1, 0, {
          tipo: "señal externa",
          descripcion: evento.titulo,
          valor: `impacto ${evento.impacto}`,
          fuente: source(s, "geo"),
        });
      }
      out.push({
        id: "exp-tech",
        severidad: "atencion",
        categoria: "exposición",
        titulo: "Alta dependencia del sector tecnológico",
        mensaje:
          `El sector Tecnología concentra el ${pct(tech)} de la cartera` +
          (evento
            ? `, en un contexto donde «${evento.titulo}» agrega incertidumbre específica sobre el sector.`
            : "."),
        evidencia,
      });
    }

    const argentina = a.composition.byRegion.find((r) => r.key === "Argentina")?.weight ?? 0;
    if (argentina > 0.1) {
      const evento = s.geo.eventos.find((e) => e.regiones.includes("Argentina"));
      out.push({
        id: "exp-arg",
        severidad: "info",
        categoria: "exposición",
        titulo: "Exposición a activos argentinos",
        mensaje:
          `Los activos de emisores argentinos representan el ${pct(argentina)} de la cartera. ` +
          `Este segmento suele mostrar mayor sensibilidad al riesgo local` +
          (evento ? ` y el calendario electoral de 2026 puede aumentar su volatilidad.` : "."),
        evidencia: [
          {
            tipo: "dato del portafolio",
            descripcion: "Exposición a la región Argentina",
            valor: pct(argentina),
            fuente: "Módulo de análisis estructural",
          },
          ...(evento
            ? [
                {
                  tipo: "señal externa" as const,
                  descripcion: evento.titulo,
                  valor: `impacto ${evento.impacto}`,
                  fuente: source(s, "geo"),
                },
              ]
            : []),
          {
            tipo: "regla",
            descripcion: "Umbral aplicado",
            valor: "exposición a Argentina > 10 %",
            fuente: "Motor de observaciones",
          },
        ],
      });
    }

    return out;
  }

  // ---------- Reglas de contexto geopolítico ----------

  private contextRules(a: PortfolioAnalysis, s: SignalsSnapshot): Observation[] {
    const out: Observation[] = [];
    if (s.geo.gprLevel === "elevado") {
      out.push({
        id: "ctx-gpr",
        severidad: "atencion",
        categoria: "contexto",
        titulo: "Riesgo geopolítico global por encima de su media",
        mensaje:
          `El índice de riesgo geopolítico (GPR) se ubica en ${s.geo.gprIndex} puntos, por encima de su ` +
          `media histórica (~100) y con tendencia ${s.geo.tendencia}. En episodios de riesgo geopolítico ` +
          `elevado suelen ampliarse los movimientos de los activos de mayor beta y de las materias primas.`,
        evidencia: [
          {
            tipo: "señal externa",
            descripcion: "Geopolitical Risk Index (Caldara-Iacoviello)",
            valor: `${s.geo.gprIndex} (tendencia ${s.geo.tendencia})`,
            fuente: source(s, "geo"),
          },
          {
            tipo: "regla",
            descripcion: "Umbral aplicado",
            valor: "GPR > 120 se considera elevado",
            fuente: "Motor de observaciones",
          },
        ],
      });
    }

    const energia = a.composition.bySector.find((x) => x.key === "Energía")?.weight ?? 0;
    const eventoEnergia = s.geo.eventos.find((e) => e.sectores.includes("Energía"));
    if (energia > 0.05 && eventoEnergia) {
      out.push({
        id: "ctx-energia",
        severidad: "info",
        categoria: "contexto",
        titulo: "El contexto sostiene una prima sobre el sector energético",
        mensaje:
          `La cartera tiene un ${pct(energia)} en Energía y el contexto actual («${eventoEnergia.titulo}») ` +
          `tiende a sostener los precios del sector; esta exposición actúa como cobertura parcial frente al riesgo geopolítico.`,
        evidencia: [
          {
            tipo: "dato del portafolio",
            descripcion: "Exposición al sector Energía",
            valor: pct(energia),
            fuente: "Módulo de análisis estructural",
          },
          {
            tipo: "señal externa",
            descripcion: eventoEnergia.titulo,
            valor: `impacto ${eventoEnergia.impacto}`,
            fuente: source(s, "geo"),
          },
          { tipo: "regla", descripcion: "Umbral aplicado", valor: "exposición a Energía > 5 % y existencia de evento energético", fuente: "Motor de observaciones" },
        ],
      });
    }
    return out;
  }

  // ---------- Reglas de señales emergentes ----------

  private emergingRules(a: PortfolioAnalysis, s: SignalsSnapshot): Observation[] {
    const out: Observation[] = [];
    const fed = s.emerging.predictionMarkets.find((p) =>
      p.pregunta.toLowerCase().includes("recorta tasas"),
    );
    if (fed && fed.probabilidad > 0.55) {
      out.push({
        id: "sig-tasas",
        severidad: "info",
        categoria: "señales",
        titulo: "El mercado asigna probabilidad alta a un recorte de tasas",
        mensaje:
          `Los prediction markets asignan una probabilidad de ${(fed.probabilidad * 100).toFixed(0)} % a un ` +
          `recorte de tasas de la Reserva Federal antes de fin de año. Históricamente, un sesgo de tasas a la baja ` +
          `favorece a los activos de duración larga (tecnología, cripto) y debilita al dólar.`,
        evidencia: [
          {
            tipo: "señal externa",
            descripcion: fed.pregunta,
            valor: `${(fed.probabilidad * 100).toFixed(0)} %`,
            fuente: source(s, "predictionMarkets"),
          },
          {
            tipo: "regla",
            descripcion: "Umbral aplicado",
            valor: "probabilidad > 55 %",
            fuente: "Motor de observaciones",
          },
        ],
      });
    }

    const recesion = s.emerging.predictionMarkets.find((p) =>
      p.pregunta.toLowerCase().includes("recesión"),
    );
    const stable = a.composition.byClass.find((c) => c.key === "stablecoin")?.weight ?? 0;
    if (recesion && recesion.probabilidad > 0.2 && stable < 0.05) {
      out.push({
        id: "sig-liquidez",
        severidad: "info",
        categoria: "señales",
        titulo: "Baja liquidez defensiva frente al riesgo de recesión",
        mensaje:
          `El mercado asigna ${(recesion.probabilidad * 100).toFixed(0)} % de probabilidad a una recesión en ` +
          `EE.UU. en 2026 y la cartera mantiene solo ${pct(stable)} en instrumentos líquidos estables. ` +
          `Un colchón de liquidez facilita rebalancear en caídas.`,
        evidencia: [
          {
            tipo: "señal externa",
            descripcion: recesion.pregunta,
            valor: `${(recesion.probabilidad * 100).toFixed(0)} %`,
            fuente: source(s, "predictionMarkets"),
          },
          {
            tipo: "dato del portafolio",
            descripcion: "Peso en stablecoins / liquidez",
            valor: pct(stable),
            fuente: "Módulo de análisis estructural",
          },
          {
            tipo: "regla",
            descripcion: "Umbral aplicado",
            valor: "probabilidad de recesión > 20 % y liquidez < 5 %",
            fuente: "Motor de observaciones",
          },
        ],
      });
    }
    return out;
  }

  // ---------- Escenarios ----------

  // Shocks estilizados por clase de activo para cada escenario. Los valores son
  // supuestos didácticos del prototipo, no proyecciones de mercado.
  private async sourcedScenarios(userId:number) {
    const rows=await this.db.query(`SELECT DISTINCT ON (r.ticker) r.id,r.ticker,r."createdAt",r.payload FROM market_reports r JOIN positions p ON p.ticker=r.ticker WHERE p."userId"=$1 AND r."createdAt">now()-interval '24 hours' ORDER BY r.ticker,r.id DESC LIMIT 50`,[userId]);
    return evidenceScenarios(rows);
  }
}
