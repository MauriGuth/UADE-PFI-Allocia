# Allocia: paridad web/móvil y cuenta compartida

Revisión del 9 de octubre de 2026. Esta matriz reemplaza el inventario previo,
que todavía describía recuperación de contraseña y alertas como inexistentes.
La referencia de alcance son RF1–RF10 y RNF1–RNF9 de `chapter03.tex` de la tesis,
más las funciones acordadas después: informes Anthropic, fuentes actuales y alertas.

## Una cuenta, una API, una base de datos

- Web publicada: https://allocia.com.ar → servidor Next.js (BFF) →
  https://uadepfi-production.up.railway.app → PostgreSQL de Railway.
- Android/iOS: cliente Expo con `EXPO_PUBLIC_API_URL` → **la misma API** →
  **la misma PostgreSQL**. El cliente móvil no tiene una base de posiciones propia.
- Next.js usa `API_URL`. No mantiene usuarios/carteras en una base alternativa.
  Los secretos de PostgreSQL permanecen en el servidor.
- Web: cookie `httpOnly`, `Secure`, `SameSite=Strict`, comprobación de Origin y
  respuestas privadas `no-store`. Móvil: token en SecureStore, enviado como Bearer.
- Todas las lecturas/modificaciones se filtran por el usuario autenticado en la API.
  No se acepta un propietario elegido por el cliente.
- No hace falta registrarse dos veces: las mismas credenciales acceden a ambas.
  La baja de cuenta invalida el acceso desde ambas. Actualmente cerrar sesión
  revoca las sesiones de la cuenta, incluidos otros dispositivos.

## Matriz de funciones

“Implementada” describe código existente; no equivale a validación física en iOS/Android.
“Parcial” conserva visible un requisito pendiente, sin modificar lo prometido.

| Requisito / función | Web | Android/iOS | Evidencia o pendiente |
|---|---|---|---|
| RF1 Registro, ingreso, consentimiento y cuenta única | Implementada | Implementada | Prueba cruzada local + 18 comprobaciones en producción |
| RF2 Alta, edición y baja de posiciones propias | Implementada | Implementada en ambos sistemas | Cliente móvil real de HTTP ↔ BFF web; edición ajena rechazada |
| RF3 Clase, sector, región y moneda | Implementada | Implementada | Catálogo compartido; origen de clasificación visible como catálogo Allocia |
| RF4 Valor, pesos, exposiciones, HHI, número efectivo y cartera vacía | Implementada | Implementada | Pruebas de cálculo e integración; valuación depende de cotizaciones disponibles |
| RF5 Señales geopolíticas/emergentes con procedencia por componente | Parcial | Parcial | `/signals` productivo: Alternative.me, CoinGecko, DefiLlama, Polymarket y noticias Finnhub; fecha/origen y ausencia por componente. GPR numérico no disponible; sin ejemplos locales |
| RF6 Observaciones con regla y evidencia | Implementada | Implementada | Motor común, evidencia desplegable y pruebas de umbrales |
| RF7 Gestión/análisis web y móvil con la misma API | Implementada | Implementada | `shared-account.spec.ts` y smoke publicado |
| RF8 Escenarios respaldados por fuentes recientes | Implementada | Implementada | Informes de activos propios, con condición, efecto posible, fuentes y fechas; sin rendimientos supuestos |
| RF9 Baja con contraseña y confirmación | Implementada | Implementada | Baja web rechaza el token móvil y elimina posiciones |
| RF10 Política/consentimiento antes del registro | Implementada | Implementada | Mismo backend registra versión y fecha |
| Recuperación y verificación de correo | Implementada | Solicitud desde app; enlace HTTPS abre el flujo web | 15 comprobaciones y recepción real confirmada |
| Búsqueda externa/importación y precio con fecha/fuente | Implementada | Implementada | Mismos endpoints y límites por proveedor; no cobertura mundial ilimitada |
| Informes Anthropic y apartados del master prompt | Parcial | Parcial | Mismos informes persistidos; faltan datos/validación para estrategia cuantitativa completa |
| Informes y alertas internas actualizados | Implementada | Implementada | Web y móvil consultan cada 30 s visibles y al regresar; lectura/preferencia persisten por usuario |
| Push remoto | Pendiente en navegador | iOS: recepción confirmada; Android: recepción confirmada por el usuario | No equiparar alertas internas con push. Expo/APNs/FCM no proveen Web Push |
| Exportación de datos personales | Descarga JSON | Menú nativo para guardar/compartir texto JSON | API común `/auth/export`; menú nativo incluido en la confirmación física del usuario |
| Desglose, detalle por activo e informe imprimible/CSV | Implementada | Parte de los datos en Resumen/Cartera; pantallas/exportación completas pendientes | Complementos web; mantener pendientes explícitos si se exige equivalencia bidireccional |

## Actualización entre dispositivos

