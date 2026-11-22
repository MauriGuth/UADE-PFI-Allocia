"use client";
import { CONCENTRATION_GLOSSARY } from "@/lib/concentration";

// Ayuda contextual: cada entrada se muestra solo si alguno de sus términos aparece en el texto.
const terms: { match: string[]; definition: string }[] = [
  { match: ["RSI"], definition: "RSI: compara la fuerza de las subas y bajas recientes. Por sí solo no predice el próximo movimiento." },
  { match: ["SMA"], definition: "SMA: es el precio promedio de varios días. El número indica cuántos días se consideran." },
  { match: ["MACD"], definition: "MACD: compara promedios de precios para observar cambios de tendencia. No garantiza una suba o baja." },
  { match: ["volatilidad"], definition: "Volatilidad: cuánto varía el precio. Una variación mayor implica más incertidumbre, no una ganancia asegurada." },
  { match: ["HHI", "concentración", "concentracion"], definition: CONCENTRATION_GLOSSARY },
];
export function AnalysisSummary({text}:{text:string}) {
 const lower=text.toLowerCase();
 const definitions=terms.filter(({match})=>match.some(term=>lower.includes(term.toLowerCase())));
 return <section className="space-y-3 rounded-xl bg-low p-4">
   <h3 className="font-semibold">En pocas palabras</h3><p className="max-w-prose whitespace-pre-line text-base leading-7">{text}</p>
   {definitions.length>0 && <details><summary className="text-sm font-semibold text-secondary">¿Qué significan estos términos?</summary><ul className="space-y-3 text-base leading-6 text-soft">{definitions.map(({match,definition})=><li key={match[0]}>{definition}</li>)}</ul></details>}
 </section>;
}
