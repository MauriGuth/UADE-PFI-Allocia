import { test, expect } from '@playwright/test';

test('baja con contraseña incorrecta: muestra el error, conserva la sesión y permite reintentar', async ({ page }) => {
  test.setTimeout(60000);
  const email = `wrong-password-${Date.now()}@example.test`;
  const password = 'Wrong-password-isolated-1234';
  await page.goto('/register');
  await page.getByLabel('Nombre', { exact: true }).fill('Prueba baja');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page).toHaveURL(/\/resumen/);

  await page.goto('/account');
  await page.getByLabel('Confirmá tu contraseña').fill('contraseña-incorrecta');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Eliminar mi cuenta y datos' }).click();
  await expect(page.locator('p[role=alert]')).toContainText('Contraseña incorrecta');
  await expect(page).toHaveURL(/\/account$/);
  expect((await page.context().cookies()).some((c) => c.name === 'allocia_token')).toBe(true);
  expect((await page.request.get('/api/proxy/portfolio/holdings')).status()).toBe(200);

  // La persona puede reintentar con la contraseña correcta y la cuenta se elimina.
  await page.getByLabel('Confirmá tu contraseña').fill(password);
  await page.getByRole('button', { name: 'Eliminar mi cuenta y datos' }).click();
  await expect(page).toHaveURL(/\/login/);
});
