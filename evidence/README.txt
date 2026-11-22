EVIDENCIA TÉCNICA

Registros saneados de las ejecuciones del 8, 9 y 13 de octubre de 2026.
Se conservan fechas, resultados y métricas públicas; se excluyen trazas de red,
cuerpos HTTP, identificadores de cuentas y datos de conexión. Los registros
completos permanecen locales. No contiene entrevistas ni resultados humanos.

Código de pruebas: https://github.com/MauriGuth/allocia/tree/dd2d12735ba6ea9b5a5c60fd0bd0245db63f9b63/apps/api/tests
Recorridos web: apps/web/e2e/release.spec.ts y account-email.spec.ts.
La evaluación inicial usa la versión previa; no se extrapola su rendimiento
a la versión integrada ni a producción. Los resultados por caso se mantienen
en su fecha original; no se suman aserciones y recorridos como cobertura.

AMPLIACIÓN: 2026-10-09-actualizacion.json registra revisiones, CI y huellas de los nuevos ensayos. Las copias saneadas están en 2026-10-09-ampliacion/. La confirmación de casilla real está registrada; no se conserva dirección personal. Los resultados históricos no se suman a los nuevos como cobertura.

REVERIFICACIÓN: 2026-10-13-reverificacion.json y la carpeta homónima registran la repetición de los casos del Anexo F sobre la revisión 79233ed de Allocia, con sus entornos, resultados y un hallazgo corregido (X11). Los resultados no se suman a los anteriores.
