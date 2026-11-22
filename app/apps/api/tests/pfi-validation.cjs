/* Ejecuta servicios reales; repositorios, caché y HTTP externo son dobles.
   No conecta bases, no consulta proveedores ni modifica datos de usuarios. */
require('reflect-metadata');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const os = require('node:os');
const {PortfolioService} = require('../src/portfolio/portfolio.service');
const {AnalysisService} = require('../src/analysis/analysis.service');
const {ObservationsService} = require('../src/observations/observations.service');
const {SignalsService} = require('../src/signals/signals.service');
const {SIGNALS_SEED} = require('../src/signals/signals.seed');
const {AuthService} = require('../src/auth/auth.service');
const {AuthGuard} = require('../src/auth/auth.guard');
const {JwtService} = require('@nestjs/jwt');
const {Logger} = require('@nestjs/common');
Logger.overrideLogger(false);
const results=[];
function repo(initial=[]) {
 const rows=structuredClone(initial); let next=1;
 const match=(x,q)=>Object.entries(q).every(([k,v])=>x[k]===v);
 return {rows,create:x=>({...x}),find:async({where})=>rows.filter(x=>match(x,where)),
 findOneBy:async q=>rows.find(x=>match(x,q))??null,
 save:async x=>{if(!x.id){x.id=next++; rows.push(x);} return x;},
 delete:async q=>{let n=0;for(let i=rows.length-1;i>=0;i--)if(match(rows[i],q)){rows.splice(i,1);n++;}return {affected:n};}};
}
const catalog=[['A',10,'accion','Tecnología','EE.UU.'],['B',20,'etf','General','Global'],['C',5,'cripto','Digital','Global'],['E',10,'accion','Energía','Argentina']].map(([ticker,refPrice,assetClass,sector,region])=>({ticker,name:ticker,refPrice:String(refPrice),assetClass,sector,region,currency:'USD'}));
function fixture(){const positions=repo();positions.countBy=async q=>(await positions.find({where:q})).length;positions.manager={transaction:async f=>f({query:async()=>[],getRepository:()=>positions})};const p=new PortfolioService(positions,repo(catalog));return {p,positions,a:new AnalysisService(p)};}
function weighted(weights,classes=[]) {return weights.map((weight,i)=>({id:i+1,ticker:`T${i}`,name:`T${i}`,quantity:1,refPrice:weight*100,value:weight*100,weight,assetClass:classes[i]??'accion',sector:'General',region:'Global',currency:'USD'}));}
function analysis(weights,classes){return new AnalysisService({getPositions:async()=>weighted(weights,classes)}).analyze(1);}
async function observe(a){return new ObservationsService({analyze:async()=>a},{getSignals:async()=>structuredClone(SIGNALS_SEED)}).generate(1);}
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-6,`${a} != ${b}`);
const status=n=>e=>e.getStatus?.()===n;
async function test(id,requirement,title,fn){try{await fn();results.push({id,requirement,title,status:'PASS'});}catch(e){results.push({id,requirement,title,status:'FAIL',detail:e.message});}}
function cache(){let data=null;return {get:async()=>data,set:async(k,v,ttl)=>{assert.equal(ttl,900);data=v;}};}
async function main(){
await test('CP01','RF4/RNF2','Cartera vacía: métricas finitas y sin posición dominante',async()=>{const a=await fixture().a.analyze(1);assert.equal(a.totalValue,0);assert.equal(a.concentration.hhi,0);assert.equal(a.concentration.effectiveN,0);assert.equal(a.concentration.topPosition,null);assert.deepEqual(a.positions,[]);});
await test('CP02','RF4/RNF2','Una posición: HHI 10000 y número efectivo 1',async()=>{const {p,a}=fixture();await p.addPosition(1,'A',2);const x=await a.analyze(1);assert.equal(x.totalValue,20);assert.equal(x.positions[0].weight,1);assert.equal(x.concentration.hhi,10000);assert.equal(x.concentration.effectiveN,1);});
await test('CP03','RF3/RF4/RNF2','Valores 20/60/20: pesos, grupos, HHI 4400',async()=>{const {p,a}=fixture();await p.addPosition(1,'A',2);await p.addPosition(1,'B',3);await p.addPosition(1,'C',4);const x=await a.analyze(1);assert.equal(x.totalValue,100);x.positions.forEach((p,i)=>near(p.weight,[.2,.6,.2][i]));assert.equal(x.concentration.hhi,4400);assert.equal(x.concentration.effectiveN,2.3);near(x.composition.byRegion.find(x=>x.key==='Global').weight,.8);for(const g of Object.values(x.composition))near(g.reduce((s,x)=>s+x.weight,0),1);});
await test('CP04','RF4','Cuatro pesos iguales: HHI 2500 moderado',async()=>{const a=await analysis([.25,.25,.25,.25]);assert.equal(a.concentration.hhi,2500);assert.equal(a.concentration.hhiLevel,'moderada');assert.equal(a.concentration.effectiveN,4);});
await test('CP05','RF4','Diez pesos iguales: HHI 1000 bajo',async()=>{const a=await analysis(Array(10).fill(.1));assert.equal(a.concentration.hhi,1000);assert.equal(a.concentration.hhiLevel,'baja');});
await test('CP06','RF2','CRUD y acumulación del mismo ticker',async()=>{const {p}=fixture();const x=await p.addPosition(1,'A',2);await p.addPosition(1,'A',3);assert.equal((await p.getPositions(1))[0].quantity,5);await p.updatePosition(1,x.id,7);assert.equal((await p.getPositions(1))[0].quantity,7);await p.removePosition(1,x.id);assert.deepEqual(await p.getPositions(1),[]);});
await test('CP07','RF2','Ticker desconocido y cantidad no positiva rechazados',async()=>{const {p}=fixture();await assert.rejects(p.addPosition(1,'UNKNOWN',1),status(400));for(const q of [0,-1,NaN])await assert.rejects(p.addPosition(1,'A',q),status(400));});
await test('CP08','RNF4','Dos propietarios: lecturas y modificaciones aisladas en servicio',async()=>{const {p}=fixture();const x=await p.addPosition(1,'A',2);await p.addPosition(2,'A',3);assert.equal((await p.getPositions(2))[0].quantity,3);await assert.rejects(p.updatePosition(2,x.id,9),status(404));await assert.rejects(p.removePosition(2,x.id),status(404));assert.equal((await p.getPositions(1))[0].quantity,2);});
const jwt=new JwtService({secret:'solo-pruebas-pfi-no-produccion',signOptions:{expiresIn:'1h'}});
await test('CP09','RF1/RNF5','Registro normalizado, hash bcrypt y login',async()=>{const r=repo();const auth=new AuthService(r,jwt);const x=await auth.register(' TEST@example.com ','Test-pass-123',' Persona ',true);assert.equal(x.user.email,'test@example.com');assert.notEqual(r.rows[0].passwordHash,'Test-pass-123');assert.match(r.rows[0].passwordHash,/^\$2[aby]\$12\$/);assert.equal((await auth.login('test@example.com','Test-pass-123')).user.id,x.user.id);await assert.rejects(auth.login('test@example.com','wrong'),status(401));await assert.rejects(auth.register('test@example.com','Test-pass-123','Persona',true),status(409));});
await test('CP10','RNF4','Guard: sin token, inválido y vencido rechazados',async()=>{const guard=new AuthGuard(jwt, {getRepository:()=>({findOneBy:async()=>({tokenVersion:0})})});for(const token of [null,'invalid',await jwt.signAsync({sub:1},{expiresIn:-1})]){const req={headers:token?{authorization:`Bearer ${token}`}:{}};await assert.rejects(guard.canActivate({switchToHttp:()=>({getRequest:()=>req})}),status(401));}});
await test('CP11','RF1','Guard: token válido identifica al propietario',async()=>{const req={headers:{authorization:`Bearer ${await jwt.signAsync({sub:2,ver:0})}`}};assert.equal(await new AuthGuard(jwt, {getRepository:()=>({findOneBy:async()=>({tokenVersion:0})})}).canActivate({switchToHttp:()=>({getRequest:()=>req})}),true);assert.equal(req.user.sub,2);});
await test('CP12','RF6','Sin posiciones no se generan observaciones',async()=>assert.deepEqual((await observe(await analysis([]))).observaciones,[]));
await test('CP13','RF6','Umbral de posición: 25 % no dispara; 26 % dispara',async()=>{assert.ok(!(await observe(await analysis([.25,.25,.25,.25]))).observaciones.some(x=>x.id==='conc-top'));assert.ok((await observe(await analysis([.26,.24,.25,.25]))).observaciones.some(x=>x.id==='conc-top'));});
await test('CP14','RF6','Exposición cripto: límite 25 % y severidad sobre 40 %',async()=>{for(const [w,expected] of [[.25,null],[.4,'atencion'],[.41,'alerta']]){const x=(await observe(await analysis([w,1-w],['cripto','etf']))).observaciones.find(x=>x.id==='exp-cripto');assert.equal(x?.severidad??null,expected);}});
await test('CP15','RF8','No se generan rendimientos supuestos sin evidencia',async()=>{const x=await observe(await analysis([.5,.5],['accion','cripto']));assert.deepEqual(x.escenarios,[]);assert.deepEqual(x.escenariosConFuentes,[]);});
await test('CP16','RF6','Todas las observaciones generadas explicitan una regla',async()=>{const {p,a}=fixture();await p.addPosition(1,'A',4);await p.addPosition(1,'C',10);await p.addPosition(1,'E',1);const x=await observe(await a.analyze(1));const missing=x.observaciones.filter(x=>!x.evidencia.some(e=>e.tipo==='regla')).map(x=>x.id);assert.deepEqual(missing,[],`Observaciones sin evidencia de regla: ${missing.join(', ')}`);});
const originalFetch=global.fetch;
try {
await test('CP17','RF5/RNF7','Fallo total de proveedores conserva datos locales',async()=>{global.fetch=async()=>{throw Error('fallo simulado')};assert.deepEqual(await new SignalsService(cache()).getSignals(),SIGNALS_SEED);});
await test('CP18','RF5','Éxito de ambos proveedores actualiza dos métricas cripto',async()=>{global.fetch=async url=>({ok:true,json:async()=>url.includes('alternative')?{data:[{value:'22',value_classification:'Extreme Fear'}]}:{data:{market_cap_percentage:{btc:61.25}}}});const x=await new SignalsService(cache()).getSignals();assert.equal(x.emerging.fearGreedIndex,22);assert.equal(x.emerging.fearGreedLabel,'Miedo extremo');assert.equal(x.emerging.btcDominance,61.3);});
await test('CP19','RF5/RNF7','Fallo parcial no debe etiquetar todo el conjunto como en vivo',async()=>{global.fetch=async url=>{if(url.includes('coingecko'))throw Error('fallo simulado');return {ok:true,json:async()=>({data:[{value:'22',value_classification:'Fear'}]})};};const x=await new SignalsService(cache()).getSignals();assert.deepEqual(x.geo,SIGNALS_SEED.geo);assert.notEqual(x.origen,'en vivo','GPR, eventos y dominancia siguen locales pero el origen global es en vivo');});
await test('CP20','RF5/RNF7','Fear & Greed fuera de 0–100 debe descartarse',async()=>{global.fetch=async url=>{if(url.includes('coingecko'))throw Error('fallo simulado');return {ok:true,json:async()=>({data:[{value:'999',value_classification:'Fear'}]})};};const x=await new SignalsService(cache()).getSignals();assert.equal(x.emerging.fearGreedIndex,SIGNALS_SEED.emerging.fearGreedIndex,'Se acepta 999 sin validar el rango');});
await test('CP21','RNF7','Segunda consulta usa caché sin nuevas llamadas externas',async()=>{let calls=0;global.fetch=async()=>{calls++;throw Error('fallo simulado')};const s=new SignalsService(cache());const a=await s.getSignals();assert.deepEqual(await s.getSignals(),a);assert.equal(calls,2);});
}finally{global.fetch=originalFetch;}
const sources=['portfolio/portfolio.service','analysis/analysis.service','observations/observations.service','signals/signals.service','signals/signals.seed','auth/auth.service','auth/auth.guard'].map(x=>`src/${x}.ts`);
const report={executedAt:new Date().toISOString(),node:process.version,platform:process.platform,arch:process.arch,os:os.release(),scope:'Servicios reales con repositorios, caché y fetch simulados; sin HTTP, PostgreSQL, Redis ni interfaz.',sourceSha256:Object.fromEntries(sources.map(x=>[x,crypto.createHash('sha256').update(fs.readFileSync(x)).digest('hex')])),total:results.length,passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,results};
fs.writeFileSync('evidence/production-regression-services.json',JSON.stringify(report,null,2)+'\n');
for(const x of results)console.log(`${x.status} ${x.id} ${x.title}${x.detail?' — '+x.detail:''}`);
console.log(`TOTAL ${report.total}: ${report.passed} PASS, ${report.failed} FAIL`);
process.exitCode=report.failed?1:0;
}
main().catch(e=>{console.error(e);process.exitCode=2});
