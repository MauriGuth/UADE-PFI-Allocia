import { marketJson, normalizeNews } from '../market/feed';
import { SignalsSnapshot, SignalProvenance } from './signals.types';
import { fetchGprDaily, gprLevel, gprTrend, marketBinary } from './gpr';

const text = (v: unknown, n = 300) => typeof v === 'string' ? v.replace(/<[^>]*>/g, ' ').replace(/[\u0000-\u001f]/g, ' ').slice(0, n) : '';
const number = (v: unknown): number => typeof v === 'number' || (typeof v === 'string' && v.trim() !== '') ? Number(v) : NaN;
function recent(v: unknown, now: number, maxAge: number): string | null {
  const t = number(v) * 1000;
  return Number.isFinite(t) && t > 0 && t <= now + 60_000 && now - t <= maxAge ? new Date(t).toISOString() : null;
}
export async function buildLiveSignals(get = marketJson, now = Date.now(), getBinary: (u: URL) => Promise<Buffer> = marketBinary): Promise<SignalsSnapshot> {
  const fetchedAt = new Date(now).toISOString();
  const missing = (source: string): SignalProvenance => ({ source, origin: 'no disponible', dataDate: null, fetchedAt });
  const out: SignalsSnapshot = {
    snapshotDate: fetchedAt, origen: 'fuentes externas',
    provenance: {geo:missing('Índice GPR no disponible; Finnhub (noticias)'),fearGreed:missing('Alternative.me'),btcDominance:missing('CoinGecko'),defi:missing('DefiLlama'),predictionMarkets:missing('Polymarket')},
    geo: {gprIndex:null,gprLevel:'no disponible',tendencia:'no disponible',eventos:[]},
    emerging:{fearGreedIndex:null,fearGreedLabel:'No disponible',btcDominance:null,defiTvlUsd:null,tendenciaCripto:'no disponible',predictionMarkets:[]},
  };
  const available = (key: keyof SignalsSnapshot['provenance'], date: string) => {
    out.provenance[key] = {...out.provenance[key],origin:'externo',dataDate:date};
  };
  await Promise.allSettled([
    (async()=>{
      const d=(await get(new URL('https://api.alternative.me/fng/?limit=1')))?.data?.[0];
      const value=number(d?.value), date=recent(d?.timestamp,now,48*3600_000);
      if(!date || !Number.isFinite(value) || value<0 || value>100)return;
      out.emerging.fearGreedIndex=value;
      const labels:Record<string,string>={'Extreme Fear':'Miedo extremo',Fear:'Miedo',Neutral:'Neutral',Greed:'Codicia','Extreme Greed':'Codicia extrema'};
      out.emerging.fearGreedLabel=labels[d.value_classification] ?? text(d.value_classification,60);
      available('fearGreed',date);
    })(),
    (async()=>{
      const d=(await get(new URL('https://api.coingecko.com/api/v3/global'), process.env.COINGECKO_API_KEY ? {'x-cg-demo-api-key':process.env.COINGECKO_API_KEY} : {}))?.data;
      const v=number(d?.market_cap_percentage?.btc),date=recent(d?.updated_at,now,3600_000);
      if(!date || !Number.isFinite(v) || v<0 || v>100)return;
      out.emerging.btcDominance=Math.round(v*10)/10;available('btcDominance',date);
    })(),
    (async()=>{
      const rows=await get(new URL('https://api.llama.fi/v2/historicalChainTvl'));
      if(!Array.isArray(rows))return;
      const d=rows.filter(d=>recent(d?.date,now,48*3600_000)).sort((a,b)=>number(b.date)-number(a.date))[0];
      const v=number(d?.tvl),date=recent(d?.date,now,48*3600_000);
      if(!date || !Number.isFinite(v) || v<=0)return;
      out.emerging.defiTvlUsd=v;available('defi',date);
    })(),
    (async()=>{
      const rows=await get(new URL('https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=50&order=volume24hr&ascending=false'));
      if(!Array.isArray(rows))return;
      for(const d of rows){
        if(d.active!==true || d.closed!==false || Date.parse(d.endDate)<=now || !Number.isFinite(Date.parse(d.endDate)))continue;
        if(!/\b(fed|inflation|recession|interest rate|bitcoin|ethereum|oil|tariff|ceasefire|war)\b/i.test(text(d.question)))continue;
        const date=recent(Date.parse(d.updatedAt)/1000,now,24*3600_000);if(!date)continue;
        try{
          const outcomes=typeof d.outcomes==='string'?JSON.parse(d.outcomes):d.outcomes;
          const prices=typeof d.outcomePrices==='string'?JSON.parse(d.outcomePrices):d.outcomePrices;
          if(!Array.isArray(outcomes)||!Array.isArray(prices)||outcomes.length!==2||prices.length!==2||!outcomes.includes('Yes')||!outcomes.includes('No'))continue;
          const values=prices.map(number);if(values.some(v=>!Number.isFinite(v)||v<0||v>1)||Math.abs(values[0]+values[1]-1)>0.02)continue;
          const v=values[outcomes.indexOf('Yes')];
          out.emerging.predictionMarkets.push({pregunta:text(d.question),probabilidad:v,fuente:`Polymarket · precio implícito de «Sí», no probabilidad calibrada · ${date} · https://polymarket.com/market/${encodeURIComponent(String(d.slug))}`});
          available('predictionMarkets',date);
          if(out.emerging.predictionMarkets.length>=5)break;
        }catch{/* Un mercado inválido no bloquea los restantes. */}
      }
    })(),
    (async()=>{
      const g=await fetchGprDaily(getBinary,now);
      if(!g)return;
      out.geo.gprIndex=Math.round(g.ma30*10)/10;
      out.geo.gprLevel=gprLevel(g.ma30);
      out.geo.tendencia=gprTrend(g.ma7,g.ma30);
      // El índice manda sobre la procedencia de «geo»; las noticias conservan su fecha en cada evento.
      out.provenance.geo={...out.provenance.geo,source:'Caldara e Iacoviello, índice GPR diario (media móvil de 30 días); Finnhub (noticias)',origin:'externo',dataDate:`${g.day}T00:00:00.000Z`};
    })(),
    (async()=>{
      if(!process.env.FINNHUB_API_KEY)return;
      const rows=await get(new URL('https://finnhub.io/api/v1/news?category=general'),{'X-Finnhub-Token':process.env.FINNHUB_API_KEY});
      const news=normalizeNews(rows,'global',now).slice(0,6);
      out.geo.eventos=news.map(n=>({titulo:n.title,descripcion:n.text,regiones:[],sectores:[],impacto:'no evaluado',fuente:`${n.publishedAt} · ${n.url}`,...(n.publisher?{medio:n.publisher}:{})}));
      // News are context, not a numeric GPR index or an inferred impact score.
      if(news.length && out.geo.gprIndex===null)available('geo',news[0].publishedAt);
      else if(news.length) out.provenance.geo={...out.provenance.geo,origin:'externo'};
    })(),
  ]);
  return out;
}
