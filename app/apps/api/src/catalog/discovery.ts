import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { MarketFeed, marketJson } from '../market/feed';
import { MarketAsset, universe } from '../market/config';
export type Candidate = { provider:'coingecko'|'finnhub'; id:string; symbol:string; name:string };
const cache=new Map<string,{until:number;value:{results:Candidate[];unavailable:string[]}}>();
export async function providerJson(provider:Candidate['provider'],path:string,params:Record<string,string>={}) {
  const key=provider==='coingecko'?process.env.COINGECKO_API_KEY:process.env.FINNHUB_API_KEY;
  if(!key) throw new ServiceUnavailableException('Proveedor no configurado');
  const url=new URL((provider==='coingecko'?'https://api.coingecko.com/api/v3/':'https://finnhub.io/api/v1/')+path);
  for(const [k,v] of Object.entries(params))url.searchParams.set(k,v);
  return marketJson(url,{[provider==='coingecko'?'x-cg-demo-api-key':'X-Finnhub-Token']:key});
}
export async function discover(q:string) {
  q=q.trim();if(q.length<2||q.length>60)throw new BadRequestException('La búsqueda requiere entre 2 y 60 caracteres');
  const hit=cache.get(q.toLowerCase());if(hit&&hit.until>Date.now())return hit.value;
  const responses=await Promise.allSettled([providerJson('coingecko','search',{query:q}),providerJson('finnhub','search',{q})]);
  const results:Candidate[]=[],unavailable:string[]=[];
  responses.forEach((r,i)=>{
    if(r.status!=='fulfilled'){unavailable.push(i===0?'CoinGecko':'Finnhub');return;}
    const list=i===0?r.value.coins:r.value.result;
    if(!Array.isArray(list)){unavailable.push(i===0?'CoinGecko':'Finnhub');return;}
    for(const x of list.slice(0,15)) {
      const id=i===0?x.id:x.symbol;
      if(typeof id!=='string'||!(i===0?/^[a-z0-9-]{1,100}$/:/^[A-Z0-9.^=-]{1,24}$/).test(id))continue;
      if(i===1&&!['Common Stock','ETP','ADR','REIT'].includes(x.type))continue;
      results.push({provider:i===0?'coingecko':'finnhub',id,symbol:String(x.symbol).slice(0,24),name:String(i===0?x.name:x.description).slice(0,150)});
    }
  });
  const value={results,unavailable};if(cache.size>=200)cache.delete(cache.keys().next().value!);cache.set(q.toLowerCase(),{until:Date.now()+300_000,value});return value;
}
export async function resolveCandidate(provider:Candidate['provider'],id:string) {
  if(!(provider==='coingecko'?/^[a-z0-9-]{1,100}$/:/^[A-Z0-9.^=-]{1,24}$/).test(id))throw new BadRequestException('Identificador inválido');
  const known=universe().find(a=>a.providerSymbol===id&&a.kind===(provider==='coingecko'?'crypto':'equity'));
  let asset:MarketAsset,sector='Sin clasificar';
  if(known)asset=known;
  else if(provider==='coingecko') {
    const d=await providerJson(provider,'coins/'+encodeURIComponent(id),{localization:'false',tickers:'false',market_data:'false',community_data:'false',developer_data:'false'});
    if(d.id!==id||typeof d.name!=='string'||typeof d.symbol!=='string')throw new BadRequestException('Cripto no identificada');
    const symbol=d.symbol.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8)||'TOKEN';
    asset={ticker:symbol+'-'+createHash('sha256').update(id).digest('hex').slice(0,10).toUpperCase(),name:d.name.slice(0,150),region:'Global',exchange:'CRYPTO',providerSymbol:id,currency:'USD',kind:'crypto'};
    sector='Criptoactivos';
  } else {
    const d=await providerJson(provider,'stock/profile2',{symbol:id});
    if(d.ticker!==id||d.currency!=='USD'||typeof d.name!=='string'||!/(NASDAQ|NYSE|NEW YORK)/i.test(String(d.exchange)))throw new ServiceUnavailableException('No hay identificación, moneda USD o acceso verificable para este instrumento');
    asset={ticker:id,name:d.name.slice(0,150),region:String(d.country||'Sin clasificar').slice(0,50),exchange:'XNYS_XNAS',providerSymbol:id,currency:'USD',kind:'equity'};
    sector=String(d.finnhubIndustry||'Sin clasificar').slice(0,100);
  }
  const quote=await new MarketFeed().quote(asset);
  if(!quote)throw new ServiceUnavailableException('El proveedor no ofrece una cotización reciente verificable. No se agrega un precio ficticio.');
  return {asset,quote,sector};
}
