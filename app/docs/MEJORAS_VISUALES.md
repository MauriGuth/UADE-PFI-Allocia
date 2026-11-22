# Mejoras visuales de Allocia

## Implementado el 10/10/2026

- Logos de proveedor con símbolo conservado y respaldo cuando no hay imagen.
- Cartera web y móvil con nombre legible, cantidad, precio por unidad y valor de posición separados. El valor en USD destaca sin ocultar la fecha del precio.
- Fuente y fecha de consulta desplegables; consultar otra vez no se presenta como un precio nuevo.
- Total primero en móvil; el formulario de alta se abre cuando hace falta si ya hay posiciones. La cartera vacía conserva indicaciones para comenzar.
- Búsqueda y ordenamiento web, con acción para limpiar una búsqueda sin resultados.
- Controles principales de al menos 44 px en web y 48 unidades en los botones móviles incorporados; se permite el ajuste del texto del sistema.
- Carga inicial diferenciada del vacío en Cartera y Alertas. Esqueletos móviles discretos y mensajes específicos; botones de actualización deshabilitados durante la consulta.
- Resumen, Riesgo y Señales móviles incorporan una acción clara para reintentar cuando falla la carga.
- Informes con resumen destacado, escenarios organizados como condición y posible efecto, limitaciones y fuentes conservadas. Glosario contextual para RSI, SMA, MACD y volatilidad. No se reescribe ni recorta el análisis original.
- Precio usado en el informe identificado como histórico del análisis; referencia a Cartera para consultar la cotización más reciente.

## Verificación

Tres recorridos de navegador aprobados: ciclo de cuenta/cartera, cuenta compartida con el cliente móvil real y claridad visual/estados. El recorrido de presentación usa anchos de 320, 390, 768 y 1280 px y texto al 200%; no detecta desbordamiento horizontal. Los informes y fallos del recorrido visual utilizan respuestas controladas, no pronósticos reales. Las posiciones y operaciones de cuenta se prueban contra la API y PostgreSQL locales. Ocho pruebas unitarias web pasan. TypeScript móvil y exportación JavaScript para iOS y Android pasan.

Estas comprobaciones no certifican accesibilidad ni comprensión por todos los grupos etarios. La aceptación física informada por el usuario corresponde a los instaladores anteriores a los logos y a este refinamiento. La presentación nueva se incluye en los instaladores internos Android a38311fb e iOS d5537a7d (revisión e068feb), generados después de estas verificaciones. Sus descargas fueron comprobadas. Posteriormente, Mauricio Huentelaf confirmó que probó las nuevas funciones e implementaciones y que todas funcionan correctamente: aceptación física informada satisfactoria para esta presentación. Ver docs/evidence/readability-builds-20261010.json.

## Oportunidades para la evaluación con participantes

Observar si se distingue precio unitario de valor de posición, si se comprende la fecha del proveedor y si el glosario permite interpretar los informes. Registrar dificultades reales antes de agregar más controles. Mantener las probabilidades únicamente cuando existe una fuente identificable; no usar porcentajes decorativos para escenarios condicionales.
