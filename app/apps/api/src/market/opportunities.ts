import { evidenceScenarios } from '../observations/scenarios.evidence';
/** An opportunity is a sourced conditional upside, never a probability or buy order. */
export function opportunity(row:any, now=Date.now()) {
  const snapshot=row.payload?.snapshot;
  const age=now-Date.parse(snapshot?.quote?.asOf??'');
  if(!Number.isFinite(age)||age< -60000||age>(snapshot?.asset?.kind==='crypto'?30*60_000:96*3600_000))return null;
  const scenarios=evidenceScenarios([row],now).filter(s=>s.direction==='up');
  if(!scenarios.length)return null;
  const sources=snapshot.sources as any[];
  // Generic crypto headlines cannot establish a token-specific opportunity.
  const name=String(snapshot.asset?.name??'').toLowerCase();
  const ticker=String(snapshot.asset?.ticker??row.ticker).split('-')[0];
  const escape=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const named=new RegExp('(^|[^\\p{L}\\p{N}])'+escape(name)+'([^\\p{L}\\p{N}]|$)','iu');
  const cashtag=new RegExp('\\$'+escape(ticker)+'\\b','i');
  const specific=(s:any)=>s.scope==='asset'||(name.length>3&&named.test(s.title+' '+s.text))||cashtag.test(s.title+' '+s.text);

  const supported=scenarios.filter(s=>s.sources.some(ref=>sources.some(src=>src.url===ref.url&&specific(src))));
  if(!supported.length)return null;
  return {label:'Posible suba · escenario condicional',probability:null,scenarios:supported,notice:'No es una probabilidad calculada ni una recomendación de compra. Puede no cumplirse.'};
}
