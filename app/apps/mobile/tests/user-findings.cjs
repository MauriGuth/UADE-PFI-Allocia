// Verifica los ocho cambios surgidos de las sesiones con usuarios (lógica pura y textos clave).
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const load=(file,mocks)=>{const code=ts.transpileModule(read(file),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;const exports={};vm.runInNewContext(code,{exports,require:n=>{if(!(n in mocks))throw new Error('módulo no simulado: '+n);return mocks[n];}});return exports;};
const React={createElement:()=>null,useState:v=>[v,()=>{}],useEffect:()=>{},useRef:v=>({current:v})};
const rn={StyleSheet:{create:x=>x,hairlineWidth:1},Text:'text',View:'view',Pressable:'pressable',Linking:{}};
const theme={colors:new Proxy({},{get:(_,k)=>'#'+String(k)}),categorical:['#a','#b','#c'],fonts:{regular:'r',medium:'m',semibold:'s',bold:'b'},makeStyles:()=>()=>({}),useTheme:()=>({c:{},cat:[]}),alpha:()=>'#0'};
const icons=new Proxy({},{get:()=>()=>null});

// 2 · Origen de la observación.
const cards=load('components/cards.tsx',{react:React,'react-native':rn,'../lib/api':{api:{}},'./ui':{ActionButton:()=>null,ProvenanceDates:()=>null,Badge:()=>null},'./icons':icons,'./AssetLogo':{AssetMark:()=>null},'../lib/theme':theme});
const obs=(categoria,tipos)=>({id:'x',severidad:'info',categoria,titulo:'t',mensaje:'m',evidencia:tipos.map(tipo=>({tipo,descripcion:'d',valor:'v',fuente:'f'}))});
assert.equal(cards.observationScope(obs('concentración',['dato del portafolio','regla'])),'cartera');
assert.equal(cards.observationScope(obs('diversificación',['dato del portafolio','regla'])),'cartera');
assert.equal(cards.observationScope(obs('exposición',['dato del portafolio','regla'])),'cartera');
assert.equal(cards.observationScope(obs('exposición',['dato del portafolio','señal externa','regla'])),'externo');
assert.equal(cards.observationScope(obs('contexto',['señal externa','regla'])),'externo');
assert.equal(cards.observationScope(obs('señales',['señal externa','regla'])),'externo');
assert.equal(cards.SCOPE_LABEL.cartera.label,'Sobre tu cartera');
assert.equal(cards.SCOPE_LABEL.externo.label,'Contexto externo');
assert.notEqual(cards.SCOPE_LABEL.cartera.bg,cards.SCOPE_LABEL.externo.bg);
// 7 · Estado vacío y estados del pedido.
assert.match(cards.SCENARIO_EMPTY_TEXT,/no se inventan/);
assert.equal(JSON.stringify(cards.REQUEST_STATE_LABEL),JSON.stringify({queued:'Pedido en cola',processing:'En proceso',ready:'Listo',failed:'No se pudo'}));
const cardsSrc=read('components/cards.tsx');
assert.ok(cardsSrc.includes('Regla aplicada:'),'la regla se muestra en la tarjeta');
assert.ok(cardsSrc.includes('¿Por qué esta observación?'),'el desplegable se conserva');
assert.ok(cardsSrc.includes('Solicitar análisis ahora')&&cardsSrc.includes('api.marketStatus()'));

// 3 · Concentración en lenguaje llano y glosario.
const summary=load('components/AnalysisSummary.tsx',{react:React,'react-native':rn,'./motion':{MotionPressable:'p'},'../lib/api':{},'../lib/theme':theme});
assert.equal(summary.CONCENTRATION_PLAIN,'Mide qué tan repartida está tu cartera. Si tenés diez activos pero uno pesa el 60 %, se comporta como si tuvieras dos.');
assert.ok(summary.glossaryFor('La concentración es alta').some(t=>t.term==='Concentración (HHI)'));
assert.ok(summary.glossaryFor('HHI 2600').some(t=>t.term==='Concentración (HHI)'));
assert.ok(!summary.glossaryFor('Sin términos').length);
const summarySrc=read('components/AnalysisSummary.tsx');
assert.ok(summarySrc.includes('Tu cartera se comporta como si tuviera ${fmtN(n)} posiciones'));

// 1 · Fechas: rótulos y ayuda.
const ui=load('components/ui.tsx',{react:React,'react-native':{...rn,ActivityIndicator:'a'},'./motion':{MotionPressable:'p',Enter:'e'},'./icons':icons,'../lib/theme':theme});
assert.equal(ui.DATE_HELP,'La fecha del dato es cuándo lo midió la fuente; la de consulta, cuándo Allocia lo pidió. Consultarlo hoy no hace que el dato sea de hoy.');
assert.equal(ui.fmtDateTime('no-es-fecha'),null);
assert.equal(ui.fmtDateTime(null),null);
const uiSrc=read('components/ui.tsx');
assert.ok(uiSrc.includes('`Dato del ${data}`')&&uiSrc.includes('"Fecha del dato: no informada"')&&uiSrc.includes('Consultado el {fetched}'));
assert.ok(uiSrc.includes('accessibilityRole="alert" accessibilityLiveRegion="polite"'),'la confirmación persistente anuncia el cambio');
for(const f of ['screens/SenalesScreen.tsx','screens/ResumenScreen.tsx','screens/AlertasScreen.tsx','screens/CarteraScreen.tsx'])assert.ok(read(f).includes('ProvenanceDates'),f+' muestra procedencia con fechas rotuladas');

// 4, 5 y 8 · Cartera.
const cartera=read('screens/CarteraScreen.tsx');
assert.ok(cartera.includes('Ya tenés {duplicate.ticker} en tu cartera')&&cartera.includes('label="Editar cantidad"')&&cartera.includes('label="Cancelar"'));
assert.ok(/positions\.find\(\(p\) => p\.ticker === symbol\)/.test(cartera),'detecta el ticker repetido antes de llamar a la API');
assert.ok(cartera.includes('<Overline>Cantidad (en unidades)</Overline>')&&cartera.includes('placeholder="p. ej. 2"'));
assert.ok(cartera.includes('Cantidad de unidades del activo, no el dinero invertido. Ejemplo: 2 para dos acciones; 0,1 para una décima de bitcoin.'));
for(const m of ['Posición guardada','Cantidad actualizada','Posición eliminada'])assert.ok(cartera.includes(`message: "${m}"`),m);
assert.ok(cartera.includes('<Text style={s.actionEdit}>Editar</Text>')&&cartera.includes('<Text style={s.actionDelete}>Eliminar</Text>'));
assert.ok(/touch: \{minHeight:48/.test(cartera),'área táctil ≥ 44 pt');

// 6 · Ajustes: cerrar sesión arriba, eliminar cuenta al final con exportación previa.
const ajustes=read('screens/AjustesScreen.tsx');
assert.ok(ajustes.indexOf('Cerrar sesión')<ajustes.indexOf('Eliminar tu cuenta'));
assert.ok(ajustes.includes('Borra tu cuenta, tus posiciones, alertas y dispositivos. No se puede deshacer.'));
assert.ok(ajustes.includes('Exportar mis datos antes de eliminar')&&ajustes.includes('api.exportData()')&&ajustes.includes('Share.share'));
assert.ok(ajustes.includes('await deleteAccount(password)'),'la lógica de baja no cambia');

// 7 · Pantallas con escenarios usan el estado vacío.
assert.ok(read('screens/AlertasScreen.tsx').includes('ScenarioEmptyState'));
assert.ok(read('screens/ResumenScreen.tsx').includes('tickers={analysis.positions.map((p) => p.ticker)}'));

console.log('PASS: fechas rotuladas, origen de observaciones, concentración en lenguaje llano, duplicados en cartera, cantidad en unidades, cierre de sesión vs baja, escenarios vacíos, confirmación persistente.');
