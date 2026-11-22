const SERIES = ['DFF','DGS2','DGS10','CPIAUCSL'] as const;
type Series = typeof SERIES[number];
export interface MacroObservation {series:Series;value:number;date:string;source:string;unit:string}
export interface MacroSnapshot {retrievedAt:string;observations:MacroObservation[];inflationYoyPct:number|null;yieldSpread10y2yPp:number|null;missing:string[];notice:string}
export function parseMacroCsv(text:string,series:Series,now=Date.now()) {
  const lines=text.trim().split(/\r?\n/);if(lines.shift()!==`observation_date,${series}`||lines.length>1000)throw Error('Formato macro inválido');
  const rows:{date:string;value:number}[]=[];let last='';
  for(const line of lines){const [date,raw,...extra]=line.split(',');
    if(extra.length||!/^\d{4}-\d{2}-\d{2}$/.test(date)||date<=last||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||Date.parse(date)>now)throw Error('Fecha macro inválida');
    last=date;if(raw==='.'||raw==='')continue;
    if(!/^-?\d+(\.\d+)?$/.test(raw))throw Error('Valor macro inválido');const value=Number(raw);
    if(!Number.isFinite(value)||(series==='CPIAUCSL'?value<=0||value>100000:value< -20||value>100))throw Error('Valor macro fuera de rango');
    rows.push({date,value});
  }
  return rows;
}
export function assembleMacro(data:Partial<Record<Series,ReturnType<typeof parseMacroCsv>>>,now=Date.now()):MacroSnapshot {
  const observations:MacroObservation[]=[],missing:string[]=[];
  for(const series of SERIES){const row=data[series]?.at(-1);if(!row||now-Date.parse(row.date)>(series==='CPIAUCSL'?75:7)*86400000){missing.push(series);continue;}
    observations.push({...row,series,unit:series==='CPIAUCSL'?'índice 1982–1984=100, desestacionalizado':'porcentaje anual',source:`https://fred.stlouisfed.org/series/${series}`});}
  const cpi=observations.find(x=>x.series==='CPIAUCSL');
  const prior=cpi?data.CPIAUCSL?.find(x=>x.date===`${Number(cpi.date.slice(0,4))-1}${cpi.date.slice(4)}`):undefined;
  const two=observations.find(x=>x.series==='DGS2'),ten=observations.find(x=>x.series==='DGS10');
  return {retrievedAt:new Date(now).toISOString(),observations,missing,inflationYoyPct:cpi&&prior?(cpi.value/prior.value-1)*100:null,yieldSpread10y2yPp:two&&ten&&two.date===ten.date?ten.value-two.value:null,notice:'Contexto de EE. UU. publicado por FRED (Federal Reserve/BLS). Fechas de observación, no cotizaciones en tiempo real. Series revisables; inflación interanual calculada sobre CPI desestacionalizado. Diferencial 10–2 años en puntos porcentuales sólo con la misma fecha. No representa toda la macroeconomía mundial.'};
}
let cache:{until:number;value:MacroSnapshot}|undefined,pending:Promise<MacroSnapshot>|undefined;
export async function macroSnapshot():Promise<MacroSnapshot> {
  if(cache&&cache.until>Date.now())return cache.value;if(pending)return pending;
  pending=(async()=>{const now=Date.now(),data:Partial<Record<Series,ReturnType<typeof parseMacroCsv>>>={};
    await Promise.all(SERIES.map(async series=>{try{
      const url=new URL('https://fred.stlouisfed.org/graph/fredgraph.csv');url.searchParams.set('id',series);url.searchParams.set('cosd',new Date(now-(series==='CPIAUCSL'?500:45)*86400000).toISOString().slice(0,10));
      const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error();
      const reader=response.body?.getReader();if(!reader)throw Error();let size=0;const chunks:Uint8Array[]=[];
      for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>100000){await reader.cancel();throw Error();}chunks.push(value);}
      data[series]=parseMacroCsv(Buffer.concat(chunks).toString('utf8'),series,now);
    }catch{/* A failed or stale source remains unavailable. */}}));
    const value=assembleMacro(data,now);cache={until:now+(value.missing.length?300000:6*3600000),value};return value;
  })().finally(()=>{pending=undefined;});return pending;
}
