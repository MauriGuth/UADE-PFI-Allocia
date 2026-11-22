import {test,expect} from '@playwright/test';

test('cartera legible, búsqueda, informes y errores sin falsos vacíos',async({page,baseURL})=>{
  test.setTimeout(90_000);
  const origin={Origin:new URL(baseURL!).origin};
  const password='Isolated-visual-2026!';
  const registered=await page.request.post('/api/auth/register',{headers:origin,data:{name:'Prueba visual',email:`visual-${Date.now()}@example.test`,password,privacyAccepted:true}});
  expect(registered.ok()).toBe(true);
  const problems:string[]=[]; page.on('pageerror',e=>problems.push(e.message));
  try {
    for(const ticker of ['AAPL','BTC'])expect((await page.request.post('/api/proxy/portfolio/positions',{headers:origin,data:{ticker,quantity:ticker==='BTC'?0.00012345:2.5}})).ok()).toBe(true);
    await page.route('**/catalog/*/logo',r=>r.fulfill({json:{dataUri:null,source:null}}));
    for(const width of [320,390,768,1280]){
      await page.setViewportSize({width,height:900}); await page.goto('/cartera');
      await expect(page.getByRole('button',{name:'Editar AAPL',exact:true})).toBeVisible();
      await expect(page.getByText('Cantidad que tenés',{exact:true})).toHaveCount(2);
      await expect(page.getByText('Precio por unidad',{exact:true})).toHaveCount(2);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    }
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(()=>document.documentElement.style.fontSize='200%');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    await page.evaluate(()=>document.documentElement.style.fontSize='');
    await page.getByLabel('Buscar en tu cartera').fill('bitcoin');
    await expect(page.getByRole('button',{name:'Editar BTC',exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:'Editar AAPL',exact:true})).toHaveCount(0);
    await page.getByLabel('Buscar en tu cartera').fill('no-existe');
    await page.getByRole('button',{name:'Limpiar búsqueda'}).click();
    await page.getByText('Fuente y actualización de AAPL',{exact:true}).click();
    await expect(page.getByText(/Consultar de nuevo no cambia su fecha/).first()).toBeVisible();
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:'/tmp/allocia-polish-cartera.png'});

    let release!:()=>void;
    const gate=new Promise<void>(resolve=>{release=resolve;});
    await page.route('**/api/proxy/market/status',async r=>{await gate;await r.fulfill({json:{configured:true,calendarConfigured:true,coverage:[],alertsEnabled:true,analysisRequests:[]}});});
    await page.route('**/api/proxy/market/alerts',r=>r.fulfill({json:[]}));
    await page.route('**/api/proxy/market/reports',r=>r.fulfill({json:[{id:'visual-fixture',ticker:'BTC',region:'Global',createdAt:'2026-10-10T12:00:00Z',payload:{report:{status:'insufficient_data',summary:'La volatilidad es alta. El RSI y el MACD muestran señales diferentes; no hay evidencia suficiente para anticipar una dirección.',facts:[],scenarios:[{direction:'down',condition:'Que aumente la presión de venta.',explanation:'El precio podría bajar; este resultado no está asegurado.',sourceIds:[]}],limitations:['Faltan datos para completar la comparación.']},snapshot:{quote:null,sources:[]}}}]}));
    await page.goto('/market');
    await expect(page.getByRole('status')).toContainText('Buscando tus análisis');
    await expect(page.getByText('Tus análisis aparecerán aquí',{exact:true})).toHaveCount(0);
    release();
    // Bandeja de Alertas: en pantallas chicas se elige el análisis en la lista y recién ahí se ve el detalle.
    await page.getByRole('button',{name:/BTC/}).first().click();
    await page.getByText('¿Qué significan estos términos?',{exact:true}).click();
    await expect(page.getByText(/RSI: compara/)).toBeVisible();
    await page.getByText('Ver fuentes y limitaciones',{exact:true}).click();
    await expect(page.getByText(/Si ocurre: Que aumente/)).toBeVisible();
    await expect(page.getByText('Faltan datos para completar la comparación.',{exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    await page.getByRole('heading',{name:'BTC · Global'}).scrollIntoViewIfNeeded();
    await page.screenshot({path:'/tmp/allocia-polish-informes.png'});
    await page.route('**/api/proxy/market/status',r=>r.fulfill({status:503,json:{message:'Fuente temporalmente no disponible'}}));
    await page.reload();
    await expect(page.getByRole('button',{name:'Reintentar',exact:true})).toBeVisible();
    await expect(page.getByText('Tus análisis aparecerán aquí',{exact:true})).toHaveCount(0);
    expect(problems).toEqual([]);
  } finally {
    expect((await page.request.delete('/api/proxy/auth/me',{headers:origin,data:{password}})).ok()).toBe(true);
  }
});
