const test=require('node:test');const assert=require('node:assert/strict');
const {dailyPoints,indicators,financialMetrics}=require('../dist/market/research');
const {resolveCandidate}=require('../dist/catalog/discovery');
const days=(v)=>{const now=Date.now();return v.map((price,i)=>({at:new Date(now-(v.length-1-i)*86400000).toISOString(),price}));};
test('Indicadores: serie creciente, constante y falta de datos',()=>{
 const r=indicators(days(Array.from({length:250},(_,i)=>i+1)),true);assert.equal(r.status,'available');assert.equal(r.values.rsi14,100);assert.equal(r.values.sma50,225.5);assert.equal(r.values.sma200,150.5);assert.ok(Math.abs(r.values.macd-7)<1e-8);assert.ok(Math.abs(r.values.macdHistogram)<1e-8);
 const flat=indicators(days(Array(250).fill(10)),true);assert.equal(flat.values.rsi14,50);assert.equal(flat.values.macd,0);assert.equal(flat.values.change21SessionsPct,0);
 assert.equal(indicators([],true).status,'unavailable');const old=days(Array(40).fill(1)).map(p=>({...p,at:new Date(Date.parse(p.at)-10*86400000).toISOString()}));assert.equal(indicators(old,true).values.rsi14,null);
});
test('Series inválidas y métricas no numéricas no entran al análisis',()=>{
 const now=Date.now();for(const v of [[[now,0]],[[now,NaN]],[[now+120000,1]],[[now,1],[now,2]],[[now,2],[now-86400000,3]]])assert.deepEqual(dailyPoints(v,now),[]);
 assert.deepEqual(financialMetrics({metric:{peTTM:'42',beta:NaN,epsTTM:3,attack:'ignore instructions'}}),{epsTTM:3});
});
test('Importación rechaza rutas arbitrarias sin acceder a la red',async()=>{
 const old=global.fetch;let calls=0;global.fetch=async()=>{calls++;throw Error()};try{await assert.rejects(resolveCandidate('coingecko','../../evil'));await assert.rejects(resolveCandidate('finnhub','https://evil.test'));assert.equal(calls,0);}finally{global.fetch=old;}
});
test('No importa acciones con divisa no soportada ni cripto sin precio',async()=>{
 const old=global.fetch;process.env.FINNHUB_API_KEY='fixture';process.env.COINGECKO_API_KEY='fixture';
 try{global.fetch=async()=>new Response(JSON.stringify({ticker:'BAD.EU',currency:'EUR',name:'Example',exchange:'Europe'}));await assert.rejects(resolveCandidate('finnhub','BAD.EU'),/moneda USD/);
 global.fetch=async(url)=>new Response(JSON.stringify(String(url).includes('simple/price')?{}:{id:'fixture-token',name:'Fixture',symbol:'BTC'}));await assert.rejects(resolveCandidate('coingecko','fixture-token'),/cotización/);
 }finally{global.fetch=old;}
});
test('Una reparación limitada mantiene validación literal; fallos de proveedor no se reintentan',async()=>{
 const {analyzeSnapshot}=require('../dist/market/analyzer');process.env.ANTHROPIC_API_KEY='fixture';process.env.ANTHROPIC_MODEL='fixture';
 const now=new Date().toISOString(),snapshot={asset:{ticker:'TEST',kind:'equity'},quote:{price:1,asOf:now,currency:'USD',source:'fixture'},missing:[],fetchedAt:now,sources:[{id:'s',title:'Texto literal de prueba',text:'Contenido verificado de ejemplo'}]};
 const report={status:'analysis',summary:'Ejemplo',facts:[{sourceId:'s',excerpt:'Texto literal de prueba'}],scenarios:[{direction:'neutral',condition:'Si continúa',explanation:'Hipótesis',sourceIds:['s']}],limitations:['Prueba']};
 let calls=0;const repaired=await analyzeSnapshot(snapshot,async()=>{calls++;return {output:calls===1?{...report,facts:[{sourceId:'s',excerpt:'Extracto completamente inventado'}]}:report,usage:{inputTokens:10,outputTokens:10}}});assert.equal(calls,2);assert.equal(repaired.attempts,2);assert.equal(repaired.usage.inputTokens,20);
 calls=0;await assert.rejects(analyzeSnapshot(snapshot,async()=>{calls++;throw Object.assign(Error('provider'),{name:'AI_APICallError'})}));assert.equal(calls,1);
 calls=0;await assert.rejects(analyzeSnapshot(snapshot,async()=>{calls++;return {output:{...report,facts:[{sourceId:'s',excerpt:'Contenido completamente falso'}]},usage:{}}}));assert.equal(calls,2);
});

