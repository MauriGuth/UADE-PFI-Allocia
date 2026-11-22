import React from "react";
import { Bell, Bitcoin, Bot, Briefcase, Cable, CircleHelp, Clock, Coins, Download, Eye, Factory, FileSearch, FileText, Fingerprint, Flag, Globe, Hand, Heart, IdCard, Landmark, Layers, Lightbulb, Lock, MousePointer2, Newspaper, Pencil, PiggyBank, Ruler, ScanFace, Search, Settings, ShoppingCart, Star, Tag, Trash2, TrendingUp, Upload, User, UserCheck, Wallet, Workflow, DollarSign, FileSpreadsheet, Quote, Keyboard } from "lucide-react";
import { C, Bd, Card, Click, CrystalBall, Dots, Dr, FocusKey, Frames, G, HBar, Ic, L, Layout, Ln, Logo, Pr, Rc, SceneDef, Shot, Strike, Tick, Tx, along, inOut, lin, mix, p, pop, size, vis, TOK_COLORS, WEIGHTS } from "./core";
import { Laptop, PhoneD } from "./v1";

const NB = " ";
const Plate: React.FC<{ x: number; y: number; w: number; h: number; o?: number; children?: React.ReactNode }> = ({ x, y, w, h, o = 1, children }) => <G o={o}><Rc x={x} y={y} w={w} h={h} r={24} f={C.bg} s={C.indigo} sw={4} />{children}</G>;

/* 1 · Qué es */
const s1: SceneDef = {
  words: ["¿Qué es Allocia?"],
  tok: (S) => {
    const { at } = S; const h = (x: number, y: number) => ({ x, y, w: 0, h: 0, r: 0, o: 0 });
    const base = [[560, 430], [720, 430], [880, 430], [1040, 430], [1200, 430], [1360, 430]].map(([x, y]) => ({ x, y, w: 110, h: 110, r: 30, o: 1 }));
    const step = (n: number): Layout => base.map((b, i) => (i < n ? b : h(b.x, b.y)));
    const scat = [[220, 240], [1700, 200], [420, 700], [1560, 690], [960, 150], [1180, 760]];
    return [[0.05, step(0)], [at("acciones"), step(2)], [at("CEDEARs"), step(3)], [at("fondos cotizados"), step(4)], [at("criptomonedas"), step(6)],
      [at("repartidos"), L.at(scat, 90)], [at("cartera completa"), L.block(960, 400, 110, 10)], [at("cómo está compuesta"), L.stack(310, 420, 1300, 150)]];
  },
  draw: (S) => {
    const { t, at } = S; const dep = at("de qué depende"), af = at("afuera"), ex = at("su explicación"), ob = at("cada observación");
    const pts: [any, number, number][] = [[Factory, 460, at("depende") + 0.1], [Globe, 960, at("depende") + 0.3], [DollarSign, 1460, at("depende") + 0.5]];
    return <>
      <Tx w={S.w(0)} x={960} y={140} s={84} o={vis(t, at("Allocia"), at("repartidos"))} k={pop(t, at("Allocia"))} />
      <Pr x={150} y={430} s={170} c={C.white} k={pop(t, at("inversores"))} o={1 - p(t, at("repartidos"), 0.4)} />
      <G o={vis(t, dep)}>
        {pts.map(([I, x, tt], i) => <React.Fragment key={i}><Dr d={`M ${x} 345 C ${x} 280 ${x} 260 ${x} 215`} k={p(t, tt, 0.5)} c={C.lilac} sw={4} /><Bd I={I} x={x} y={160} s={110} k={pop(t, tt + 0.3)} c={C.lilac} /></React.Fragment>)}
      </G>
      <G o={vis(t, af)}><Ic I={Globe} x={1760} y={700} s={140} c={C.blue} k={pop(t, af)} sw={1.4} />{[0, 1, 2].map((i) => { const ph = (t * 0.7 + i / 3) % 1; return <circle key={i} cx={mix(1680, 1500, ph)} cy={mix(650, 520, ph)} r={10} fill={C.blue} opacity={1 - ph} />; })}</G>
      <G o={vis(t, ob)}><Card x={740} y={690} w={420} h={170} c={C.green} lines={3} k={pop(t, ob)} />
        <Ic I={CircleHelp} x={1040} y={690} s={110} c={C.orange} o={1 - p(t, ex, 0.3)} k={pop(t, ob + 0.2)} /><Tick x={1040} y={690} r={55} k={pop(t, ex)} /></G>
    </>;
  },
};

