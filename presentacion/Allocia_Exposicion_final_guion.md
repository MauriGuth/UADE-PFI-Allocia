# Guion · Exposición final de Allocia (10 minutos)

Reparto: Orador A, diapositivas 1 a 5 (problema, solución, diferencial y negocio; 3 min). Orador B, demo en vivo (3 min) y diapositivas 7 a 10 (técnica, pruebas y cierre; 3,5 min). Texto en pantalla mínimo; estas notas son el hilo, no para leer. También están cargadas como notas del orador en el .pptx.

## 1. Análisis de portafolios multiactivo con riesgo geopolítico y recomendaciones explicables mediante IA

[Orador A · 10 s] Buenas. Somos Mauricio Huentelaf y Máximo Rosso. Vamos a contar Allocia en siete minutos y mostrarla funcionando en tres: primero el problema y el negocio, después una demo en vivo, y al final cómo está construida y qué pruebas la respaldan.

## 2. La cartera está repartida y los avisos no se explican

[Orador A · 45 s] Octavio tiene acciones en un broker internacional, cripto en un exchange y bonos en uno local; para saber cuánto tiene en cada cosa usa un Excel, y cuando una app le avisa que algo cayó, no le dice por qué. No es un caso aislado: tres de cada cuatro encuestados operan en varias plataformas y dos de cada tres se enteraron tarde de algo importante. Lo validamos con 190 encuestas, tres entrevistas transcriptas y cinco sesiones de uso. La frase de Octavio es el criterio de diseño de todo el producto.

## 3. Allocia: cargar, integrar, medir, explicar, decidir

[Orador A · 45 s] Allocia hace cinco cosas. Cargás tus posiciones, símbolo y cantidad, sin mover la plata. Integra: clasifica cada instrumento y le pone precio con fecha. Mide pesos y concentración. Explica: cada observación muestra la regla, los datos y la fuente. Y vos decidís: no compra, no vende, no promete rendimientos. Es una herramienta de análisis, no un asesor. Y existe en dos formas: web y app móvil, sobre la misma cuenta.

## 4. Nadie cubre el flujo completo

[Orador A · 40 s] Relevamos lo que existe. Morningstar descompone carteras tradicionales pero no sabe de cripto ni de geopolítica; Kubera une mundos pero no explica; CoinStats y DeFiLlama viven solo en cripto. Ninguna hace el recorrido completo hasta una observación que muestre regla, datos y fuente, y ninguna piensa en CEDEARs ni bonos locales. Ese es el espacio de Allocia.

## 5. Freemium: plan Pro de 6 USD, equilibrio con 133 a 163 usuarios

[Orador A · 50 s] El modelo es freemium porque la mitad de los encuestados pide una puerta gratuita y uno de cada cuatro pagaría una suscripción. El plan gratuito resuelve lo básico; el Pro, de seis dólares, agrega informes con fuentes, alertas y seguimiento de activos. Con precios reales de proveedores, el punto de equilibrio son entre 133 y 163 usuarios Pro; el escenario optimista recupera la inversión en el mes 21, el pesimista no llega. Lo decimos sin maquillaje: es viable si la conversión se acerca al optimista, y eso se valida con usuarios, no con encuestas. Y un límite que define el negocio: vendemos análisis, no consejo. Ahora Máximo les muestra la plataforma.

## 6. Demo en vivo

[Orador B · 3 min] Guion de la demo (web en allocia.com.ar, cuenta de prueba preparada antes, con sesión iniciada). 0:00 Cartera: agregar 0,1 BTC; mostrar que se clasifica solo, el precio con fecha y la confirmación. Agregar de nuevo AAPL: el sistema avisa que ya está y ofrece editar. 0:45 Resumen: valor total, distribución por clase y sector, y la lectura «tu cartera se comporta como si tuviera N posiciones». 1:15 Riesgo: abrir «¿Por qué esta observación?» en la posición dominante: dato de la cartera, umbral del 25 %, etiqueta «Sobre tu cartera». Mostrar también la de contexto geopolítico: GPR 176, fuente Caldara e Iacoviello, fecha del dato. 2:00 Señales: recorrer «Dato del» y «Consultado el»; sentimiento cripto, dominancia, Polymarket. 2:30 Teléfono en mano: la misma cuenta, la misma cartera, desbloqueo con Face ID; Ajustes con exportar y eliminar cuenta. 2:50 Cerrar: «todo lo que vieron sale de reglas declaradas y fuentes con fecha; nada decide por el usuario». Plan B si falla internet: video 3 (Allocia explicada) desde el minuto 1:30.

## 7. Una API, dos clientes, seis fuentes en vivo

[Orador B · 45 s] Lo que vieron corre sobre una arquitectura simple a propósito: una API en NestJS con toda la lógica, PostgreSQL y Redis, y dos clientes que comparten cuenta, la web en Next.js y la app en React Native. Todo en TypeScript, un solo lenguaje para los dos. Las señales vienen de seis fuentes en vivo; en el 50 % el índice geopolítico era un dato de demostración y hoy se lee de la planilla diaria de sus autores: 176, elevado. Cada dato lleva dos fechas, la de la fuente y la de nuestra consulta.

## 8. Explicable, acotada y segura

[Orador B · 45 s] Tres decisiones técnicas definen la confianza. Primero: las observaciones salen de un motor de reglas determinista con umbrales declarados; por eso el usuario puede rehacer la cuenta a mano, y en las pruebas coincide con el cálculo manual al millonésimo. Segundo: el modelo de lenguaje solo redacta informes sobre datos públicos, con citas literales; nunca recibe la cartera, y los titulares se tratan como contenido no confiable para evitar inyección de prompts. Tercero: cuentas con JWT revocable, contraseñas con bcrypt, cantidades cifradas, aislamiento por usuario en la base, y el ciclo de la ley de datos personales: consentimiento, exportación y baja.

## 9. Probado con código y con personas

[Orador B · 45 s] Probamos con código y con personas. Sesenta y dos comprobaciones de servicios e integración, treinta y tres unitarias, veintisiete de navegador, y la cobertura del catálogo verificada en producción. Y cinco usuarios con tareas reales: los inversores activos entendieron las observaciones casi sin ayuda; la persona que invierte de vez en cuando y la que recién empieza leyeron el aviso de concentración como si fuera una noticia. Nuestro criterio era cuatro de cinco; dio dos de cinco. De ahí salieron ocho cambios que ya están desplegados, y los vieron en la demo: las fechas rotuladas, la etiqueta de cartera o contexto, la concentración en palabras simples.

## 10. En producción, probada con personas, con límites explícitos

[Orador B · 30 s] Para cerrar: el objetivo está cumplido en su núcleo, cálculo verificado, observaciones con evidencia, web y móvil sobre una cuenta, seis señales en vivo y datos protegidos. Queda parcial la comprensión por perfiles sin experiencia, con los cambios ya aplicados y una segunda ronda por hacer. Y lo que queda afuera por decisión: operar, recomendar comprar o vender, prometer rendimientos. Gracias; quedamos para las preguntas.
