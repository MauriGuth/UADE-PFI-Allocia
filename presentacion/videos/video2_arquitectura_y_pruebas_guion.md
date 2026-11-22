# Video 2 · Arquitectura, implementación y pruebas

Duración total: 5.0 min

## Diapositiva 1 (19 s)

Este es el segundo video de nuestro Proyecto Final. En el primero contamos el problema y la propuesta. Acá mostramos cómo está construida Allocia: arquitectura, recorrido de los datos, motor de reglas, capa de inteligencia artificial, seguridad, metodología y las pruebas que respaldan los resultados.

## Diapositiva 2 (30 s)

La arquitectura es simple a propósito. Una API en NestJS concentra la lógica: catálogo, cálculo, reglas, señales e informes; persiste en PostgreSQL y usa Redis como caché. Sobre ella hay dos clientes: la web en Next.js, en Vercel, y la app móvil en React Native con Expo. TypeScript en los tres componentes permite compartir contratos y trabajar con un solo lenguaje. La API y la base corren en Railway, con los secretos fuera del repositorio.

## Diapositiva 3 (29 s)

Este es el recorrido de la información. A la izquierda, las fuentes externas: Finnhub, CoinGecko, Alternative me, FRED, DefiLlama y Polymarket. Todas responden en vivo en el servicio publicado; lo verificamos el veintidós de octubre. Solo el índice GPR sigue sin fuente en vivo. La API normaliza cada dato con su fuente, la fecha del dato y la fecha de consulta, lo guarda en caché quince minutos y lo entrega al motor de reglas y a los clientes.

## Diapositiva 4 (31 s)

El corazón de Allocia es un motor de reglas determinista en TypeScript, sin modelo de lenguaje. Las condiciones están declaradas: el índice HHI es alto por encima de dos mil quinientos; una posición que supera el veinticinco por ciento genera una observación; la exposición cripto pasa a atención arriba del veinticinco y a alerta arriba del cuarenta. Cada observación guarda la regla, las métricas y la señal que la activaron. Por eso el usuario puede abrir «por qué esta observación» y ver qué dato y qué umbral la produjeron.

## Diapositiva 5 (37 s)

La segunda capa sí usa un modelo de lenguaje, con límites estrictos. Redacta informes por activo a partir de un snapshot público: noticias, cotización e indicadores. Nunca recibe la cartera ni la identidad del usuario. Los titulares se marcan como contenido no confiable, porque son el vector típico de la inyección indirecta de prompts. La salida se valida con un esquema y cada cita debe coincidir literalmente con su fuente; si falta evidencia, el informe se abstiene. Y el modelo no tiene funciones para operar. El motor explica; el modelo solo redacta sobre fuentes citadas.

## Diapositiva 6 (37 s)

En seguridad: JWT con emisor, audiencia, vencimiento y versión revocable; cookie HttpOnly en la web y almacenamiento seguro en el móvil; contraseñas con bcrypt, cantidades cifradas, HTTPS y límites de solicitudes; posiciones aisladas por propietario en la base. En lo legal, el aviso de privacidad, el consentimiento, la exportación y la baja de cuenta responden a la Ley veinticinco mil trescientos veintiséis, y Allocia no es agente ante la CNV: no asesora ni opera. Lo pendiente también está escrito: auditoría externa, responsable de datos y plazos de conservación.

## Diapositiva 7 (24 s)

Trabajamos con Scrum adaptado a un equipo de dos, con un tablero Kanban en GitHub Projects. Sprints de dos semanas con un objetivo y un incremento revisable; el tutor participa en cada hito. Una tarea está terminada cuando sus pruebas pasan en integración continua, el otro integrante revisó la solicitud y el informe está actualizado. Dieciséis sprints ejecutados, cuatro hasta la defensa.

## Diapositiva 8 (36 s)

Las pruebas: sesenta y dos comprobaciones de servicios, integración, seguridad e inteligencia artificial; treinta y tres unitarias; veintisiete de Playwright sobre la web y catorce adicionales de privacidad, sesión y accesibilidad. Detectaron y corrigieron tres defectos. El ejemplo que mejor muestra el valor: una cartera de tres posiciones con pesos veinte, sesenta y veinte por ciento. El HHI da cuatro mil cuatrocientos y el motor emite dos observaciones: concentración alta y posición dominante. Cualquiera puede rehacer la cuenta y comprobar que la observación sale de sus datos y de un umbral declarado.

## Diapositiva 9 (37 s)

Contrastamos cada objetivo con su evidencia. El objetivo general está cumplido en el núcleo: una cartera cargada desde cualquiera de los dos clientes se mide y produce observaciones explicables; el cálculo coincide con la verificación manual; la protección de datos está probada. Cinco personas probaron la aplicación con tareas reales: dos inversores activos explicaron una observación sin ayuda; los demás necesitaron orientación, y de ahí salen ocho cambios de presentación. Queda parcial el índice geopolítico en vivo. Lo que no probamos no lo afirmamos: ni rentabilidad, ni predicción, ni asesoramiento.

## Diapositiva 10 (22 s)

En resumen: un sistema en producción, con pruebas reproducibles y límites explícitos. Próximos pasos: aplicar los cambios que surgieron de las sesiones con usuarios, el índice GPR en vivo, las notificaciones en el navegador y la validación de la disposición a pagar. En el tercer video mostramos el producto como lo ve un usuario. Gracias.