/* 2 · Punto de partida */
const BX = [420, 960, 1500];
const s2: SceneDef = {
  words: [`−5${NB}%`, "¿Por qué?"],
  tok: (S) => {
    const { at } = S; const a = at("en un broker internacional"), b = at("en un exchange"), c = at("en un broker local"), ex = at("Para saber"), ca = at("Y cuando"), al = at("Allocia nace");
    const one = [[380, 280], [460, 280]], two = [[920, 280], [1000, 280]], tre = [[1460, 280], [1540, 280]];
    const prev = [[310 + 0.36 * 1300 * 0.5, 420, 1], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
    const stackL = L.stack(310, 420, 1300, 150);
    const m = (k: number[][]): Layout => k.map(([x, y], i) => (x ? { x, y, w: 58, h: 58, r: 16, o: 1 } : stackL[i]));
    return [[a, m([one[0], one[1], [0], [0], [0], [0]])], [b, m([one[0], one[1], two[0], two[1], [0], [0]])], [c, L.at([...one, ...two, ...tre], 58)],
      [ex, L.at([...one, ...two, ...tre].map(([x, y]) => [x * 0.62 + 90, 95]), 32)], [al, L.row(960, 600, 66, 16)]];
  },
  cam: (S) => { const { at } = S; return [[0, { x: 960, y: 450, z: 1 }], [at("Para saber"), { x: 960, y: 470, z: 1.1 }], [at("Y cuando"), { x: 960, y: 450, z: 1 }]]; },
  draw: (S) => {
    const { t, at } = S; const a = at("en un broker internacional"), b = at("en un exchange"), c = at("en un broker local"), ex = at("Para saber"), ca = at("Y cuando"), al = at("Allocia nace"), dro = at("cayó cinco"), no = at("no le dice");
    const cells = Array.from({ length: 24 }); const hx = 0;
    return <>
      <Pr x={150} y={560} s={190} c={C.white} k={pop(t, at("Octavio"))} o={1 - p(t, ex, 0.4)} />
      <G o={vis(t, a - 0.3, ex)}>{[[Landmark, a], [Bitcoin, b], [Flag, c]].map(([I, tt]: any, i) => <G key={i} x={BX[i]} y={310} k={pop(t, tt - 0.2)}><Rc x={0} y={0} w={300} h={210} f={C.panel} s={C.line} /><Bd I={I} y={-105} s={86} bg={C.bg} /></G>)}</G>
      <G o={vis(t, ex, ca)}>
        <Rc x={960} y={430} w={700} h={460} r={18} f={C.panel} s={C.green} />
        {cells.map((_, i) => { const f = t > at("a mano") + i * 0.13; return <rect key={i} x={640 + (i % 6) * 108} y={225 + Math.floor(i / 6) * 104} width={96} height={92} rx={6} fill={f ? C.green : C.line} opacity={f ? 0.85 : 0.5} />; })}
        <Ic I={FileSpreadsheet} x={500} y={430} s={140} c={C.green} k={pop(t, at("un Excel"))} />
        <G x={mix(700, 1200, ((t - ex) * 0.25) % 1)} y={mix(240, 600, ((t - ex) * 0.6) % 1)} o={p(t, at("a mano"), 0.3)}><Ic I={Hand} s={110} c={C.yellow} /></G>
      </G>
      <G o={vis(t, ca, al)}>
        <G x={560} y={420} rot={t > ca && t < dro + 0.6 ? Math.sin(t * 40) * 12 : 0}><Ic I={Bell} s={170} c={C.yellow} k={pop(t, ca)} sw={1.5} /></G>
        {/* barra a escala: el 5 % cae del total */}
        <rect x={880} y={200} width={200} height={460 * 0.95} fill={C.indigo} rx={8} transform="translate(0 23)" />
        <rect x={880} y={200 + 300 * p(t, dro + 0.3, 0.8)} width={200} height={23} fill={C.red} rx={4} opacity={1 - p(t, dro + 0.9, 0.3)} />
        <Tx w={S.w(0)} x={1120} y={212} s={80} a="start" c={C.red} k={pop(t, dro + 0.2)} />
        <G o={vis(t, no)}>
          {[[Factory, 1260, at("un resultado")], [Landmark, 1480, at("una noticia")], [Globe, 1700, at("el mercado")]].map(([I, x, tt]: any, i) => <G key={i} x={x} y={500} k={pop(t, tt)}><circle r={86} fill="none" stroke={C.orange} strokeWidth={5} strokeDasharray="14 12" /><Ic I={I} s={80} c={C.orange} /></G>)}
          <Tx w={S.w(1)} x={1480} y={700} s={72} c={C.orange} k={pop(t, no)} />
        </G>
      </G>
      <G o={vis(t, al)}><Logo x={960} y={330} w={620} k={pop(t, al)} /></G>
    </>;
  },
};

/* 3 · Cinco cosas */
const ST = [220, 590, 960, 1330, 1700];
const s3: SceneDef = {
  words: ["Cinco cosas", "Vos decidís"],
  cam: (S) => { const { at } = S; return [[0, { x: 960, y: 450, z: 1 }], [at("Primero"), { x: 420, y: 430, z: 1.5 }], [at("Segundo"), { x: 860, y: 450, z: 1.5 }], [at("Tercero"), { x: 1280, y: 450, z: 1.5 }], [at("Cuarto"), { x: 1500, y: 450, z: 1.5 }], [at("Quinto"), { x: 960, y: 450, z: 1 }]]; },
  tok: (S) => {
    const { at } = S; const y = 400;
    return [[at("Primero"), L.ring(ST[0], y + 130, 110, 34, 70)], [at("Segundo"), L.row(ST[2], y + 110, 30, 8)], [at("Tercero"), L.bars(ST[3], y + 260, 190, 34, 8)], [at("Cuarto"), L.row(ST[4], y + 215, 22, 6)]];
  },
  draw: (S) => {
    const { t, at } = S; const y = 300; const cues = [at("Primero"), at("Segundo"), at("Tercero"), at("Cuarto"), at("Quinto")];
    const no = at("mover la plata"), co = at("conectar cuentas"), cl = at("lo clasifica"), pr = at("le pone precio"), nu = at("nunca compra");
    const Is = [Upload, Workflow, Ruler, FileSearch, UserCheck];
    return <>
      <Tx w={S.w(0)} x={960} y={100} s={84} o={vis(t, at("cinco cosas"), cues[0])} k={pop(t, at("cinco cosas"))} />
      {Is.map((I, i) => <React.Fragment key={i}>{i > 0 ? <Ln x1={ST[i - 1] + 76} y1={y} x2={ST[i] - 76} y2={y} k={p(t, cues[i] - 0.1, 0.4)} c={C.indigo} head sw={6} /> : null}
        <Bd I={I} x={ST[i]} y={y} s={140} k={pop(t, cues[i])} bg={t > cues[i] && t < (cues[i + 1] ?? 1e9) ? C.indigo : C.panel} /></React.Fragment>)}
      <G o={vis(t, no, cues[1])}>
        <Ic I={PiggyBank} x={110} y={690} s={90} c={C.soft} k={pop(t, no)} /><Strike x={110} y={690} r={50} k={p(t, no + 0.2, 0.4)} />
        <Ic I={Cable} x={340} y={690} s={90} c={C.soft} k={pop(t, co)} /><Strike x={340} y={690} r={50} k={p(t, co + 0.2, 0.4)} />
      </G>
      <G o={vis(t, cl, cues[2])} x={ST[2]}>{[Layers, Factory, Globe, DollarSign].map((I, i) => <Bd key={i} I={I} x={(i - 1.5) * 110} y={610} s={84} k={pop(t, cl + i * 0.3)} c={C.lilac} />)}
        <Ic I={Tag} x={0} y={500 - 10} s={0} /></G>
      <G o={vis(t, pr, cues[2])} x={ST[2]}><Ic I={Clock} x={260} y={510} s={64} c={C.yellow} k={pop(t, pr)} /></G>
      <G o={vis(t, cues[3] + 0.2)}><Card x={ST[4]} y={490} w={300} h={140} c={C.green} lines={0} k={pop(t, cues[3] + 0.3)}>
        {[0, 1].map((i) => <Tick key={i} x={-40 + i * 80} y={-20} r={26} k={pop(t, cues[3] + 1.2 + i * 0.5)} />)}</Card></G>
      <G o={vis(t, cues[4])}>
        <Pr x={720} y={730} s={160} c={C.white} k={pop(t, cues[4])} /><Tx w={S.w(1)} x={1060} y={730} s={80} k={pop(t, cues[4] + 0.15)} />
        <Ic I={ShoppingCart} x={1480} y={730} s={100} c={C.soft} /><Strike x={1480} y={730} r={62} k={p(t, nu, 0.4)} />
      </G>
    </>;
  },
};

/* 4 · Pantalla de cartera */
const FORM = [305, 198, 643, 525]; const TICK = [325, 350, 493, 411]; const QTY = [503, 350, 623, 411]; const CARDR = [689, 550, 1216, 800]; const PRICE = [980, 620, 1216, 700];
const typed = (w: string, t: number, a: number) => w.slice(0, Math.floor(Math.max(0, t - a) * 7));
const s4: SceneDef = {
  words: ["AAPL", "BTC"],
  tok: (S) => { const { at } = S; const cl = at("clasifica"); return [[0.05, L.hidden(1500, 100)], [at("los pesos"), L.bars(1500, 210, 160, 34, 8)], [at("La cotización"), L.bars(1500, 210, 160, 34, 8).map((a, i) => ({ ...a, h: i === 0 ? a.h * 0.55 : a.h * 1.15, y: 210 - (i === 0 ? a.h * 0.55 : a.h * 1.15) / 2 }))]]; },
  draw: (S) => {
    const { t, at } = S; const ti = at("el ticker"), aa = at("AAPL"), bt = at("BTC"), ca = at("la cantidad"), cl = at("clasifica"), ed = at("editar o borrar"), pe = at("los pesos"), co = at("La cotización"), fe = at("fecha visible");
    const focus: FocusKey[] = [[ti, TICK], [ca, QTY], [cl, CARDR], [ed, CARDR], [co, PRICE]];
    const showBt = t > bt - 0.1;
    return <>
      <Shot id="s4" src="w-02-cartera.png" x={960} y={450} w={1370} t={t} focus={focus} k={pop(t, 0.05, 0.5)}>
        <rect x={330} y={366} width={158} height={42} rx={6} fill="#fff" opacity={t > aa - 0.1 ? 1 : 0} />
        <text x={345} y={394} fontSize={18} fontWeight={700} fill={C.bg} fontFamily="Inter">{showBt ? typed(S.w(1), t, bt) : typed(S.w(0), t, aa)}</text>
        <rect x={505} y={362} width={116} height={46} rx={6} fill="#fff" opacity={t > ca ? 1 : 0} />
        <text x={520} y={392} fontSize={18} fontWeight={700} fill={C.bg} fontFamily="Inter" opacity={t > ca + 0.3 ? 1 : 0}>2</text>
      </Shot>
      <G o={vis(t, cl, ed)}>{[[Layers, 400, cl + 0.1], [Factory, 600, at("de qué sector")], [Globe, 800, at("de qué región")], [DollarSign, 1000, at("en qué moneda")]].map(([I, x, tt]: any, i) => <Bd key={i} I={I} x={x} y={120} s={110} k={pop(t, tt)} bg={C.indigo} />)}</G>
      <G o={vis(t, ed, co)}><Bd I={Pencil} x={420} y={150} s={130} k={pop(t, ed)} bg={C.indigo} /><Bd I={Trash2} x={590} y={150} s={130} k={pop(t, at("borrar"))} bg={C.red} /></G>
      <G o={vis(t, pe - 0.1)}><Rc x={1500} y={150} w={520} h={230} r={20} f={C.bg} s={C.indigo} /></G>
      <G o={vis(t, fe)}><Bd I={Clock} x={420} y={150} s={130} k={pop(t, fe)} bg={C.indigo} /></G>
    </>;
  },
};

/* 5 · Resumen y posiciones efectivas */
const SQ = (t: number, x: number, y: number, s: number, c: string, o = 1) => o <= 0 ? null : <rect x={x - s / 2} y={y - s / 2} width={s} height={s} rx={s * 0.14} fill={c} opacity={o} />;
const s5: SceneDef = {
  words: ["10", `60${NB}%`, "2"],
  tok: () => [[0.05, L.hidden(1500, 150)]],
  draw: (S) => {
    const { t, at } = S; const v = at("el valor total"), re = at("cómo se reparte"), ni = at("el nivel"), ef = at("posiciones efectivas"), si = at("Si tenés"), se = at("sesenta"), dos = at("como si tuviera"), cl = at("a un clic");
    const away = p(t, si, 0.7) * (1 - p(t, cl, 0.7));
    const focus: FocusKey[] = [[v, [304, 198, 558, 292]], [re, [304, 700, 1255, 800]], [ni, [304, 320, 1255, 512]], [si, null], [cl, [464, 440, 691, 490]]];
    const grow = p(t, se, 0.9); const merge = p(t, dos + 0.2, 0.9);
    const big = mix(120, 420 * Math.sqrt(0.6), grow);
    return <>
      <Shot id="s5" src="w-01-resumen.png" x={mix(960, 400, away)} y={450} w={mix(1370, 640, away)} t={t} focus={focus} k={pop(t, 0.05, 0.5)} />
      <G o={vis(t, si, cl)}>
        <Tx w={S.w(0)} x={1000} y={110} s={90} k={pop(t, si)} c={C.soft} o={1 - merge} />
        {SQ(t, mix(960, 1000, merge), mix(350, 380, merge), big, C.indigo)}
        {Array.from({ length: 9 }).map((_, i) => { const small = mix(mix(120, 420 * Math.sqrt(0.4 / 9), grow), 420 * Math.sqrt(0.4), merge);
          return <React.Fragment key={i}>{SQ(t, mix(1210 + (i % 3) * 140, 1370, merge), mix(210 + Math.floor(i / 3) * 140, 380, merge), small, i % 2 ? C.blue : C.lilac, merge > 0.6 && i > 0 ? 0 : 1)}</React.Fragment>; })}
        <Tx w={S.w(1)} x={960} y={620} s={76} c={C.indigo} k={pop(t, se)} o={1 - merge} />
        <Tx w={S.w(2)} x={1185} y={660} s={120} c={C.white} k={pop(t, dos + 0.6)} />
      </G>
      <Click I={MousePointer2} t={t} from={[1200, 700]} to={[820, 470]} a={cl + 0.8} />
    </>;
  },
};

/* 6 · Riesgo */
const s6: SceneDef = {
  words: ["¿Por qué?", `60${NB}%`],
  draw: (S) => {
    const { t, at } = S; const co = at("el corazón"), pr = at("una prioridad"), bo = at("un botón"), ab = at("Al abrirlo"), da = at("el dato"), se = at("la señal externa"), re = at("la regla aplicada"), ve = at("verificarlo"), en = at("tres entrevistados");
    const beat = Math.pow(Math.max(0, Math.sin(t * 5)), 8); const side = p(t, ab, 0.7);
    const f1: FocusKey[] = [[pr, [637, 262, 763, 305]], [bo, [325, 385, 742, 436]], [ab, null]];
    const f2: FocusKey[] = [[da, [98, 1390, 1108, 1565]], [se, [98, 1570, 1108, 1735]], [re, [98, 1745, 1108, 1900]]];
    return <>
      <Shot id="s6a" src="w-03-riesgo.png" x={mix(960, 520, side)} y={450} w={mix(1370, 900, side)} t={t} focus={f1} k={pop(t, 0.05, 0.5)} dim={side > 0.5 ? 0 : 0.72} />
      <G o={vis(t, co, pr)}><Ic I={Heart} x={1500} y={190} s={200} c={C.red} fill={C.red} k={pop(t, co) * (1 + 0.16 * beat)} /></G>
      <G o={vis(t, bo, ab)}><Tx w={S.w(0)} x={960} y={120} s={90} k={pop(t, bo)} /></G>
      <Click I={MousePointer2} t={t} from={[1200, 800]} to={[960, 640]} a={ab - 0.05} hide={ab + 0.6} />
      <Shot id="s6b" src="ez-04-riesgo-evidencia.png" iw={1206} ih={2622} x={mix(2300, 1490, side)} y={450} w={395} t={t} focus={f2} radius={38} dim={0.75} />
      <G o={vis(t, da, se)}><Plate x={520} y={700} w={760} h={190}><HBar x={190} y={700} W={660} h={56} v={0.6} k={p(t, at("sesenta"), 0.8)} c={C.indigo} /><line x1={190 + 660 * 0.25} x2={190 + 660 * 0.25} y1={660} y2={740} stroke={C.white} strokeWidth={6} /><Tx w={S.w(1)} x={190 + 660 * 0.6 + 16} y={700} s={56} a="start" k={pop(t, at("sesenta") + 0.3)} /></Plate></G>
      <G o={vis(t, se, re)}><Plate x={520} y={700} w={760} h={190}><Ic I={Newspaper} x={520} y={700} s={110} c={C.blue} k={pop(t, se)} /></Plate></G>
      <G o={vis(t, re, ve)}><Plate x={520} y={700} w={760} h={190}><Ic I={Ruler} x={520} y={700} s={110} c={C.orange} k={pop(t, re)} /></Plate></G>
      <G o={vis(t, ve, en)}><Plate x={520} y={700} w={760} h={190}><Tick x={520} y={700} r={60} k={pop(t, ve)} /></Plate></G>
      <G o={vis(t, en)}><Plate x={520} y={700} w={760} h={190}>{[0, 1, 2].map((i) => { const nod = t > at("confían") ? Math.sin((t - i * 0.15) * 7) * 7 : 0; return <Pr key={i} x={320 + i * 200} y={700 + nod} s={130} c={C.white} k={pop(t, en + i * 0.12)} />; })}</Plate></G>
    </>;
  },
};

/* 7 · Señales */
const s7: SceneDef = {
  words: ["Contexto"],
  draw: (S) => {
    const { t, at } = S; const no = at("No son predicciones"), co = at("son contexto"), fu = at("su fuente");
    const focus: FocusKey[] = [[at("noticias"), [305, 200, 764, 590]], [at("el sentimiento"), [801, 253, 927, 334]], [at("la dominancia"), [944, 253, 1070, 334]], [at("el valor bloqueado"), [1081, 253, 1219, 334]], [at("las probabilidades"), [801, 386, 1238, 609]], [fu, [320, 674, 1234, 800]], [no, null]];
    const away = p(t, no, 0.7);
    return <>
      <Shot id="s7" src="w-04-senales.png" x={mix(960, 620, away)} y={450} w={mix(1370, 1100, away)} t={t} focus={focus} k={pop(t, 0.05, 0.5)} />
      <G o={vis(t, no)}><CrystalBall x={1530} y={310} s={260} k={pop(t, no)} /><Strike x={1530} y={310} r={130} k={p(t, at("predicciones"), 0.5)} /><Tx w={S.w(0)} x={1530} y={590} s={62} c={C.green} k={pop(t, co)} /></G>
    </>;
  },
};

/* 8 · Informes */
const s8: SceneDef = {
  words: ["Cita literal", "Sin inventar"],
  tok: (S) => { const { at } = S; const st = at("seguir activos"), sm = at("sin mezclarlos"); return [[0.05, L.hidden(1400, 800)], [sm, L.row(1500, 700, 40, 10)]]; },
  draw: (S) => {
    const { t, at } = S; const mo = at("Lo redacta"), ci = at("citar su fuente"), si = at("Si no hay"), se = at("También podés"), al = at("alertas"), me = at("sin mezclarlos");
    const f: FocusKey[] = [[0.3, [337, 361, 1207, 436]]];
    const swap = p(t, se, 0.5);
    return <>
      <G o={1 - swap}><Shot id="s8a" src="a-08-informe.png" x={560} y={450} w={980} t={t} focus={f} k={pop(t, 0.05, 0.5)} /></G>
      <G o={swap}><Shot id="s8b" src="a-07-alertas.png" x={560} y={450} w={980} t={t} focus={[[se + 0.2, [305, 394, 561, 438]]]} /></G>
      <G o={vis(t, mo, ci)}><Ic I={Bot} x={1400} y={260} s={170} c={C.lilac} k={pop(t, mo)} /><Ic I={Keyboard} x={1400} y={440} s={130} c={C.white} k={pop(t, mo + 0.2)} />
        <Ic I={Newspaper} x={1660} y={260} s={100} c={C.soft} k={pop(t, at("noticias"))} /><Ic I={TrendingUp} x={1660} y={410} s={100} c={C.soft} k={pop(t, at("datos públicos"))} /></G>
      <G o={vis(t, ci, si)}>
        <Card x={1390} y={330} w={320} h={210} c={C.white} lines={4} k={pop(t, ci)} /><rect x={1254} y={332} width={272} height={18} fill={C.yellow} rx={5} opacity={p(t, ci + 0.3, 0.3)} />
        <Card x={1750} y={330} w={260} h={210} c={C.blue} lines={4} k={pop(t, ci + 0.2)} /><rect x={1642} y={332} width={216} height={18} fill={C.yellow} rx={5} opacity={p(t, ci + 0.5, 0.3)} />
        <Ln x1={1526} y1={341} x2={1642} y2={341} k={p(t, ci + 0.6, 0.5)} c={C.yellow} sw={6} />
        <Tx w={S.w(0)} x={1560} y={540} s={68} c={C.yellow} k={pop(t, at("literal"))} />
      </G>
      <G o={vis(t, si, se)}><Rc x={1520} y={320} w={260} h={330} r={16} f={C.white} /><Ic I={Hand} x={1520} y={320} s={120} c={C.red} k={pop(t, at("el informe lo dice"))} /><Tx w={S.w(1)} x={1520} y={590} s={68} c={C.red} k={pop(t, at("inventar"))} /></G>
      <G o={vis(t, se)}>
        <Ic I={Star} x={1300} y={280} s={140} c={C.yellow} fill={C.yellow} k={pop(t, at("seguir activos"))} />
        <Ic I={Bell} x={1680} y={280} s={120} c={C.white} k={pop(t, al)} rot={t > al && t < al + 0.8 ? Math.sin(t * 40) * 12 : 0} />
        <rect x={1100} y={540} width={p(t, me, 0.5) * 800} height={14} rx={7} fill={C.red} />
        <Ic I={Wallet} x={1250} y={700} s={100} c={C.green} k={pop(t, me + 0.2)} />
      </G>
    </>;
  },
};

/* 9 · Móvil */
const s9: SceneDef = {
  words: ["Misma cuenta", "Se borra"],
  tok: (S) => {
    const { at } = S; const a = at("lo que cargás"), r = at("al revés"), bo = at("Lo que borrás"); const one = (x: number, y: number, s = 70): Layout => TOK_COLORS.map(() => ({ x, y, w: s, h: s, r: 18, o: 1 }));
    return [[0.05, L.hidden(560, 420)], [a, one(560, 420)], [a + 1, one(1360, 420)], [r, one(560, 420)], [r + 1.2, one(1360, 420)], [bo + 0.1, one(1360, 420)], [bo + 0.9, L.hidden(1700, 760)]];
  },
  draw: (S) => {
    const { t, at } = S; const fa = at("Face ID"), hu = at("huella"), aj = at("desde ajustes"), ex = at("exportar"), ba = at("dar de baja"), bo = at("Lo que borrás"), mi = at("misma cuenta");
    const scan = ((t - fa) * 0.9) % 1; const swap = p(t, aj, 0.5);
    return <>
      <Shot id="s9a" src="w-01-resumen.png" x={530} y={420} w={880} t={t} k={pop(t, 0.05, 0.5)} o={1 - 0.75 * p(t, bo + 0.8, 0.5)} />
      <G o={1 - 0.75 * p(t, bo + 0.8, 0.5)}><G o={1 - swap}><Shot id="s9b" src="ez-01-resumen.png" iw={1206} ih={2622} x={1360} y={440} w={370} t={t} radius={36} k={pop(t, 0.3, 0.5)} /></G>
        <G o={swap}><Shot id="s9c" src="ez-06-ajustes.png" iw={1206} ih={2622} x={1360} y={440} w={370} t={t} radius={36} /></G></G>
      <Tx w={S.w(0)} x={530} y={760} s={70} k={pop(t, mi)} />
      <G o={vis(t, fa, aj)}><Plate x={1720} y={300} w={230} h={230}><Ic I={ScanFace} x={1720} y={300} s={130} c={C.green} k={pop(t, fa)} /><rect x={1630} y={210 + 170 * Math.abs(scan)} width={180} height={6} fill={C.green} opacity={t < hu ? 1 : 0} /></Plate></G>
      <G o={vis(t, hu, aj)}><Plate x={1720} y={560} w={230} h={230}><Ic I={Fingerprint} x={1720} y={560} s={130} c={C.lilac} k={pop(t, hu)} /></Plate></G>
      <G o={vis(t, ex, bo)}><Ic I={FileText} x={mix(1360, 1720, p(t, ex + 0.1, 0.7))} y={mix(500, 300, p(t, ex + 0.1, 0.7))} s={110} c={C.white} k={pop(t, ex)} /></G>
      <G o={vis(t, ba)}><Ic I={Trash2} x={1700} y={740} s={150} c={C.red} k={pop(t, ba)} sw={1.6} /></G>
      <G o={vis(t, bo)}><Tx w={S.w(1)} x={1130} y={760} s={70} c={C.red} a="end" k={pop(t, at("se borra"))} /></G>
    </>;
  },
};

/* 10 · Límites y cierre */
const s10: SceneDef = {
  words: ["Nunca opera", "Gracias"],
  tok: (S) => { const { at } = S; return [[0.05, L.row(960, 110, 34, 12)], [at("Eso es Allocia"), L.block(960, 480, 76, 10)], [at("Gracias"), L.row(960, 640, 60, 16)]]; },
  draw: (S) => {
    const { t, at } = S; const a = [at("no compra"), at("No promete"), at("No reemplaza"), at("nunca recibe")]; const ho = at("Hoy Allocia"), ci = at("cinco personas"), mo = at("el motivo"), si = at("más simples"), es = at("Eso es Allocia"), gr = at("Gracias");
    const Is = [ShoppingCart, TrendingUp, Briefcase, IdCard]; const sh = p(t, si, 1);
    return <>
      <G o={vis(t, a[0], ho)}>
        {Is.map((I, i) => <G key={i} x={330 + i * 420} y={380}><Ic I={I} s={190} c={C.soft} k={pop(t, a[i])} /><Strike x={0} y={0} r={110} k={p(t, a[i] + 0.25, 0.4)} /></G>)}
        <Tx w={S.w(0)} x={960} y={660} s={90} c={C.red} k={pop(t, a[0] + 0.6)} />
      </G>
      <G o={vis(t, ho, es)}>
        {[0, 1, 2, 3, 4].map((i) => <Pr key={i} x={200 + i * 170} y={400} s={170} c={C.indigo} k={pop(t, ci + i * 0.12)} />)}
        <G o={vis(t, mo)}><Ic I={Bell} x={1160} y={330} s={130} c={C.yellow} k={pop(t, mo)} /><Ic I={Search} x={1250} y={410} s={150} c={C.white} k={pop(t, mo + 0.2)} /></G>
        <G o={vis(t, si)}>{[0, 1, 2].map((i) => <rect key={i} x={1460} y={280 + i * 56} width={mix(340, 180 - i * 30, sh)} height={26} rx={13} fill={C.lilac} />)}</G>
      </G>
      <G o={vis(t, es, gr)}><Ic I={Wallet} x={960} y={480} s={330} c={C.white} sw={1} k={pop(t, es)} /><Logo x={960} y={160} w={500} k={pop(t, at("inteligencia"))} /></G>
      <G o={vis(t, gr)}><Logo x={960} y={330} w={620} k={pop(t, gr)} /><Tx w={S.w(1)} x={960} y={520} s={86} k={pop(t, gr + 0.2)} /></G>
    </>;
  },
};

export const V3: SceneDef[] = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10];
