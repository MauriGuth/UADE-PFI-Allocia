// Explicit production smoke: uses only Resend's documented simulator recipients.
// Never logs credentials, tokens, message bodies or real users' addresses.
// From apps/api: node ../../scripts/mail-smoke.cjs --live (secrets injected in env).
const fs=require('node:fs'),crypto=require('node:crypto');
if(!process.argv.includes('--live'))throw Error('Requires --live');
const base=process.env.API_TEST_URL,origin=process.env.PUBLIC_WEB_URL;
if(!base?.startsWith('https://')||!origin?.startsWith('https://')||!process.env.RESEND_API_KEY)throw Error('Missing secure configuration');
const email=`delivered+allocia-${crypto.randomUUID()}@resend.dev`;
let password=crypto.randomBytes(24).toString('hex'),session,created=false;
const results=[];
function check(label,pass){results.push({label,pass:!!pass});console.log(JSON.stringify({label,pass:!!pass}));if(!pass)throw Error(label);}
async function api(path,method='GET',body,token=session){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});return {status:r.status,body:await r.json()};}
async function resend(path){const r=await fetch('https://api.resend.com'+path,{headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`},signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Resend inspection failed');return r.json();}
async function received(purpose){
 const deadline=Date.now()+180000;
 while(Date.now()<deadline){
  const list=await resend('/emails?limit=100');
  for(const m of list.data??[]){
   if(!Array.isArray(m.to)||!m.to.includes(email))continue;
   const message=await resend('/emails/'+encodeURIComponent(m.id));
   const match=String(message.text??'').match(/https:\/\/[^\s]+#token=([a-f0-9]{64})/);
   if(!match)continue;
   const url=new URL(match[0]);if(url.pathname!==purpose)continue;
   check('Enlace '+purpose+' usa dominio propio y token en fragmento',url.origin===origin&&url.search==='');
   check('Remitente verificado de Allocia',String(message.from).includes('noreply@allocia.com.ar'));
   return match[1];
  }
  await new Promise(r=>setTimeout(r,5000));
 }
 throw Error('Worker did not send test email before timeout');
}
(async()=>{
 try{
  const reg=await api('/auth/register','POST',{email,password,name:'Prueba correo',privacyAccepted:true},null);
  check('Cuenta temporal de simulación creada',reg.status===201&&!!reg.body.token);created=true;session=reg.body.token;
  check('Solicitud de verificación aceptada',(await api('/auth/request-verification','POST',{})).status===201);
  const verify=await received('/verify-email');
  check('Verificación consume enlace',(await api('/auth/verify-email','POST',{token:verify})).status===201);
  check('Enlace de verificación no reutilizable',(await api('/auth/verify-email','POST',{token:verify})).status===400);
  check('Solicitud de recuperación aceptada',(await api('/auth/forgot-password','POST',{email},null)).status===201);
  const reset=await received('/reset-password');
  const previous=password,next=crypto.randomBytes(24).toString('hex');
  const changed=await api('/auth/reset-password','POST',{token:reset,password:next},null);
  if(changed.status===201)password=next;
  check('Cambio de contraseña válido',changed.status===201);
  check('Sesión anterior revocada',(await api('/auth/me')).status===401);
  check('Contraseña anterior rechazada',(await api('/auth/login','POST',{email,password:previous},null)).status===401);
  const login=await api('/auth/login','POST',{email,password},null);session=login.body.token;
  check('Nueva contraseña permite acceso',login.status===201&&!!session);
  check('Enlace de recuperación no reutilizable',(await api('/auth/reset-password','POST',{token:reset,password:next},null)).status===400);
 }catch{results.push({label:'Flujo completo',pass:false});console.error('Prueba incompleta; revisar evidencia sin secretos.');process.exitCode=1;}
 finally{
  if(created){if(!session){const login=await api('/auth/login','POST',{email,password},null);session=login.body.token;}
   const deleted=await api('/auth/me','DELETE',{password});results.push({label:'Cuenta temporal eliminada',pass:deleted.status===200});console.log(JSON.stringify(results.at(-1)));if(deleted.status!==200)process.exitCode=1;
  }
  fs.mkdirSync('evidence',{recursive:true});fs.writeFileSync('evidence/mail-smoke.json',JSON.stringify({at:new Date().toISOString(),origin,scope:'Resend real con destinatario simulador; no confirma recepción en casillas o teléfonos personales',results},null,2));
 }
})().catch(()=>{console.error('No se completó la limpieza de la prueba');process.exitCode=1;});
