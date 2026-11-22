/* Verificación de la web de Allocia contra la interfaz vigente.
   UI01-UI09 reproducen los casos del Anexo F; X01-X12 son comprobaciones adicionales.
   Requiere: API + PostgreSQL + Redis aislados y `next start` (ver README de la evidencia). */
// Ejecutar desde apps/web (donde está instalado @playwright/test) con CHROMIUM_PATH si no hay Chrome instalado.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE??'@playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const WEB=process.env.WEB_URL??'http://localhost:3000';
const OUT=process.env.OUT??'web-verification.json';
const SHOTS=process.env.SHOTS;
const results=[], problems=[], provoked=[];
let provoking=false;
const {execSync}=require('node:child_process');
const stamp=Date.now();
const email=`ui-${stamp}@example.test`, password='Web-verification-1234', other=`ui-b-${stamp}@example.test`;
const origin={Origin:WEB};
let browser;

async function test(id,title,fn){
  const t0=Date.now();
  try{const detail=await fn();results.push({id,title,status:'PASS',ms:Date.now()-t0,detail});console.log('PASS',id,title);}
  catch(e){results.push({id,title,status:'FAIL',ms:Date.now()-t0,detail:String(e.message).split('\n').slice(0,6).join(' | ')});console.log('FAIL',id,title,'—',String(e.message).split('\n')[0]);}
}
function watch(page,tag){
  page.on('pageerror',e=>problems.push(`[${tag}] pageerror: ${e.message.slice(0,200)}`));
  page.on('console',m=>{if(!['error','warning'].includes(m.type()))return;const t=`[${tag}] ${m.type()}: ${m.text().slice(0,200)}`;if(provoking&&/Failed to load resource: the server responded with a status of 4\d\d/.test(m.text()))provoked.push(t);else problems.push(t);});
}
const visible=async(loc,ms=8000)=>{await loc.first().waitFor({state:'visible',timeout:ms});};
async function overflow(page){return page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));}
async function shot(page,name){if(SHOTS)await page.screenshot({path:`${SHOTS}/${name}.png`,fullPage:true});}

