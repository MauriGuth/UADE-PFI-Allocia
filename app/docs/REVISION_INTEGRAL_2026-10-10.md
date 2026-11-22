# Revisión previa al próximo instalador — 10 de octubre de 2026

## Resultado

Se corrigió una pérdida de sesión al iniciar sin red: un error temporal de conexión ya no elimina el token guardado. Se ofrece reintentar o ingresar con otra cuenta, sin mostrar información privada antes de validar la sesión y pasar el bloqueo biométrico. Un 401 invalida la sesión; una respuesta tardía no puede restaurar una cuenta que se abandonó.

No se genera otro build en esta revisión. Los últimos instaladores no incluyen esta corrección ni las últimas etiquetas de frescura de cotizaciones. El backend publicado sí incluye la actualización manual de cotizaciones. El documento académico distingue implementación, despliegue y verificación física.

## Comprobaciones ejecutadas

| Alcance | Resultado | Límite |
| --- | --- | --- |
| Seguridad e integración HTTP/PostgreSQL/Redis | 22 comprobaciones satisfactorias | Entorno aislado; no envía push real |
| Indicadores, cotizaciones, publicación, correo, traducción y escenarios | 20 pruebas satisfactorias | Proveedores y respuestas controlados |
| Utilidades web | 8 pruebas satisfactorias | No representa cobertura total |
| Navegador → API → base de datos | 3 recorridos satisfactorios | Correo simulado en esta suite; entrega real ya confirmada previamente por el usuario |
| Compilación API y web, tipos de móvil | Correctos | No demuestra comportamiento físico |
| Regresión biométrica y restauración de sesión | Correcta | Sensores y almacenamiento simulados |
| Caducidad, refresco manual y errores de cotización | Correctos | No garantiza datos que el proveedor no entrega |

Los tres recorridos de navegador cubren verificación/recuperación, registro/cartera/alertas/exportación/revocación/baja y una misma cuenta compartida entre web y cliente móvil. CI incorpora las regresiones de biometría, sesión sin red y refresco de cotizaciones.

## Mejoras priorizadas

1. **Cierre físico:** probar Face ID y huella, cancelación, segundo plano, reconexión, teclado, fechas y barra inferior en ambos teléfonos. Push confirmado por el usuario en iPhone; Android pendiente de confirmación.
2. **Datos comprensibles:** estado de mercado abierto/cerrado basado en calendarios verificables y resumen de cobertura/demoras por proveedor. Nunca cambiar la fecha del proveedor por la hora de consulta.
3. **Valuación consistente entre pantallas:** agregar una instantánea versionada compartida. Actualmente cada respuesta calcula total y posiciones juntos, pero dos consultas en momentos diferentes pueden usar precios distintos.
4. **Análisis observable:** ampliar progreso por activo, motivos de error/cuotas y observación del disparo automático real. Existe estado de solicitud; recibirla no equivale a terminar el informe.
5. **Claridad:** filtros de noticias relevantes para la cartera, glosario contextual y sesiones de comprensión con usuarios independientes.

## Condiciones abiertas

La cobertura global de históricos y precios, los calendarios fuera del alcance configurado, la observación de ejecuciones automáticas reales y la validación humana independiente siguen abiertas. Los gráficos no convierten interpretaciones de IA en probabilidades calibradas. No hay evidencia suficiente para afirmar un 100 % global ni ausencia de vulnerabilidades.

## Documento

Se actualizan metodología/implementación y capítulos 5, 6 y 7 en el repositorio separado UADE_PFI, incluyendo resultados, límites y oportunidades. La entrega es `entrega/Allocia.pdf`.
