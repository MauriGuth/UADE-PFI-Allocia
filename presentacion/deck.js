// Exposición final de Allocia: diapositivas livianas, el relato va en las notas.
const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const Fi = require("react-icons/fi");
const { applyTheme } = require(process.env.SKILL_DIR + "/scripts/apply_theme.js");

const A = (f) => path.join(__dirname, "assets", f);
const THEME = {
  name: "Allocia",
  headFontFace: "Calibri",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "091426", lt1: "FFFFFF", dk2: "3A4356", lt2: "E2DFFF",
    accent1: "4B41E1", accent2: "15803D", accent3: "B45309", accent4: "BA1A1A", accent5: "6D5BFF", accent6: "8A94A6",
    hlink: "4B41E1", folHlink: "6D5BFF",
  },
};
const viab = JSON.parse(fs.readFileSync(path.join(__dirname, "viab.json"), "utf8"));

async function icon(Component, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Component, { color: "#" + color, size }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  pres.author = "Huentelaf, Mauricio; Rosso, Máximo";
  pres.title = "Allocia · Exposición final";
  const C = pres.SchemeColor;
  const FOOT = { x: 0.6, y: 7.0, w: 9, h: 0.3, fontSize: 10, color: C.accent6, margin: 0 };

  pres.defineSlideMaster({
    title: "DARK", background: { color: THEME.colors.dk1 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.3, w: 11.7, h: 1.8, fontSize: 40, bold: true, color: C.background1, valign: "bottom", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 4.3, w: 11.7, h: 1.6, fontSize: 20, color: C.background2, valign: "top", margin: 0 }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "LIGHT", background: { color: THEME.colors.lt1 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.45, w: 12.1, h: 0.9, fontSize: 32, bold: true, color: C.text1, valign: "middle", margin: 0 }, text: "" } },
      { text: { text: "Allocia · Exposición final · PFI 2026 · UADE", options: FOOT } },
    ],
    slideNumber: { x: 12.3, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: THEME.colors.accent6 },
  });

  const T = (slide, t) => slide.addText(t, { placeholder: "title" });
  const stat = (slide, x, y, w, big, small, color = C.accent1) => {
    slide.addShape(pres.ShapeType.roundRect, { x, y, w, h: 1.9, fill: { color: C.background2, transparency: 55 }, line: { color: C.background2, width: 0 }, rectRadius: 0.15 });
    slide.addText(big, { x: x + 0.25, y: y + 0.15, w: w - 0.5, h: 1.0, fontSize: 44, bold: true, color, margin: 0, isTextBox: true, valign: "middle" });
    slide.addText(small, { x: x + 0.25, y: y + 1.15, w: w - 0.5, h: 0.65, fontSize: 14, color: C.text2, margin: 0, isTextBox: true, valign: "top" });
  };
  const row = async (slide, x, y, w, Comp, head, text, color = THEME.colors.accent1) => {
    slide.addShape(pres.ShapeType.ellipse, { x, y: y + 0.05, w: 0.6, h: 0.6, fill: { color: C.background2 }, line: { color: C.background2, width: 0 } });
    slide.addImage({ data: await icon(Comp, color), x: x + 0.14, y: y + 0.19, w: 0.32, h: 0.32 });
    slide.addText(head, { x: x + 0.8, y, w: w - 0.8, h: 0.4, fontSize: 18, bold: true, color: C.text1, margin: 0, isTextBox: true });
    slide.addText(text, { x: x + 0.8, y: y + 0.4, w: w - 0.8, h: 0.5, fontSize: 14, color: C.text2, margin: 0, isTextBox: true, valign: "top" });
  };
  const img = (slide, f, x, y, w, h, shadow = true) => slide.addImage({ path: A(f), x, y, w, h, sizing: { type: "contain", w, h }, ...(shadow ? { shadow: { type: "outer", color: THEME.colors.dk1, blur: 8, offset: 2, angle: 90, opacity: 0.18 } } : {}) });


  // 1 Portada (10 s)
  pres.addSection({ title: "Apertura" });
  let s = pres.addSlide({ masterName: "DARK", sectionTitle: "Apertura" });
  s.addImage({ path: A("allocia_logo.png"), x: 0.8, y: 0.8, h: 0.9, w: 3.4 });
  T(s, "Análisis de portafolios multiactivo con riesgo geopolítico y recomendaciones explicables mediante IA");
  s.addText([{ text: "Proyecto Final de Ingeniería en Informática · Exposición final", options: { breakLine: true } }, { text: "Huentelaf, Mauricio · Rosso, Máximo        Tutor: Prieto, Leonardo Javier        UADE · 2026", options: { fontSize: 16 } }], { placeholder: "body" });
  s.addNotes("[Orador A · 10 s] Buenas. Somos Mauricio Huentelaf y Máximo Rosso. Vamos a contar Allocia en siete minutos y mostrarla funcionando en tres: primero el problema y el negocio, después una demo en vivo, y al final cómo está construida y qué pruebas la respaldan.");

  // 2 Problema y validación (45 s)
  pres.addSection({ title: "Negocio" });
  s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Negocio" });
  T(s, "La cartera está repartida y los avisos no se explican");
  stat(s, 0.6, 1.7, 3.9, "74,7 %", "opera en dos o más plataformas");
  stat(s, 4.7, 1.7, 3.9, "68,9 %", "se enteró tarde de algo que cambiaba una decisión");
  stat(s, 8.8, 1.7, 3.9, "190 · 3 · 5", "encuestas · entrevistas · sesiones de uso");
  s.addShape(pres.ShapeType.roundRect, { x: 0.6, y: 4.0, w: 12.1, h: 2.3, fill: { color: C.background2, transparency: 55 }, line: { color: C.background2, width: 0 }, rectRadius: 0.15 });
  s.addText("«Confiaría mucho más en una recomendación si pudiera entender qué información se utilizó, qué riesgo considera y cómo se relaciona con mi cartera.»", { x: 1.0, y: 4.2, w: 11.3, h: 1.4, fontSize: 22, italic: true, color: C.text1, margin: 0, isTextBox: true, valign: "middle" });
  s.addText("Octavio Antunes, inversor entrevistado", { x: 1.0, y: 5.6, w: 11.3, h: 0.5, fontSize: 14, color: C.accent6, margin: 0, isTextBox: true });
  s.addNotes("[Orador A · 45 s] Octavio tiene acciones en un broker internacional, cripto en un exchange y bonos en uno local; para saber cuánto tiene en cada cosa usa un Excel, y cuando una app le avisa que algo cayó, no le dice por qué. No es un caso aislado: tres de cada cuatro encuestados operan en varias plataformas y dos de cada tres se enteraron tarde de algo importante. Lo validamos con 190 encuestas, tres entrevistas transcriptas y cinco sesiones de uso. La frase de Octavio es el criterio de diseño de todo el producto.");

  // 3 Solución (45 s)
  s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Negocio" });
  T(s, "Allocia: cargar, integrar, medir, explicar, decidir");
  img(s, "fig_flujo_valor-1.png", 0.6, 1.6, 12.1, 5.2, false);
  s.addNotes("[Orador A · 45 s] Allocia hace cinco cosas. Cargás tus posiciones, símbolo y cantidad, sin mover la plata. Integra: clasifica cada instrumento y le pone precio con fecha. Mide pesos y concentración. Explica: cada observación muestra la regla, los datos y la fuente. Y vos decidís: no compra, no vende, no promete rendimientos. Es una herramienta de análisis, no un asesor. Y existe en dos formas: web y app móvil, sobre la misma cuenta.");

  // 4 Diferenciación (40 s)
  s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Negocio" });
  T(s, "Nadie cubre el flujo completo");
  const hdr = (t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: THEME.colors.dk1 }, align: "center", fontSize: 14 } });
  const Y = { text: "sí", options: { color: THEME.colors.accent2, bold: true, align: "center" } };
  const N = { text: "–", options: { color: THEME.colors.accent6, align: "center" } };
  const P = { text: "parcial", options: { color: THEME.colors.accent3, align: "center" } };
  const nm = (t) => ({ text: t, options: { bold: true, align: "left" } });
  const rows = [
    [hdr(""), hdr("Tradicional + cripto"), hdr("Contexto geopolítico"), hdr("Señales emergentes"), hdr("Explica cada aviso")],
    [nm("Morningstar"), N, N, N, P],
    [nm("Kubera"), Y, N, P, N],
    [nm("CoinStats / DeFiLlama"), { text: "solo cripto", options: { color: THEME.colors.accent3, align: "center" } }, N, Y, N],
    [{ text: "Allocia", options: { bold: true, color: THEME.colors.accent1, fill: { color: THEME.colors.lt2 } } }, ...["sí", "sí", "sí", "regla + datos + fuente"].map((t) => ({ text: t, options: { bold: true, color: THEME.colors.accent1, fill: { color: THEME.colors.lt2 }, align: "center" } }))],
  ];
  s.addTable(rows, { x: 0.6, y: 1.8, w: 12.1, colW: [3.3, 2.2, 2.2, 2.2, 2.2], fontSize: 15, rowH: 0.7, border: { type: "solid", color: THEME.colors.lt2, pt: 1 }, valign: "middle", color: THEME.colors.dk2 });
  s.addText("En español y para instrumentos accesibles desde la Argentina", { x: 0.6, y: 5.6, w: 12.1, h: 0.6, fontSize: 18, color: C.text1, margin: 0, isTextBox: true });
  s.addNotes("[Orador A · 40 s] Relevamos lo que existe. Morningstar descompone carteras tradicionales pero no sabe de cripto ni de geopolítica; Kubera une mundos pero no explica; CoinStats y DeFiLlama viven solo en cripto. Ninguna hace el recorrido completo hasta una observación que muestre regla, datos y fuente, y ninguna piensa en CEDEARs ni bonos locales. Ese es el espacio de Allocia.");

  // 5 Negocio y viabilidad (50 s)
  s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Negocio" });
  T(s, "Freemium: plan Pro de 6 USD, equilibrio con 133 a 163 usuarios");
  img(s, "fig_flujo_caja-1.png", 0.6, 1.6, 7.6, 5.2, false);
  stat(s, 8.6, 1.6, 4.1, "50 %", "quiere entrada gratuita con funciones pagas");
  stat(s, 8.6, 3.7, 4.1, "mes 21", "recupero de la inversión, escenario optimista");
  s.addText("Vendemos análisis, no asesoramiento: no somos agentes ante la CNV", { x: 8.6, y: 5.9, w: 4.1, h: 0.9, fontSize: 12, color: C.accent6, margin: 0, isTextBox: true, valign: "top" });
  s.addNotes("[Orador A · 50 s] El modelo es freemium porque la mitad de los encuestados pide una puerta gratuita y uno de cada cuatro pagaría una suscripción. El plan gratuito resuelve lo básico; el Pro, de seis dólares, agrega informes con fuentes, alertas y seguimiento de activos. Con precios reales de proveedores, el punto de equilibrio son entre 133 y 163 usuarios Pro; el escenario optimista recupera la inversión en el mes 21, el pesimista no llega. Lo decimos sin maquillaje: es viable si la conversión se acerca al optimista, y eso se valida con usuarios, no con encuestas. Y un límite que define el negocio: vendemos análisis, no consejo. Ahora Máximo les muestra la plataforma.");

  // 6 Demo (3 min)
  pres.addSection({ title: "Demo" });
  s = pres.addSlide({ masterName: "DARK", sectionTitle: "Demo" });
  s.addImage({ path: A("allocia_isotipo.png"), x: 0.8, y: 0.8, h: 0.9, w: 0.9 });
  T(s, "Demo en vivo");
  s.addText([{ text: "allocia.com.ar  ·  app móvil", options: { breakLine: true } }, { text: "Cargar · Resumen · ¿Por qué esta observación? · Señales con fecha · Misma cuenta en el teléfono", options: { fontSize: 16 } }], { placeholder: "body" });
  s.addNotes("[Orador B · 3 min] Guion de la demo (web en allocia.com.ar, cuenta de prueba preparada antes, con sesión iniciada). 0:00 Cartera: agregar 0,1 BTC; mostrar que se clasifica solo, el precio con fecha y la confirmación. Agregar de nuevo AAPL: el sistema avisa que ya está y ofrece editar. 0:45 Resumen: valor total, distribución por clase y sector, y la lectura «tu cartera se comporta como si tuviera N posiciones». 1:15 Riesgo: abrir «¿Por qué esta observación?» en la posición dominante: dato de la cartera, umbral del 25 %, etiqueta «Sobre tu cartera». Mostrar también la de contexto geopolítico: GPR 176, fuente Caldara e Iacoviello, fecha del dato. 2:00 Señales: recorrer «Dato del» y «Consultado el»; sentimiento cripto, dominancia, Polymarket. 2:30 Teléfono en mano: la misma cuenta, la misma cartera, desbloqueo con Face ID; Ajustes con exportar y eliminar cuenta. 2:50 Cerrar: «todo lo que vieron sale de reglas declaradas y fuentes con fecha; nada decide por el usuario». Plan B si falla internet: video 3 (Allocia explicada) desde el minuto 1:30.");

  // 7 Cómo está construida (45 s)
  pres.addSection({ title: "Técnica" });
  s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Técnica" });
  T(s, "Una API, dos clientes, seis fuentes en vivo");
  img(s, "fig_diag_componentes-1.png", 0.6, 1.6, 7.6, 5.2, false);
  await row(s, 8.6, 1.7, 4.1, Fi.FiServer, "API NestJS", "PostgreSQL y Redis, en Railway.");
  await row(s, 8.6, 2.95, 4.1, Fi.FiMonitor, "Web y app móvil", "Next.js en Vercel · Expo en iOS y Android.");
  await row(s, 8.6, 4.2, 4.1, Fi.FiGlobe, "Seis fuentes con fecha", "Finnhub, CoinGecko, Alternative.me, DefiLlama, Polymarket, GPR.");
  s.addNotes("[Orador B · 45 s] Lo que vieron corre sobre una arquitectura simple a propósito: una API en NestJS con toda la lógica, PostgreSQL y Redis, y dos clientes que comparten cuenta, la web en Next.js y la app en React Native. Todo en TypeScript, un solo lenguaje para los dos. Las señales vienen de seis fuentes en vivo; en el 50 % el índice geopolítico era un dato de demostración y hoy se lee de la planilla diaria de sus autores: 176, elevado. Cada dato lleva dos fechas, la de la fuente y la de nuestra consulta.");

  // 8 Explicable, acotada, segura (45 s)
  s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Técnica" });
  T(s, "Explicable, acotada y segura");
  img(s, "ez-04-riesgo-evidencia.png", 0.9, 1.5, 3.0, 5.4);
  await row(s, 4.6, 1.8, 8.1, Fi.FiCheckSquare, "Motor de reglas determinista", "Dato de la cartera + señal con fuente y fecha + regla con umbral. Sin modelo de lenguaje.");
  await row(s, 4.6, 3.2, 8.1, Fi.FiFileText, "IA solo para redactar informes", "Datos públicos del activo, citas literales, abstención sin evidencia; nunca ve tu cartera ni opera.");
  await row(s, 4.6, 4.6, 8.1, Fi.FiLock, "Datos protegidos", "JWT revocable, bcrypt, cifrado, aislamiento por usuario, exportación y baja (Ley 25.326).");
  s.addNotes("[Orador B · 45 s] Tres decisiones técnicas definen la confianza. Primero: las observaciones salen de un motor de reglas determinista con umbrales declarados; por eso el usuario puede rehacer la cuenta a mano, y en las pruebas coincide con el cálculo manual al millonésimo. Segundo: el modelo de lenguaje solo redacta informes sobre datos públicos, con citas literales; nunca recibe la cartera, y los titulares se tratan como contenido no confiable para evitar inyección de prompts. Tercero: cuentas con JWT revocable, contraseñas con bcrypt, cantidades cifradas, aislamiento por usuario en la base, y el ciclo de la ley de datos personales: consentimiento, exportación y baja.");

  // 9 Pruebas y usuarios (45 s)
  s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Técnica" });
  T(s, "Probado con código y con personas");
  stat(s, 0.6, 1.7, 3.9, "62 + 33 + 27", "comprobaciones de servicios, unitarias y de navegador");
  stat(s, 4.7, 1.7, 3.9, "34 / 34", "cotizaciones del catálogo en producción", THEME.colors.accent2);
  stat(s, 8.8, 1.7, 3.9, "2 de 5", "explicaron una observación sin ayuda", THEME.colors.accent3);
  await row(s, 0.6, 4.1, 5.8, Fi.FiUsers, "Cinco usuarios con tareas reales", "Los activos entendieron; ocasional y principiante leyeron el aviso como noticia.");
  await row(s, 6.9, 4.1, 5.8, Fi.FiRefreshCw, "Ocho cambios ya desplegados", "Fechas rotuladas, «sobre tu cartera» vs. contexto, concentración en palabras simples.");
  s.addNotes("[Orador B · 45 s] Probamos con código y con personas. Sesenta y dos comprobaciones de servicios e integración, treinta y tres unitarias, veintisiete de navegador, y la cobertura del catálogo verificada en producción. Y cinco usuarios con tareas reales: los inversores activos entendieron las observaciones casi sin ayuda; la persona que invierte de vez en cuando y la que recién empieza leyeron el aviso de concentración como si fuera una noticia. Nuestro criterio era cuatro de cinco; dio dos de cinco. De ahí salieron ocho cambios que ya están desplegados, y los vieron en la demo: las fechas rotuladas, la etiqueta de cartera o contexto, la concentración en palabras simples.");

  // 10 Estado y cierre (30 s)
  pres.addSection({ title: "Cierre" });
  s = pres.addSlide({ masterName: "DARK", sectionTitle: "Cierre" });
  s.addImage({ path: A("allocia_logo.png"), x: 0.8, y: 0.8, h: 0.9, w: 3.4 });
  T(s, "En producción, probada con personas, con límites explícitos");
  s.addText([{ text: "Cumplido: cálculo verificado · observaciones con evidencia · web y móvil · seis señales en vivo · datos protegidos", options: { breakLine: true } }, { text: "Sigue: segunda ronda con usuarios · notificaciones web · validar la disposición a pagar", options: { breakLine: true } }, { text: "allocia.com.ar · Huentelaf, Mauricio · Rosso, Máximo — PFI 2026, UADE", options: { fontSize: 14 } }], { placeholder: "body" });
  s.addNotes("[Orador B · 30 s] Para cerrar: el objetivo está cumplido en su núcleo, cálculo verificado, observaciones con evidencia, web y móvil sobre una cuenta, seis señales en vivo y datos protegidos. Queda parcial la comprensión por perfiles sin experiencia, con los cambios ya aplicados y una segunda ronda por hacer. Y lo que queda afuera por decisión: operar, recomendar comprar o vender, prometer rendimientos. Gracias; quedamos para las preguntas.");

  const out = path.join(__dirname, "Allocia_Exposicion_final.pptx");
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log("ok", out);
})().catch((e) => { console.error(e); process.exit(1); });
