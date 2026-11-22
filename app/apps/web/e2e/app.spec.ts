import { expect, test, type Page } from "@playwright/test";

// Pruebas end-to-end contra la API real (cuenta demo sembrada con seed.ts).
const DEMO = { email: "demo@allocia.app", password: "allocia123" };

async function login(page: Page, creds = DEMO) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(creds.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(creds.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/resumen/);
}

/**
 * Valor esperado de una posición = cantidad × precio unitario tal como lo muestra la pantalla. Los precios son de mercado
 * y cambian, así que no se fija una cifra: se lee el precio visible («345,59 USD») y se verifica el valor con él.
 */
async function expectPositionValue(page: Page, quantity: number) {
  const priceText = await page
    .getByText(/^\d[\d.]*(,\d+)?\s*USD$/)
    .filter({ visible: true })
    .first()
    .innerText();
  const price = Number(priceText.replace(/\s*USD$/, "").replace(/\./g, "").replace(",", "."));
  expect(price).toBeGreaterThan(0);
  const expected = Math.round(quantity * price).toLocaleString("es-AR");
  await expect(page.getByText(`US$ ${expected}`, { exact: true }).first()).toBeVisible();
}

async function registerFresh(page: Page) {
  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.com`;
  await page.goto("/register");
  await page.getByLabel("Nombre").fill("Ana Pérez");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill("Integration-test-1234");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/resumen/);
  return email;
}

test.describe("acceso y sesión", () => {
  test("redirige a login sin sesión y conserva la ruta destino", async ({ page }) => {
    await page.goto("/cartera");
    await expect(page).toHaveURL(/\/login\?next=%2Fcartera/);
  });

  test("muestra el error del backend con credenciales inválidas", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("demo@allocia.app");
    await page.getByLabel("Contraseña", { exact: true }).fill("incorrecta");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page.locator("p[role=alert]")).toContainText("Email o contraseña incorrectos");
  });

  test("el login tolera espacios alrededor del email y mayúsculas", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("  DEMO@allocia.app ");
    await page.getByLabel("Contraseña", { exact: true }).fill("allocia123");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).toHaveURL(/\/resumen/);
  });

  test("login, persistencia tras recarga y cierre de sesión", async ({ page, context }) => {
    await login(page);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Resumen" })).toBeVisible();
    // El JWT no es accesible desde JavaScript (cookie httpOnly).
    expect(await page.evaluate(() => document.cookie)).not.toContain("allocia_token");
    expect((await context.cookies()).find((c) => c.name === "allocia_token")?.httpOnly).toBe(true);

    await page.getByRole("button", { name: /Cuenta Demo|CD/ }).first().click();
    await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/resumen");
    await expect(page).toHaveURL(/\/login/);
  });

  test("el proxy solo expone rutas permitidas y exige sesión", async ({ request }) => {
    expect((await request.get("/api/proxy/portfolio")).status()).toBe(401);
    expect((await request.get("/api/proxy/auth/me")).status()).toBe(405);
  });
});

test.describe("módulos con la cuenta demo", () => {
  test.beforeEach(async ({ page }) => login(page));

  test("Resumen muestra datos reales del análisis", async ({ page }) => {
    await expect(page.getByText("Valor total").first()).toBeVisible();
    await expect(page.getByText(/US\$\s\d/).first()).toBeVisible();
    await expect(page.getByText("13 posiciones")).toBeVisible();
    await expect(page.getByText("Cómo está repartido tu dinero")).toBeVisible();
    // Los escenarios provienen de informes con fuentes: sin evidencia no hay rendimientos supuestos.
    await expect(page.getByText("Escenarios con fuentes")).toBeVisible();
    await expect(page.getByText(/Sin porcentajes de rendimiento supuestos/)).toBeVisible();
    await expect(page.getByRole("tab", { name: "Adverso" })).toHaveCount(0);
  });

  test("Riesgo: filtra y despliega la evidencia", async ({ page }) => {
    await page.goto("/riesgo");
    await expect(page.getByRole("heading", { name: "Qué revisar en tu cartera" })).toBeVisible();
    const first = page.getByRole("button", { name: "¿Por qué esta observación?" }).first();
    await first.click();
    await expect(page.getByText("EVIDENCIA UTILIZADA").first()).toBeVisible();
    // La cantidad de observaciones por prioridad depende de la cartera y del mercado del momento: se usa un filtro de
    // prioridad que tenga resultados (los vacíos quedan deshabilitados) en lugar de exigir «ALTA PRIORIDAD».
    const available = page
      .getByRole("group", { name: "Filtrar por prioridad" })
      .getByRole("button", { disabled: false })
      .filter({ hasNotText: /^Todas/i });
    test.skip((await available.count()) === 0, "La cuenta no tiene observaciones para filtrar por prioridad");
    const chip = available.first();
    const label = ((await chip.innerText()).split("·")[0] ?? "").trim();
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  });

  test("Señales, Ajustes, Desglose e Informe cargan", async ({ page }) => {
    await page.goto("/senales");
    await expect(page.getByText(/Índice de riesgo geopol/)).toBeVisible();
    // La tarjeta de mercados de predicción se identifica por su título en español (el rótulo en inglés se quitó).
    await expect(page.getByRole("heading", { name: "Mercados de predicción" })).toBeVisible();
    await page.goto("/ajustes");
    await expect(page.getByText("demo@allocia.app")).toBeVisible();
    await page.goto("/desglose");
    await page.getByLabel("Clase de activo").selectOption("cripto");
    await expect(page.getByText(/de 13 posiciones/)).toBeVisible();
    await page.goto("/informe");
    await expect(page.getByRole("button", { name: /Exportar CSV/ })).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /Exportar CSV/ }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^allocia-cartera-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  test("buscador del header lleva al detalle del activo", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/resumen");
    await page.getByRole("combobox", { name: /Buscar activos/ }).fill("aapl");
    await page.getByRole("option", { name: /AAPL/ }).click();
    await expect(page).toHaveURL(/\/cartera\/AAPL/);
    await expect(page.getByRole("heading", { name: /Análisis detallado de Apple/ })).toBeVisible();
    await expect(page.getByText("Peso en cartera")).toBeVisible();
  });
});

test.describe("Cartera: alta, edición y baja", () => {
  test("flujo completo con una cuenta nueva", async ({ page }) => {
    await registerFresh(page);
    await expect(page.getByText("Tu cartera está vacía")).toBeVisible();

    await page.goto("/cartera");
    await expect(page.getByText("Todavía no hay activos cargados.")).toBeVisible();

    // Validaciones: ticker fuera de catálogo → error del backend.
    await page.getByLabel("Ticker / Símbolo").fill("ZZZZ");
    await page.getByLabel("Cantidad (en unidades)", { exact: true }).fill("1");
    await page.getByRole("button", { name: /Agregar Activo/ }).click();
    await expect(page.locator("p[role=alert]")).toContainText("catálogo");

    // Alta con autocompletado y coma decimal.
    await page.getByLabel("Ticker / Símbolo").fill("aap");
    await page.getByRole("option", { name: /AAPL/ }).click();
    await expect(page.getByText(/cotización sujeta a disponibilidad/)).toBeVisible();
    await page.getByLabel("Cantidad (en unidades)", { exact: true }).fill("2,5");
    await page.getByRole("button", { name: /Agregar Activo/ }).click();
    await expect(page.getByRole("status")).toContainText("AAPL se agregó");
    await expect(page.getByRole("link", { name: "Ver detalle de AAPL" })).toBeVisible();
    await expectPositionValue(page, 2.5);

    // Edición de cantidad. La confirmación queda visible hasta la siguiente acción o hasta cerrarla.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.getByRole("button", { name: "Editar AAPL" }).click();
    await page.getByLabel("Nueva cantidad").fill("4");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByRole("status")).toContainText("Cantidad actualizada");
    await expectPositionValue(page, 4);
    await page.getByRole("button", { name: "Cerrar aviso" }).click();
    await expect(page.getByRole("status")).not.toContainText("Cantidad actualizada");

    // Resumen refleja la cartera.
    await page.goto("/resumen");
    // El héroe de Resumen separa el conteo de posiciones del estado de los precios (demostración, con demora o bolsa
    // cerrada, según el proveedor; nunca «tiempo real»).
    await expect(page.getByText("1 posición", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/^(Precios de demostración|Cotizaciones con demora.*|Bolsa cerrada.*)$/).first()).toBeVisible();
    await expect(page.getByText(/tiempo real/i)).toHaveCount(0);

    // Baja con confirmación.
    await page.goto("/cartera");
    await page.getByRole("button", { name: "Eliminar AAPL" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
    await expect(page.getByText("Todavía no hay activos cargados.")).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Posición eliminada");
  });
});

test.describe("Cartera: campos numéricos", () => {
  test("bloquean letras y símbolos, respetan límites y ofrecen editar una posición existente", async ({ page }) => {
    await registerFresh(page);
    await page.goto("/cartera");
    const ticker = page.getByLabel("Ticker / Símbolo");
    const qty = page.getByLabel("Cantidad (en unidades)", { exact: true });

    // Cantidad: solo dígitos y un separador decimal.
    await qty.pressSequentially("d");
    await expect(qty).toHaveValue("");
    await qty.pressSequentially("12abc,5");
    await expect(qty).toHaveValue("12,5");
    await qty.fill("");
    await qty.pressSequentially("1e3-");
    await expect(qty).toHaveValue("13");
    await qty.fill("12345678901"); // 11 dígitos → se recorta a 10 (numeric(18,8))
    await expect(qty).toHaveValue("1234567890");
    await qty.fill("0,123456789");
    await expect(qty).toHaveValue("0,12345678");

    // Ticker: el campo es un buscador por símbolo o nombre; acota la longitud y el backend valida el catálogo.
    await expect(ticker).toHaveAttribute("maxlength", "60");
    await ticker.fill("");

    // Alta. Volver a cargar el mismo ticker no duplica ni suma (el backend sumaría):
    // el formulario avisa y ofrece editar la posición existente con su cantidad actual.
    await ticker.fill("aapl");
    await qty.fill("2");
    await page.getByRole("button", { name: /Agregar Activo/ }).click();
    await expect(page.getByRole("status")).toContainText("AAPL se agregó");
    await ticker.fill("AAPL");
    await qty.fill("3");
    await page.getByRole("button", { name: /Agregar Activo/ }).click();
    await expect(page.getByText("Ya tenés AAPL en tu cartera")).toBeVisible();
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await expect(page.getByText("Ya tenés AAPL en tu cartera")).toHaveCount(0);
    await page.getByRole("button", { name: /Agregar Activo/ }).click();
    await page.getByRole("button", { name: "Editar cantidad", exact: true }).click();
    await expect(page.getByLabel("Nueva cantidad")).toHaveValue("2");
    await page.getByLabel("Nueva cantidad").fill("5");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByRole("status")).toContainText("Cantidad actualizada: ahora tenés 5 de AAPL");

    // Tope de cantidad: el diálogo de edición no lo envía al backend.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.getByRole("button", { name: "Editar AAPL" }).filter({ visible: true }).first().click();
    const edit = page.getByLabel("Nueva cantidad");
    await expect(edit).toHaveValue("5");
    await edit.fill("9999999999");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.locator("p[role=alert]")).toContainText("no puede superar");

    // El diálogo de edición aplica el mismo filtro.
    await expect(edit).toHaveValue("9999999999");
    await edit.fill("");
    await edit.pressSequentially("7x,5y");
    await expect(edit).toHaveValue("7,5");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByRole("status")).toContainText("Cantidad actualizada: ahora tenés 7,5 de AAPL");
    await expectPositionValue(page, 7.5);
  });
});

test.describe("responsive", () => {
  const sizes = [
    { name: "móvil", width: 375, height: 800 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "notebook chico", width: 1024, height: 768 },
    { name: "notebook", width: 1280, height: 800 },
    { name: "notebook grande", width: 1440, height: 900 },
    { name: "monitor", width: 1920, height: 1080 },
  ];
  const routes = ["/resumen", "/cartera", "/desglose", "/riesgo", "/senales", "/informe", "/ajustes", "/cartera/AAPL"];

  for (const size of sizes) {
    test(`sin desbordamiento horizontal en ${size.name} (${size.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await login(page);
      for (const route of routes) {
        await page.goto(route);
        await page.waitForLoadState("networkidle");
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${route} a ${size.width}px`).toBeLessThanOrEqual(0);
        // Ninguna tabla debe necesitar scroll horizontal interno (columnas cortadas).
        const clipped = await page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>(".overflow-x-auto")]
            .filter((el) => el.scrollWidth > el.clientWidth + 1)
            .map((el) => `${el.scrollWidth}>${el.clientWidth}`),
        );
        expect(clipped, `tabla con scroll interno en ${route} a ${size.width}px`).toEqual([]);
      }
    });
  }
});
