import { Injectable, Logger } from "@nestjs/common";
import { CacheService } from "./cache.service";
import { spanishSignals } from "./signals.spanish";
import { buildLiveSignals } from "./signals.live";
import { SIGNALS_SEED } from "./signals.seed";
import { SignalsSnapshot } from "./signals.types";

// Producción usa exclusivamente fuentes externas. La semilla queda aislada
// en el modo local de demostración y en una clave de caché diferente.
@Injectable()
export class SignalsService {
  private readonly logger = new Logger(SignalsService.name);
  private static readonly CACHE_KEY = "signals:v2";
  private static readonly TTL_SECONDS = 15 * 60;

  private pending: Promise<SignalsSnapshot> | null = null;
  constructor(private readonly cache: CacheService) {}

  async getSignals(): Promise<SignalsSnapshot> {
    // LIVE_SIGNALS=true usa las fuentes reales y la traducción también fuera de producción (para probar en local).
    const production = process.env.NODE_ENV === "production" || process.env.LIVE_SIGNALS === "true";
    const key = production ? "signals:live:es:v3" : SignalsService.CACHE_KEY;
    const cached = await this.cache.get(key).catch(() => null);
    if (cached) return JSON.parse(cached);

    if (this.pending) return this.pending;
    this.pending = this.loadSnapshot(production, key).finally(() => { this.pending = null; });
    return this.pending;
  }

  private async loadSnapshot(production: boolean, key: string): Promise<SignalsSnapshot> {
    const snapshot = production ? await spanishSignals(await buildLiveSignals(), this.cache) : await this.buildSnapshot();
    await this.cache.set(
      key,
      JSON.stringify(snapshot),
      production ? 300 : SignalsService.TTL_SECONDS,
    ).catch(() => undefined);
    return snapshot;
  }

  private async fetchJson(url: string, timeoutMs = 2500): Promise<any> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  private async buildSnapshot(): Promise<SignalsSnapshot> {
    const snapshot: SignalsSnapshot = structuredClone(SIGNALS_SEED);
    let live = false;

    try {
      const fg = await this.fetchJson("https://api.alternative.me/fng/?limit=1");
      const value = Number(fg?.data?.[0]?.value);
      const label = String(fg?.data?.[0]?.value_classification ?? "");
      if (fg?.data?.[0]?.value != null && Number.isFinite(value) && value >= 0 && value <= 100) {
        const stamp = Number(fg?.data?.[0]?.timestamp);
        snapshot.provenance.fearGreed = { source: "Alternative.me", origin: "externo",
          dataDate: Number.isFinite(stamp) && stamp > 0 && stamp < 8640000000000 ? new Date(stamp * 1000).toISOString() : null,
          fetchedAt: new Date().toISOString() };
        snapshot.emerging.fearGreedIndex = value;
        snapshot.emerging.fearGreedLabel = this.translateFearGreed(label);
        live = true;
      }
    } catch {
      this.logger.warn("Fear & Greed en vivo no disponible; se usa snapshot");
    }

    try {
      const global = await this.fetchJson("https://api.coingecko.com/api/v3/global");
      const dom = Number(global?.data?.market_cap_percentage?.btc);
      if (global?.data?.market_cap_percentage?.btc != null && Number.isFinite(dom) && dom >= 0 && dom <= 100) {
        const stamp = Number(global?.data?.updated_at);
        snapshot.provenance.btcDominance = { source: "CoinGecko", origin: "externo",
          dataDate: Number.isFinite(stamp) && stamp > 0 && stamp < 8640000000000 ? new Date(stamp * 1000).toISOString() : null,
          fetchedAt: new Date().toISOString() };
        snapshot.emerging.btcDominance = Number(dom.toFixed(1));
        live = true;
      }
    } catch {
      this.logger.warn("CoinGecko en vivo no disponible; se usa snapshot");
    }

    if (live) {
      snapshot.origen = "mixto"; // El contexto, TVL y mercados siguen siendo ejemplos locales.
    }
    return snapshot;
  }

  private translateFearGreed(label: string): string {
    const map: Record<string, string> = {
      "Extreme Fear": "Miedo extremo",
      Fear: "Miedo",
      Neutral: "Neutral",
      Greed: "Codicia",
      "Extreme Greed": "Codicia extrema",
    };
    return map[label] ?? label;
  }
}
