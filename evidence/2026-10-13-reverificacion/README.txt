REVERIFICACIÓN DEL 13 DE OCTUBRE DE 2026

Ejecución local y aislada sobre la revisión 79233ed del repositorio de Allocia
(https://github.com/MauriGuth/allocia). Base PostgreSQL y Redis exclusivos de
evaluación, creados desde cero (cinco migraciones, catálogo de 34 instrumentos y
cuenta demo). Los registros conservan resultados, fechas y métricas; no contienen
claves, tokens, cuerpos HTTP ni direcciones reales.

  servicios.json                  CP01-CP21 (tests/pfi-validation.cjs)
  integracion.json                IT01-IT15 (tests/pfi-integration.cjs)
  seguridad-ia-programacion.json  SEC, AI, SCH y PUSH (tests/production-security.cjs)
  web.json                        UI01-UI09, UI04b y X01-X11 tras la corrección: 21 de 21
  web-previo-a-la-correccion.json Primera pasada: 20 de 21; X11 detecta el defecto
  pruebas-unitarias.json          12 archivos node:test de apps/api/tests
  suite-playwright-repositorio.json  Suite apps/web/e2e: resultados y causas de fallas
  web-verification.cjs            Recorrido web ejecutado contra la interfaz vigente
  web-extra.json                  Comprobaciones web adicionales (E01-E16, sin E11 ni E13): 14 de 14
  web-extra-previo-a-la-correccion.json  Primera pasada: 13 de 14; E06 (axe-core) detecta los defectos de accesibilidad
  web-extra-verification.cjs      Comprobaciones adicionales (requiere axe-core y, para E02, la web con APP_MAINTENANCE=true)

Cómo repetirlo (desde apps/api con las variables de entorno de prueba):
  node -r ts-node/register tests/pfi-validation.cjs
  node tests/pfi-integration.cjs
  node tests/production-security.cjs
  node web-verification.cjs        (con la web y la API en ejecución)

Alcance: no consulta proveedores externos (las señales muestran su respaldo local,
identificado como demostración), no usa el servicio publicado ni equipos móviles y no
reemplaza sesiones con participantes. Los entornos de la ejecución del 8 de octubre y
de esta reverificación difieren; las latencias no son comparables.

Hallazgo corregido: X11 (web). Escribir una contraseña incorrecta en «Eliminar cuenta»
produce una respuesta 401 de la API que la web (cliente y proxy) trataba como
sesión vencida: eliminaba la cookie y redirigía al acceso sin mostrar el error.
La cuenta no se eliminaba. Corregido en la revisión 3bd9d56 de Allocia (PR #2).

Correspondencia de los nombres del Anexo F con los archivos de pruebas
  Pruebas unitarias y de integración (apps/api/tests): Correo de cuenta = account-email; Logos de activos = asset-logos;
  Cotizaciones de mercado = market-quotes; Oportunidades = opportunities; Oportunidades (integración) =
  opportunities-integration; Actualización de cotizaciones = quote-refresh; Publicación = release-unit; Investigación y
  descubrimiento = research-discovery; Evidencia de escenarios = scenarios-evidence; Señales en vivo = signals-live;
  Señales en español = signals-spanish; Instantánea de valuación = valuation-snapshot.
  Suite Playwright (apps/web/e2e): Flujos de la aplicación = app.spec.ts; Consola del navegador = console.spec.ts;
  Publicación = release.spec.ts; Claridad visual = visual-clarity.spec.ts; Oportunidades = opportunities.spec.ts;
  Cuenta compartida = shared-account.spec.ts; Correo de la cuenta = account-email.spec.ts; Baja con contraseña
  incorrecta = account-wrong-password.spec.ts.
