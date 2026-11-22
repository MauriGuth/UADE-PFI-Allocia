import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Pantallas públicas rediseñadas (landing, login, registro): navegación real, controles
// conservados y accesibilidad. No requieren API: la autenticación se cubre en app.spec.ts.

test("landing: los CTA llevan al login y al registro reales", async ({ page }) => {
  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));
  page.on("console", (m) => ["error", "warning"].includes(m.type()) && errores.push(m.text()));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Entendé tus inversiones");
  await expect(page.getByRole("img", { name: /Gráfico de asignación|Asignación de activos/ }).first()).toBeVisible();
  const enlaces: Array<[string, string]> = [
    ["Iniciar sesión", "/login"],
    ["Empezar", "/register"],
    ["Crear cuenta", "/register"],
    ["Ya tengo cuenta", "/login"],
  ];
  for (const [nombre, ruta] of enlaces) {
    await expect(page.getByRole("link", { name: nombre, exact: true })).toHaveAttribute("href", ruta);
  }
  await page.getByRole("link", { name: "Crear cuenta", exact: true }).click();
  await expect(page).toHaveURL(/\/register$/);
  await page.goto("/");
  await page.getByRole("link", { name: "Ya tengo cuenta", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(errores).toEqual([]);
});

test("login: controles conservados (volver, olvidé, registro) y envío deshabilitado hasta completar", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bienvenido de nuevo");
  await expect(page.getByRole("link", { name: "Volver" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("link", { name: "Olvidé mi contraseña" })).toHaveAttribute("href", "/forgot-password");
  await expect(page.getByRole("link", { name: "Registrate" })).toHaveAttribute("href", "/register");
  const enviar = page.getByRole("button", { name: "Iniciar sesión" });
  await expect(enviar).toBeDisabled();
  await page.getByLabel("Email", { exact: true }).fill("alguien@example.test");
  await expect(enviar).toBeDisabled();
  await page.getByLabel("Contraseña", { exact: true }).fill("x");
  await expect(enviar).toBeEnabled();
});

test("registro: privacidad obligatoria, contraseña de 12 caracteres y enlaces conservados", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Creá tu cuenta");
  await expect(page.getByRole("link", { name: "Iniciá sesión" })).toHaveAttribute("href", "/login");
  await expect(page.getByRole("link", { name: "política de privacidad" })).toHaveAttribute("href", "/privacy");
  const crear = page.getByRole("button", { name: "Crear cuenta" });
  await page.getByLabel("Nombre", { exact: true }).fill("Ana Pérez");
  await page.getByLabel("Email", { exact: true }).fill("ana@example.test");
  await page.getByLabel("Contraseña", { exact: true }).fill("corta-123");
  await page.getByRole("checkbox").check();
  await expect(crear).toBeDisabled();
  await page.getByLabel("Contraseña", { exact: true }).fill("una-clave-de-12+");
  await expect(crear).toBeEnabled();
  await page.getByRole("checkbox").uncheck();
  await expect(crear).toBeDisabled();
});

test("registro: tocar «Crear cuenta» con datos incompletos explica qué falta y lleva al primer campo (no se envía nada)", async ({ page }) => {
  let envios = 0;
  await page.route("**/api/auth/register", (route) => {
    envios++;
    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.goto("/register");
  const crear = page.getByRole("button", { name: "Crear cuenta" });
  // El formulario queda inhabilitado hasta que carga el JavaScript: se espera a que se pueda escribir.
  await expect(page.getByLabel("Nombre", { exact: true })).toBeEnabled();
  await expect(crear).toBeDisabled();
  // Un toque real llega al botón aunque se vea apagado (aria-disabled), así que se fuerza el clic.
  await crear.click({ force: true });
  await expect(page.getByRole("status").filter({ hasText: "Para crear tu cuenta falta:" })).toContainText("tu nombre");
  await expect(page.getByLabel("Nombre", { exact: true })).toBeFocused();
  await page.getByLabel("Nombre", { exact: true }).fill("Ana Pérez");
  await page.getByLabel("Email", { exact: true }).fill("ana@example.test");
  await page.getByLabel("Contraseña", { exact: true }).fill("contrasena1");
  await expect(page.getByText("Te falta 1 carácter (mínimo 12).")).toBeVisible();
  await crear.click({ force: true });
  await expect(page.getByLabel("Contraseña", { exact: true })).toBeFocused();
  await page.getByLabel("Contraseña", { exact: true }).fill("una-clave-de-12+");
  await crear.click({ force: true });
  await expect(page.getByRole("checkbox")).toBeFocused();
  await expect(page.getByRole("status").filter({ hasText: "aceptar la política de privacidad" })).toBeVisible();
  expect(envios).toBe(0);
  // Con todo completo el aviso desaparece y el envío sale.
  await page.getByRole("checkbox").check();
  await expect(page.getByRole("status").filter({ hasText: "falta:" })).toHaveCount(0);
  await crear.click();
  await expect.poll(() => envios).toBe(1);
});

for (const ancho of [1280, 820, 390]) {
  test(`landing, login y registro: sin desborde horizontal ni violaciones graves de axe a ${ancho}px`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: ancho, height: 900 } });
    const page = await ctx.newPage();
    for (const ruta of ["/", "/login", "/register"]) {
      await page.goto(ruta);
      const desborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(desborde, `${ruta} desborda ${desborde}px`).toBeLessThanOrEqual(0);
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const graves = r.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""));
      expect(graves.map((v) => `${ruta}: ${v.id}`)).toEqual([]);
    }
    await ctx.close();
  });
}
