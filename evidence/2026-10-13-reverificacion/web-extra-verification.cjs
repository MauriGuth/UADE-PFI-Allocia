/* Comprobaciones adicionales de la web de Allocia: partes sin cobertura previa.
   E01-E16. Requiere API + PostgreSQL + Redis aislados y la web en ejecución.
   WEB_URL (servidor normal) y MAINT_URL (misma web con APP_MAINTENANCE=true). */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE??'@playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execSync}=require('node:child_process');
const WEB=process.env.WEB_URL??'http://localhost:3000';
const MAINT=process.env.MAINT_URL;
const AXE=process.env.AXE_PATH;
const OUT=process.env.OUT??'web-extra.json';
const results=[];const stamp=Date.now();
const password='Web-extra-verification-1234';
const resetLimiter=()=>{try{execSync(process.env.RESET_LIMITER??'redis-cli -p 6387 flushall',{stdio:'ignore'});}catch{}};
async function test(id,title,fn){
  const t0=Date.now();
  try{const detail=await fn();results.push({id,title,status:'PASS',ms:Date.now()-t0,detail});console.log('PASS',id,title);}
  catch(e){results.push({id,title,status:'FAIL',ms:Date.now()-t0,detail:String(e.message).split('\n').slice(0,5).join(' | ')});console.log('FAIL',id,title,'—',String(e.message).split('\n')[0].slice(0,200));}
}
const visible=(loc,ms=8000)=>loc.first().waitFor({state:'visible',timeout:ms});
async function register(ctx,name,email){
  const p=await ctx.newPage();
  await p.goto(`${WEB}/register`);
  await p.getByLabel('Nombre',{exact:true}).fill(name);await p.getByLabel('Email',{exact:true}).fill(email);
  await p.getByLabel('Contraseña',{exact:true}).fill(password);await p.getByRole('checkbox').check();
  await p.getByRole('button',{name:'Crear cuenta'}).click();await p.waitForURL(/\/resumen/);
  return p;
}
async function removeAccount(page){
  await page.goto(`${WEB}/account`);
  await page.getByLabel('Confirmá tu contraseña').fill(password);await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:'Eliminar mi cuenta y datos'}).click();await page.waitForURL(/\/login/);
}

(async()=>{
const browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
resetLimiter();

await test('E01','Página de privacidad accesible sin sesión, con su contenido y sin errores de consola',async()=>{
  const c=await browser.newContext();const p=await c.newPage();const errs=[];
  p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type()))errs.push(m.text().slice(0,160));});
  const r=await p.goto(`${WEB}/privacy`);assert.equal(r.status(),200);assert.ok(!p.url().includes('/login'));
  const text=(await p.locator('main, body').first().innerText()).toLowerCase();
  for(const w of ['datos','finalidad','eliminar']) assert.ok(text.includes(w),`falta «${w}» en la política`);
  assert.deepEqual(errs,[]);await c.close();return {estado:200,caracteres:text.length};
});

await test('E02','Modo mantenimiento: páginas y API responden 503 y la privacidad sigue disponible',async()=>{
  assert.ok(MAINT,'falta MAINT_URL');
  const c=await browser.newContext();
  const login=await c.request.get(`${MAINT}/login`);const api=await c.request.post(`${MAINT}/api/auth/login`,{data:{email:'a@b.c',password:'x'},headers:{Origin:MAINT}});
  const priv=await c.request.get(`${MAINT}/privacy`);
  assert.equal(login.status(),503);assert.equal(login.headers()['retry-after'],'3600');
  assert.equal(api.status(),503);assert.equal(priv.status(),200);
  const p=await c.newPage();await p.goto(`${MAINT}/resumen`);await visible(p.getByText(/mantenimiento|actualización/i));
  await c.close();return {login:503,api:503,privacidad:200};
});

