require('reflect-metadata');
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {Client}=require('pg');
const {DataSource}=require('typeorm');
const {encryptQuantity,decryptQuantity}=require('../dist/security/crypto');
const {validateGrounding,analyzeSnapshot,DATA_LIMITATIONS}=require('../dist/market/analyzer');
const {normalizeNews}=require('../dist/market/feed');
const {dueSlots}=require('../dist/market/config');
const {tick,dispatchPush}=require('../dist/market/worker');
const base=process.env.API_TEST_URL??'http://127.0.0.1:41873',password='Security-only-1234',results=[];
const redis=new (require('ioredis'))(process.env.TEST_REDIS_URL??'redis://127.0.0.1:6387/2');
const database=process.env.TEST_DB_NAME??'allocia_production_validation_20261008';
if(!database.startsWith('allocia_') || process.env.NODE_ENV==='production' || process.env.DATABASE_URL) throw new Error('Sólo se permiten bases aisladas locales para estas pruebas');
const db=new Client({host:'localhost',database,user:process.env.DB_USER??process.env.USER,password:process.env.DB_PASS});
const orm=new DataSource({type:'postgres',host:'localhost',database,username:process.env.DB_USER??process.env.USER,password:process.env.DB_PASS});
async function req(url,method='GET',body,token,headers={}){const r=await fetch(base+url,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`} : {}),...headers},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,headers:r.headers,body:await r.json()};}
async function test(id,title,fn){try{await fn();results.push({id,title,status:'PASS'});}catch(e){results.push({id,title,status:'FAIL',detail:e.message});}}
async function main(){for(const k of await redis.keys("rate:*")) await redis.del(k);await db.connect();await orm.initialize();const tag=Date.now();let a,b,cookie,pos;
await test('SEC01','Contraseña breve y falta de consentimiento rechazadas; dos cuentas registradas',async()=>{assert.equal((await req('/auth/register','POST',{name:'Test',email:`short-${tag}@example.test`,password:'short',privacyAccepted:true})).status,400);assert.equal((await req('/auth/register','POST',{name:'Test',email:`consent-${tag}@example.test`,password,privacyAccepted:false})).status,400);a=(await req('/auth/register','POST',{name:'Test A',email:`sec-a-${tag}@example.test`,password,privacyAccepted:true})).body;b=(await req('/auth/register','POST',{name:'Test B',email:`sec-b-${tag}@example.test`,password,privacyAccepted:true})).body;assert.ok(a.token&&b.token);const claims=JSON.parse(Buffer.from(a.token.split('.')[1],'base64url').toString());assert.equal(claims.exp-claims.iat,7*24*3600);});
await test('SEC02','Cookie HttpOnly SameSite sin token en JSON para navegador',async()=>{const r=await req('/auth/login','POST',{email:a.user.email,password},null,{'X-Allocia-Client':'browser',Origin:'http://localhost:3010'});assert.equal(r.status,201);assert.equal(r.body.token,undefined);cookie=r.headers.get('set-cookie').split(';')[0];assert.match(r.headers.get('set-cookie'),/HttpOnly/);assert.match(r.headers.get('set-cookie'),/SameSite=Strict/);assert.equal((await req('/auth/me','GET',undefined,null,{Cookie:cookie})).status,200);});
await test('SEC03','CSRF: mutaciones sin Origin y con origen ajeno rechazadas',async()=>{for(const origin of [undefined,'https://evil.example']){const r=await req('/portfolio/positions','POST',{ticker:'AAPL',quantity:2},null,{Cookie:cookie,...(origin?{Origin:origin}:{})});assert.equal(r.status,403);}});
await test('SEC04','Cantidades cifradas y autenticadas en PostgreSQL',async()=>{const r=await req('/portfolio/positions','POST',{ticker:'AAPL',quantity:2.12345678},a.token);assert.equal(r.status,201);pos=r.body.id;const {quantity}= (await db.query('SELECT quantity FROM positions WHERE id=$1',[pos])).rows[0];assert.match(quantity,/^v1:/);assert.equal(decryptQuantity(quantity),'2.12345678');assert.notEqual(encryptQuantity('2'),encryptQuantity('2'));const parts=quantity.split(':');parts[2]=Buffer.alloc(16).toString('base64');assert.throws(()=>decryptQuantity(parts.join(':')));});
await test('SEC05','Aislamiento de propietario: cartera, edición y baja',async()=>{assert.equal((await req('/portfolio','GET',undefined,b.token)).body.positions.length,0);assert.equal((await req(`/portfolio/positions/${pos}`,'PATCH',{quantity:100},b.token)).status,404);assert.equal((await req(`/portfolio/positions/${pos}`,'DELETE',undefined,b.token)).status,404);});
await test('SEC06','Acumulaciones concurrentes no pierden actualizaciones',async()=>{const responses=await Promise.all(Array.from({length:8},()=>req('/portfolio/positions','POST',{ticker:'AAPL',quantity:1},a.token)));responses.forEach(r=>assert.equal(r.status,201));const positions=(await req('/portfolio','GET',undefined,a.token)).body.positions;assert.equal(positions.length,1);assert.equal(positions[0].quantity,10.12345678);});
await test('SEC07','Campos extra, precisión y cantidades enormes rechazados',async()=>{for(const body of [{ticker:'AAPL',quantity:1,userId:b.user.id},{ticker:'AAPL',quantity:1e10},{ticker:'AAPL',quantity:0.000000001}])assert.equal((await req('/portfolio/positions','POST',body,a.token)).status,400);});
await test('SEC08','Logout revoca Bearer y cookie emitidos anteriormente',async()=>{assert.equal((await req('/auth/logout','POST',{},a.token)).status,201);assert.equal((await req('/auth/me','GET',undefined,a.token)).status,401);assert.equal((await req('/auth/me','GET',undefined,null,{Cookie:cookie})).status,401);a=(await req('/auth/login','POST',{email:a.user.email,password})).body;});
await test('SEC09','Cabeceras de seguridad y privacidad presentes',async()=>{const r=await req('/auth/me','GET',undefined,a.token);assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.ok(r.headers.get('x-request-id'));});
const now=new Date(),source={id:'verified-source',title:'Company announces a new factory',text:'The company announced a new factory and stated that financing remains subject to approval.',url:'https://example.test/news',publishedAt:now.toISOString(),fetchedAt:now.toISOString(),scope:'asset'};
const snapshot={asset:{ticker:'AAPL',name:'Synthetic test',region:'test',exchange:'TEST',providerSymbol:'AAPL',kind:'equity',currency:'USD'},quote:{price:100,currency:'USD',asOf:now.toISOString(),source:'Synthetic fixture'},sources:[source],missing:[],fetchedAt:now.toISOString()};
const report={status:'analysis',summary:'Escenario sintético condicionado a financiación.',facts:[{sourceId:source.id,excerpt:'The company announced a new factory'}],scenarios:[{direction:'up',condition:'Si se obtiene financiación.',explanation:'Hipótesis de expansión; no certeza.',sourceIds:[source.id]}],limitations:['Caso sintético, no es información de mercado.']};
await test('AI01','Citas inexistentes, inventadas y análisis incompletos rechazados',async()=>{assert.deepEqual(validateGrounding(report,snapshot),{...report,limitations:[...DATA_LIMITATIONS,...report.limitations]});for(const invalid of [{...report,facts:[{sourceId:'invented',excerpt:'The company announced a new factory'}]},{...report,facts:[{sourceId:source.id,excerpt:'Company profits doubled last quarter'}]},{...report,scenarios:[{...report.scenarios[0],sourceIds:['invented']}]}])assert.throws(()=>validateGrounding(invalid,snapshot));assert.throws(()=>validateGrounding(report,{...snapshot,missing:['stale']}));});
await test('AI02','Fuentes viejas, futuras, URL insegura y HTML se filtran',async()=>{const items=[{headline:'Valid',summary:'<b>Recent news</b>',datetime:Date.now()/1000,url:'https://example.test/ok'},{headline:'Old',summary:'old',datetime:0,url:'https://example.test/old'},{headline:'Future',summary:'future',datetime:Date.now()/1000+999999,url:'https://example.test/future'},{headline:'Bad',summary:'bad',datetime:Date.now()/1000,url:'javascript:alert(1)'}];const news=normalizeNews(items,'global');assert.equal(news.length,1);assert.equal(news[0].text.includes('<b>'),false);});
await test('AI03','Sin cotización no se invoca Anthropic ni se generan escenarios',async()=>{const r=await analyzeSnapshot({...snapshot,quote:null,missing:['Falta cotización']});assert.equal(r.report.status,'insufficient_data');assert.equal(r.report.scenarios.length,0);assert.equal(r.model,null);});
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'allocia-market-test-'));process.env.MARKET_UNIVERSE_FILE=path.join(temp,'universe.json');process.env.MARKET_CALENDAR_FILE=path.join(temp,'calendar.json');
const tickTime=new Date('2026-10-08T13:15:00Z');
const calendar={source:'https://example.test/synthetic-calendar',verifiedAt:'2026-10-01T00:00:00Z',validUntil:'2027-01-01T00:00:00Z',sessions:[{exchange:'TEST',timezone:'America/New_York',open:'2026-10-08T09:30:00-04:00',close:'2026-10-08T16:00:00-04:00'},{exchange:'TEST',timezone:'America/New_York',open:'2026-11-02T09:30:00-05:00',close:'2026-11-02T16:00:00-05:00'},{exchange:'EARLY',timezone:'America/New_York',open:'2026-11-27T09:30:00-05:00',close:'2026-11-27T13:00:00-05:00'}]};fs.writeFileSync(process.env.MARKET_CALENDAR_FILE,JSON.stringify(calendar));fs.writeFileSync(process.env.MARKET_UNIVERSE_FILE,JSON.stringify([snapshot.asset]));
await test('SCH01','Calendario respeta DST, sesiones, cierres anticipados y cripto',async()=>{assert.ok(dueSlots(tickTime).some(s=>s.exchange==='TEST'));assert.ok(dueSlots(new Date('2026-11-02T14:15:00Z')).some(s=>s.exchange==='TEST'));assert.ok(dueSlots(new Date('2026-11-27T17:45:00Z')).some(s=>s.exchange==='EARLY'));assert.equal(dueSlots(new Date('2026-10-10T13:15:00Z')).length,0);assert.ok(dueSlots(new Date('2026-10-10T12:02:00Z')).some(s=>s.exchange==='CRYPTO'));assert.throws(()=>dueSlots(new Date('2027-02-01T00:00:00Z')));});
await test('SCH02','Job idempotente guarda informe y alerta una sola vez',async()=>{await req('/market/preferences','PATCH',{enabled:true},a.token);await db.query(`DELETE FROM push_outbox`);await db.query(`DELETE FROM market_alerts`);await db.query(`DELETE FROM market_reports`);await db.query(`DELETE FROM market_runs`);await db.query("INSERT INTO market_runs(slot,status) VALUES($1,'running')",['REQUEST:'+new Date(Date.now()-3600000).toISOString().slice(0,13)+':AAPL']);let calls=0;const dependencies={snapshot:async asset=>{assert.equal('quantity' in asset,false);assert.equal('userId' in asset,false);return snapshot;},analyze:async s=>{calls++;return {report:validateGrounding(report,s),usage:{inputTokens:100,outputTokens:50},model:'synthetic-test'};}};await tick(orm,tickTime,dependencies);await tick(orm,tickTime,dependencies);assert.equal(calls,2);assert.equal((await req('/market/alerts','GET',undefined,a.token)).body.length,1);assert.equal((await req('/market/alerts','GET',undefined,b.token)).body.length,0);const payload=(await db.query('SELECT payload FROM market_reports')).rows[0].payload;assert.equal(JSON.stringify(payload).includes('quantity'),false);});
await test('SCH03','Lectura de alerta aislada y baja del consentimiento',async()=>{const [alert]=(await req('/market/alerts','GET',undefined,a.token)).body;assert.equal((await req(`/market/alerts/${alert.id}`,'PATCH',{},b.token)).status,404);assert.equal((await req(`/market/alerts/${alert.id}`,'PATCH',{},a.token)).status,200);assert.equal((await req('/market/preferences','PATCH',{enabled:false},a.token)).status,200);assert.equal((await req('/market/status','GET',undefined,a.token)).body.alertsEnabled,false);});
await test('SCH04','Solicitud manual requiere sesión, sólo usa tenencias propias y deduplica por hora',async()=>{assert.equal((await req('/market/analyze','POST',{})).status,401);assert.equal((await req('/market/analyze','POST',{},b.token)).body.queued,0);assert.equal((await req('/market/analyze','POST',{},a.token)).body.queued,1);assert.equal((await req('/market/analyze','POST',{},a.token)).body.queued,0);});
await test('SCH08','Estado por activo pertenece al solicitante y distingue cola, éxito y fallo',async()=>{
 const state=(await req('/market/status','GET',undefined,a.token)).body;
 assert.equal(state.analysisRequests.length,1);assert.equal(state.analysisRequests[0].ticker,'AAPL');assert.equal(state.analysisRequests[0].state,'queued');
 assert.equal((await req('/market/status','GET',undefined,b.token)).body.analysisRequests.length,0);
 const slot='REQUEST:'+new Date().toISOString().slice(0,13)+':'+a.user.id+':AAPL';
 await db.query("UPDATE market_runs SET status='partial',attempts=3 WHERE slot=$1",[slot]);
 assert.equal((await req('/market/status','GET',undefined,a.token)).body.analysisRequests[0].state,'failed');
 await db.query("UPDATE market_runs SET status='complete' WHERE slot=$1",[slot]);
 assert.equal((await req('/market/status','GET',undefined,a.token)).body.analysisRequests[0].state,'ready');
 await db.query("UPDATE market_runs SET status='pending',attempts=0 WHERE slot=$1",[slot]);
});
await test('SCH07','Último informe visible y push manual sólo omite el silencio para quien lo pidió',async()=>{
 await req('/market/preferences','PATCH',{enabled:true},a.token);
 await req('/market/preferences','PATCH',{enabled:true},b.token);
 await req('/portfolio/positions','POST',{ticker:'AAPL',quantity:1},b.token);
 for(const u of [a,b])await req('/market/devices','POST',{token:`ExpoPushToken[manual_regression_${u.user.id}_${tag}]`},u.token);
 const deps={snapshot:async()=>snapshot,analyze:async()=>({report:validateGrounding(report,snapshot),usage:null,model:'synthetic-test'})};
 await tick(orm,new Date(),deps);
 const count=async user=>(await db.query(`SELECT count(*)::int n FROM push_outbox o JOIN market_alerts a ON a.id=o."alertId" WHERE a."userId"=$1`,[user.user.id])).rows[0].n;
 const beforeA=await count(a),beforeB=await count(b);
 assert.ok(beforeA>0 && beforeB>0);
 const ready=(await req('/market/analyze','POST',{},a.token)).body;
 assert.equal(ready.queued,0);assert.equal(ready.ready,1);assert.match(ready.message,/ya disponibles/);
 assert.equal((await req('/market/analyze','POST',{},b.token)).body.queued,1);
 await tick(orm,new Date(),deps);
 assert.equal(await count(a),beforeA);assert.equal(await count(b),beforeB+1);
 const latest=(await req('/market/reports','GET',undefined,a.token)).body[0];
 const alerts=(await req('/market/alerts','GET',undefined,a.token)).body;
 assert.equal(alerts.length,1);assert.equal(String(alerts[0].reportId),String(latest.id));
 await tick(orm,new Date(),deps);assert.equal(await count(b),beforeB+1);
});
await test('SEC12','Estado global no revela símbolos de solicitudes privadas',async()=>{
 await db.query("INSERT INTO market_runs(slot) VALUES($1)",['REQUEST:private-'+tag+':CONFIDENTIAL']);
 const state=(await req('/market/status','GET',undefined,b.token)).body;
 assert.ok(!JSON.stringify(state).includes('CONFIDENTIAL'));
 assert.ok(!String(state.lastRun?.slot).startsWith('REQUEST:'));
});
await test('SCH05','Fallo de una fuente no bloquea otros activos y se reintenta sin duplicar',async()=>{
 fs.writeFileSync(process.env.MARKET_UNIVERSE_FILE,JSON.stringify([snapshot.asset,{...snapshot.asset,ticker:'MSFT'}]));
 let broken=true;const counts={AAPL:0,MSFT:0};
 const dependencies={snapshot:async asset=>{if(asset.ticker==='AAPL'&&broken)throw Error('fixture outage');return {...snapshot,asset};},analyze:async s=>{counts[s.asset.ticker]++;return {report:validateGrounding(report,s),usage:null,model:'fixture'};}};
 const when=new Date('2026-11-02T14:15:00Z');
 await tick(orm,when,dependencies);
 let run=(await db.query("SELECT id,status FROM market_runs WHERE slot LIKE 'TEST:2026-11-02%'")).rows[0];
 assert.equal(run.status,'partial');assert.equal(counts.MSFT,1);
 broken=false;await tick(orm,when,dependencies);
 run=(await db.query('SELECT id,status FROM market_runs WHERE id=$1',[run.id])).rows[0];assert.equal(run.status,'complete');
 assert.equal(counts.MSFT,1);assert.equal((await db.query('SELECT count(*) FROM market_reports WHERE "runId"=$1',[run.id])).rows[0].count,'2');
});
await test('PUSH01','Reinicio ambiguo no reenvía; fallo de recibos no interrumpe limpieza',async()=>{
 const oldFetch=global.fetch,oldEnabled=process.env.PUSH_ENABLED,oldToken=process.env.EXPO_ACCESS_TOKEN;
 process.env.PUSH_ENABLED='true';process.env.EXPO_ACCESS_TOKEN='fixture';
 try{
  await db.query('DELETE FROM push_outbox');
  await db.query('UPDATE users SET "alertsEnabled"=true WHERE id=$1',[a.user.id]);
  const reportId=(await db.query('SELECT id FROM market_reports ORDER BY id DESC LIMIT 1')).rows[0].id;
  const alertId=(await db.query('INSERT INTO market_alerts("userId","reportId") VALUES($1,$2) ON CONFLICT ("userId","reportId") DO UPDATE SET "readAt"=NULL RETURNING id',[a.user.id,reportId])).rows[0].id;
  for(const kind of ['sending','pending','ticket']){
   const token='ExpoPushToken[fixture_'+kind+'_'+tag+']';await db.query('INSERT INTO push_devices(token,"userId") VALUES($1,$2)',[token,a.user.id]);
   await db.query('INSERT INTO push_outbox("alertId",token,status,ticket,"createdAt") VALUES($1,$2,$3,$4,now()-$5::interval)',[alertId,token,kind,kind==='ticket'?'expired-ticket':null,kind==='ticket'?'25 hours':'20 minutes']);
  }
  let sends=0;global.fetch=async url=>{if(String(url).endsWith('getReceipts'))throw Error('fixture outage');sends++;return new Response(JSON.stringify({data:{status:'ok',id:'fixture-ticket'}}));};
  await dispatchPush(orm);assert.equal(sends,1);
  let rows=(await db.query('SELECT status FROM push_outbox WHERE "alertId"=$1 ORDER BY id',[alertId])).rows;
  assert.deepEqual(rows.map(r=>r.status),['unknown','ticket','expired']);
  global.fetch=async()=>new Response(JSON.stringify({data:{'fixture-ticket':{status:'ok'}}}));
  await dispatchPush(orm);
  rows=(await db.query('SELECT status FROM push_outbox WHERE "alertId"=$1 ORDER BY id',[alertId])).rows;
  assert.deepEqual(rows.map(r=>r.status),['unknown','accepted','expired']);
 }finally{global.fetch=oldFetch;if(oldEnabled===undefined)delete process.env.PUSH_ENABLED;else process.env.PUSH_ENABLED=oldEnabled;if(oldToken===undefined)delete process.env.EXPO_ACCESS_TOKEN;else process.env.EXPO_ACCESS_TOKEN=oldToken;}
});
await test('SEC10','Exportación legible y baja de posiciones, alertas y dispositivos',async()=>{const exported=await req('/auth/export','GET',undefined,a.token);assert.equal(exported.status,200);assert.equal(exported.body.account.privacyVersion,'2026-10-09');assert.ok(exported.body.positions.every(p=>typeof p.quantity==='number'));assert.equal(JSON.stringify(exported.body).includes('v1:'),false);await req('/market/devices','POST',{token:`ExpoPushToken[synthetic_test_${tag}]`},a.token);assert.equal((await req('/auth/me','DELETE',{password},a.token)).status,200);for(const table of ['positions','market_alerts','push_devices'])assert.equal((await db.query(`SELECT count(*) FROM ${table} WHERE "userId"=$1`,[a.user.id])).rows[0].count,'0');assert.equal((await req('/auth/me','GET',undefined,a.token)).status,401);await req('/auth/me','DELETE',{password},b.token);});
await test('SEC11','Límite de autenticación aplica 429 con Retry-After',async()=>{let limited=false;for(let i=0;i<22;i++){const r=await req('/auth/login','POST',{email:`missing-${tag}@example.test`,password});if(r.status===429){assert.ok(r.headers.get('retry-after'));limited=true;break;}}assert.ok(limited);});
for(const k of await redis.keys("rate:*")) await redis.del(k);redis.disconnect();
fs.rmSync(temp,{recursive:true,force:true});await orm.destroy();await db.end();const output={executedAt:new Date().toISOString(),scope:'HTTP/PostgreSQL/Redis reales aislados; fuentes y modelo simulados para scheduler y grounding; sin envíos push ni llamadas Anthropic reales',total:results.length,passed:results.filter(r=>r.status==='PASS').length,results};fs.writeFileSync('evidence/production-security.json',JSON.stringify(output,null,2));results.forEach(r=>console.log(r.status,r.id,r.title,r.detail??''));process.exitCode=results.some(r=>r.status==='FAIL')?1:0;}
main().catch(async e=>{redis.disconnect();console.error(e);await orm.destroy().catch(()=>{});await db.end().catch(()=>{});process.exitCode=1;});