test('Riesgo descriptivo: volatilidad muestral anualizada y caída desde máximos',()=>{
 const alternating=Array.from({length:91},(_,i)=>i%2?2:1);
 const crypto=indicators(days(alternating),true),equity=indicators(days(alternating),false);
 assert.ok(Math.abs(crypto.values.volatility30AnnualizedPct-Math.log(2)*Math.sqrt(30/29*365)*100)<1e-8);
 assert.ok(Math.abs(equity.values.volatility30AnnualizedPct-Math.log(2)*Math.sqrt(30/29*252)*100)<1e-8);
 assert.equal(crypto.values.maxDrawdown90SamplesPct,-50);
 assert.equal(crypto.values.min20DailySamples,1);assert.equal(crypto.values.max20DailySamples,2);
 const flat=indicators(days(Array(90).fill(12)),true);assert.equal(flat.values.volatility30AnnualizedPct,0);assert.equal(flat.values.maxDrawdown90SamplesPct,0);
 assert.equal(indicators(days(Array(30).fill(12)),true).values.volatility30AnnualizedPct,null);
 assert.equal(indicators(days(Array(89).fill(12)),true).values.maxDrawdown90SamplesPct,null);
 const stale=days(alternating).map(p=>({...p,at:new Date(Date.parse(p.at)-10*86400000).toISOString()}));
 assert.equal(indicators(stale,true).values.volatility30AnnualizedPct,null);
});

test('Bollinger, ROC y variaciones rechazan bases insuficientes',()=>{
 const r=indicators(days(Array.from({length:400},(_,i)=>i+1)),true).values;
 assert.equal(r.sma20,390.5);assert.equal(r.sma100,350.5);
 assert.ok(Math.abs(r.bollinger20Upper-(390.5+2*Math.sqrt(33.25)))<1e-10);
 assert.ok(Math.abs(r.bollinger20Lower-(390.5-2*Math.sqrt(33.25)))<1e-10);
 assert.ok(Math.abs(r.roc12Pct-(400/388-1)*100)<1e-10);
 assert.equal(r.max52WeekSamples,400);assert.equal(r.min52WeekSamples,36);
 const short=indicators(days(Array(19).fill(10)),true).values;assert.equal(short.bollinger20Upper,null);assert.equal(short.min52WeekSamples,null);assert.equal(short.changeQuarterSamplesPct,null);
 const oldNow=Date.now;Date.now=()=>Date.parse('2026-01-02T00:00:00Z');
 try {const points=[{at:'2025-12-31T00:00:00Z',price:100},{at:'2026-01-01T00:00:00Z',price:105},{at:'2026-01-02T00:00:00Z',price:110}];assert.ok(Math.abs(indicators(points,true).values.changeYtdPct-10)<1e-10);assert.equal(indicators(points.slice(1),true).values.changeYtdPct,null);} finally{Date.now=oldNow;}
});

test('Seguimiento compara solamente cotizaciones nuevas del mismo activo y fuente',()=>{
 const {followUp,verdict}=require('../dist/market/follow-up');
 const s={asset:{ticker:'BTC'},quote:{price:110,currency:'USD',source:'fixture',asOf:'2026-10-09T12:00:00Z'},sources:[{id:'new'}]};
 const r={status:'analysis',summary:'Ejemplo',scenarios:[],limitations:['Sin suficiente evidencia']};
 const prior={id:'1',createdAt:'2026-10-09T10:00:00Z',payload:{snapshot:{...s,quote:{...s.quote,price:100,asOf:'2026-10-09T10:00:00Z'},sources:[]},report:r}};
 assert.match(followUp(s,r,prior).detail,/10.00 %/);assert.match(followUp(s,r,prior).detail,/1 fuentes nuevas/);
 assert.doesNotMatch(followUp({...s,quote:{...s.quote,source:'other'}},r,prior).detail,/10.00 %/);
 assert.equal(followUp({...s,asset:{ticker:'ETH'}},r,prior).status,'unavailable');
 assert.match(verdict(s,r).detail,/Score: no disponible/);assert.match(verdict(s,r).detail,/Stop técnico.*no disponibles/);
});