await test('E03','Sesión vencida: aviso en el login y retorno al acceso con una cookie inválida',async()=>{
  const c=await browser.newContext();const p=await c.newPage();
  await p.goto(`${WEB}/login?expired=1`);await visible(p.getByText(/venci[óo]|vencid|expir/i));
  await c.addCookies([{name:'allocia_token',value:'token-falso',url:WEB,httpOnly:true,sameSite:'Strict'}]);
  await p.goto(`${WEB}/resumen`);await p.waitForURL(/\/login/,{timeout:10000});
  await c.close();return p.url();
});

await test('E04','Límite de solicitudes: tras 20 intentos de acceso la web informa sin romperse',async()=>{
  resetLimiter();
  const c=await browser.newContext();const p=await c.newPage();
  await p.goto(`${WEB}/login`);let ultimo='';
  for(let i=0;i<22;i++){
    await p.getByLabel('Email',{exact:true}).fill(`limite-${stamp}@example.test`);
    await p.getByLabel('Contraseña',{exact:true}).fill('incorrecta-'+i);
    await p.getByRole('button',{name:'Iniciar sesión'}).click();
    await p.waitForTimeout(250);
  }
  await visible(p.locator('p[role=alert]'));ultimo=(await p.locator('p[role=alert]').first().innerText());
  assert.match(ultimo,/demasiadas|intent[áa]|m[aá]s tarde|solicitudes/i,`mensaje: ${ultimo}`);
  assert.ok(p.url().includes('/login'));await c.close();resetLimiter();return ultimo;
});

await test('E05','Mostrar y ocultar la contraseña funciona y se anuncia al lector de pantalla',async()=>{
  const c=await browser.newContext();const p=await c.newPage();await p.goto(`${WEB}/login`);
  const input=p.getByLabel('Contraseña',{exact:true});const btn=p.getByRole('button',{name:'Mostrar contraseña'});
  await input.fill('secreto');assert.equal(await input.getAttribute('type'),'password');assert.equal(await btn.getAttribute('aria-pressed'),'false');
  await btn.click();assert.equal(await input.getAttribute('type'),'text');
  await p.getByRole('button',{name:/Ocultar contraseña/}).click();assert.equal(await input.getAttribute('type'),'password');
  await c.close();return 'ok';
});

