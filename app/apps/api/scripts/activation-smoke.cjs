// Explicit production smoke: only creates and removes its own temporary accounts.
// Never runs fixture suites, bulk SQL, or mutations against existing accounts.
const crypto=require('node:crypto'),fs=require('node:fs');
if(!process.argv.includes('--live'))throw Error('Requires --live');
const root='https://uadepfi-production.up.railway.app';
const equity=process.argv.find(a=>a.startsWith('--equity='))?.split('=')[1]??'AAPL';
const coin=process.argv.find(a=>a.startsWith('--crypto='))?.split('=')[1]??'dogecoin';
if(!/^[A-Z]{1,8}$/.test(equity)||!/^[a-z0-9-]{1,80}$/.test(coin))throw Error('Invalid test symbols');
const users=[],results=[];const password=crypto.randomBytes(24).toString('base64url');
async function req(path,method='GET',body,token){const r=await fetch(root+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(25000)});const data=await r.json();return {status:r.status,data};}
function check(label,condition){results.push({label,pass:!!condition});console.log(JSON.stringify(results.at(-1)));if(!condition)throw Error(label);}
(async()=>{try{
 const h=await req('/health');check('API activa con commit verificado',h.status===200&&h.data.commit===process.env.EXPECTED_API_COMMIT);
 for(let i=0;i<2;i++){const r=await req('/auth/register','POST',{email:'activation-'+crypto.randomUUID()+'@example.invalid',password,name:'Verificación temporal Allocia',privacyAccepted:true});if(r.status!==201)throw Error('No se pudo registrar cuenta temporal');users.push(r.data);}
 check('Registro y autenticación de dos cuentas temporales',users.length===2);
 const a=users[0].token,b=users[1].token;
 check('Alta de posición', (await req('/portfolio/positions','POST',{ticker:equity,quantity:1},a)).status===201);
 const search=await req('/catalog/search','POST',{query:coin},a);check('Búsqueda externa CoinGecko',search.status===201&&search.data.results.some(x=>x.id===coin));
 const imported=await req('/catalog/import','POST',{provider:'coingecko',id:coin},a);check('Importación respaldada por cotización real',imported.status===201&&imported.data.quote?.price>0);
 check('Alta de cripto importada',(await req('/portfolio/positions','POST',{ticker:imported.data.ticker,quantity:1},a)).status===201);
 const p=await req('/portfolio','GET',undefined,a);check('Valuación real acciones y cripto',p.status===200&&p.data.positions.length===2&&p.data.positions.every(x=>x.refPrice>0&&['Finnhub','CoinGecko'].includes(x.priceSource)&&x.priceAsOf));
 const other=await req('/portfolio/holdings','GET',undefined,b);check('Aislamiento de lectura',other.status===200&&other.data.length===0);
 const id=p.data.positions[0].id;
 check('Aislamiento de escritura',(await req('/portfolio/positions/'+id,'PATCH',{quantity:999},b)).status===404);
 check('Edición propia',(await req('/portfolio/positions/'+id,'PATCH',{quantity:2},a)).status===200);
 check('Consentimiento de alertas dentro de la app',(await req('/market/preferences','PATCH',{enabled:true},a)).status===200);
 check('Cola de análisis propia',(await req('/market/analyze','POST',{},a)).status===201);
 check('Solicitud repetida deduplicada',(await req('/market/analyze','POST',{},a)).data.queued===0);
 let reports=[];
 for(let n=0;n<24;n++){reports=(await req('/market/reports','GET',undefined,a)).data;if(Array.isArray(reports)&&reports.length>=2)break;await new Promise(r=>setTimeout(r,5000));}
 check('Worker procesa informes de las dos posiciones',Array.isArray(reports)&&reports.length>=2);
 check('IA con escenarios y fuentes verificadas',reports.every(r=>r.payload.report.status==='analysis'&&r.payload.report.facts.length&&r.payload.report.scenarios.length));
 check('Investigación y formato de catorce apartados incluidos',reports.every(r=>r.payload.snapshot.research&&r.payload.masterSections?.length===14));
 const alerts=await req('/market/alerts','GET',undefined,a);check('Alertas dentro de la app entregadas sólo al propietario',alerts.status===200&&alerts.data.length===2&&(await req('/market/alerts','GET',undefined,b)).data.length===0);
 }catch(e){console.error(JSON.stringify({error:e.message}));process.exitCode=1;}
 finally{for(const u of users){try{const r=await req('/auth/me','DELETE',{password},u.token);results.push({label:'Eliminación de cuenta temporal',pass:r.status===200});if(r.status!==200)process.exitCode=1;}catch{results.push({label:'Eliminación de cuenta temporal',pass:false});process.exitCode=1;}}
 fs.mkdirSync('evidence',{recursive:true});fs.writeFileSync('evidence/activation-smoke.json',JSON.stringify({at:new Date().toISOString(),commit:process.env.EXPECTED_API_COMMIT,results},null,2));console.log(JSON.stringify({cleanup:results.filter(x=>x.label==='Eliminación de cuenta temporal')}));}
})();
