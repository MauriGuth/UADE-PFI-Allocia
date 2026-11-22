import {test,expect} from '@playwright/test';
test('opportunities remain separate, support preferences and following, and explain sourced upside',async({page,baseURL})=>{
  const origin={Origin:new URL(baseURL!).origin};
  const registered=await page.request.post('/api/auth/register',{headers:origin,data:{name:'Opportunity test',email:`opportunity-${Date.now()}@example.test`,password:'Isolated-opportunities-2026!',privacyAccepted:true}});
  expect(registered.ok(),registered.ok()?"":await registered.text()).toBe(true);
  try {
    await page.goto('/market');await page.getByRole('button',{name:'Oportunidades',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Oportunidades fuera de tu cartera'})).toBeVisible();
    await page.getByRole('button',{name:'Activar alertas de oportunidades',exact:true}).click();
    await expect(page.getByRole('button',{name:'Desactivar alertas de oportunidades',exact:true})).toBeVisible();
    await page.getByLabel('Qué querés seguir').selectOption('watchlist');
    await expect.poll(async()=>(await (await page.request.get('/api/proxy/market/opportunities')).json()).preferences).toEqual({enabled:true,scope:'watchlist'});
    await page.route('**/api/proxy/catalog/search',r=>r.fulfill({json:{results:[{provider:'finnhub',id:'TSLA',symbol:'TSLA',name:'Tesla (fixture)'}],unavailable:[]}}));
    await page.route('**/api/proxy/catalog/import',r=>r.fulfill({json:{ticker:'TSLA'}}));
    await page.getByLabel('Nombre o símbolo del activo').fill('Tesla');await page.getByRole('button',{name:'Buscar',exact:true}).click();
    await page.getByRole('button',{name:'Seguir',exact:true}).click();await expect(page.getByRole('button',{name:'Dejar de seguir TSLA',exact:true})).toBeVisible();
    const holdings=await page.request.get('/api/proxy/portfolio/holdings');expect(JSON.stringify(await holdings.json())).not.toContain('TSLA');
    await page.getByRole('button',{name:'Dejar de seguir TSLA',exact:true}).click();await expect(page.getByText('No seguís activos todavía.')).toBeVisible();
    const feed=await (await page.request.get('/api/proxy/market/opportunities')).json();
    await page.route('**/api/proxy/market/opportunities',r=>r.fulfill({json:{...feed,reports:[{id:'fixture-report',ticker:'TSLA',region:'US',createdAt:new Date().toISOString(),alertId:null,payload:{report:{summary:'Ejemplo sintético: una expansión depende de aprobación.',scenarios:[{direction:'down',condition:'Si se demora',explanation:'La expansión puede no concretarse.'}],limitations:['Datos sintéticos para revisar la interfaz.']}},opportunity:{notice:'No es una probabilidad calculada ni una recomendación de compra.',scenarios:[{condition:'Si se aprueba el financiamiento',explanation:'Podría ampliar ingresos.',sources:[{title:'Fuente sintética identificada',url:'https://example.test/news',publishedAt:new Date().toISOString()}]}]}}]}}));
    await page.getByRole('button',{name:'Actualizar oportunidades'}).click();await expect(page.getByRole('heading',{name:'TSLA · Posible suba'})).toBeVisible();
    for(const width of [320,390,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0);}
    await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/allocia-opportunities-web.png',fullPage:true});
    await page.getByText('Fuentes de este escenario',{exact:true}).click();await expect(page.getByRole('link',{name:'Fuente sintética identificada'})).toHaveAttribute('href','https://example.test/news');
    await page.getByRole('button',{name:'Mi cartera',exact:true}).click();await expect(page.getByRole('heading',{name:'TSLA · Posible suba'})).toHaveCount(0);
  } finally {const removed=await page.request.delete('/api/proxy/auth/me',{headers:origin,data:{password:'Isolated-opportunities-2026!'}});expect(removed.ok(),removed.ok()?"":await removed.text()).toBe(true);}
});
