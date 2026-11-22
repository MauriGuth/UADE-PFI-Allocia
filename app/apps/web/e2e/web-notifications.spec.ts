import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Avisos del navegador para las alertas (mientras la web está abierta). Corre contra la API real con la
// cuenta demo; las alertas se simulan en el navegador y los avisos se registran sin depender del sistema.
const DEMO = { email: "demo@allocia.app", password: "allocia123" };

interface Shown {
  title: string;
  body?: string;
  tag?: string;
}
const shown = (page: Page) => page.evaluate(() => (window as unknown as { __shown: Shown[] }).__shown);

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(DEMO.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(DEMO.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/resumen/);
}

const alertRow = (id: number) => ({
  id: String(id),
  reportId: String(id + 1000),
  readAt: null,
  ticker: "AAPL",
  region: "EE.UU.",
  createdAt: new Date().toISOString(),
  payload: {
    report: { status: "analysis", summary: "Resumen de prueba", facts: [], scenarios: [], limitations: [] },
    snapshot: { sources: [] },
  },
});

test("avisos del navegador: activar, probar, avisar con la pestaña oculta, contador y desactivar", async ({ page }) => {
  await page.addInitScript(() => {
    // El permiso se simula: el navegador de CI (headless shell) no concede notificaciones.
    Object.defineProperty(Notification, "permission", { get: () => "granted", configurable: true });
    Notification.requestPermission = async () => "granted";
    const log: Shown[] = [];
    (window as unknown as { __shown: Shown[] }).__shown = log;
    ServiceWorkerRegistration.prototype.showNotification = function (title: string, options?: NotificationOptions) {
      log.push({ title, body: options?.body, tag: options?.tag });
      return Promise.resolve();
    };
  });
  let alerts: ReturnType<typeof alertRow>[] = [];
  await page.route("**/api/proxy/market/alerts", (route) => route.fulfill({ json: alerts }));
  await page.clock.install();

  await login(page);

  // 1. Activar desde la pantalla Alertas.
  await page.getByRole("link", { name: "Alertas" }).first().click();
  const panel = page.getByRole("region", { name: "Notificaciones del navegador" });
  await expect(panel).toBeVisible();
  const accessibility = await new AxeBuilder({ page })
    .include('section[aria-labelledby="notif-titulo"]')
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(accessibility.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? "")).map((v) => v.id)).toEqual([]);
  await panel.getByRole("button", { name: "Activar notificaciones del navegador" }).click();
  await expect(panel.getByText("Notificaciones activadas")).toBeVisible();

  // 2. La prueba muestra un aviso real al instante.
  await panel.getByRole("button", { name: "Enviar notificación de prueba" }).click();
  await expect.poll(async () => (await shown(page)).length).toBe(1);
  expect((await shown(page))[0].body).toContain("Prueba");

  // 3. Fuera de Alertas: lo pendiente al activar no genera avisos; lo nuevo sí, si la pestaña no se ve.
  await page.getByRole("link", { name: "Resumen" }).first().click();
  await expect(page).toHaveURL(/\/resumen/);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { get: () => "hidden", configurable: true });
    document.hasFocus = () => false;
  });
  alerts = [alertRow(9001)];
  await page.clock.fastForward(60_000);
  await expect.poll(async () => (await shown(page)).length).toBe(2);
  expect((await shown(page))[1].body).toBe("Tenés un nuevo análisis disponible. Abrí Allocia para ver las fuentes y los riesgos.");
  expect((await shown(page))[1].body).not.toContain("AAPL");

  // 4. El menú muestra cuántas hay sin leer, sin cambiar el nombre del enlace.
  const link = page.getByRole("link", { name: "Alertas", exact: true }).first();
  await expect(link).toHaveAccessibleDescription("1 alerta sin leer");

  // 5. La misma alerta no se repite; una nueva sí.
  await page.clock.fastForward(60_000);
  await page.waitForTimeout(300);
  expect(await shown(page)).toHaveLength(2);
  alerts = [alertRow(9001), alertRow(9002)];
  await page.clock.fastForward(60_000);
  await expect.poll(async () => (await shown(page)).length).toBe(3);
  await expect(link).toHaveAccessibleDescription("2 alertas sin leer");

  // 6. Con la pestaña a la vista alcanza el contador: no hay aviso del sistema.
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { get: () => "visible", configurable: true });
    document.hasFocus = () => true;
  });
  alerts = [alertRow(9001), alertRow(9002), alertRow(9003)];
  await page.clock.fastForward(60_000);
  await expect(link).toHaveAccessibleDescription("3 alertas sin leer");
  expect(await shown(page)).toHaveLength(3);

  // 7. Desactivar corta los avisos (el contador sigue).
  alerts = [];
  await link.click();
  await panel.getByRole("button", { name: "Desactivar" }).click();
  await expect(panel.getByRole("button", { name: "Activar notificaciones del navegador" })).toBeVisible();
  await page.getByRole("link", { name: "Resumen" }).first().click();
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { get: () => "hidden", configurable: true });
    document.hasFocus = () => false;
  });
  alerts = [alertRow(9004)];
  await page.clock.fastForward(60_000);
  await expect(link).toHaveAccessibleDescription("1 alerta sin leer");
  expect(await shown(page)).toHaveLength(3);
});

test("con el permiso bloqueado el panel lo explica, sin errores de hidratación ni de consola", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (m) => ["error", "warning"].includes(m.type()) && problems.push(m.text().slice(0, 300)));
  page.on("pageerror", (e) => problems.push(e.message.slice(0, 300)));
  await page.addInitScript(() => {
    Object.defineProperty(Notification, "permission", { get: () => "denied", configurable: true });
  });
  await login(page);
  await page.goto("/market"); // render completo desde el servidor: ahí se detecta un desajuste de hidratación
  const panel = page.getByRole("region", { name: "Notificaciones del navegador" });
  await expect(panel.getByText(/bloqueadas para este sitio/)).toBeVisible();
  await expect(panel.getByRole("button", { name: /Activar/ })).toHaveCount(0);
  await page.waitForLoadState("networkidle");
  expect(problems, problems.join("\n")).toEqual([]);
});

test("el service worker de avisos se sirve desde el propio sitio y no intercepta pedidos", async ({ request }) => {
  const response = await request.get("/sw.js");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/javascript/);
  const csp = (await request.get("/login")).headers()["content-security-policy"] ?? "";
  expect(csp).toMatch(/worker-src 'self'/);
  const source = await response.text();
  expect(source).toContain("notificationclick");
  expect(source).not.toContain("addEventListener(\"fetch\"");
});
