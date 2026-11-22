require('ts-node/register');
const {test}=require('node:test');const assert=require('node:assert/strict');
const {spanishSignals,splitPublisher}=require('../src/signals/signals.spanish');
const snapshot={geo:{eventos:[{titulo:'Markets fall',descripcion:'Stocks fell today',fuente:'https://example.com',sectores:[],regiones:[],impacto:'no evaluado'}]},emerging:{predictionMarkets:[{pregunta:'Will rates fall?',probabilidad:0.4,fuente:'https://example.com/market'}]}};
const memory=()=>{const saved=new Map();return {get:async k=>saved.get(k)??null,set:async(k,v)=>{saved.set(k,v)}};};
const quiet=()=>{};
process.env.ANTHROPIC_API_KEY='test';process.env.ANTHROPIC_MODEL='test';
test('Spanish translation preserves sources and probabilities, caches per item and does not mutate original',async()=>{
let calls=0;const cache=memory();
const generate=async()=>{calls++;return {output:{items:[{id:'news-0',title:'Caen los mercados',description:'Las acciones bajaron hoy'},{id:'market-0',title:'¿Bajarán las tasas?',description:''}]}}};
const result=await spanishSignals(snapshot,cache,generate,quiet);
assert.equal(result.geo.eventos[0].titulo,'Caen los mercados');assert.equal(result.geo.eventos[0].traducido,true);assert.equal(result.geo.eventos[0].fuente,snapshot.geo.eventos[0].fuente);
assert.equal(result.emerging.predictionMarkets[0].pregunta,'¿Bajarán las tasas?');assert.equal(result.emerging.predictionMarkets[0].probabilidad,0.4);
assert.equal(snapshot.geo.eventos[0].titulo,'Markets fall');
await spanishSignals(snapshot,cache,generate,quiet);assert.equal(calls,1);
});
test('Provider failure keeps the original text (never a placeholder) and keeps the market with its condition',async()=>{
const logs=[];const result=await spanishSignals(snapshot,memory(),async()=>{throw Error('down')},m=>logs.push(m));
assert.equal(result.geo.eventos[0].titulo,'Markets fall');assert.equal(result.geo.eventos[0].descripcion,'Stocks fell today');assert.equal(result.geo.eventos[0].traducido,false);
assert.equal(result.emerging.predictionMarkets[0].pregunta,'Will rates fall?');assert.equal(result.emerging.predictionMarkets[0].traducido,false);
assert.ok(logs.some(l=>/down/.test(l)));
});
test('After a failure the provider is not called again until the cool-down ends',async()=>{
let calls=0;const cache=memory();const generate=async()=>{calls++;throw Error('down')};
await spanishSignals(snapshot,cache,generate,quiet);await spanishSignals(snapshot,cache,generate,quiet);assert.equal(calls,1);
});
test('Unknown IDs are ignored and valid items are still used (partial translation)',async()=>{
const two={...snapshot,geo:{eventos:[snapshot.geo.eventos[0],{...snapshot.geo.eventos[0],titulo:'Oil rises',descripcion:'Crude went up'}]}};
const result=await spanishSignals(two,memory(),async()=>({output:{items:[{id:'fake',title:'Inventado',description:''},{id:'news-1',title:'Sube el petróleo',description:'El crudo subió'}]}}),quiet);
assert.equal(result.geo.eventos[0].titulo,'Markets fall');assert.equal(result.geo.eventos[0].traducido,false);
assert.equal(result.geo.eventos[1].titulo,'Sube el petróleo');assert.equal(result.geo.eventos[1].traducido,true);
});
test('A long translated description no longer invalidates the whole batch',async()=>{
const result=await spanishSignals(snapshot,memory(),async()=>({output:{items:[{id:'news-0',title:'Caen los mercados',description:'x'.repeat(2000)},{id:'market-0',title:'¿Bajarán?',description:''}]}}),quiet);
assert.equal(result.geo.eventos[0].titulo,'Caen los mercados');assert.ok(result.geo.eventos[0].descripcion.length<=702);
});
test('Publisher suffix of aggregator headlines is split off and reported as medio',async()=>{
assert.deepEqual(splitPublisher('Stocks slide as AI trade unwinds - Reuters'),{title:'Stocks slide as AI trade unwinds',publisher:'Reuters'});
assert.deepEqual(splitPublisher('Plain headline'),{title:'Plain headline',publisher:null});
const s={geo:{eventos:[{titulo:'Stocks slide as AI trade unwinds - Reuters',descripcion:'d',fuente:'2026 · https://news.google.com/x',sectores:[],regiones:[],impacto:'no evaluado',medio:'Google News'}]},emerging:{predictionMarkets:[]}};
const r=await spanishSignals(s,memory(),async()=>{throw Error('down')},quiet);
assert.equal(r.geo.eventos[0].medio,'Reuters');assert.equal(r.geo.eventos[0].titulo,'Stocks slide as AI trade unwinds');
const g={geo:{eventos:[{...s.geo.eventos[0],titulo:'Plain headline here'}]},emerging:{predictionMarkets:[]}};
const r2=await spanishSignals(g,memory(),async()=>{throw Error('down')},quiet);assert.equal(r2.geo.eventos[0].medio,undefined);
});
