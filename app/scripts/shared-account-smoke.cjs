// Cross-client smoke test. Only modifies the two accounts created by this run.
// Never logs credentials, cookies, positions of existing users or response bodies.
const assert = require('node:assert/strict');
const {randomUUID,randomBytes}=require('node:crypto');
const {readFileSync,writeFileSync}=require('node:fs');
const {resolve}=require('node:path');
const {createRequire}=require('node:module');
const {runInNewContext}=require('node:vm');
const ts=createRequire(resolve(__dirname,'../apps/web/package.json'))('typescript');
const apiURL=process.env.SMOKE_API_URL;
const webURL=process.env.SMOKE_WEB_URL;
if(!apiURL||!webURL)throw new Error('SMOKE_API_URL and SMOKE_WEB_URL required');
for(const u of [apiURL,webURL])if(new URL(u).protocol!=='https:')throw new Error('HTTPS required');
const checks=[];
let currentCheck='network_or_client';
const check=(name,ok)=>{currentCheck=name;assert.ok(ok,name);checks.push(name);};
function client(){
 const source=readFileSync(resolve(__dirname,'../apps/mobile/lib/api.ts'),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const exports={};runInNewContext(code,{exports,process:{env:{EXPO_PUBLIC_API_URL:apiURL}},__DEV__:false,fetch});return exports;
}
const mobile=client(),other=client();
const password=randomBytes(24).toString('base64url')+'aA1!';
const email=`parity-${randomUUID()}@example.invalid`;
let cookie='',created=false,secondCreated=false,deleted=false;
async function web(path,method='GET',data){
 return fetch(webURL+path,{method,redirect:'error',signal:AbortSignal.timeout(20000),headers:{Origin:new URL(webURL).origin,...(cookie?{Cookie:cookie}:{}),...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});
}
(async()=>{
 try {
  const registered=await web('/api/auth/register','POST',{name:'Validación multidispositivo',email,password,privacyAccepted:true});
  check('web_register',registered.ok);created=true;
  cookie=registered.headers.get('set-cookie')?.split(';')[0]??'';
  check('secure_web_session',Boolean(cookie)&&/httponly/i.test(registered.headers.get('set-cookie'))&&/secure/i.test(registered.headers.get('set-cookie')));
  const webUser=(await registered.json()).user;
  const login=await mobile.api.login(email,password);mobile.setAuthToken(login.token);
  check('same_account_identifier',login.user.id===webUser.id);
  const second=await other.api.register('Validación aislada',`parity-${randomUUID()}@example.invalid`,password);
  other.setAuthToken(second.token);secondCreated=true;
  await mobile.api.addPosition('AAPL',1.25);
  const positions=await (await web('/api/proxy/portfolio/holdings')).json();
  const p=positions.find(p=>p.ticker==='AAPL');check('mobile_create_visible_on_web',p?.quantity===1.25);
  check('web_update', (await web(`/api/proxy/portfolio/positions/${p.id}`,'PATCH',{quantity:2.5})).ok);
  check('web_update_visible_on_mobile',(await mobile.api.holdings())[0]?.quantity===2.5);
  await mobile.api.marketPreferences(true);
  check('mobile_preferences_visible_on_web',(await (await web('/api/proxy/market/status')).json()).alertsEnabled===true);
  check('web_preferences_update',(await web('/api/proxy/market/preferences','PATCH',{enabled:false})).ok);
  check('web_preferences_visible_on_mobile',(await mobile.api.marketStatus()).alertsEnabled===false);
  check('other_account_isolated',(await other.api.holdings()).length===0);
  check('other_account_update_denied',await other.api.updatePosition(p.id,999).then(()=>false,()=>true));
  check('other_account_delete_denied',await other.api.removePosition(p.id).then(()=>false,()=>true));
  check('owner_data_unchanged',(await mobile.api.holdings())[0]?.quantity===2.5);
  const reports=await (await web('/api/proxy/market/reports')).json();
  check('same_report_ids',JSON.stringify(reports.map(r=>r.id))===JSON.stringify((await mobile.api.marketReports()).map(r=>r.id)));
  const exported=await (await web('/api/proxy/auth/export')).json();
  check('export_uses_shared_positions',exported.positions[0]?.quantity===2.5);
  await mobile.api.removePosition(p.id);
  check('mobile_delete_visible_on_web',(await (await web('/api/proxy/portfolio/holdings')).json()).length===0);
  check('web_account_deletion',(await web('/api/proxy/auth/me','DELETE',{password})).ok);deleted=true;
  check('mobile_session_invalid_after_account_deletion',await mobile.api.me().then(()=>false,()=>true));
 } finally {
  if(created&&!deleted){const session=await mobile.api.login(email,password);mobile.setAuthToken(session.token);await mobile.api.deleteAccount(password);deleted=true;}
  if(secondCreated){await other.api.deleteAccount(password);secondCreated=false;}
 }
 const evidence={checkedAt:new Date().toISOString(),apiURL,webURL,scope:'Real deployed web BFF and actual mobile HTTP client; not physical phone UI',checks,temporaryAccountsDeleted:deleted&&!secondCreated};
 if(process.env.SMOKE_EVIDENCE)writeFileSync(process.env.SMOKE_EVIDENCE,JSON.stringify(evidence,null,2)+'\n');
 console.log(JSON.stringify(evidence));
})().catch(e=>{console.error(JSON.stringify({failedAfter:currentCheck,completedChecks:checks,cleanup:{created,deleted,secondCreated},errorType:e?.name,errorMessage:e instanceof TypeError?e.message:undefined,networkCode:e?.cause?.code}));process.exitCode=1;});
