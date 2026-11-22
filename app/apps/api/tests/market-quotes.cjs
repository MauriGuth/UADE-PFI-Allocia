const {test}=require('node:test');
const assert=require('node:assert/strict');
const {MarketFeed}=require('../dist/market/feed');
const {validateGrounding}=require('../dist/market/analyzer');
const asset=i=>({ticker:'TEST'+i,name:'Test',kind:'equity',currency:'USD',providerSymbol:'TEST'+i,region:'US',exchange:'XNYS_XNAS'});
test('concurrent callers share public quotes without changing provider timestamps; expired cache never masks failure',async()=>{
 const oldFetch=global.fetch,oldKey=process.env.FINNHUB_API_KEY,oldNow=Date.now;
 let now=oldNow(),calls=0;Date.now=()=>now;process.env.FINNHUB_API_KEY='synthetic';
 const stamp=Math.floor(now/1000)-3600;
 try{
  global.fetch=async()=>{calls++;return new Response(JSON.stringify({c:12,t:stamp}));};
  const quotes=await Promise.all([new MarketFeed().quote(asset('CACHE')),new MarketFeed().quote(asset('CACHE'))]);
  assert.equal(calls,1);assert.equal(quotes[0].asOf,new Date(stamp*1000).toISOString());
  assert.equal((await new MarketFeed().quote(asset('CACHE'))).price,12);assert.equal(calls,1);
  now+=31000;global.fetch=async()=>{calls++;return new Response('',{status:429});};
  assert.equal(await new MarketFeed().quote(asset('CACHE')),null);assert.equal(calls,2);
 }finally{global.fetch=oldFetch;Date.now=oldNow;if(oldKey===undefined)delete process.env.FINNHUB_API_KEY;else process.env.FINNHUB_API_KEY=oldKey;}
});
test('portfolio quote requests have bounded concurrency and preserve missing results',async()=>{
 const feed=new MarketFeed();let active=0,max=0;
 feed.quote=async a=>{active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,5));active--;return a.ticker==='TEST3'?null:{price:1,asOf:new Date().toISOString(),currency:'USD',source:'test'};};
 const result=await feed.quotes(Array.from({length:10},(_,i)=>asset(i)));
 assert.equal(result.size,10);assert.equal(result.get('TEST3'),null);assert.ok(max<=4);assert.ok(max>1);
});
test('analysis always discloses unavailable master-prompt inputs and old quote dates',()=>{
 const now=Date.now(),s={asset:asset('AI'),quote:{price:1,currency:'USD',source:'test',asOf:new Date(now-3600000).toISOString()},sources:[{id:'s',title:'Una noticia verificada',text:'Contenido de prueba',url:'https://example.com',publishedAt:new Date(now).toISOString(),fetchedAt:new Date(now).toISOString(),scope:'asset'}],missing:[],fetchedAt:new Date(now).toISOString()};
 const r=validateGrounding({status:'analysis',summary:'Escenarios',facts:[{sourceId:'s',excerpt:'Una noticia verificada'}],scenarios:[{direction:'neutral',condition:'Si persiste',explanation:'Se mantiene',sourceIds:['s']}],limitations:['Cobertura limitada']},s);
 assert.ok(r.limitations.some(x=>x.includes('historial completo y verificado')));assert.ok(r.limitations.some(x=>x.includes('datos financieros')));assert.ok(r.limitations.some(x=>x.includes('no un precio en tiempo real')));
});
