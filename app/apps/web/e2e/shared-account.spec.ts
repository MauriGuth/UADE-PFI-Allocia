import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

interface MobileModule {
  setAuthToken(token: string): void;
  api: {
    login(email: string, password: string): Promise<{token: string; user: {id: number}}>;
    register(name: string, email: string, password: string): Promise<{token: string}>;
    addPosition(ticker: string, quantity: number): Promise<unknown>;
    updatePosition(id: number, quantity: number): Promise<unknown>;
    removePosition(id: number): Promise<unknown>;
    holdings(): Promise<{id: number; quantity: number}[]>;
    exportData(): Promise<{positions: {quantity: number}[]}>;
    marketPreferences(enabled: boolean): Promise<unknown>;
    marketStatus(): Promise<{alertsEnabled: boolean}>;
    marketReports(): Promise<unknown[]>;
    deleteAccount(password: string): Promise<unknown>;
    me(): Promise<unknown>;
  };
}

// Execute the actual mobile HTTP client, without pretending this is a phone UI test.
function mobileClient(baseURL: string) {
  const source = readFileSync(resolve(process.cwd(), '../mobile/lib/api.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports: Record<string, unknown> = {};
  runInNewContext(code, { exports, process: { env: { EXPO_PUBLIC_API_URL: baseURL } }, __DEV__: true, fetch });
  return exports as unknown as MobileModule;
}

test('same account: web and mobile client share positions, preferences and deletion', async ({ page, baseURL }) => {
  test.setTimeout(90_000);
  const apiURL = process.env.API_TEST_URL ?? 'http://127.0.0.1:41873';
  if (!['localhost', '127.0.0.1'].includes(new URL(apiURL).hostname)) throw new Error('Use an isolated local API for this test');
  const mobile = mobileClient(apiURL);
  const other = mobileClient(apiURL);
  const password = 'Shared-account-isolated-1234';
  const email = `shared-${Date.now()}@example.test`;
  let firstCreated = false;
  let otherCreated = false;
  let deleted = false;
  const origin = { Origin: new URL(baseURL!).origin };
  try {
    const registered = await page.request.post('/api/auth/register', {
      headers: origin, data: { name: 'Cuenta compartida', email, password, privacyAccepted: true },
    });
    expect(registered.ok()).toBe(true);
    firstCreated = true;
    const userWeb = (await registered.json()).user;
    const login = await mobile.api.login(email, password);
    mobile.setAuthToken(login.token);
    expect(login.user.id).toBe(userWeb.id);
    const second = await other.api.register('Otra cuenta', `other-${Date.now()}@example.test`, password);
    other.setAuthToken(second.token);
    otherCreated = true;

    await mobile.api.addPosition('AAPL', 2.5);
    await page.goto('/cartera');
    await expect(page.getByRole('button', { name: 'Editar AAPL' }).first()).toBeVisible();
    let holdings = await (await page.request.get('/api/proxy/portfolio/holdings')).json();
    const position = holdings.find((p: { ticker: string }) => p.ticker === 'AAPL');
    expect(position.quantity).toBe(2.5);
    await page.getByRole('button', { name: 'Editar AAPL' }).first().click();
    await page.getByLabel('Nueva cantidad').fill('4');
    const saved = page.waitForResponse(r => r.request().method() === 'PATCH' && r.url().endsWith(`/positions/${position.id}`));
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    expect((await saved).ok()).toBe(true);
    expect((await mobile.api.holdings())[0].quantity).toBe(4);
    expect((await mobile.api.exportData()).positions[0].quantity).toBe(4);

    // A change from the phone is picked up on browser focus, without a reload
    // and without losing the user's unfinished form.
    if (!(await page.getByLabel('Ticker / Símbolo').isVisible())) await page.getByRole('button', { name: 'Agregar activo', exact: true }).click();
    await page.getByLabel('Ticker / Símbolo').fill('MSFT');
    await page.getByLabel('Cantidad (en unidades)', { exact: true }).fill('7');
    await mobile.api.updatePosition(position.id, 6.75);
    const refreshed = page.waitForResponse(r => r.url().endsWith('/api/proxy/portfolio/holdings'));
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    expect((await refreshed).ok()).toBe(true);
    await expect(page.getByLabel('Ticker / Símbolo')).toHaveValue('MSFT');
    await expect(page.getByLabel('Cantidad (en unidades)', { exact: true })).toHaveValue('7');
    holdings = await (await page.request.get('/api/proxy/portfolio/holdings')).json();
    expect(holdings[0].quantity).toBe(6.75);

    await mobile.api.marketPreferences(true);
    expect((await (await page.request.get('/api/proxy/market/status')).json()).alertsEnabled).toBe(true);
    const preference = await page.request.patch('/api/proxy/market/preferences', { headers: origin, data: { enabled: false } });
    expect(preference.ok()).toBe(true);
    expect((await mobile.api.marketStatus()).alertsEnabled).toBe(false);
    const reports = await (await page.request.get('/api/proxy/market/reports')).json();
    expect(JSON.stringify(await mobile.api.marketReports())).toBe(JSON.stringify(reports));

    expect((await other.api.holdings()).length).toBe(0);
    expect(await other.api.updatePosition(position.id, 99).then(() => false, () => true)).toBe(true);
    expect(await other.api.removePosition(position.id).then(() => false, () => true)).toBe(true);
    expect((await mobile.api.holdings())[0].quantity).toBe(6.75);
    await mobile.api.removePosition(position.id);
    expect(await (await page.request.get('/api/proxy/portfolio/holdings')).json()).toEqual([]);
    const removed = await page.request.delete('/api/proxy/auth/me', { headers: origin, data: { password } });
    expect(removed.ok()).toBe(true);
    deleted = true;
    expect(await mobile.api.me().then(() => false, () => true)).toBe(true);
  } finally {
    if (firstCreated && !deleted) {
      const session = await mobile.api.login(email, password);
      mobile.setAuthToken(session.token);
      await mobile.api.deleteAccount(password);
    }
    if (otherCreated) await other.api.deleteAccount(password);
  }
});
