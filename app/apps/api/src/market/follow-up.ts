import { MarketSnapshot } from './feed';
import { AiReport } from './analyzer';

interface PriorReport { id:string; createdAt:string; payload:{snapshot:MarketSnapshot;report:AiReport;promptVersion?:string} }
// Comparisons describe observed changes; they do not validate a trading thesis.
export function followUp(snapshot:MarketSnapshot, report:AiReport, prior?:PriorReport) {
  if(!prior || prior.payload.snapshot.asset.ticker!==snapshot.asset.ticker) return {status:'unavailable',detail:'Primer informe disponible: no hay un análisis anterior comparable.'};
  const before=prior.payload.snapshot, lines=[`Informe anterior: ${prior.id}, ${new Date(prior.createdAt).toISOString()}.`];
  const a=before.quote,b=snapshot.quote;
  if(a&&b&&a.currency===b.currency&&a.source===b.source&&a.price>0&&Date.parse(b.asOf)>Date.parse(a.asOf)) lines.push(`Cambio entre cotizaciones fechadas: ${((b.price/a.price-1)*100).toFixed(2)} %. No equivale a rentabilidad de una operación.`);
  else lines.push('Cotizaciones sin fechas distintas comparables; no se calcula una variación nueva.');
  const oldSources=new Set(before.sources.map(s=>s.id));
  lines.push(`${snapshot.sources.filter(s=>!oldSources.has(s.id)).length} fuentes nuevas respecto del informe anterior.`);
  lines.push(report.status===prior.payload.report.status?'La disponibilidad de evidencia mantiene el mismo estado.':`Estado de evidencia: ${prior.payload.report.status} → ${report.status}.`);
  const prev=before.research?.technical,next=snapshot.research?.technical;
  if(prev?.status==='available'&&next?.status==='available'&&prev.asOf!==next.asOf) {
    for(const name of ['rsi14','macd','volatility30AnnualizedPct']) {
      const x=prev.values[name],y=next.values[name];
      if(typeof x==='number'&&typeof y==='number'&&Number.isFinite(x)&&Number.isFinite(y))lines.push(`${name}: ${x.toFixed(4)} → ${y.toFixed(4)}. Un aumento no implica una mejora de inversión.`);
    }
  }
  lines.push('No se evalúan cambios de stops, objetivos o score: esos valores no están validados. Revisar las condiciones de ambos escenarios; este seguimiento no confirma la tesis.');
  return {status:'descriptive',detail:lines.join('\n')};
}
export function verdict(snapshot:MarketSnapshot, report:AiReport) {
  const q=snapshot.quote,t=snapshot.research?.technical;
  const v=t?.values;
  const trend=t?.status==='available'&&typeof v?.sma50==='number'&&typeof v?.sma200==='number'?`SMA50 ${v.sma50>v.sma200?'por encima de':v.sma50<v.sma200?'por debajo de':'igual a'} SMA200; descripción diaria, no señal operativa.`:'No disponible con históricos suficientes.';
  return {section:'Veredicto final',status:'limited',detail:[
    `Activo: ${snapshot.asset.ticker}.`,
    `Precio actual: ${q?`${q.price} ${q.currency} (${q.source}, ${q.asOf})`:'no disponible'}.`,
    `Tendencia: ${trend}`,
    'Score: no disponible; metodología no validada.',
    'Corto plazo: escenarios condicionales del informe; sin plan de trading validado.',
    'Mediano plazo: faltan proyecciones y comparaciones verificadas.',
    'Largo plazo: faltan valoración intrínseca y supuestos contrastados.',
    'Zona de compra ideal / entradas agresiva, confirmada y conservadora: no disponibles.',
    'Stop técnico / objetivos 1, 2 y 3 / relación riesgo-beneficio: no disponibles.',
    'Acción recomendada: no se emite una orden operativa ni tamaño de posición.',
    'Nivel de confianza: limitado por la evidencia disponible; no es una probabilidad de éxito.',
    `Principal riesgo: ${report.limitations[0]??'Evidencia insuficiente.'}`,
    `Catalizador principal: ${report.scenarios[0]?.condition??'No identificado con respaldo suficiente.'}`,
    '¿Qué cambiaría el análisis?: nuevas fuentes, cambios en las cotizaciones fechadas o incumplimiento de las condiciones expuestas.',
    'Si tuviera que tomar una decisión hoy, mi estrategia sería: completar la evidencia y contrastar los escenarios antes de asumir una operación.'
  ].join('\n')};
}
