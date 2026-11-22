# Prueba de Allocia en Android e iOS

**Resultado informado el 10/10/2026:** Mauricio confirma que realizó todas las comprobaciones físicas y funcionan. Se registra como aceptación del usuario en ambos sistemas sobre los builds enlazados; no se inventan mediciones ni registros individuales.

Equipos confirmados por Mauricio para las pruebas:

| Equipo | Sistema o interfaz | Resultado informado |
| --- | --- | --- |
| iPhone 17 Pro Max | iOS 27 | Comprobaciones satisfactorias |
| iPhone 14 | iOS 27 | Comprobaciones satisfactorias |
| Samsung Galaxy A16 | One UI 8.5; versión base de Android no informada | Comprobaciones satisfactorias |
| MacBook Pro (web) | macOS 27.2 | Comprobaciones satisfactorias |

La versión de macOS se verificó en el equipo local mediante `sw_vers`: 27.2, compilación 26B5101f. Los modelos y las versiones móviles fueron informados por el usuario. No se informó la versión del navegador ni tiempos individuales por caso.

Instaladores terminados:

- Android: https://expo.dev/accounts/mauri-guth/projects/allocia/builds/5197fba7-6bdf-4fa9-acc5-0ec166c23dca
- iOS: https://expo.dev/accounts/mauri-guth/projects/allocia/builds/a1f76f64-6dcf-4835-a278-ecc829ca4bcc

Registrar teléfono, versión del sistema, enlace del build, hora y resultado. Usar ambos dispositivos y la web con una misma cuenta. No compartir contraseñas ni capturas de tokens.

1. Ingresar y comprobar el botón para mostrar/ocultar contraseña.
2. Cerrar y abrir la app: solicitar Face ID o huella. Cancelar no debe mostrar la cartera. Probar ingreso con contraseña como alternativa.
3. Mandar la app al fondo y volver: comprobar bloqueo y ausencia de datos en la vista previa del sistema.
4. Abrir sin internet: debe permitir reintentar sin perder la sesión. Recuperar conexión y comprobar acceso protegido.
5. Agregar, editar y eliminar una posición de prueba. Comprobar el cambio en la web y en el otro dispositivo después de actualizar (hasta 30 segundos si queda visible).
6. Actualizar cotizaciones: revisar total, posiciones, fecha del precio y última consulta. Una bolsa cerrada puede conservar el último precio; la fecha del proveedor no debe cambiar artificialmente.
7. Comparar Resumen, Cartera y Riesgo. Dentro de la ventana de actualización deben compartir la valuación; un cambio de tenencia o actualización manual recalcula.
8. Solicitar análisis: observar estado por activo hasta listo o no completado. No esperar otra notificación si el informe de esa hora ya existe. Revisar fuentes y marcar como leído.
9. Habilitar notificaciones en cada teléfono. En Android comprobar recepción y apertura hacia Alertas. En iOS repetir apertura y comportamiento con la app en segundo plano.
10. Revisar barra inferior, teclado, fechas, textos largos y tamaño de texto del sistema; ningún control debe quedar tapado.
11. Exportar datos desde Ajustes y comprobar el menú de compartir. Comparar con la cuenta web.
12. Con una cuenta de prueba separada, verificar recuperación, cierre de sesión y baja; no eliminar la cuenta de trabajo.

Esperar siete días es una comprobación física distinta de verificar el vencimiento del JWT. El token vence a los siete días y también puede revocarse por cierre de sesión, cambio de contraseña o baja.

## Alcance de esta entrega

Incluye reintento de sesión sin red, cotización con fecha de consulta, valuación compartida durante un máximo de 30 segundos y estado por activo del análisis. No implica cobertura total de bolsas/históricos, equivalencia de Web Push con Expo Push ni validación física anticipada.

## Nuevos instaladores con logos y legibilidad

Generados desde `e068feb` y terminados correctamente en Expo. Estos enlaces reemplazan los anteriores para instalar la revisión visual; la aceptación informada arriba corresponde a los builds previos.

- [Android](https://expo.dev/accounts/mauri-guth/projects/allocia/builds/a38311fb-b7f3-4b99-a812-3c80e67ed626)
- [iOS](https://expo.dev/accounts/mauri-guth/projects/allocia/builds/d5537a7d-ac60-4841-8d77-416e7ff809e1)

Resultado: satisfactorio, informado por Mauricio Huentelaf después de instalar los nuevos builds. Confirma que probó las nuevas funciones e implementaciones y que todas funcionan correctamente. Se cierra la aceptación física pendiente de esta revisión, que incluye logos, apertura del formulario de alta, cantidades/precios/valor, legibilidad, carga y reintento, y glosario de informes. La confirmación es global: no se inventan tiempos ni resultados individuales por dispositivo o caso. Las sesiones independientes con participantes permanecen separadas de esta aceptación.

## Nueva función: oportunidades fuera de la cartera

Los instaladores Android `8a312f48` e iOS `3e5deb95` incorporan esta función (enlaces en `docs/OPORTUNIDADES.md`). La confirmación previa no se aplica todavía a esta ampliación.

1. Abrir Alertas y cambiar entre Mi cartera y Oportunidades.
2. Buscar Tesla, seguirla sin agregar tenencias y comprobar el mismo seguimiento en la web.
3. Activar alertas de oportunidades y elegir solo seguidos o todo el universo cubierto.
4. Solicitar análisis; un informe completado puede no producir oportunidad si falta un escenario alcista respaldado. Revisar condición, fuentes y riesgos.
5. Cuando se produzca una oportunidad válida, comprobar el push y su apertura hacia Oportunidades en ambos sistemas.
6. Desactivar la preferencia y comprobar que no se entregan nuevos avisos de oportunidades; las alertas de cartera conservan su preferencia propia.
