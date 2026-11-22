# Video 1 · Problema, investigación y propuesta

Duración total: 4.9 min

## Diapositiva 1 (27 s)

Somos Mauricio Huentelaf y Máximo Rosso, y este es el primero de tres videos sobre nuestro Proyecto Final: Allocia, una plataforma de análisis de portafolios multiactivo con riesgo geopolítico y observaciones explicables mediante inteligencia artificial. Acá contamos el problema, la investigación con usuarios, la propuesta y el modelo de negocio. El segundo video cubre arquitectura, implementación y pruebas; el tercero explica el producto de punta a punta.

## Diapositiva 2 (32 s)

El problema es concreto. Un inversor minorista argentino tiene acciones y CEDEARs en un broker, criptomonedas en un exchange y el resto en una planilla. Cada aplicación muestra su propio rendimiento, pero ninguna muestra la cartera completa ni cuánto depende de un sector, una región o una moneda. Y las alertas avisan que algo cayó, pero no explican por qué. En la encuesta, las dificultades más marcadas fueron la visión consolidada, entender la diversificación y la exposición real, y la falta de tiempo para investigar.

## Diapositiva 3 (31 s)

Para validarlo hicimos una encuesta con ciento noventa respuestas, con ochenta y cinco inversores activos, y tres entrevistas en profundidad con inversores independientes, transcriptas completas en el anexo. Los tres tienen la cartera repartida en varias plataformas y los tres desconfían de las recomendaciones sin fundamento. Octavio lo resumió así: confiaría mucho más en una recomendación si pudiera entender qué información se usó, qué riesgo considera y cómo se relaciona con su cartera. Esa frase guía el diseño de Allocia.

## Diapositiva 4 (32 s)

Relevamos las herramientas existentes. Morningstar descompone muy bien una cartera tradicional, pero sin cripto ni contexto geopolítico. Sharesight y Empower consolidan rendimiento, sin señales ni explicación. Kubera une activos tradicionales y cripto, pero no explica observaciones. CoinStats y DeFiLlama cubren solo cripto. Ninguna documenta el flujo completo, de la composición multiactivo a una observación con su regla, sus datos y su fuente. Ese es el diferencial de Allocia.

## Diapositiva 5 (35 s)

La propuesta tiene cinco pasos. Uno: el inversor con posiciones repartidas. Dos: una carga única, ticker y cantidad, desde la web o el teléfono. Tres: la integración, con el catálogo que clasifica cada instrumento, cotizaciones con fecha y señales con su procedencia. Cuatro: el análisis, con pesos, exposiciones e índice de concentración. Cinco: la observación explicable, con la regla que la activó, las métricas y la evidencia. El usuario decide; la herramienta no opera ni recomienda.

## Diapositiva 6 (24 s)

La propuesta original comprometía una plataforma web. La mantuvimos y sumamos una aplicación móvil nativa, porque casi la mitad de los encuestados sigue sus inversiones desde el teléfono. Hoy Allocia tiene dos clientes sobre la misma cuenta y la misma API: la web, para computadora o navegador del teléfono sin instalar nada, y la app para iOS y Android. Lo que se carga en uno aparece en el otro.

## Diapositiva 7 (31 s)

La investigación se tradujo en doce requerimientos funcionales y diez no funcionales, redactados como «el sistema debe» y con criterio de aceptación. Los centrales: cuenta propia con posiciones aisladas; composición e índice de concentración; señales con fuente, fecha y condición; observaciones con regla, métricas y evidencia; informes por activo con citas validadas; y baja de cuenta con exportación. Un requerimiento fija el límite: Allocia informa y explica, nunca opera ni promete rendimientos.

## Diapositiva 8 (29 s)

El modelo de negocio es freemium. El plan gratuito admite hasta diez posiciones con composición y observaciones básicas; el plan Pro, de seis dólares por mes, agrega posiciones ilimitadas, informes con fuentes, alertas y exportación. La encuesta lo respalda: la mitad usaría la herramienta solo si tiene versión gratuita con funciones pagas y uno de cada cuatro pagaría una suscripción. El límite legal es claro: Allocia vende análisis, no asesoramiento.

## Diapositiva 9 (35 s)

Para la viabilidad armamos un flujo de fondos a treinta y seis meses con precios reales. Inversión inicial: unos diez mil trescientos dólares; costos fijos: quinientos diecisiete por mes más marketing. El punto de equilibrio está entre ciento treinta y tres y ciento sesenta y tres usuarios Pro. El pesimista no lo alcanza; el base llega al equilibrio operativo en el mes veinticinco; el optimista recupera la inversión en el mes veintiuno, con VAN positivo y una TIR del ochenta y siete por ciento. Es viable si la conversión se acerca al optimista, y eso se valida con usuarios reales.

## Diapositiva 10 (21 s)

Hasta acá, el problema, la investigación y la propuesta. Allocia no promete predecir el mercado: promete que cada observación se pueda entender y verificar. En el segundo video mostramos cómo está construida: arquitectura, motor de reglas, capa de inteligencia artificial, seguridad y pruebas. Gracias por ver.

