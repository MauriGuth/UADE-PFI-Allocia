require('reflect-metadata');
const assert=require('node:assert/strict'),{Client}=require('pg'),{DataSource}=require('typeorm'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
if(process.env.NODE_ENV==='production'||process.env.DATABASE_URL)throw new Error('Only isolated local tests');
process.env.NODE_ENV='test';process.env.HOLDINGS_ENCRYPTION_KEY=Buffer.alloc(32,7).toString('base64');
process.env.MARKET_ANALYSIS_ENABLED='true';process.env.PUSH_ENABLED='false';delete process.env.RESEND_API_KEY;
const {databaseOptions}=require('../dist/database'),{OpportunitiesController}=require('../dist/market/opportunities.controller'),{tick,dispatchPush}=require('../dist/market/worker');
const name='allocia_opportunities_'+Date.now(),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'allocia-opportunities-'));
const connection={host:'localhost',user:process.env.DB_USER??process.env.USER,password:process.env.DB_PASS,database:'postgres'},admin=new Client(connection);
let db;const asset={ticker:'TSLA',name:'Tesla',region:'US',exchange:'XNYS_XNAS',providerSymbol:'TSLA',currency:'USD',kind:'equity'};
async function main(){await admin.connect();await admin.query(`CREATE DATABASE ${name}`);db=new DataSource({...databaseOptions(),host:'localhost',username:process.env.DB_USER??process.env.USER,password:process.env.DB_PASS??'',database:name,ssl:false});await db.initialize();await db.runMigrations();
 const c=new OpportunitiesController(db),req=id=>({user:{sub:id}});
 for(let i=1;i<=4;i++)await db.query('INSERT INTO users(id,email,name,"passwordHash","alertsEnabled") VALUES($1,$2,$3,$4,$5)',[i,`test${i}@example.test`,'Synthetic','not-a-real-password',i===1]);
 await db.query('INSERT INTO instruments(ticker,name,"assetClass",sector,region,currency,"refPrice","marketMapping") VALUES($1,$2,$3,$4,$5,$6,0,$7)',[asset.ticker,asset.name,'accion','test','US','USD',JSON.stringify(asset)]);
 await db.query('INSERT INTO positions("userId",ticker,quantity) VALUES(1,$1,$2)',[asset.ticker,'test-only']);
 process.env.MARKET_UNIVERSE_FILE=path.join(tmp,'universe.json');fs.writeFileSync(process.env.MARKET_UNIVERSE_FILE,JSON.stringify([asset]));delete process.env.MARKET_CALENDAR_FILE;
 await c.preferences(req(2),{enabled:true,scope:'all'});await c.preferences(req(3),{enabled:true,scope:'watchlist'});await c.follow(req(3),{ticker:'TSLA'});
 assert.equal((await c.list(req(4))).watchlist.length,0);assert.equal((await c.list(req(3))).watchlist.length,1);
 await c.unfollow(req(4),'TSLA');assert.equal((await c.list(req(3))).watchlist.length,1);
 assert.equal((await c.analyze(req(2))).queued,1);assert.equal((await c.analyze(req(2))).queued,0);
 const date=new Date().toISOString(),snapshot={asset,quote:{price:100,currency:'USD',asOf:date,source:'synthetic'},sources:[{id:'s',title:'Tesla anuncia una nueva fábrica',text:'La expansión depende del financiamiento.',scope:'asset',url:'https://example.test/news',publishedAt:date}],fetchedAt:date,missing:[]};
 const report={status:'analysis',summary:'La expansión depende de financiamiento.',facts:[{sourceId:'s',excerpt:'Tesla anuncia una nueva fábrica'}],scenarios:[{direction:'up',condition:'Si se aprueba el financiamiento',explanation:'Podría ampliar ingresos.',sourceIds:['s']}],limitations:['Escenario de prueba, no datos reales.']};
 for(let i=1;i<=4;i++)await db.query('INSERT INTO push_devices(token,"userId") VALUES($1,$2)',[`ExpoPushToken[synthetic-test-${i}]`,i]);
 const deps={snapshot:async()=>snapshot,analyze:async()=>({report,usage:null,model:'synthetic'})};await tick(db,new Date(),deps);await tick(db,new Date(),deps);
 let alerts=await db.query('SELECT "userId",kind FROM market_alerts ORDER BY "userId"');assert.deepEqual(alerts,[{userId:1,kind:'portfolio'},{userId:2,kind:'opportunity'},{userId:3,kind:'opportunity'}]);
 assert.equal((await c.list(req(1))).reports.length,0);assert.equal((await c.list(req(2))).reports.length,1);
 await c.preferences(req(2),{enabled:false,scope:'all'});assert.equal((await db.query('SELECT o.id FROM push_outbox o JOIN market_alerts a ON a.id=o."alertId" WHERE a."userId"=2')).length,0);
 const originalFetch=global.fetch,captured=[];global.fetch=async(u,o)=>{captured.push(JSON.parse(o.body));return {ok:true,json:async()=>({data:{status:'ok',id:'synthetic-ticket'}})};};process.env.PUSH_ENABLED='true';process.env.EXPO_ACCESS_TOKEN='test-only';try{await dispatchPush(db);}finally{global.fetch=originalFetch;process.env.PUSH_ENABLED='false';}
 assert.equal(captured.length,2);assert.ok(captured.some(x=>x.data.kind==='opportunity'&&x.body.includes('TSLA')&&x.body.includes('posible suba')));await dispatchPush(db);
 // The latest contrary report suppresses the earlier upside.
 const [run]=await db.query("INSERT INTO market_runs(slot,status) VALUES('synthetic-later','complete') RETURNING id");await db.query('INSERT INTO market_reports("runId",ticker,region,payload) VALUES($1,$2,$3,$4)',[run.id,'TSLA','US',JSON.stringify({snapshot,report:{...report,scenarios:[{...report.scenarios[0],direction:'down'}]}})]);assert.equal((await c.list(req(2))).reports.length,0);
 await db.query('DELETE FROM users WHERE id=3');assert.equal((await db.query('SELECT * FROM market_watchlist WHERE "userId"=3')).length,0);
 console.log('PASS: migration, follow isolation, manual deduplication, external opportunities, portfolio separation, opt-in, push payload, consent cancellation, latest report, account deletion');
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(db?.isInitialized)await db.destroy();await admin.query(`DROP DATABASE IF EXISTS ${name}`);await admin.end();fs.rmSync(tmp,{recursive:true,force:true});});