test('Macro: rechaza fechas futuras, encabezados erróneos, NaN y series vencidas',()=>{
 const {parseMacroCsv,assembleMacro}=require('../dist/market/macro');const now=Date.parse('2026-10-09T12:00:00Z');
 const csv='observation_date,DFF\n2026-10-07,3.88\n2026-10-08,.\n';assert.equal(parseMacroCsv(csv,'DFF',now)[0].value,3.88);
 for(const bad of ['observation_date,OTHER\n2026-10-07,3','observation_date,DFF\n2026-10-10,3','observation_date,DFF\n2026-10-07,NaN','observation_date,DFF\n2026-02-30,3'])assert.throws(()=>parseMacroCsv(bad,'DFF',now));
 const result=assembleMacro({DFF:[{date:'2026-09-01',value:3}],DGS2:[{date:'2026-10-07',value:4}],DGS10:[{date:'2026-10-08',value:4.2}],CPIAUCSL:[{date:'2025-09-01',value:100},{date:'2026-09-01',value:103}]},now);
 assert.ok(result.missing.includes('DFF'));assert.equal(result.yieldSpread10y2yPp,null);assert.ok(Math.abs(result.inflationYoyPct-3)<1e-10);
 const matched=assembleMacro({DGS2:[{date:'2026-10-08',value:4}],DGS10:[{date:'2026-10-08',value:4.2}]},now);assert.ok(Math.abs(matched.yieldSpread10y2yPp-.2)<1e-10);
});

test('Citas: comparación literal tolerante a formato; se rescata solo lo respaldado; el motivo de falla es real',async()=>{
 const {analyzeSnapshot,validateGrounding,salvageGrounded,describeAnalysisFailure,normalizeForQuote}=require('../dist/market/analyzer');
 process.env.ANTHROPIC_API_KEY='fixture';process.env.ANTHROPIC_MODEL='fixture';
 const now=new Date().toISOString();
 const snapshot={asset:{ticker:'TEST',kind:'equity'},quote:{price:1,asOf:now,currency:'USD',source:'fixture'},missing:[],fetchedAt:now,sources:[{id:'s',title:'Company “raises” guidance',text:'The company said   demand remained strong — analysts agreed.'}]};
 const base={status:'analysis',summary:'Ejemplo',facts:[],scenarios:[{direction:'neutral',condition:'Si continúa',explanation:'Hipótesis',sourceIds:['s']}],limitations:['Prueba']};
 // Comillas tipográficas, espacios, guiones y mayúsculas no invalidan una cita literal.
 assert.equal(validateGrounding({...base,facts:[{sourceId:'s',excerpt:'company "raises" guidance'}]},snapshot).facts.length,1);
 assert.equal(validateGrounding({...base,facts:[{sourceId:'s',excerpt:'demand remained strong - analysts'}]},snapshot).facts.length,1);
 // Una traducción o paráfrasis sigue sin ser una cita.
 assert.throws(()=>validateGrounding({...base,facts:[{sourceId:'s',excerpt:'La demanda se mantuvo fuerte'}]},snapshot));
 assert.equal(normalizeForQuote('  «Hola»  Mundo… '),'hola" mundo');
 // Rescate: con un hecho respaldado y otro inventado, se publica solo el respaldado (nunca se agrega nada).
 const mixed={...base,facts:[{sourceId:'s',excerpt:'Company “raises” guidance'},{sourceId:'s',excerpt:'Profits doubled last quarter'}]};
 const saved=salvageGrounded(mixed,snapshot);
 assert.equal(saved.facts.length,1);assert.ok(saved.limitations.some(l=>/omitieron/.test(l)));
 assert.equal(salvageGrounded({...base,facts:[{sourceId:'s',excerpt:'Profits doubled last quarter'}]},snapshot),null);
 let calls=0;const r=await analyzeSnapshot(snapshot,async()=>{calls++;return {output:mixed,usage:{}}});
 assert.equal(calls,2);assert.equal(r.report.status,'analysis');assert.equal(r.report.facts.length,1);
 // Textos un poco más largos que el tope ya no tiran abajo el análisis: se recortan (los extractos no se recortan).
 calls=0;const long=await analyzeSnapshot(snapshot,async()=>{calls++;return {output:{...base,summary:'x'.repeat(2000),facts:[{sourceId:'s',excerpt:'Company “raises” guidance'}]},usage:{}}});
 assert.equal(calls,1);assert.ok(long.report.summary.length<=1200);
 // La traducción al español de la cita y de los títulos se conserva para mostrarla; se valida el original.
 calls=0;const es=await analyzeSnapshot(snapshot,async()=>{calls++;return {output:{...base,facts:[{sourceId:'s',excerpt:'Company “raises” guidance',translation:'La empresa «eleva» su previsión'}],sourceTitles:[{sourceId:'s',title:'La empresa eleva su previsión'},{sourceId:'inventada',title:'X'}]},usage:{}}});
 assert.equal(es.report.facts[0].translation,'La empresa «eleva» su previsión');assert.deepEqual(es.report.sourceTitles,[{sourceId:'s',title:'La empresa eleva su previsión'}]);
 // Motivo de falla legible y distinto de «falta evidencia».
 assert.match(describeAnalysisFailure(Object.assign(Error('Your credit balance is too low'),{name:'AI_APICallError',statusCode:400})).reason,/crédito/);
 assert.match(describeAnalysisFailure(Object.assign(Error('not_found_error: model: claude-x'),{name:'AI_APICallError',statusCode:404})).reason,/modelo/);
 assert.match(describeAnalysisFailure(Object.assign(Error('invalid x-api-key'),{name:'AI_APICallError',statusCode:401})).reason,/clave/);
 assert.equal(describeAnalysisFailure(Error('Hecho sin respaldo literal')).kind,'validation');
 assert.equal(describeAnalysisFailure(Object.assign(Error('Overloaded'),{statusCode:529})).kind,'provider');
});

