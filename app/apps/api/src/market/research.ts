import type { MacroSnapshot } from './macro';
export interface DailyPoint { at:string; price:number }
export interface ResearchData {
  history:{source:string; retrievedAt:string; kind:'daily_price_samples'|'daily_closes'; points:DailyPoint[]; error?:string};
  fundamentals:{source:string; retrievedAt:string; metrics:Record<string,number>; periods:{filedAt:string;period:string;form:string}[]; error?:string};
  technical:ReturnType<typeof indicators>;
}
export function dailyPoints(raw:unknown,now=Date.now()):DailyPoint[] {
  if(!Array.isArray(raw))return [];
  const result:DailyPoint[]=[];let previous=-Infinity;
  for(const pair of raw.slice(-400)) {
    if(!Array.isArray(pair)||pair.length<2) return [];
    const [t,p]=pair;
    if(!Number.isFinite(t)||!Number.isFinite(p)||p<=0||t<=previous||t>now+60000)return [];
    previous=t;result.push({at:new Date(t).toISOString(),price:p});
  }
  return result;
}
function ema(v:number[],period:number):(number|null)[] {
  const result:(number|null)[]=v.map(()=>null);if(v.length<period)return result;
  let avg=v.slice(0,period).reduce((a,b)=>a+b,0)/period;result[period-1]=avg;
  for(let i=period;i<v.length;i++){avg=v[i]*2/(period+1)+avg*(1-2/(period+1));result[i]=avg;}return result;
}
export function indicators(points:DailyPoint[],crypto=false) {
  const v=points.map(p=>p.price),n=v.length;
  const timestamps=points.map(p=>Date.parse(p.at));
  const valid=points.every((p,i)=>Number.isFinite(p.price)&&p.price>0&&Number.isFinite(timestamps[i])&&timestamps[i]<=Date.now()+60000&&(i===0||(timestamps[i]-timestamps[i-1]>=20*3600000&&timestamps[i]-timestamps[i-1]<=(crypto?28:120)*3600000)));
  const recent=valid&&n>0&&Date.now()-Date.parse(points[n-1].at)<(crypto?48:120)*3600000;
  const last=(a:(number|null)[])=>a.length?a[a.length-1]:null;
  const sma=(p:number)=>n>=p?v.slice(-p).reduce((a,b)=>a+b,0)/p:null;
  let rsi14:number|null=null;
  if(n>=15){let gain=0,loss=0;for(let i=1;i<=14;i++){const d=v[i]-v[i-1];gain+=Math.max(d,0)/14;loss+=Math.max(-d,0)/14;}for(let i=15;i<n;i++){const d=v[i]-v[i-1];gain=(gain*13+Math.max(d,0))/14;loss=(loss*13+Math.max(-d,0))/14;}rsi14=gain===0&&loss===0?50:loss===0?100:100-100/(1+gain/loss);}
  const fast=ema(v,12),slow=ema(v,26);const macd=v.map((_,i)=>fast[i]!==null&&slow[i]!==null?fast[i]!-slow[i]!:null).filter((x):x is number=>x!==null);
  const signal=last(ema(macd,9)),line=last(macd);
  const change=(sessions:number)=>n>sessions?(v[n-1]/v[n-1-sessions]-1)*100:null;
  // Descriptive risk statistics, not trade levels or calibrated forecasts.
  let volatility30AnnualizedPct:number|null=null,maxDrawdown90SamplesPct:number|null=null;
  if(n>=31){
    const window=v.slice(-31),returns=window.slice(1).map((p,i)=>Math.log(p/window[i]));
    const mean=returns.reduce((a,b)=>a+b,0)/returns.length;
    const variance=returns.reduce((a,b)=>a+(b-mean)**2,0)/(returns.length-1);
    volatility30AnnualizedPct=Math.sqrt(variance*(crypto?365:252))*100;
  }
  if(n>=90){
    let peak=v[n-90],drawdown=0;
    for(const price of v.slice(-90)){peak=Math.max(peak,price);drawdown=Math.min(drawdown,price/peak-1);}
    maxDrawdown90SamplesPct=drawdown*100;
  }
  const mean20=sma(20);
  const std20=n>=20?Math.sqrt(v.slice(-20).reduce((sum,p)=>sum+(p-mean20!)**2,0)/20):null;
  const yearStart=n?Date.UTC(new Date(timestamps[n-1]).getUTCFullYear(),0,1):NaN;
  const priorYear=points.filter(p=>Date.parse(p.at)<yearStart).at(-1);
  const ytdBase=priorYear&&yearStart-Date.parse(priorYear.at)<=7*86400000?priorYear.price:null;
  const yearWindow=points.filter(p=>timestamps[n-1]-Date.parse(p.at)<=364*86400000);
  const fullYear=n>0&&timestamps[n-1]-timestamps[0]>=364*86400000;
  const values={sma20:mean20,sma100:sma(100),bollinger20Middle:mean20,bollinger20Upper:std20!==null?mean20!+2*std20:null,bollinger20Lower:std20!==null?mean20!-2*std20:null,roc12Pct:change(12),changeQuarterSamplesPct:change(crypto?90:63),changeYtdPct:ytdBase?(v[n-1]/ytdBase-1)*100:null,min52WeekSamples:fullYear?Math.min(...yearWindow.map(p=>p.price)):null,max52WeekSamples:fullYear?Math.max(...yearWindow.map(p=>p.price)):null,volatility30AnnualizedPct,maxDrawdown90SamplesPct,min20DailySamples:n>=20?Math.min(...v.slice(-20)):null,max20DailySamples:n>=20?Math.max(...v.slice(-20)):null,sma50:sma(50),sma200:sma(200),ema9:last(ema(v,9)),ema21:last(ema(v,21)),rsi14,macd:line,macdSignal:signal,macdHistogram:line!==null&&signal!==null?line-signal:null,change1SessionPct:change(1),change5SessionsPct:change(5),change21SessionsPct:change(21)};
  return {status:recent&&n>=35?'available' as const:'unavailable' as const,asOf:points.at(-1)?.at??null,samples:n,values:recent?values:Object.fromEntries(Object.keys(values).map(k=>[k,null])),method:`SMA/EMA y MACD(12,26,9) sobre observaciones diarias; RSI(14) suavizado de Wilder. EMA inicializada con SMA. Volatilidad: desvío muestral de 30 retornos logarítmicos, anualizado con ${crypto?365:252} observaciones; drawdown: mayor caída desde un máximo previo en las últimas 90 muestras. Mínimo/máximo de 20 muestras, no soportes, stops ni objetivos. Bollinger: SMA20 ± dos desvíos poblacionales de 20 observaciones; ROC12 y trimestre por 90 muestras cripto/63 bursátiles. YTD usa la última muestra del año anterior (máximo 7 días de separación). Extremos de 52 semanas sobre muestras, no máximos/mínimos intradiarios. Sin señales automáticas de operación.`};
}
export function financialMetrics(raw:any):Record<string,number> {
  const allowed=['52WeekHigh','52WeekLow','beta','marketCapitalization','peTTM','pbAnnual','psTTM','epsTTM','roeTTM','roaTTM','netProfitMarginTTM','revenueGrowthTTMYoy','epsGrowthTTMYoy','dividendYieldIndicatedAnnual','currentRatioQuarterly','totalDebt/totalEquityQuarterly'];
  const result:Record<string,number>={};for(const k of allowed)if(typeof raw?.metric?.[k]==='number'&&Number.isFinite(raw.metric[k]))result[k]=raw.metric[k];return result;
}
export function masterSections(research:ResearchData|undefined,report?:{summary:string;scenarios:{direction:string;condition:string;explanation:string}[];limitations:string[]},quote?:{price:number;currency:string;asOf:string;source:string}|null,macro?:MacroSnapshot) {
  const technical=research?.technical.status==='available';
  const fundamental=Object.keys(research?.fundamentals.metrics??{}).length>0;
  return [
    {section:'1. Resumen ejecutivo',status:'conditional',detail:report?.summary??'Datos insuficientes.'},
    {section:'2. Precio actual',status:quote?'available':'unavailable',detail:quote?`${quote.price} ${quote.currency}; ${quote.source}; ${quote.asOf}. Cotización fechada, sin garantía de latencia en tiempo real.`:'Cotización no disponible.'},
    {section:'3. Análisis técnico',status:technical?'partial':'unavailable',detail:technical?'Indicadores diarios, volatilidad y drawdown calculados por el servidor cuando hay muestras suficientes. Faltan análisis intradiario, volumen por vela, ATR/VWAP y confirmación de patrones.':'Faltan históricos recientes suficientes.'},
    {section:'4. Análisis fundamental',status:fundamental?'partial':'unavailable',detail:fundamental?'Ratios informados por proveedor y períodos reportados. No reemplazan valoración intrínseca ni comparación sectorial.':'Fundamentales societarios no disponibles o no aplicables.'},
    {section:'5. Análisis macro',status:'partial',detail:macro?.observations.length?[...macro.observations.map(o=>`${o.series}: ${o.value} ${o.unit}; ${o.date}; ${o.source}`),`Inflación interanual: ${macro.inflationYoyPct===null?'no disponible':macro.inflationYoyPct.toFixed(2)+' %'}. Diferencial 10–2 años: ${macro.yieldSpread10y2yPp===null?'no disponible':macro.yieldSpread10y2yPp.toFixed(2)+' puntos porcentuales'}.`,macro.notice,'Faltan liquidez, empleo y cobertura macro global completa.'].join('\n'):'Series oficiales no disponibles. Contexto limitado a las noticias citadas.'},
    {section:'6. Escenarios',status:report?.scenarios.length?'conditional':'unavailable',detail:report?.scenarios.map(s=>`${s.direction==='up'?'Alcista':s.direction==='down'?'Bajista':'Base'}: ${s.condition} ${s.explanation}`).join('\n')||'Sin evidencia suficiente para escenarios.'},
    {section:'7. Puntos de entrada',status:'unavailable',detail:'No se calculan entradas agresivas, confirmadas o conservadoras sin estrategia y datos suficientes.'},
    {section:'8. Plan de salida',status:'unavailable',detail:'Stop, TP1, TP2 y TP3 no disponibles: faltan metodología y validación.'},
    {section:'9. Relación riesgo/beneficio',status:'unavailable',detail:'No calculable sin entrada, stop y objetivo respaldados.'},
    {section:'10. Scoring 0–100',status:'unavailable',detail:'No calculado: falta calibrar y validar los componentes y sus pesos fuera de muestra.'},
    {section:'11. Plan de acción',status:'unavailable',detail:'No se emite una recomendación operativa personalizada sin perfil, horizonte, liquidez y metodología validados.'},
    {section:'12. Nivel de confianza',status:'limited',detail:'Limitada por cobertura y actualidad de datos. No expresa una probabilidad de suba o baja.'},
    {section:'13. Principales riesgos',status:'partial',detail:report?.limitations.join('\n')||'La evidencia no alcanza para cuantificar los riesgos del activo.'},
    {section:'14. Catalizadores',status:'conditional',detail:'Sólo los acontecimientos de las fuentes citadas y las condiciones de los escenarios. No hay calendario corporativo completo verificado.'},
  ];
}