(async()=>{
browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
const ctx=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await ctx.newPage();watch(page,'A');
let cookieA;

await test('UI01','Ruta privada redirige al acceso conservando el destino',async()=>{
  await page.goto(`${WEB}/cartera`);await page.waitForURL(/\/login\?next=%2Fcartera/);
  await visible(page.getByRole('button',{name:'Iniciar sesión'}));
  return page.url();
});
await test('UI02','Registro con consentimiento abre cartera vacía',async()=>{
  await page.goto(`${WEB}/register`);
  await page.getByLabel('Nombre',{exact:true}).fill('Persona de prueba');
  await page.getByLabel('Email',{exact:true}).fill(email);
  await page.getByLabel('Contraseña',{exact:true}).fill(password);
  assert.equal(await page.getByRole('button',{name:'Crear cuenta'}).isDisabled(),true,'El registro debe exigir el consentimiento');
  await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:'Crear cuenta'}).click();
  await page.waitForURL(/\/resumen/);await visible(page.getByText('Tu cartera está vacía'));
  cookieA=(await ctx.cookies()).find(c=>c.name==='allocia_token');
  assert.ok(cookieA,'falta cookie de sesión');
  return {httpOnly:cookieA.httpOnly,sameSite:cookieA.sameSite};
});
await test('UI03','Carga, edición y persistencia tras recargar',async()=>{
  await page.goto(`${WEB}/cartera`);await visible(page.getByText('Todavía no hay activos cargados.'));
  for(const [t,q] of [['AAPL','2'],['BTC','0.1'],['XLE','100']]){
    await page.getByLabel('Ticker / Símbolo').fill(t);
    await page.getByLabel('Cantidad',{exact:true}).fill(q);
    await page.getByRole('button',{name:/Agregar Activo/}).click();
    await visible(page.getByRole('button',{name:`Editar ${t}`}));
  }
  await page.getByRole('button',{name:'Editar AAPL'}).first().click();
  await page.getByLabel('Nueva cantidad').fill('3');
  await page.getByRole('button',{name:'Guardar',exact:true}).click();
  await page.getByLabel('Nueva cantidad').waitFor({state:'hidden'});
  await page.reload();await visible(page.getByRole('button',{name:'Editar AAPL'}));
  const h=await (await page.request.get(`${WEB}/api/proxy/portfolio/holdings`)).json();
  const q=Object.fromEntries(h.map(x=>[x.ticker,x.quantity]));
  assert.equal(q.AAPL,3);assert.equal(q.BTC,0.1);assert.equal(q.XLE,100);
  await shot(page,'cartera-con-posiciones');
  return q;
});
await test('UI04','Resumen y Riesgo: observación con regla, datos y fuente visibles',async()=>{
  await page.goto(`${WEB}/resumen`);
  await visible(page.getByRole('heading',{name:'Cómo está repartido tu dinero'}));
  await visible(page.getByText(/precios de referencia/));
  await page.goto(`${WEB}/riesgo`);
  await visible(page.getByRole('heading',{name:'Qué revisar en tu cartera'}));
  const title=page.getByRole('heading',{name:'El contexto sostiene una prima sobre el sector energético'});
  await visible(title);
  const card=page.locator('article, li, div').filter({has:title}).filter({has:page.getByRole('button',{name:'¿Por qué esta observación?'})}).last();
  await card.getByRole('button',{name:'¿Por qué esta observación?'}).click();
  await visible(page.getByText('exposición a Energía > 5 % y existencia de evento energético',{exact:true}));
  await visible(page.getByText(/demostración; fecha del dato/));
  await shot(page,'riesgo-evidencia');
  return 'regla y fuente visibles';
});
await test('UI04b','Escenarios: sin rendimientos supuestos cuando no hay evidencia',async()=>{
  await page.goto(`${WEB}/resumen`);
  await visible(page.getByRole('heading',{name:'Escenarios con fuentes'}));
  await visible(page.getByText(/Sin porcentajes de rendimiento supuestos/));
  await visible(page.getByText(/No se completan con ejemplos/));
  assert.equal(await page.getByRole('tab',{name:'Adverso'}).count(),0,'ya no existe la pestaña de escenario adverso');
  return 'el selector de escenario adverso fue reemplazado por escenarios con fuentes';
});
await test('UI05','Sin desborde horizontal en 390, 768 y 1440 px en todas las pantallas',async()=>{
  const paths=['/resumen','/cartera','/desglose','/riesgo','/senales','/market','/informe','/ajustes','/account'];
  const bad=[];
  for(const w of [390,768,1440]){
    await page.setViewportSize({width:w,height:900});
    for(const p of paths){await page.goto(`${WEB}${p}`);await page.waitForLoadState('networkidle');const o=await overflow(page);if(o.scroll>o.client)bad.push({w,p,...o});}
  }
  await page.setViewportSize({width:1440,height:1000});
  assert.deepEqual(bad,[],JSON.stringify(bad));
  return `${paths.length} pantallas × 3 anchos`;
});
await test('UI06','Eliminar posición con confirmación',async()=>{
  await page.goto(`${WEB}/cartera`);
  await page.getByRole('button',{name:'Eliminar BTC'}).first().click();
  await page.getByRole('alertdialog').getByRole('button',{name:'Eliminar'}).click();
  await page.getByRole('button',{name:'Editar BTC'}).waitFor({state:'detached',timeout:8000});
  const h=await (await page.request.get(`${WEB}/api/proxy/portfolio/holdings`)).json();
  assert.ok(!h.some(x=>x.ticker==='BTC'));assert.equal(h.length,2);
  return h.map(x=>x.ticker);
});
await test('UI07','Cerrar sesión, error de login y nuevo acceso',async()=>{
  await page.goto(`${WEB}/account`);
  await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();await page.waitForURL(/\/login/);
  const stale=await ctx.request.get(`${WEB}/api/proxy/portfolio/holdings`,{headers:{Cookie:`allocia_token=${cookieA.value}`}});
  assert.equal(stale.status(),401,'el token anterior debe quedar revocado');
  await page.getByLabel('Email',{exact:true}).fill(email);
  provoking=true;
  await page.getByLabel('Contraseña',{exact:true}).fill('contraseña-incorrecta');
  await page.getByRole('button',{name:'Iniciar sesión'}).click();
  await visible(page.locator('p[role=alert]'));
  provoking=false;
  await page.getByLabel('Contraseña',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Iniciar sesión'}).click();await page.waitForURL(/\/resumen/);
  await page.goto(`${WEB}/cartera`);await visible(page.getByRole('button',{name:'Editar AAPL'}));
  cookieA=(await ctx.cookies()).find(c=>c.name==='allocia_token');
  return 'revocación (401) + error + reingreso';
});
// Segunda cuenta para aislamiento
const ctxB=await browser.newContext({viewport:{width:1280,height:900}});const pb=await ctxB.newPage();watch(pb,'B');
await test('X01','Aislamiento: otra cuenta no ve ni modifica posiciones ajenas',async()=>{
  await pb.goto(`${WEB}/register`);
  await pb.getByLabel('Nombre',{exact:true}).fill('Cuenta B');await pb.getByLabel('Email',{exact:true}).fill(other);
  await pb.getByLabel('Contraseña',{exact:true}).fill(password);await pb.getByRole('checkbox').check();
  await pb.getByRole('button',{name:'Crear cuenta'}).click();await pb.waitForURL(/\/resumen/);
  const hb=await (await pb.request.get(`${WEB}/api/proxy/portfolio/holdings`)).json();assert.deepEqual(hb,[]);
  const ha=await (await page.request.get(`${WEB}/api/proxy/portfolio/holdings`)).json();
  const id=ha.find(x=>x.ticker==='AAPL').id;
  const patch=await pb.request.patch(`${WEB}/api/proxy/portfolio/positions/${id}`,{headers:origin,data:{quantity:99}});
  const del=await pb.request.delete(`${WEB}/api/proxy/portfolio/positions/${id}`,{headers:origin});
  assert.equal(patch.status(),404);assert.equal(del.status(),404);
  const after=await (await page.request.get(`${WEB}/api/proxy/portfolio/holdings`)).json();
  assert.equal(after.find(x=>x.ticker==='AAPL').quantity,3);
  return {patch:patch.status(),delete:del.status()};
});
await test('X02','CSRF: mutaciones con cookie sin origen o con origen ajeno rechazadas',async()=>{
  const forged=await page.request.patch(`${WEB}/api/proxy/market/preferences`,{headers:{Origin:'https://evil.example'},data:{enabled:false}});
  const noOrigin=await page.request.post(`${WEB}/api/auth/logout`);
  assert.equal(forged.status(),403);assert.equal(noOrigin.status(),403);
  return {origenAjeno:forged.status(),sinOrigen:noOrigin.status()};
});
await test('X03','El proxy exige sesión y sólo expone rutas permitidas',async()=>{
  const anon=await (await browser.newContext()).request.get(`${WEB}/api/proxy/portfolio/holdings`);
  const denied=await page.request.get(`${WEB}/api/proxy/health`);
  assert.equal(anon.status(),401);
  assert.ok([403,404].includes(denied.status()),`ruta no permitida respondió ${denied.status()}`);
  return {sinSesion:anon.status(),rutaNoPermitida:denied.status()};
});
await test('X04','Validación de entradas: ticker inexistente, cantidad cero, negativa y letras',async()=>{
  provoking=true;
  await page.goto(`${WEB}/cartera`);
  await page.getByLabel('Ticker / Símbolo').fill('ZZZZ');await page.getByLabel('Cantidad',{exact:true}).fill('1');
  await page.getByRole('button',{name:/Agregar Activo/}).click();
  await visible(page.locator('p[role=alert]'));assert.match(await page.locator('p[role=alert]').first().innerText(),/catálogo/);provoking=false;
  await page.getByLabel('Ticker / Símbolo').fill('AAPL');
  const qty=page.getByLabel('Cantidad',{exact:true});
  await qty.fill('');await qty.pressSequentially('1a$2');assert.equal(await qty.inputValue(),'12','sólo dígitos');
  const before=(await (await page.request.get(`${WEB}/api/proxy/portfolio/holdings`)).json()).length;
  const api=[];for(const q of [0,-1,'texto',1e12]){api.push((await page.request.post(`${WEB}/api/proxy/portfolio/positions`,{headers:origin,data:{ticker:'AAPL',quantity:q}})).status());}
  assert.ok(api.every(s=>s===400),`respuestas ${api}`);
  const after=(await (await page.request.get(`${WEB}/api/proxy/portfolio/holdings`)).json()).length;assert.equal(after,before);
  return {estadosApi:api};
});
await test('X05','Señales: cada componente muestra fuente y origen (demostración/en vivo)',async()=>{
  await page.goto(`${WEB}/senales`);
  await visible(page.getByRole('heading',{name:'Fuentes y disponibilidad'}));
  const t=await page.locator('main').innerText();
  assert.match(t,/demostración/i);assert.match(t,/fecha/i);
  await shot(page,'senales');
  return 'procedencia visible';
});
await test('X06','El login tolera espacios y mayúsculas en el correo',async()=>{
  const c=await browser.newContext();const p=await c.newPage();
  await p.goto(`${WEB}/login`);await p.getByLabel('Email',{exact:true}).fill(`  ${email.toUpperCase()}  `);
  await p.getByLabel('Contraseña',{exact:true}).fill(password);await p.getByRole('button',{name:'Iniciar sesión'}).click();
  await p.waitForURL(/\/resumen/);await c.close();return 'ok';
});
await test('X07','Exportación de datos propios y cuenta compartida con la API',async()=>{
  const ex=await (await page.request.get(`${WEB}/api/proxy/auth/export`)).json();
  assert.ok(Array.isArray(ex.positions)&&ex.positions.length===2);
  assert.ok(!JSON.stringify(ex).includes(other),'la exportación no debe incluir datos de otra cuenta');
  return {posiciones:ex.positions.length};
});
await test('X08','Detalle de activo y ruta inexistente sin errores',async()=>{
  await page.goto(`${WEB}/cartera/AAPL`);await visible(page.getByRole('heading').first());
  const r=await page.goto(`${WEB}/cartera/NOEXISTE`);
  await page.waitForLoadState('networkidle');return {estadoNoExiste:r.status()};
});
await test('X09','Recorrido de todas las pantallas sin errores de consola (escritorio, tablet, móvil)',async()=>{
  execSync('redis-cli -p 6387 flushall');
  const before=problems.length;
  for(const [w,h] of [[1280,800],[820,1180],[390,844]]){
    await page.setViewportSize({width:w,height:h});
    for(const p of ['/resumen','/cartera','/desglose','/riesgo','/senales','/market','/informe','/ajustes','/account','/privacy']){await page.goto(`${WEB}${p}`);await page.waitForLoadState('networkidle');await page.waitForTimeout(900);}
  }
  await page.setViewportSize({width:1440,height:1000});
  const nuevos=problems.slice(before);assert.deepEqual(nuevos,[],nuevos.join(' || '));return '30 cargas';
});
await test('X11','Baja con contraseña incorrecta: muestra el error y conserva la sesión',async()=>{
  const c=await browser.newContext({viewport:{width:1280,height:900}});const p=await c.newPage();watch(p,'C');
  const mail=`ui-c-${stamp}@example.test`;
  await p.goto(`${WEB}/register`);await p.getByLabel('Nombre',{exact:true}).fill('Cuenta C');await p.getByLabel('Email',{exact:true}).fill(mail);
  await p.getByLabel('Contraseña',{exact:true}).fill(password);await p.getByRole('checkbox').check();
  await p.getByRole('button',{name:'Crear cuenta'}).click();await p.waitForURL(/\/resumen/);
  await p.goto(`${WEB}/account`);
  await p.getByLabel('Confirmá tu contraseña').fill('contraseña-incorrecta');await p.getByRole('checkbox').check();
  provoking=true;await p.getByRole('button',{name:'Eliminar mi cuenta y datos'}).click();await p.waitForTimeout(2500);provoking=false;
  const url=p.url();const cookies=(await c.cookies()).map(x=>x.name);
  const alerts=(await p.locator('[role=alert]').allInnerTexts()).join('').trim();
  // Limpieza de la cuenta temporal con la contraseña correcta
  const login=await c.request.post(`${WEB}/api/auth/login`,{headers:origin,data:{email:mail,password}});
  if(login.ok())await c.request.delete(`${WEB}/api/proxy/auth/me`,{headers:origin,data:{password}});
  await c.close();
  assert.ok(url.includes('/account')&&!url.includes('expired')&&cookies.includes('allocia_token')&&alerts.length>0,
    `DEFECTO: se redirigió a ${url}, cookies=[${cookies}], mensaje="${alerts}" (se esperaba permanecer en /account con un mensaje de contraseña incorrecta)`);
  return {url,cookies,alerts};
});
await test('UI08','Baja de cuenta: confirmación, sesión cerrada y acceso posterior rechazado',async()=>{
  await page.goto(`${WEB}/account`);
  const btn=page.getByRole('button',{name:'Eliminar mi cuenta y datos'});
  await btn.click();
  assert.ok(page.url().includes('/account'),'sin contraseña ni confirmación no debe eliminar');
  assert.equal((await page.request.get(`${WEB}/api/proxy/portfolio/holdings`)).status(),200,'la cuenta debe seguir activa');
  await page.getByLabel('Confirmá tu contraseña').fill(password);await page.getByRole('checkbox').check();
  await shot(page,'baja-cuenta');
  await btn.click();
  await page.waitForURL(/\/login/);
  const old=await ctx.request.get(`${WEB}/api/proxy/portfolio/holdings`,{headers:{Cookie:`allocia_token=${cookieA.value}`}});
  assert.equal(old.status(),401);
  await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Contraseña',{exact:true}).fill(password);
  provoking=true;await page.getByRole('button',{name:'Iniciar sesión'}).click();await visible(page.locator('p[role=alert]'));provoking=false;
  return {tokenAnterior:old.status(),loginPosterior:'rechazado'};
});
await test('X10','La baja no afecta a otra cuenta',async()=>{
  const hb=await pb.request.get(`${WEB}/api/proxy/portfolio/holdings`);assert.equal(hb.status(),200);
  await pb.goto(`${WEB}/account`);
  await pb.getByLabel('Confirmá tu contraseña').fill(password);await pb.getByRole('checkbox').check();
  await pb.getByRole('button',{name:'Eliminar mi cuenta y datos'}).click();await pb.waitForURL(/\/login/);return 'cuenta B eliminada';
});
await test('UI09','Sin errores JavaScript ni de consola durante todo el recorrido',async()=>assert.deepEqual(problems,[],problems.join(' || ')));

const version=browser.version();await browser.close();
const report={executedAt:new Date().toISOString(),browser:`Chromium ${version}`,target:WEB,provocados:provoked,total:results.length,passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,results,problems};
fs.writeFileSync(OUT,JSON.stringify(report,null,2)+'\n');
console.log(`TOTAL ${report.total}: ${report.passed} PASS, ${report.failed} FAIL`);
process.exitCode=report.failed?1:0;
})().catch(async e=>{console.error('ERROR FATAL',e);await browser?.close();process.exitCode=2;});