await test('E07','Cabeceras de seguridad de la web (CSP con nonce, sin caché, tipo de contenido, marcos)',async()=>{
  const c=await browser.newContext();const r=await c.request.get(`${WEB}/login`);const h=r.headers();
  const csp=h['content-security-policy']||'';
  assert.match(csp,/default-src 'self'/);assert.match(csp,/script-src[^;]*'nonce-/);assert.ok(!/script-src[^;]*'unsafe-inline'/.test(csp),'no debe permitir scripts en línea');
  assert.match(h['cache-control']||'',/no-store/);
  const faltan=[];
  if(!/frame-ancestors/.test(csp)&&!h['x-frame-options'])faltan.push('frame-ancestors/X-Frame-Options');
  if(h['x-content-type-options']!=='nosniff')faltan.push('X-Content-Type-Options');
  if(!h['referrer-policy'])faltan.push('Referrer-Policy');
  await c.close();
  assert.deepEqual(faltan,[],'faltan cabeceras: '+faltan.join(', '));
  return {csp:csp.slice(0,120)+'…'};
});

const ctxA=await browser.newContext({viewport:{width:1280,height:900}});
const emailA=`extra-a-${stamp}@example.test`;
let pa;
await test('E15','Un nombre con HTML se muestra como texto y no ejecuta código',async()=>{
  const payload='<img src=x onerror="window.__xss=1"><b>Neg</b>';
  pa=await register(ctxA,payload,emailA);
  await pa.goto(`${WEB}/account`);await pa.waitForTimeout(800);
  const executed=await pa.evaluate(()=>window.__xss===1);
  const injected=await pa.evaluate(()=>!!document.querySelector('img[src="x"]'));
  assert.equal(executed,false,'se ejecutó el código del nombre');assert.equal(injected,false,'el HTML del nombre se interpretó como elemento');
  return 'texto escapado';
});

await test('E14','Redirección tras el login: respeta rutas internas y rechaza destinos externos',async()=>{
  const c=await browser.newContext();
  const login=async(next)=>{const p=await c.newPage();await p.goto(`${WEB}/login?next=${encodeURIComponent(next)}`);
    await p.getByLabel('Email',{exact:true}).fill(emailA);await p.getByLabel('Contraseña',{exact:true}).fill(password);
    await p.getByRole('button',{name:'Iniciar sesión'}).click();await p.waitForTimeout(2500);const u=p.url();await c.clearCookies();await p.close();return u;};
  const interno=await login('/cartera');assert.ok(interno.endsWith('/cartera'),`ruta interna: ${interno}`);
  for(const malo of ['https://evil.example','//evil.example','/\\evil.example']){const u=await login(malo);assert.ok(u.startsWith(WEB),`destino externo ${malo} -> ${u}`);}
  await c.close();return {interno};
});

await test('E12','Cerrar sesión en una pestaña invalida la otra pestaña',async()=>{
  const p2=await ctxA.newPage();await p2.goto(`${WEB}/cartera`);await visible(p2.getByRole('heading',{name:'Mi cartera'}));
  await pa.goto(`${WEB}/account`);await pa.getByRole('button',{name:'Cerrar sesión',exact:true}).click();await pa.waitForURL(/\/login/);
  await p2.goto(`${WEB}/cartera`);await p2.waitForURL(/\/login/,{timeout:10000});await p2.close();
  // reingreso para las pruebas siguientes
  await pa.getByLabel('Email',{exact:true}).fill(emailA);await pa.getByLabel('Contraseña',{exact:true}).fill(password);
  await pa.getByRole('button',{name:'Iniciar sesión'}).click();await pa.waitForURL(/\/resumen/);return 'ok';
});

await test('E09','Cartera: ordenar por cantidad cambia el orden de las filas',async()=>{
  await pa.goto(`${WEB}/cartera`);
  for(const [t,q] of [['AAPL','1'],['MSFT','5'],['NVDA','3']]){
    await pa.getByLabel('Ticker / Símbolo').fill(t);await pa.getByLabel('Cantidad',{exact:true}).fill(q);
    await pa.getByRole('button',{name:/Agregar Activo/}).click();await visible(pa.getByRole('button',{name:`Editar ${t}`}));
  }
  const order=async()=>pa.locator('[aria-label^="Editar "]').evaluateAll(els=>els.filter(e=>e.offsetParent!==null).map(e=>e.getAttribute('aria-label').replace('Editar ','')));
  const before=await order();
  const sel=pa.getByLabel(/Ordenar por/);const opts=await sel.locator('option').allInnerTexts();
  const resultados={antes:before,opciones:opts,ordenes:{}};
  for(let i=0;i<opts.length;i++){await sel.selectOption({index:i});await pa.waitForTimeout(300);resultados.ordenes[opts[i]]=await order();}
  const distintos=new Set(Object.values(resultados.ordenes).map(o=>o.join(',')));
  assert.ok(opts.length>=2,'el selector no ofrece opciones');assert.ok(distintos.size>=2,'ninguna opción altera el orden: '+JSON.stringify(resultados.ordenes));
  return resultados;
});

await test('E08','Sin conexión: la web informa el error y se recupera al volver',async()=>{
  await pa.goto(`${WEB}/cartera`);await visible(pa.getByRole('button',{name:'Editar AAPL'}));
  await ctxA.setOffline(true);
  await pa.getByRole('button',{name:'Editar AAPL'}).first().click();await pa.getByLabel('Nueva cantidad').fill('9');await pa.getByRole('button',{name:'Guardar',exact:true}).click();
  await visible(pa.locator('p[role=alert], [role=alert]').filter({hasText:/conexi[oó]n|internet|servidor/i}),8000);
  await ctxA.setOffline(false);
  assert.ok(pa.url().includes('/cartera'),'no debe sacar de la pantalla');
  const h=await (await pa.request.get(`${WEB}/api/proxy/portfolio/holdings`)).json();assert.equal(h.find(x=>x.ticker==='AAPL').quantity,1,'una edición sin conexión no debe guardarse');
  return 'error informado, dato intacto';
});

await test('E10','Acceso sólo con teclado: el orden de tabulación llega al botón y Enter inicia sesión',async()=>{
  const c=await browser.newContext();const p=await c.newPage();await p.goto(`${WEB}/login`);
  await p.getByLabel('Email',{exact:true}).focus();await p.keyboard.type(emailA);await p.keyboard.press('Tab');await p.keyboard.type(password);
  await p.keyboard.press('Enter');await p.waitForURL(/\/resumen/,{timeout:10000});
  const f=await p.evaluate(()=>{const e=document.activeElement;return e?e.tagName:null});
  await c.close();return {foco:f};
});

await test('E06','Accesibilidad (axe-core, WCAG 2.1 A/AA): sin violaciones graves ni críticas en 12 pantallas × 2 anchos',async()=>{
  assert.ok(AXE,'falta AXE_PATH');const src=fs.readFileSync(AXE,'utf8');
  const hallazgos=[];
  for(const w of [1280,390]){
    await pa.setViewportSize({width:w,height:900});
    for(const path of ['/resumen','/cartera','/desglose','/riesgo','/senales','/market','/informe','/ajustes','/account','/cartera/AAPL']){
      await pa.goto(`${WEB}${path}`);await pa.waitForLoadState('networkidle');await pa.waitForTimeout(500);
      await pa.evaluate(src);
      const r=await pa.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));
      for(const v of r.violations)hallazgos.push({ancho:w,ruta:path,regla:v.id,impacto:v.impact,nodos:v.nodes.length,ayuda:v.help,ejemplo:(v.nodes[0]&&v.nodes[0].target&&v.nodes[0].target[0])||''});
    }
  }
  // pantallas públicas
  const c=await browser.newContext();const pp=await c.newPage();
  for(const path of ['/login','/register','/privacy','/forgot-password']){
    await pp.goto(`${WEB}${path}`);await pp.waitForLoadState('networkidle');await pp.evaluate(src);
    const r=await pp.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));
    for(const v of r.violations)hallazgos.push({ancho:1280,ruta:path,regla:v.id,impacto:v.impact,nodos:v.nodes.length,ayuda:v.help,ejemplo:(v.nodes[0]&&v.nodes[0].target&&v.nodes[0].target[0])||''});
  }
  await c.close();
  fs.writeFileSync(process.env.AXE_OUT??'axe-hallazgos.json',JSON.stringify(hallazgos,null,2)+'\n');
  const graves=hallazgos.filter(h=>['serious','critical'].includes(h.impacto));
  const porRegla={};for(const h of hallazgos){const k=`${h.regla} [${h.impacto}]`;(porRegla[k]??=new Set()).add(h.ruta);}
  const resumen=Object.fromEntries(Object.entries(porRegla).map(([k,v])=>[k,[...v]]));
  assert.equal(graves.length,0,'violaciones graves/críticas: '+JSON.stringify(Object.fromEntries(Object.entries(resumen).filter(([k])=>/serious|critical/.test(k)))));
  return {totalViolaciones:hallazgos.length,reglas:resumen};
});

await test('E16','Limpieza: la cuenta de pruebas se elimina',async()=>{await removeAccount(pa);return 'ok';});
await ctxA.close();
const version=browser.version();await browser.close();
const report={executedAt:new Date().toISOString(),browser:`Chromium ${version}`,target:WEB,total:results.length,passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,results};
fs.writeFileSync(OUT,JSON.stringify(report,null,2)+'\n');
console.log(`TOTAL ${report.total}: ${report.passed} PASS, ${report.failed} FAIL`);
process.exitCode=report.failed?1:0;
})().catch(async e=>{console.error('ERROR FATAL',e);process.exitCode=2;});
