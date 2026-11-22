import { expect, test } from "@playwright/test";

// Recorre todas las pantallas e interacciones principales y falla ante cualquier
// error de consola (hidratación, HTML inválido, claves duplicadas, etc.).
// Los errores de hidratación solo se emiten en modo desarrollo: correr contra
// `next dev` (E2E_BASE_URL=http://localhost:3100) para la cobertura completa.
for (const [label, width, height] of [["escritorio", 1280, 800], ["tablet", 820, 1180], ["móvil", 390, 844]] as const) {
test(`sin errores ni advertencias de consola en ningún módulo (${label})`, async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") problems.push(`[${m.type()}] ${m.text().slice(0, 300)}`);
  });
  page.on("pageerror", (e) => problems.push(`[pageerror] ${e.message.slice(0, 300)}`));
  await page.setViewportSize({ width, height });

  await page.goto("/");
  await page.goto("/register");
  await page.goto("/login");
  await page.getByLabel("Email").fill("demo@allocia.app");
  await page.getByLabel("Contraseña", { exact: true }).fill("allocia123");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/resumen/);
  await expect(page.getByText("Escenarios con fuentes")).toBeVisible();

  await page.goto("/cartera");
  // El alta de activos vive tras «Agregar activo» cuando ya hay posiciones.
  if (!(await page.getByLabel("Ticker / Símbolo").isVisible())) await page.getByRole("button", { name: "Agregar activo", exact: true }).click();
  await page.getByLabel("Ticker / Símbolo").fill("aap");
  await page.getByRole("option", { name: /AAPL/ }).click();
  await expect(page.getByText(/cotización sujeta a disponibilidad/)).toBeVisible();
  await page.getByRole("button", { name: "Editar AAPL" }).filter({ visible: true }).first().click();
  await page.getByRole("button", { name: "Cancelar" }).click();
  await page.getByRole("button", { name: "Eliminar AAPL" }).filter({ visible: true }).first().click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Cancelar" }).click();

  await page.goto("/riesgo");
  await page.getByRole("button", { name: "¿Por qué esta observación?" }).first().click();
  await page.goto("/senales");
  await page.goto("/desglose");
  await page.getByLabel("Sector").selectOption({ index: 1 });
  await page.goto("/cartera/BTC");
  await page.goto("/cartera/NOEXISTE");
  await page.goto("/informe");
  await page.goto("/ajustes");
  await page.getByRole("button", { name: /Cuenta Demo|CD/ }).filter({ visible: true }).first().click();
  await page.waitForLoadState("networkidle");

  expect(problems, problems.join("\n")).toEqual([]);
});
}

test("alta, edición y baja sin errores de consola", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") problems.push(`[${m.type()}] ${m.text().slice(0, 300)}`);
  });
  page.on("pageerror", (e) => problems.push(`[pageerror] ${e.message.slice(0, 300)}`));
  await page.setViewportSize({ width: 1280, height: 800 });

  const email = `console-${Date.now()}@test.com`;
  await page.goto("/register");
  await page.getByLabel("Nombre").fill("Prueba Consola");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill("Integration-test-1234");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/resumen/);
  await expect(page.getByText("Tu cartera está vacía")).toBeVisible();

  await page.goto("/cartera");
  for (const [t, q] of [["BTC", "0,5"], ["AAPL", "2"]]) {
    await page.getByLabel("Ticker / Símbolo").fill(t);
    await page.getByLabel("Cantidad (en unidades)", { exact: true }).fill(q);
    await page.getByRole("button", { name: /Agregar Activo/ }).click();
    await expect(page.getByRole("status")).toContainText(t);
  }
  // Un ticker repetido no se duplica: se ofrece editar la posición existente.
  await page.getByLabel("Ticker / Símbolo").fill("AAPL");
  await page.getByLabel("Cantidad (en unidades)", { exact: true }).fill("1");
  await page.getByRole("button", { name: /Agregar Activo/ }).click();
  await expect(page.getByText("Ya tenés AAPL en tu cartera")).toBeVisible();
  await page.getByRole("button", { name: "Editar cantidad", exact: true }).click();
  await page.getByLabel("Nueva cantidad").fill("3");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("status")).toContainText("Cantidad actualizada");
  await page.getByRole("button", { name: "Editar BTC" }).filter({ visible: true }).first().click();
  await page.getByLabel("Nueva cantidad").fill("1");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("link", { name: "Ver detalle de BTC" })).toBeVisible();
  for (const r of ["/resumen", "/desglose", "/cartera/AAPL", "/informe", "/riesgo"]) {
    await page.goto(r);
    await page.waitForLoadState("networkidle");
  }
  await page.goto("/cartera/AAPL");
  await page.getByRole("button", { name: "Eliminar" }).first().click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
  await expect(page).toHaveURL(/\/cartera$/);
  await page.getByRole("button", { name: "Eliminar BTC" }).filter({ visible: true }).first().click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByText("Todavía no hay activos cargados.")).toBeVisible();

  expect(problems, problems.join("\n")).toEqual([]);
});
