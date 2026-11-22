import { Injectable } from "@nestjs/common";
import { EnrichedPosition, PortfolioService } from "../portfolio/portfolio.service";

export interface ExposureItem {
  key: string;
  value: number;
  weight: number; // 0-1
}

export interface PortfolioAnalysis {
  valuationId?: string;
  valuedAt?: string;
  totalValue: number;
  positionCount: number;
  composition: {
    byClass: ExposureItem[];
    bySector: ExposureItem[];
    byRegion: ExposureItem[];
    byCurrency: ExposureItem[];
  };
  concentration: {
    hhi: number; // 0-10000
    hhiLevel: "baja" | "moderada" | "alta";
    effectiveN: number;
    topPosition: { ticker: string; weight: number } | null;
    top3Weight: number;
  };
  positions: EnrichedPosition[];
}

@Injectable()
export class AnalysisService {
  constructor(private readonly portfolio: PortfolioService) {}

  private groupBy(
    positions: EnrichedPosition[],
    total: number,
    key: (p: EnrichedPosition) => string,
  ): ExposureItem[] {
    const map = new Map<string, number>();
    for (const p of positions) {
      map.set(key(p), (map.get(key(p)) ?? 0) + p.value);
    }
    return [...map.entries()]
      .map(([k, v]) => ({ key: k, value: v, weight: total > 0 ? v / total : 0 }))
      .sort((a, b) => b.weight - a.weight);
  }

  async analyze(userId: number): Promise<PortfolioAnalysis> {
    const positions = await this.portfolio.getPositions(userId);
    const totalValue = positions.reduce((s, p) => s + p.value, 0);

    // Índice de Herfindahl-Hirschman sobre pesos por posición (escala 0-10000).
    const hhi = positions.reduce((s, p) => s + Math.pow(p.weight * 100, 2), 0);
    const effectiveN = hhi > 0 ? 10000 / hhi : 0;
    const sorted = [...positions].sort((a, b) => b.weight - a.weight);
    const hhiLevel = hhi > 2500 ? "alta" : hhi > 1500 ? "moderada" : "baja";

    return {
      valuationId:positions[0]?.valuationId, valuedAt:positions[0]?.valuedAt,
      totalValue,
      positionCount: positions.length,
      composition: {
        byClass: this.groupBy(positions, totalValue, (p) => p.assetClass),
        bySector: this.groupBy(positions, totalValue, (p) => p.sector),
        byRegion: this.groupBy(positions, totalValue, (p) => p.region),
        byCurrency: this.groupBy(positions, totalValue, (p) => p.currency),
      },
      concentration: {
        hhi: Math.round(hhi),
        hhiLevel,
        effectiveN: Number(effectiveN.toFixed(1)),
        topPosition: sorted[0]
          ? { ticker: sorted[0].ticker, weight: sorted[0].weight }
          : null,
        top3Weight: sorted.slice(0, 3).reduce((s, p) => s + p.weight, 0),
      },
      positions,
    };
  }
}
