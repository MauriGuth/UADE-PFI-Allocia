# Oportunidades fuera de la cartera

Se separan «Mi cartera» y «Oportunidades» en Mercados y alertas, tanto en web como en móvil. Las oportunidades no son órdenes ni probabilidades de rentabilidad. No se agregan posiciones al seguir un activo.

## Alcance

- Búsqueda por nombre/símbolo mediante Finnhub y CoinGecko, identificación e importación verificadas y hasta 50 activos seguidos por cuenta.
- Preferencia independiente y desactivada inicialmente para alertas de oportunidades; alcance «todo el universo cubierto» o «solo mis activos seguidos».
- El proceso automático existente también analiza activos seguidos sin tenencias, con el mismo calendario regional (15 minutos antes de apertura/cierre) y cortes cripto 00:00 y 12:00 UTC.
- Solicitud manual de hasta 50 activos no poseídos, primero los seguidos y luego el universo configurado; deduplicación por cuenta, activo y hora y límite diario compartido. No implica analizar todos los instrumentos del mundo.
- Solo el último informe por activo puede producir una oportunidad visible. Se requiere informe de hasta 24 horas, fuentes HTTPS de hasta 48 horas, cita literal validada y un escenario alcista condicionado con respaldo específico del activo. Las noticias genéricas de cripto no acreditan una oportunidad de un token concreto. Cotización de referencia: hasta 96 horas para acciones y 30 minutos para cripto; nunca se presenta esa antigüedad como tiempo real.
- Alertas internas y push con símbolo y escenario de posible suba, sin cantidades ni porcentajes inventados. Se revisan preferencias y seguimiento al entregar. Un informe reemplazado o sin vigencia no genera un push atrasado. La pausa automática de seis horas por activo se conserva.
- Seguimiento y preferencias se exportan con los datos personales. La baja de cuenta elimina los seguimientos por cascada.

## Validación

Pruebas unitarias de evidencia y antigüedad; integración aislada con PostgreSQL de migración, aislamiento de listas, idempotencia de pedidos, diferenciación cartera/oportunidad, consentimiento, contenido push con transporte simulado, supresión por informe contrario y baja de cuenta. La prueba de navegador utiliza la API real para preferencias y seguimiento, con búsqueda e informes sintéticos identificados para comprobar presentación. La recepción física de esta nueva clase de aviso se valida con el próximo instalador; la aceptación de los builds anteriores no se extiende automáticamente a esta función.

## Instaladores

- Android: https://expo.dev/accounts/mauri-guth/projects/allocia/builds/8a312f48-efc5-4c3e-9c65-cd338bf9e1a4
- iOS: https://expo.dev/accounts/mauri-guth/projects/allocia/builds/3e5deb95-3fd9-47ae-9bf5-3f89b19fba20

Ambos terminados desde `d58c665`. API publicada `2174898`, con ajuste compatible de referencias cripto. La web está publicada en https://allocia.com.ar/market. Todas las comprobaciones de GitHub de ambas revisiones finalizaron satisfactoriamente.

En Alertas, abrir Oportunidades, activar su preferencia y elegir el alcance. Para seguir Tesla sin comprarla, buscarla y seleccionar Seguir; no cargar una posición ficticia. Para recibir push deben estar habilitados también los permisos del teléfono y su registro de dispositivo. Comprobar la apertura de una notificación de oportunidad hacia esta sección; esa nueva comprobación física queda pendiente.

## Corrección de navegación

La vista elegida en Alertas (Mi cartera u Oportunidades) se conserva por cuenta en el dispositivo al cambiar de sección y al reiniciar la aplicación. No modifica la suscripción a alertas guardada en el servidor. Una notificación nueva abre su vista correspondiente y se consume para evitar reaperturas involuntarias. Verificado con pruebas automatizadas de restauración, aislamiento por cuenta y cambios durante la lectura del almacenamiento. Pendiente de comprobar esta corrección en el próximo binario instalado.
