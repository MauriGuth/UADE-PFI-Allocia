import { macroSnapshot, MacroSnapshot } from './macro';
import { ResearchData, dailyPoints, financialMetrics, indicators } from './research';
import { createHash } from 'node:crypto';
import { MarketAsset } from './config';
export interface MarketSource { id: string; title: string; text: string; url: string; publishedAt: string; fetchedAt: string; scope: 'asset'|'global'|'crypto'; /** Medio que publicó la nota según el proveedor (campo `source` de Finnhub), si lo informa. */ publisher?: string; }
export interface MarketSnapshot { asset: MarketAsset; quote: { price: number; currency: string; asOf: string; source: string; checkedAt?: string } | null; sources: MarketSource[]; missing: string[]; fetchedAt: string; research?:ResearchData; macro?:MacroSnapshot; }
export async function marketJson(url: URL, headers: Record<string,string> = {}): Promise<any> {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000), redirect: 'error' });
  if (!res.ok) throw new Error('Fuente no disponible');
  // Bound the stream, not just Content-Length (third-party input).
  const reader = res.body?.getReader(); if (!reader) throw new Error('Respuesta vacía');
  let size = 0; const chunks: Uint8Array[] = [];
  for (;;) { const {done,value} = await reader.read(); if(done) break; size += value.length; if(size>2_000_000) { await reader.cancel(); throw new Error('Respuesta excesiva'); } chunks.push(value); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function safeText(v: unknown, max: number) { return typeof v==='string' ? v.replace(/<[^>]*>/g,' ').replace(/[\u0000-\u001f]/g,' ').slice(0,max) : ''; }
export function normalizeNews(items: any, scope: MarketSource['scope'], now = Date.now()): MarketSource[] {
  if (!Array.isArray(items)) return [];
  const result: MarketSource[] = [];
  for (const item of items.slice(0,100)) {
    const timestamp = Number(item.datetime)*1000;
    if (!Number.isFinite(timestamp) || timestamp > now+60_000 || now-timestamp > 48*3600_000) continue;
    let url: URL; try { url = new URL(item.url); } catch { continue; }
    if (url.protocol !== 'https:' || url.username || url.password) continue;
    const title = safeText(item.headline,240), text = safeText(item.summary,1800);
    if (!title || !text) continue;
    // Duplicados: la misma nota llega a veces repetida (misma URL o mismo titular en otro agregador).
    const titleKey = title.toLowerCase().replace(/\s+/g,' ').trim();
    if (result.some(r => r.url===url.href || r.title.toLowerCase().replace(/\s+/g,' ').trim()===titleKey)) continue;
    const publisher = safeText(item.source,60).trim();
    result.push({id:createHash('sha256').update(url.href).digest('hex').slice(0,20), title, text, url:url.href, publishedAt:new Date(timestamp).toISOString(),fetchedAt:new Date(now).toISOString(),scope,...(publisher?{publisher}:{})});
  }
  return result.slice(0,12);
}
export class MarketFeed {
  // Public quotes only. Coalesce requests from portfolio/analysis/observations;
  // never retain holdings or replace a missing quote with a demonstration value.
  private static readonly quotesCache = new Map<string, {until:number; value:NonNullable<MarketSnapshot['quote']>}>();
  private static readonly pending = new Map<string, Promise<MarketSnapshot['quote']>>();
  async quote(asset: MarketAsset, forceRefresh = false): Promise<MarketSnapshot['quote']> {
    const key=JSON.stringify([asset.kind,asset.providerSymbol,asset.currency]);
    const cached=MarketFeed.quotesCache.get(key);
    if(MarketFeed.pending.has(key)) return MarketFeed.pending.get(key)!;
    if(cached && cached.until>Date.now() && (!forceRefresh || Date.now()-Date.parse(cached.value.checkedAt ?? "")<5000)) return {...cached.value};
    const promise=this.fetchQuote(asset).then(value=>{
      if(value) {
        value.checkedAt=new Date().toISOString();
        if(MarketFeed.quotesCache.size>=500) MarketFeed.quotesCache.delete(MarketFeed.quotesCache.keys().next().value!);
        MarketFeed.quotesCache.set(key,{until:Date.now()+30_000,value});
      } else MarketFeed.quotesCache.delete(key);
      return value ? {...value} : null;
    }).finally(()=>MarketFeed.pending.delete(key));
    MarketFeed.pending.set(key,promise);
    return promise;
  }
  async quotes(assets:MarketAsset[], forceRefresh = false):Promise<Map<string,MarketSnapshot['quote']>> {
    const results=new Map<string,MarketSnapshot['quote']>();
    let next=0;
    await Promise.all(Array.from({length:Math.min(4,assets.length)},async()=>{
      while(next<assets.length){const asset=assets[next++];results.set(asset.ticker,await this.quote(asset,forceRefresh));}
    }));
    return results;
  }
  private async finnhub(path: string, params: Record<string,string>) {
    if (!process.env.FINNHUB_API_KEY) throw new Error('Fuente no configurada');
    const u = new URL(`https://finnhub.io/api/v1/${path}`); for(const [k,v] of Object.entries(params)) u.searchParams.set(k,v);
    return marketJson(u, {'X-Finnhub-Token':process.env.FINNHUB_API_KEY});
  }
  private async fetchQuote(asset: MarketAsset): Promise<MarketSnapshot["quote"]> {
    const now = Date.now();
    let quote: MarketSnapshot['quote'] = null;
    try {
      if(asset.kind==='crypto') {
        if (!process.env.COINGECKO_API_KEY) throw new Error('Cripto no configurado');
        const u = new URL('https://api.coingecko.com/api/v3/simple/price');
        u.searchParams.set('ids',asset.providerSymbol);u.searchParams.set('vs_currencies','usd');u.searchParams.set('include_last_updated_at','true');
        const d = (await marketJson(u, {'x-cg-demo-api-key':process.env.COINGECKO_API_KEY}))[asset.providerSymbol];
        if(d?.usd>0 && Number.isFinite(d.usd) && now-d.last_updated_at*1000<15*60_000 && d.last_updated_at*1000<=now+60_000) quote={price:d.usd,currency:'USD',asOf:new Date(d.last_updated_at*1000).toISOString(),source:'CoinGecko'};
      } else {
        const d = await this.finnhub('quote',{symbol:asset.providerSymbol});
        // Pre-open snapshots can use the previous close, explicitly dated, for up to 96 hours.
        if(d.c>0 && Number.isFinite(d.c) && d.t>0 && now-d.t*1000<96*3600_000 && d.t*1000<=now+60_000) quote={price:d.c,currency:asset.currency,asOf:new Date(d.t*1000).toISOString(),source:'Finnhub'};
      }
    } catch { /* Return explicit missing data; never use demonstration prices. */ }
    return quote;
  }
  async research(asset:MarketAsset):Promise<ResearchData> {
    const now=Date.now(),retrievedAt=new Date(now).toISOString();
    let points:ReturnType<typeof dailyPoints>=[],metrics:Record<string,number>={},periods:ResearchData['fundamentals']['periods']=[];
    let historyError:string|undefined,financialError:string|undefined;
    await Promise.all([
      (async()=>{try {
        if(asset.kind==='crypto') {
          if(!process.env.COINGECKO_API_KEY)throw new Error();
          const u=new URL('https://api.coingecko.com/api/v3/coins/'+encodeURIComponent(asset.providerSymbol)+'/market_chart');
          u.searchParams.set('vs_currency','usd');u.searchParams.set('days','365');u.searchParams.set('interval','daily');
          const d=await marketJson(u,{'x-cg-demo-api-key':process.env.COINGECKO_API_KEY});
          points=dailyPoints(d.prices?.filter((p:unknown)=>Array.isArray(p)&&new Date(p[0]).getUTCHours()===0&&new Date(p[0]).getUTCMinutes()===0),now);
        } else {
          const d=await this.finnhub('stock/candle',{symbol:asset.providerSymbol,resolution:'D',from:String(Math.floor(now/1000)-550*86400),to:String(Math.floor(now/1000))});
          if(d.s!=='ok'||!Array.isArray(d.t)||!Array.isArray(d.c)||d.t.length!==d.c.length)throw new Error();
          points=dailyPoints(d.t.map((t:number,i:number)=>[t*1000,d.c[i]]),now);
        }
        if(!points.length)throw new Error();
      }catch{historyError='Históricos no disponibles con el acceso actual; no se estiman indicadores.';}})(),
      (async()=>{if(asset.kind==='crypto'){financialError='Los ratios societarios no aplican a este criptoactivo.';return;}
        const results=await Promise.allSettled([this.finnhub('stock/metric',{symbol:asset.providerSymbol,metric:'all'}),this.finnhub('stock/financials-reported',{symbol:asset.providerSymbol,freq:'quarterly'})]);
        if(results[0].status==='fulfilled')metrics=financialMetrics(results[0].value);
        if(results[1].status==='fulfilled'&&Array.isArray(results[1].value.data))periods=results[1].value.data.slice(0,4).filter((d:any)=>Number.isFinite(Date.parse(d.filedDate))&&Date.parse(d.filedDate)<=now).map((d:any)=>({filedAt:d.filedDate,period:String(d.endDate).slice(0,30),form:String(d.form).slice(0,20)}));
        if(!Object.keys(metrics).length)financialError='Fundamentales no disponibles.';
      })(),
    ]);
    return {history:{source:asset.kind==='crypto'?'CoinGecko':'Finnhub',retrievedAt,kind:asset.kind==='crypto'?'daily_price_samples':'daily_closes',points,error:historyError},fundamentals:{source:'Finnhub',retrievedAt,metrics,periods,error:financialError},technical:indicators(points,asset.kind==='crypto')};
  }
  async snapshot(asset: MarketAsset): Promise<MarketSnapshot> {
    const now=Date.now(), missing:string[]=[];
    const [quote,research,macro]=await Promise.all([this.quote(asset),this.research(asset),macroSnapshot()]);
    if(!quote) missing.push("Cotización verificable no disponible");
    const from=new Date(now-48*3600_000).toISOString().slice(0,10),to=new Date(now).toISOString().slice(0,10);
    const groups = await Promise.allSettled([
      this.finnhub('news',{category:'general'}),
      asset.kind==='crypto' ? this.finnhub('news',{category:'crypto'}) : this.finnhub('company-news',{symbol:asset.providerSymbol,from,to}),
    ]);
    let sources: MarketSource[]=[];
    groups.forEach((g,i)=> { if(g.status==='fulfilled') sources.push(...normalizeNews(g.value,i===0?'global':asset.kind==='crypto'?'crypto':'asset',now)); else missing.push(i===0?'Noticias globales no disponibles':'Noticias del activo no disponibles'); });
    sources=[...new Map(sources.map(s=>[s.id,s])).values()];
    if (!sources.some(s=>s.scope==='global')) missing.push('Sin contexto global reciente');
    if (!sources.some(s=>s.scope==='asset'||s.scope==='crypto')) missing.push('Sin noticias recientes del activo o sector cripto');
    return {asset,quote,research,macro,sources,missing:[...new Set(missing)],fetchedAt:new Date(now).toISOString()};
  }
}