Las pantallas web con datos asíncronos refrescan al recuperar foco o visibilidad y
cada 30 segundos visibles. Los formularios se mantienen montados y conservan su
texto. En móvil se refresca al volver al primer plano y cada 30 segundos activo.
Cambiar de pestaña móvil monta la pantalla y vuelve a leer sus datos.

Es consulta periódica, no sincronización por WebSocket ni cotización tick a tick.
Una actualización necesita conexión y una respuesta satisfactoria. La API aplica
su caché de proveedores independientemente del refresco de la interfaz.

## Validación nueva

- `e2e/shared-account.spec.ts`: navegador Chromium real y el archivo real del cliente
  HTTP móvil transpilado para el test; API/PostgreSQL aislados. Alta desde móvil,
  edición web, nueva edición móvil reflejada al enfocar web, formularios conservados,
  preferencias compartidas, aislamiento de otra cuenta y eliminación de cuenta.
- `scripts/shared-account-smoke.cjs`: 18 comprobaciones contra web/ API publicados.
  Usa dos cuentas temporales propias y las elimina. No registra contraseñas/tokens.
- Resultado: `docs/evidence/shared-account-production-20261009.json`.
- La igualdad de informes se comprueba sobre la lista devuelta para la cuenta de
  prueba (puede estar vacía); no demuestra generación IA ni disparo programado.
- No se simula una prueba física de la interfaz nativa ni recepción push.

## Criterios restantes antes de declarar el proyecto completo

1. Completar GPR numérico y ampliar cobertura de RF5. Las señales productivas disponibles ya conservan procedencia, fecha y ausencia explícita.
2. Completar cobertura/históricos requeridos o tramitar acceso educativo; no afirmar
   “todo el mercado en tiempo real” con accesos que lo impiden.
3. Validar la estrategia y los resultados del master prompt; no generar scores,
   probabilidades, entradas o stops sin metodología contrastada.
4. Observar el disparo previo a la apertura y la recepción de sus alertas. Los registros productivos ya confirman cierre EE.UU. y dos cortes cripto.
5. Resolver las diferencias de plataforma listadas y ejecutar pruebas físicas tras
   generar los builds. La recepción push en iPhone está confirmada; Android también confirmado el 10/10.
6. RNF1 requiere evaluación con participantes reales; pruebas técnicas no reemplazan
   las entrevistas ni la evaluación de usabilidad de la tesis.

## Corrección tras la prueba física del 9 de octubre

La captura del usuario confirma push en iPhone y descubre dos fallos: `/signals` bloqueado en producción y escenarios vacíos. La revisión ea4ac82 agrega fuentes externas y habilita simulaciones de cartera con supuestos explícitos. Cinco pruebas controladas y cinco comprobaciones remotas de API/navegador pasan; la cuenta temporal se elimina. Evidencia: `signals-scenarios-production-20261009.json` y `push-iphone-confirmed-20261009.json`. No se infiere recepción Android ni ejecución programada a partir de esa captura.

### Revisión de escenarios con fuentes — 9 de octubre

Por pedido del usuario se retiran las simulaciones de porcentajes fijos incorporadas en ea4ac82. El resumen y el informe exportable utilizan escenarios condicionales de informes de las últimas 24 horas, con fuentes de hasta 48 horas, referencias vinculadas a extractos literales y limitaciones conservadas. Sin evidencia suficiente se muestra ausencia explícita, nunca un escenario de reemplazo. La validación de citas comprueba trazabilidad textual; no garantiza la veracidad de una noticia ni que el efecto previsto ocurra.

## Preparación física — 10 de octubre

Estado de solicitudes manuales por activo disponible en ambos clientes, con aislamiento por solicitante y tenencias vigentes. La API comparte una instantánea privada de valuación entre Cartera, Análisis y reglas durante un máximo de 30 segundos, sin extender la vigencia de la consulta al proveedor. Verifica tenencias en cada lectura, recalcula tras cambios o actualización manual y elimina el snapshot ante fallo. La coordinación es por instancia de API; no implica igualdad indefinida entre dispositivos.

Evidencia productiva: cierre NYSE/Nasdaq del 9/10 (25 informes), cortes cripto del 10/10 a las 00:00 y 12:00 UTC (9 informes cada uno). Preapertura y entrega física por cada corte aún pendientes. Catálogo probado: 34/34 cotizaciones accesibles, sin afirmar cobertura universal.

Prueba física: `docs/PRUEBA_FISICA_2026-10-10.md`. Se conservan las diferencias de plataforma de la matriz; no se declara paridad total.

### Aceptación física informada

El 10/10 el usuario confirma todas las comprobaciones físicas en Android e iOS para los builds 5197fba7 y a1f76f64. Se cierra el pendiente de ejecución de ese protocolo (incluye biometría, reconexión, exportación y push). No sustituye la evaluación independiente de usabilidad ni valida cambios visuales posteriores. Evidencia: `physical-validation-user-confirmed-20261010.json`.
