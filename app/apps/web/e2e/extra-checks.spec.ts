import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

const SIN_SESION = ['/login', '/register', '/privacy'];

test('privacidad: pública, con su contenido y sin errores de consola', async ({ page }) => {
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(e.message));
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errores.push(m.text()); });
  const r = await page.goto('/privacy');
  expect(r?.status()).toBe(200);
  expect(page.url()).not.toContain('/login');
  const texto = (await page.locator('main, body').first().innerText()).toLowerCase();
  for (const palabra of ['datos', 'finalidad', 'eliminar']) expect(texto).toContain(palabra);
  expect(errores).toEqual([]);
});

test('sesión vencida: aviso en el login y retorno al acceso con una cookie inválida', async ({ page, context, baseURL }) => {
  await page.goto('/login?expired=1');
  await expect(page.getByText(/venci[óo]|vencid|expir/i).first()).toBeVisible();
  await context.addCookies([{ name: 'allocia_token', value: 'token-falso', url: baseURL!, httpOnly: true, sameSite: 'Strict' }]);
  await page.goto('/resumen');
  await expect(page).toHaveURL(/\/login/);
});

test('mostrar y ocultar la contraseña, anunciado al lector de pantalla', async ({ page }) => {
  await page.goto('/login');
  const campo = page.getByLabel('Contraseña', { exact: true });
  const boton = page.getByRole('button', { name: 'Mostrar contraseña' });
  await campo.fill('secreto');
  await expect(campo).toHaveAttribute('type', 'password');
  await expect(boton).toHaveAttribute('aria-pressed', 'false');
  await boton.click();
  await expect(campo).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: /Ocultar contraseña/ }).click();
  await expect(campo).toHaveAttribute('type', 'password');
});

test('cabeceras de seguridad: CSP con nonce, sin caché, nosniff, referrer y marcos', async ({ request }) => {
  const h = (await request.get('/login')).headers();
  const csp = h['content-security-policy'] ?? '';
  expect(csp).toMatch(/default-src 'self'/);
  expect(csp).toMatch(/script-src[^;]*'nonce-/);
  expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  expect(h['cache-control']).toMatch(/no-store/);
  expect(/frame-ancestors/.test(csp) || !!h['x-frame-options']).toBe(true);
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['referrer-policy']).toBeTruthy();
});

test('un nombre con HTML se muestra como texto y no ejecuta código', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Nombre', { exact: true }).fill('<img src=x onerror="window.__xss=1"><b>Neg</b>');
  await page.getByLabel('Email', { exact: true }).fill(`xss-${Date.now()}@example.test`);
  await page.getByLabel('Contraseña', { exact: true }).fill('Xss-isolated-1234');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page).toHaveURL(/\/resumen/);
  await page.goto('/account');
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss === 1)).toBe(false);
  expect(await page.evaluate(() => !!document.querySelector('img[src="x"]'))).toBe(false);
  await page.getByLabel('Confirmá tu contraseña').fill('Xss-isolated-1234');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Eliminar mi cuenta y datos' }).click();
  await expect(page).toHaveURL(/\/login/);
});

for (const ancho of [1280, 390]) {
  test(`accesibilidad (axe, WCAG 2.1 A/AA) sin violaciones graves en pantallas públicas a ${ancho}px`, async ({ page }) => {
    await page.setViewportSize({ width: ancho, height: 900 });
    for (const ruta of SIN_SESION) {
      await page.goto(ruta);
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const graves = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
      expect(graves.map((v) => `${ruta}: ${v.id}`)).toEqual([]);
    }
  });
}

test('accesibilidad (axe) en Señales con sesión: sin violaciones graves', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/register');
  await page.getByLabel('Nombre', { exact: true }).fill('Prueba axe');
  await page.getByLabel('Email', { exact: true }).fill(`axe-${Date.now()}@example.test`);
  await page.getByLabel('Contraseña', { exact: true }).fill('Axe-isolated-1234');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page).toHaveURL(/\/resumen/);
  for (const ruta of ['/resumen', '/cartera', '/senales', '/account']) {
    await page.goto(ruta);
    await page.waitForLoadState('networkidle');
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const graves = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
    expect(graves.map((v) => `${ruta}: ${v.id}`)).toEqual([]);
  }
  await page.goto('/account');
  await page.getByLabel('Confirmá tu contraseña').fill('Axe-isolated-1234');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Eliminar mi cuenta y datos' }).click();
  await expect(page).toHaveURL(/\/login/);
});