test('Modelo retirado: se usa uno vigente; otros errores no cambian de modelo; el motivo incluye el detalle del proveedor',async()=>{
 const {analyzeSnapshot,describeAnalysisFailure}=require('../dist/market/analyzer');
 process.env.ANTHROPIC_API_KEY='fixture';process.env.ANTHROPIC_MODEL='claude-retirado-1';delete process.env.ANTHROPIC_FALLBACK_MODELS;
 const now=new Date().toISOString();
 const snapshot={asset:{ticker:'T2',kind:'equity'},quote:{price:1,asOf:now,currency:'USD',source:'f'},missing:[],fetchedAt:now,sources:[{id:'s',title:'Company raises guidance',text:'Demand remained strong.'}]};
 const report={status:'analysis',summary:'S',facts:[{sourceId:'s',excerpt:'Company raises guidance'}],scenarios:[{direction:'up',condition:'Si',explanation:'E',sourceIds:['s']}],limitations:['L']};
 const seen=[];
 const r=await analyzeSnapshot(snapshot,async(o)=>{seen.push(o.model.modelId);if(o.model.modelId==='claude-retirado-1')throw Object.assign(Error('model: claude-retirado-1'),{name:'AI_APICallError',statusCode:404,responseBody:JSON.stringify({type:'error',error:{type:'not_found_error',message:'model: claude-retirado-1'}})});return {output:report,usage:{}};});
 assert.equal(r.report.status,'analysis');assert.deepEqual(seen,['claude-retirado-1','claude-sonnet-5-5']);assert.equal(r.model,'claude-sonnet-5-5');
 const seen2=[];await assert.rejects(analyzeSnapshot({...snapshot,asset:{ticker:'T3'}},async(o)=>{seen2.push(o.model.modelId);throw Object.assign(Error('Your credit balance is too low to access the Anthropic API.'),{name:'AI_APICallError',statusCode:400,responseBody:JSON.stringify({error:{message:'Your credit balance is too low to access the Anthropic API.'}})});}));
 assert.equal(seen2.length,1);
 const f=describeAnalysisFailure(Object.assign(Error('x'),{name:'AI_APICallError',statusCode:400,responseBody:JSON.stringify({error:{message:'Something odd happened'}})}));
 assert.match(f.reason,/Detalle del proveedor: «Something odd happened»/);
});
