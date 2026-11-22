# Rediseño del panel autenticado (8 pestañas)

Rama: `feat/allocia-dashboard-redesign` (desde `origin/main`). Solo capa visual de `apps/web`: sin cambios en API,
base de datos, autenticación, cálculos, reglas de riesgo ni lógica de alertas. Landing, login/registro y la app móvil no se tocaron.

Regla de trabajo: la app existente define **qué** se ve y se puede hacer; las maquetas definen **cómo** se ve.

## Sistema compartido
- **Marco**: lienzo gris frío (`bg-canvas`), menú lateral agrupado (Portafolio · Mercado · Herramientas), cabecera con buscador y avatar
  (el nombre sigue disponible para lectores de pantalla), contador de alertas sin leer como píldora (`aria-hidden`, la descripción accesible del enlace no cambia).
- **`components/ui/AssetIdentity.tsx`**: `AssetMark` (recuadro) y `AssetIdentity` (logo + ticker + nombre como texto real).
  Logo: 1) el de la API (Finnhub/CoinGecko, como antes) → 2) archivo local verificado (`lib/asset-logos.ts`, `public/brand/assets/`) → 3) recuadro con el ticker.
  Fuentes y licencias en `apps/web/public/brand/assets/SOURCES.md`.
- Estilos: tarjetas de 20 px, tablas `.tbl`, botones `.btn-accent`, `.icon-btn`, pestañas `.pill`, escala de texto pequeño (`micro/caption/body-sm`).

## Inventario por pestaña (línea base: lo que existía antes; todo se conserva)
| Pestaña | Contenido y acciones conservados |
|---|---|
| Resumen | Valor total y n.º de posiciones, mayor posición, «en pocas palabras», concentración + explicación, contexto global con fecha del dato/consulta, composición (clase, sector, región), escenarios con fuentes, observaciones destacadas, Actualizar, Ver informe, estado vacío |
| Cartera | Alta con búsqueda/verificación de activos y validaciones, total y aviso de precios, Actualizar cotizaciones, búsqueda y orden, cantidad/precio/valor/peso, fecha del dato y consulta, fuente por fila, Editar cantidad, Eliminar (con confirmación), Ver detalle, Ver desglose, avisos y errores, estados vacío/carga/error |
| Desglose | Clase, sector, región y moneda; filtros (clase, sector, región) + Limpiar; totales filtrados; todas las columnas (incl. contribución al HHI, separada del peso); orden por columna; Editar/Eliminar; nota de la fórmula |
| Riesgo | Concentración (HHI, nivel, posiciones efectivas, explicación), filtros de prioridad y de origen, todas las observaciones con regla aplicada, evidencia y fuentes, «¿Por qué esta observación?» |
| Señales | Índice GPR, nivel y tendencia, noticias con enlace a la fuente original y fechas, señales emergentes, mercados de predicción (no son probabilidades calibradas), fuentes y disponibilidad, «—» ≠ 0, Actualizar, enlace a Alertas |
| Alertas | Mi cartera / Oportunidades, lista completa, sin leer, Marcar como leído (elegir no marca), solicitar análisis, actualizar, solicitudes en curso, notificaciones del navegador (activar, prueba, desactivar), cobertura y alertas, análisis completo (resumen, glosario, escenarios, precio usado, informe completo, indicadores, limitaciones, fuentes y extractos) |
| Informe | Informe completo, Exportar CSV (sin cambios), Imprimir / Guardar PDF |
| Ajustes | Cuenta, enlaces a Cuenta y privacidad / Mercados y alertas, Cerrar sesión (con confirmación), fuentes de datos con atribución, producto y versión, aviso, eliminar cuenta (exportación previa, contraseña, casilla, confirmación) |

## Diferencias deliberadas respecto de las maquetas
- Cartera: tabla desde 1280 px; en tablet, tarjetas en dos columnas; en móvil, tarjetas. Las acciones de fila son botones visibles (editar, eliminar) en vez de un menú «⋮», para que sean fáciles de encontrar y de usar con teclado. La barra de peso solo aparece desde 1536 px.
- «Agregar activo» abre el formulario existente (abierto de entrada si la cartera está vacía y se mantiene abierto al agregar).
- Alertas: las preferencias de notificación están siempre visibles (no plegadas); el desplegable «Escenarios posibles y sus límites» pasó a «Ver fuentes y limitaciones» y los escenarios se muestran directamente.
- Señales: los ítems de noticias usan un ícono genérico (los eventos no traen empresa asociada); no se inventaron logos.
- Resumen: «Precios de referencia» se muestra bajo el importe y el conteo de posiciones aparte.

## Pruebas e2e actualizadas por el cambio de estructura
`e2e/app.spec.ts` (héroe de Resumen), `e2e/visual-clarity.spec.ts` (bandeja de Alertas), `e2e/console.spec.ts`, `e2e/release.spec.ts` y
`e2e/shared-account.spec.ts` (el alta de activos queda tras «Agregar activo» cuando ya hay posiciones).

## Logos de fuentes (proveedores y medios)
- `components/ui/SourceMark.tsx` + `lib/source-logos.ts`: reconocen la fuente por su nombre (Ajustes, «Fuentes y disponibilidad») o, en las noticias, por el
  enlace o el sufijo del titular («… - Reuters»), y muestran su logo local o un monograma. No se inventan medios ni logos.
- Archivos y licencias: `apps/web/public/brand/sources/SOURCES.md`. Incluidos (Wikimedia Commons, dominio público, marca registrada de su titular): Reuters, CNBC,
  The Wall Street Journal, Bloomberg, Financial Times, Yahoo Finance, Polymarket, Infobae, La Nación, Ámbito, Investopedia y Seeking Alpha. Sin archivo verificable
  (se muestran con monograma): Finnhub, CoinGecko, FRED, DefiLlama, Alternative.me, MarketWatch, Barron's e índice GPR; el procedimiento para sumarlos está en ese archivo.
- Activos: los logos de acciones y cripto los entrega la API (Finnhub/CoinGecko); los ETF no tienen logo en ningún proveedor y muestran el recuadro con el ticker.

## Verificación con una cuenta real (solo lectura)
Se recorrieron las 8 pestañas (escritorio y móvil) contra el backend real: inicio de sesión, posiciones, búsqueda, orden, diálogos de alta/edición/baja (abiertos y cancelados),
bandeja de Alertas (elegir no marca como leído), exportación CSV, impresión a PDF, sin errores de consola, sin respuestas 4xx/5xx y sin desbordes. 78/78 comprobaciones
sin escrituras al backend.
