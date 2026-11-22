import { createHash, randomUUID } from "node:crypto";
import { MarketFeed } from "../market/feed";
import { universe } from "../market/config";
import { BadRequestException, Injectable, ServiceUnavailableException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Instrument } from "../entities/instrument.entity";
import { Position } from "../entities/position.entity";

export interface EnrichedPosition {
  valuationId?: string;
  valuedAt?: string;
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
  weight: number; // 0-1
}

@Injectable()
export class PortfolioService {
  // Private, bounded snapshots; holdings are always re-read before reuse.
  private snapshots = new Map<number, {key:string;expires:number;positions:EnrichedPosition[]}>();
  private pending = new Map<string, Promise<EnrichedPosition[]>>();
  constructor(
    @InjectRepository(Position)
    private readonly positions: Repository<Position>,
    @InjectRepository(Instrument)
    private readonly instruments: Repository<Instrument>,
  ) {}

  async getHoldings(userId: number) {
    const list = await this.positions.find({ where: { userId }, order: { id: "ASC" } });
    return list.map(p => ({ id: p.id, ticker: p.ticker, name: p.instrument.name,
      assetClass: p.instrument.assetClass, sector: p.instrument.sector, region: p.instrument.region,
      currency: p.instrument.currency, quantity: Number(p.quantity), refPrice: null, value: null, weight: null }));
  }

  async getPositions(userId: number, forceRefresh = false): Promise<EnrichedPosition[]> {
    const list = await this.positions.find({ where: { userId }, order: { id: "ASC" } });
    const key=createHash('sha256').update(JSON.stringify(list)).digest('hex');
    const current=this.snapshots.get(userId);
    if(!forceRefresh && current?.key===key && current.expires>Date.now()) return structuredClone(current.positions);
    const pendingKey=`${userId}:${key}`;
    const existing=this.pending.get(pendingKey);
    if(existing) return structuredClone(await existing);
    const task=this.valuePositions(list,forceRefresh).then(positions=>{
      const fetched=positions.map(p=>Date.parse(p.priceCheckedAt??'')).filter(Number.isFinite);
      const expires=Math.min(Date.now()+30_000,...fetched.map(t=>t+30_000));
      if(this.snapshots.size>=256) this.snapshots.delete(this.snapshots.keys().next().value!);
      this.snapshots.set(userId,{key,expires,positions});
      return positions;
    }).catch(error=>{this.snapshots.delete(userId);throw error;}).finally(()=>{this.pending.delete(pendingKey);});
    this.pending.set(pendingKey,task);
    return structuredClone(await task);
  }

  private async valuePositions(list: Position[], forceRefresh: boolean): Promise<EnrichedPosition[]> {
    const valuationId=randomUUID(), valuedAt=new Date().toISOString();
    const live = new Map<string, {price:number; asOf:string; source:string; checkedAt?:string}>();
    if (process.env.NODE_ENV === "production" || process.env.LIVE_PRICES === "true") {
      const assets=universe();
      const requested = list.map(position => {
        const asset=assets.find(a=>a.ticker===position.ticker) ?? position.instrument.marketMapping;
        if(!asset || asset.currency!==position.instrument.currency || asset.currency!=="USD") throw new ServiceUnavailableException(`Falta cobertura o conversión monetaria verificable para ${position.ticker}`);
        return asset;
      });
      const quotes=await new MarketFeed().quotes(requested,forceRefresh);
      for(const asset of requested) {
        const quote=quotes.get(asset.ticker);
        if(!quote) throw new ServiceUnavailableException(`Cotización no disponible para ${asset.ticker}; no se calcula una valuación con datos ficticios`);
        live.set(asset.ticker,quote);
      }
    }
    const enriched = list.map((p) => {
      const qty = Number(p.quantity);
      const price = live.get(p.ticker)?.price ?? Number(p.instrument.refPrice);
      return {
        valuationId, valuedAt,
        id: p.id,
        ticker: p.ticker,
        name: p.instrument.name,
        assetClass: p.instrument.assetClass,
        sector: p.instrument.sector,
        region: p.instrument.region,
        currency: p.instrument.currency,
        quantity: qty,
        priceSource: live.get(p.ticker)?.source ?? "Demostración",
        priceCheckedAt: live.get(p.ticker)?.checkedAt,
        priceAsOf: live.get(p.ticker)?.asOf ?? "2026-08-14",
        priceStatus: !live.has(p.ticker) ? 'demo' as const : Date.now()-Date.parse(live.get(p.ticker)!.asOf)<=120_000 ? 'recent' as const : 'reference' as const,
        refPrice: price,
        value: qty * price,
        weight: 0,
      };
    });
    const total = enriched.reduce((s, p) => s + p.value, 0);
    for (const p of enriched) p.weight = total > 0 ? p.value / total : 0;
    return enriched;
  }

  async addPosition(userId: number, ticker: string, quantity: number): Promise<Position> {
    const instrument = await this.instruments.findOneBy({ ticker });
    if (!instrument) {
      throw new BadRequestException(
        `El ticker ${ticker} no está en el catálogo de clasificación`,
      );
    }
    if (!(quantity > 0) || !Number.isFinite(quantity) || quantity>1e9) {
      throw new BadRequestException("La cantidad debe ser mayor a cero");
    }
    return this.positions.manager.transaction(async manager => {
      await manager.query('SELECT pg_advisory_xact_lock($1)', [userId]);
      const repo=manager.getRepository(Position);
      const existing=await repo.findOneBy({userId,ticker});
      if(existing) {
        const total=Number((Number(existing.quantity)+quantity).toFixed(8));
        if(total>1e9) throw new BadRequestException("Cantidad máxima excedida");
        existing.quantity=String(total); return repo.save(existing);
      }
      if(await repo.countBy({userId})>=500) throw new BadRequestException("Máximo de 500 posiciones");
      return repo.save(repo.create({userId,ticker,instrument,quantity:String(quantity)}));
    });
  }

  async updatePosition(userId: number, id: number, quantity: number): Promise<Position> {
    if (!(quantity > 0) || !Number.isFinite(quantity) || quantity>1e9) {
      throw new BadRequestException("La cantidad debe ser mayor a cero");
    }
    return this.positions.manager.transaction(async manager => {
      await manager.query('SELECT pg_advisory_xact_lock($1)', [userId]);
      const repo = manager.getRepository(Position);
      const pos = await repo.findOneBy({ id, userId });
      if (!pos) throw new NotFoundException("Posición inexistente");
      pos.quantity = String(quantity);
      return repo.save(pos);
    });
  }

  async removePosition(userId: number, id: number): Promise<{ ok: true }> {
    return this.positions.manager.transaction(async manager => {
      await manager.query('SELECT pg_advisory_xact_lock($1)', [userId]);
      const res = await manager.getRepository(Position).delete({ id, userId });
      if (!res.affected) throw new NotFoundException("Posición inexistente");
      return { ok: true as const };
    });
  }
}
