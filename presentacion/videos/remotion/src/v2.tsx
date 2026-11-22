import React from "react";
import { CircleHelp, AlertTriangle, Bitcoin, BookOpen, Bug, Calculator, CheckCheck, Cookie, Cog, Database, Eye, Fence, FileText, Fingerprint, FlaskConical, Flag, FolderGit2, Gauge, Globe, Hand, Heart, IdCard, KeyRound, Landmark, Layers, LineChart, Lock, MessageSquareText, Network, Newspaper, PenLine, Percent, PieChart, Radio, RefreshCw, Scale, Server, ShoppingCart, Shield, Signpost, Smartphone, Sparkles, Syringe, TrainFront, TrendingUp, Users, Wallet, Wrench, Bot, MousePointer2, Briefcase, BellRing, Coins, Binary, Camera, Timer, Waypoints, Vault, FileX2, Quote, Check } from "lucide-react";
import { C, Bd, Card, Click, CrystalBall, Dots, Dr, Frames, G, HBar, Ic, L, Layout, Ln, Logo, Pr, Rc, SceneDef, Strike, Tick, Tx, along, inOut, lin, mix, p, pop, vis, TOK_COLORS } from "./core";
import { Laptop, PhoneD } from "./v1";

const NB = " ";
const HEX = (r: number) => Array.from({ length: 6 }).map((_, i) => `${r * Math.cos((i / 6) * 6.283)},${r * Math.sin((i / 6) * 6.283)}`).join(" ");
const Cyl: React.FC<{ x: number; y: number; c?: string; k?: number; o?: number; I?: any }> = ({ x, y, c = C.blue, k = 1, o = 1, I = Database }) => (
  <G x={x} y={y} k={k} o={o}><rect x={-85} y={-55} width={170} height={110} fill={C.panel} /><ellipse cy={55} rx={85} ry={24} fill={C.panel} stroke={c} strokeWidth={4} /><rect x={-85} y={-55} width={170} height={110} fill={C.panel} /><line x1={-85} x2={-85} y1={-55} y2={55} stroke={c} strokeWidth={4} /><line x1={85} x2={85} y1={-55} y2={55} stroke={c} strokeWidth={4} /><ellipse cy={-55} rx={85} ry={24} fill={C.panel} stroke={c} strokeWidth={4} /><Ic I={I} y={10} s={56} c={c} /></G>
);
/* Mapa persistente de la arquitectura. Cada k enciende una parte; d atenúa el mapa entero. */
type MK = { hub?: number; mods?: number[]; pg?: number; re?: number; web?: number; ph?: number; d?: number };
const HUB = [960, 420]; const MODS = [[690, 330], [690, 510], [1230, 330], [1230, 510], [960, 615]]; const MODI = [Layers, Calculator, Scale, Radio, FileText];
const ArchMap: React.FC<MK & { hubWord?: string; ts?: number; webW?: string; phW?: string }> = ({ hub = 1, mods = [1, 1, 1, 1, 1], pg = 1, re = 1, web = 1, ph = 1, d = 1, hubWord, webW, phW }) => (
  <G o={d}>
    <Ln x1={HUB[0]} y1={HUB[1]} x2={600} y2={190} k={web} c={C.line} sw={6} /><Ln x1={HUB[0]} y1={HUB[1]} x2={1320} y2={190} k={ph} c={C.line} sw={6} />
    <Ln x1={HUB[0]} y1={HUB[1]} x2={720} y2={700} k={pg} c={C.line} sw={6} /><Ln x1={HUB[0]} y1={HUB[1]} x2={1200} y2={700} k={re} c={C.line} sw={6} />
    {MODS.map(([x, y], i) => <React.Fragment key={i}><Ln x1={HUB[0]} y1={HUB[1]} x2={x} y2={y} k={mods[i]} c={C.indigo} sw={4} /><Bd I={MODI[i]} x={x} y={y} s={92} k={mods[i]} c={C.lilac} /></React.Fragment>)}
    <G x={HUB[0]} y={HUB[1]} k={hub}><polygon points={HEX(130)} fill={C.indigo} />{hubWord ? <Tx w={hubWord} x={0} y={4} s={70} /> : null}</G>
    <Cyl x={720} y={720} k={pg} c={C.blue} /><Cyl x={1200} y={720} k={re} c={C.orange} I={Timer} />
    <G x={600} y={130} k={web * 0.42}><Rc x={0} y={0} w={380} h={230} r={16} f={C.panel} s={C.soft} sw={8} /><path d="M -230 128 H 230 L 205 150 H -205 Z" fill={C.soft} /></G>
    {webW ? <Tx w={webW} x={420} y={130} s={48} a="end" /> : null}
    <G x={1320} y={130} k={ph * 0.42}><Rc x={0} y={0} w={170} h={300} r={30} f={C.panel} s={C.soft} sw={8} /></G>
    {phW ? <Tx w={phW} x={1410} y={130} s={48} a="start" /> : null}
  </G>
);

/* 1 · Apertura */
const ORB: any[] = [Network, Waypoints, Cog, Sparkles, Shield, Users, FlaskConical];
const s1: SceneDef = {
  words: ["Cómo está construida"],
  tok: () => [[0.1, L.hidden(960, 400)]],
  draw: (S) => {
    const { t, at } = S; const cues = [at("arquitectura"), at("recorrido"), at("motor de reglas"), at("capa de inteligencia"), at("seguridad"), at("metodología"), at("las pruebas")];
    return <>
      <Frames x={960} y={mix(400, 70, p(t, at("Acá mostramos"), 0.6))} s={mix(2, 0.85, p(t, at("Acá mostramos"), 0.6))} on={[t > at("En el primero") && t < at("Acá mostramos") ? 1 : 0, t > at("segundo") && (t < at("En el primero") || t > at("Acá mostramos")) ? 1 : 0, 0]} />
      <G x={960} y={430} k={pop(t, at("Acá mostramos"))}><polygon points={HEX(170)} fill={C.indigo} /></G>
      <G x={960} y={430} k={pop(t, at("Acá mostramos") + 0.1)}><Logo x={0} y={0} w={220} /></G>
      {ORB.map((I, i) => { const a = (i / 7) * 6.283 - 1.57 + t * 0.18; return <Bd key={i} I={I} x={960 + 520 * Math.cos(a)} y={430 + 290 * Math.sin(a)} s={120} k={pop(t, cues[i])} bg={C.panel} c={C.white} />; })}
      <Tx w={S.w(0)} x={960} y={845} s={66} o={vis(t, at("cómo está construida"))} k={pop(t, at("cómo está construida"))} />
    </>;
  },
};

/* 2 · Arquitectura */
const s2: SceneDef = {
  words: ["API", "Web", "Móvil", "TS"],
  draw: (S) => {
    const { t, at } = S; const mods = [at("catálogo"), at("cálculo"), at("reglas"), at("señales"), at("informes")].map((c) => p(t, c, 0.45));
    const ts = at("TypeScript"), ra = at("Railway"), se = at("secretos");
    const train = lin(t, ra, 2.4);
    return <>
      <G o={vis(t, ra)}><path d="M 480 845 H 1440" stroke={C.soft} strokeWidth={6} />{Array.from({ length: 21 }).map((_, i) => <line key={i} x1={480 + i * 48} x2={480 + i * 48} y1={835} y2={858} stroke={C.soft} strokeWidth={5} />)}
        <Ic I={TrainFront} x={mix(520, 1400, inOut(train))} y={805} s={70} c={C.yellow} /></G>
      <ArchMap hub={pop(t, at("Una API"))} mods={mods} pg={pop(t, at("PostgreSQL"))} re={pop(t, at("Redis"))} web={pop(t, at("la web en Nextjs"))} ph={pop(t, at("la app móvil"))} hubWord={S.w(0)} webW={t > at("la web en Nextjs") ? S.w(1) : undefined} phW={t > at("la app móvil") ? S.w(2) : undefined} />
      {[[960, 275], [600, 45], [1320, 45]].map(([x, y], i) => <G key={i} x={x} y={y} k={pop(t, ts + i * 0.25)}><Rc x={0} y={0} w={92} h={70} r={12} f={C.blue} /><Tx w={S.w(3)} x={0} y={4} s={46} c={C.bg} /></G>)}
      <G o={vis(t, se - 0.2)}><Ic I={FolderGit2} x={1660} y={560} s={120} c={C.soft} k={pop(t, se - 0.2)} /><Ic I={KeyRound} x={mix(1660, 1770, p(t, se + 0.2, 0.7))} y={mix(560, 760, p(t, se + 0.2, 0.7))} s={80} c={C.yellow} k={pop(t, se)} /><Strike x={1660} y={560} r={0} /></G>
    </>;
  },
};

/* 3 · Recorrido de la información */
const SRC: [any, string][] = [[LineChart, "Finnhub"], [Bitcoin, "CoinGecko"], [Gauge, "Alternative"], [Landmark, "FRED"], [Layers, "DefiLlama"], [Percent, "Polymarket"], [Globe, "índice de riesgo"]];
const srcY = (i: number) => 40 + i * 120;
const FUN = [230, 420];
const s3: SceneDef = {
  words: ["En vivo", `15${NB}min`],
  cam: (S) => { const { at } = S; return [[0.3, { x: 720, y: 450, z: 0.8 }], [at("normaliza"), { x: 330, y: 420, z: 1.45 }], [at("lo guarda"), { x: 1040, y: 560, z: 1.25 }], [at("lo entrega"), { x: 720, y: 450, z: 0.8 }]]; },
  draw: (S) => {
    const { t, at } = S; const cues = SRC.map(([, c]) => at(c)); const vivo = at("en vivo"), nor = at("normaliza"), ca = at("quince minutos"), en = at("lo entrega");
    const flow = (i: number, ph: number, st: number) => {
      const k = ((t - st) * 0.45 + ph) % 1; if (t < st) return null; const done = t > nor + 1.6;
      const pts = t > en ? [[-250, srcY(i)], [FUN[0], FUN[1]], [HUB[0], HUB[1]], i % 2 ? [600, 130] : [1320, 130]] : [[-250, srcY(i)], [FUN[0], FUN[1]], [HUB[0], HUB[1]], [1200, 700]];
      const [x, y] = along(pts, k); const col = TOK_COLORS[i % 6]; const stick = done && k > 0.34;
      return <g key={i + "-" + ph}><circle cx={x} cy={y} r={12} fill={col} />{stick ? [0, 1, 2].map((j) => <circle key={j} cx={x + (j - 1) * 13} cy={y - 20} r={5} fill={[C.white, C.yellow, C.green][j]} />) : null}</g>;
    };
    return <>
      <ArchMap d={1} hubWord={undefined} />
      {SRC.map(([I], i) => <React.Fragment key={i}><Ln x1={-250} y1={srcY(i)} x2={FUN[0]} y2={FUN[1]} k={p(t, cues[i], 0.5)} c={C.line} sw={4} />
        {t > vivo ? <circle cx={-250} cy={srcY(i)} r={60 + 26 * ((t * 0.9 + i * 0.13) % 1)} fill="none" stroke={C.green} strokeWidth={3} opacity={1 - ((t * 0.9 + i * 0.13) % 1)} /> : null}
        <Bd I={I} x={-250} y={srcY(i)} s={104} k={pop(t, cues[i])} c={i === 6 ? C.yellow : C.white} /></React.Fragment>)}
      <Tx w={S.w(0)} x={-130} y={-60} s={72} c={C.green} a="start" k={pop(t, vivo)} />
      <Ln x1={FUN[0]} y1={FUN[1]} x2={HUB[0]} y2={HUB[1]} k={p(t, cues[0], 0.5)} c={C.line} sw={8} />
      <G x={FUN[0]} y={FUN[1]} k={pop(t, nor - 1.2)}><path d="M -70 -80 H 70 L 22 10 V 80 H -22 V 10 Z" fill={C.panel} stroke={C.lilac} strokeWidth={5} strokeLinejoin="round" /></G>
      <G o={vis(t, nor, en)} x={FUN[0] + 170} y={FUN[1] - 170}>
        <circle r={38} fill={C.blue} />
        {[[at("su fuente"), FileText, -80, C.white], [at("la fecha del dato"), Timer, 0, C.yellow], [at("la fecha de consulta"), Check, 80, C.green]].map(([tt, I, dx, col]: any, i) => <Bd key={i} I={I} x={dx} y={-85} s={64} k={pop(t, tt)} c={col} bg={C.bg} />)}
      </G>
      {SRC.flatMap((_, i) => [flow(i, 0, Math.max(cues[i], 1)), flow(i, 0.5, Math.max(cues[i], 1))])}
      <G o={vis(t, ca - 0.1)} x={1200} y={500}>
        <circle r={82} fill={C.panel} stroke={C.orange} strokeWidth={5} />
        <path d={`M 0 0 L 0 -74 A 74 74 0 0 1 ${74 * Math.sin(1.5708 * p(t, ca, 1.2))} ${-74 * Math.cos(1.5708 * p(t, ca, 1.2))} Z`} fill={C.orange} />
        <Tx w={S.w(1)} x={110} y={0} s={60} a="start" c={C.orange} k={pop(t, ca + 0.5)} />
      </G>
    </>;
  },
};

/* 4 · Motor de reglas */
const MY = (v: number) => 790 - v * 5.2; // v en % de cada escala
const Meter: React.FC<{ x: number; t: number; a: number; show: number; to: number; marks: [number, string][]; I: any; fill: string; dur?: number }> = ({ x, t, a, show, to, marks, I, fill, dur = 1.6 }) => {
  const v = to * p(t, a, dur);
  return <G o={vis(t, show)}><Rc x={x} y={530} w={90} h={520} r={12} f={C.panel} s={C.line} /><rect x={x - 45} y={MY(v) - 2} width={90} height={v * 5.2} rx={10} fill={fill} />
    {marks.map(([m, col], i) => <line key={i} x1={x - 68} x2={x + 68} y1={MY(m)} y2={MY(m)} stroke={col} strokeWidth={7} />)}<Ic I={I} x={x} y={225} s={70} c={C.white} /></G>;
};
const s4: SceneDef = {
  words: ["2.500", `25${NB}%`, `40${NB}%`],
  cam: (S) => { const { at } = S; return [[0, { x: 960, y: 450, z: 1 }], [at("El corazón") - 0.2, { x: 960, y: 420, z: 2.3 }], [at("Las condiciones"), { x: 960, y: 450, z: 1 }]]; },
  draw: (S) => {
    const { t, at } = S; const co = at("Las condiciones"); const beat = Math.pow(Math.max(0, Math.sin(t * 5)), 8);
    return <G o={1 - p(t, co, 0.4)}>
      <ArchMap d={1} />
      <Ic I={Heart} x={HUB[0]} y={HUB[1]} s={120} c={C.red} fill={C.red} k={pop(t, at("El corazón")) * (1 + 0.18 * beat)} />
      <G o={vis(t, at("sin modelo"))}><Ic I={Bot} x={1110} y={280} s={70} c={C.soft} /><Strike x={1110} y={280} r={40} k={p(t, at("sin modelo") + 0.1, 0.4)} /></G>
    </G>;
  },
  hud: (S) => {
    const { t, at } = S; const a = at("dos mil quinientos"), b = at("veinticinco por ciento"), c = at("arriba del veinticinco"), d = at("arriba del cuarenta"), gu = at("Cada observación guarda"), pq = at("por qué esta observación");
    const col3 = t > d + 0.3 ? C.red : t > c + 0.5 ? C.orange : C.yellow;
    const cards: [number, number, string][] = [[a + 0.9, 140, C.indigo], [b + 0.9, 330, C.blue], [d + 0.7, 520, C.red]];
    const big = p(t, gu, 0.6);
    return <>
      <Meter x={240} show={at("Las condiciones") + 0.1} t={t} a={a - 0.3} to={28.3} marks={[[25, C.white]]} I={Gauge} fill={C.indigo} />
      <Tx w={S.w(0)} x={310} y={MY(25)} s={56} a="start" k={pop(t, a)} />
      <Meter x={680} show={at("Las condiciones") + 0.25} t={t} a={b - 0.3} to={36} marks={[[25, C.white]]} I={PieChart} fill={C.blue} />
      <Tx w={S.w(1)} x={750} y={MY(25)} s={56} a="start" k={pop(t, b)} />
      <Meter x={1120} show={at("Las condiciones") + 0.4} t={t} a={c - 0.3} to={46} marks={[[25, C.orange], [40, C.red]]} I={Bitcoin} fill={col3} dur={d - c + 1} />
      <Tx w={S.w(2)} x={1190} y={MY(40)} s={56} a="start" c={C.red} k={pop(t, d)} />
      {cards.map(([tt, y, col], i) => { const isTop = i === 1; return <G key={i} o={isTop ? 1 : 1 - big * 0.7}><Card x={1660} y={isTop ? mix(y, 330, big) : y} w={mix(330, isTop ? 400 : 330, big)} h={mix(130, isTop ? 240 : 130, isTop ? big : 0)} c={col} k={pop(t, tt)} lines={isTop ? 2 - Math.round(big) * 2 : 2}>
        {isTop ? [[at("la regla"), Scale], [at("las métricas"), PieChart], [at("la señal"), Radio]].map(([q, I]: any, j) => <Bd key={j} I={I} x={-120 + j * 120} y={-30} s={84} k={pop(t, q)} c={C.white} />) : null}
        {isTop ? <G o={vis(t, pq)}><Rc x={0} y={72} w={320} h={54} r={12} f={C.white} /><Ic I={CircleHelp} x={0} y={72} s={40} c={C.bg} /></G> : null}
      </Card></G>; })}
      <Ln x1={1470} y1={420} x2={740} y2={MY(25) - 40} k={p(t, pq + 1.1, 0.9)} c={C.yellow} sw={6} head />
      <Click I={MousePointer2} t={t} from={[1760, 700]} to={[1660, 402]} a={pq + 0.7} />
    </>;
  },
};

/* 5 · Capa de IA */
const SLOT = [1660, 340];
const s5: SceneDef = {
  words: ["Capa IA", "No confiable"],
  draw: (S) => {
    const { t, at } = S; const ca = at("La segunda capa"), lim = at("límites estrictos"), sn = at("snapshot"), nu = at("Nunca recibe"), ti = at("Los titulares"), iny = at("inyección"), va = at("La salida"), ci = at("cada cita"), ab = at("se abstiene"), op = at("para operar"), mo = at("El motor explica");
    const drop = pop(t, ca, 0.6); const wallB = (a: number) => { const k = lin(t, a, 1.2); return k < 0.5 ? mix(780, 480, k * 2) : mix(480, 720, (k - 0.5) * 2); };
    const flash = 1 - lin(t, sn + 0.4, 0.3);
    return <>
      <G x={960} y={680}><polygon points={HEX(110)} fill={C.panel} stroke={C.indigo} strokeWidth={5} /><Ic I={Cog} s={90} c={C.lilac} rot={t * (t > mo ? 90 : 20)} /></G>
      <G y={mix(-300, 0, drop)}><Rc x={960} y={230} w={1000} h={170} r={30} f={C.indigo} /><Tx w={S.w(0)} x={800} y={234} s={72} /><Ic I={t > mo ? PenLine : Sparkles} x={1210} y={230} s={90} c={C.white} rot={t > mo ? Math.sin(t * 8) * 10 : 0} /></G>
      <G o={vis(t, lim)}><rect x={460} y={440} width={p(t, lim, 0.6) * 1000} height={16} rx={8} fill={C.red} /></G>
      <G o={vis(t, sn, ti)}>
        <G x={mix(120, 330, p(t, sn + 0.5, 0.7))} y={260} k={pop(t, sn)}><Rc x={0} y={0} w={200} h={200} r={14} f={C.white} />{[Newspaper, LineChart].map((I, i) => <Ic key={i} I={I} x={-44 + i * 88} y={-20} s={72} c={C.bg} />)}</G>
        <Ic I={Camera} x={120} y={520} s={90} c={C.white} k={pop(t, sn - 0.1)} />
        {flash > 0 && flash < 1 ? <rect x={-200} y={-200} width={2400} height={1500} fill="#fff" opacity={flash * 0.55} /> : null}
      </G>
      <G o={vis(t, nu, ti)}>
        <Ic I={Wallet} x={760} y={wallB(nu + 0.2)} s={100} c={C.green} k={pop(t, nu)} /><Ic I={IdCard} x={1160} y={wallB(at("la identidad"))} s={100} c={C.blue} k={pop(t, at("la identidad"))} />
      </G>
      <G o={vis(t, ti, va)} x={200} y={250}>
        <Rc x={0} y={0} w={280} h={230} r={18} f={C.panel} s={C.yellow} sw={8} dash="26 14" /><Ic I={Newspaper} s={110} c={C.white} k={pop(t, ti)} />
        <Tx w={S.w(1)} x={0} y={165} s={46} c={C.yellow} k={pop(t, at("no confiable"))} />
      </G>
      <G o={vis(t, iny, va)}>
        <Ic I={Syringe} x={mix(280, 430, p(t, iny, 0.6))} y={250} s={100} c={C.red} rot={45} />
        <Ic I={Shield} x={500} y={250} s={120} c={C.green} k={pop(t, iny + 0.5)} fill={C.bg} />
      </G>
      {/* puesto de salida: un objeto por acción */}
      <G o={vis(t, va, ci)}><Rc x={SLOT[0]} y={SLOT[1] + 240} w={240} h={150} r={12} s={C.lilac} sw={5} dash="14 10" /><Card x={mix(1250, SLOT[0], p(t, va + 0.3, 0.9))} y={SLOT[1] + 240} w={220} h={130} c={C.white} /></G>
      <G o={vis(t, ci, ab)}><Card x={SLOT[0] - 150} y={SLOT[1] + 240} w={210} h={120} c={C.white} /><Card x={SLOT[0] + 150} y={SLOT[1] + 240} w={210} h={120} c={C.blue} /><Ln x1={SLOT[0] - 45} y1={SLOT[1] + 240} x2={SLOT[0] + 45} y2={SLOT[1] + 240} k={p(t, ci + 0.5, 0.5)} c={C.green} sw={8} /><Tick x={SLOT[0]} y={SLOT[1] + 170} k={pop(t, ci + 1)} /></G>
      <G o={vis(t, ab, op)}><Rc x={SLOT[0]} y={SLOT[1] + 250} w={190} h={250} r={14} f={C.white} /><Ic I={Hand} x={SLOT[0]} y={SLOT[1] + 250} s={120} c={C.red} k={pop(t, ab + 0.1)} /></G>
      <G o={vis(t, op)}><Ic I={ShoppingCart} x={SLOT[0] - 50} y={SLOT[1] + 260} s={120} c={C.soft} /><Strike x={SLOT[0] - 50} y={SLOT[1] + 260} r={72} k={p(t, op + 0.1, 0.5)} /></G>
    </>;
  },
};

/* 6 · Seguridad y legal: cada control se muestra grande y queda guardado en la fila superior */
type It = { I: any; q: string; c?: string; extra?: (t: number, a: number) => React.ReactNode };
const ITEMS: It[] = [
  { I: KeyRound, q: "JWT", c: C.yellow, extra: (t, a) => [0, 1, 2, 3].map((i) => <rect key={i} x={-90 + i * 50} y={150} width={36} height={60} rx={6} fill={t > a + 0.4 + i * 0.42 ? C.yellow : C.line} />) },
  { I: Cookie, q: "cookie", c: C.orange, extra: (t, a) => <Ic I={Lock} x={90} y={90} s={90} c={C.green} k={pop(t, a + 0.3)} fill={C.bg} /> },
  { I: Smartphone, q: "almacenamiento seguro", extra: (t, a) => <Ic I={Vault} x={0} y={0} s={80} c={C.green} k={pop(t, a + 0.2)} /> },
  { I: Lock, q: "contraseñas", c: C.lilac, extra: (t, a) => [0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={-105 + i * 36} y={150} width={28} height={40} rx={5} fill={t > a + 0.3 + i * 0.07 ? C.lilac : C.line} />) },
  { I: Binary, q: "cantidades cifradas", c: C.teal },
  { I: Waypoints, q: "HTTPS", c: C.green, extra: (t) => [0, 1, 2].map((i) => <circle key={i} cx={-140 + (((t * 0.8 + i / 3) % 1) * 280)} cy={150} r={12} fill={C.green} />) },
  { I: Timer, q: "límites de solicitudes", c: C.red, extra: (t) => [0, 1, 2, 3].map((i) => <circle key={i} cx={-140 + Math.min(1, ((t * 0.6 + i / 4) % 1) * 1.3) * 140} cy={150} r={12} fill={C.red} />) },
  { I: Vault, q: "posiciones aisladas", c: C.blue, extra: (t, a) => [0, 1, 2].map((i) => <Pr key={i} x={-120 + i * 120} y={170} s={70} c={C.white} k={pop(t, a + 0.2 + i * 0.15)} />) },
];
const s6: SceneDef = {
  words: [`Ley${NB}25.326`, "No asesora"],
  draw: (S) => {
    const { t, at } = S; const leg = at("En lo legal"), cnv = at("agente ante"), pe = at("Lo pendiente"); const cues = ITEMS.map((x) => at(x.q));
    const sw = [at("aviso"), at("consentimiento"), at("la exportación"), at("la baja")]; const chk = [FileText, Check, FileText, FileX2];
    return <>
      <G o={1}><Ic I={Shield} x={960} y={420} s={560} c={C.indigo} sw={0.8} o={0.28} k={pop(t, 0.1, 0.6)} /></G>
      {ITEMS.map((it, i) => {
        const a = cues[i]; const b = cues[i + 1] ?? leg; const go = p(t, b - 0.05, 0.5); const x = mix(960, 340 + i * 177, go), y = mix(400, 90, go), k = mix(1, 0.36, go);
        return <G key={i} x={x} y={y} k={k * pop(t, a)}>
          <Rc x={0} y={0} w={240} h={240} r={120} f={C.panel} s={it.c ?? C.white} /><Ic I={it.I} s={130} c={it.c ?? C.white} />
          {go < 0.5 && it.extra ? <G o={1 - go * 2}>{it.extra(t, a)}</G> : null}
        </G>;
      })}
      <G o={vis(t, leg, cnv)}>
        <Ic I={BookOpen} x={520} y={440} s={230} c={C.white} k={pop(t, at("Ley"))} sw={1.3} />
        <Tx w={S.w(0)} x={520} y={640} s={72} k={pop(t, at("Ley") + 0.2)} />
        {sw.map((tt, i) => <React.Fragment key={i}><Bd I={chk[i]} x={1000 + i * 210} y={440} s={140} k={pop(t, tt)} /><Tick x={1050 + i * 210} y={490} r={26} k={pop(t, tt + 0.25)} /></React.Fragment>)}
      </G>
      <G o={vis(t, cnv, pe)}><Ic I={Briefcase} x={960} y={400} s={230} c={C.soft} k={pop(t, cnv)} /><Strike x={960} y={400} r={130} k={p(t, at("no asesora"), 0.5)} /><Tx w={S.w(1)} x={960} y={630} s={84} c={C.red} k={pop(t, at("no asesora"))} /></G>
      <G o={vis(t, pe)}>
        {[[Users, at("auditoría")], [IdCard, at("responsable")], [Timer, at("plazos")]].map(([I, tt]: any, i) => <G key={i} x={480 + i * 480} y={470} k={pop(t, tt)}><Rc x={0} y={0} w={300} h={300} r={30} s={C.orange} sw={6} dash="20 16" /><Ic I={I} s={130} c={C.orange} /></G>)}
      </G>
    </>;
  },
};

/* 7 · Metodología */
const COLX = [760, 1010, 1260, 1510];
const s7: SceneDef = {
  words: [`2${NB}semanas`, "16", "4"],
  draw: (S) => {
    const { t, at } = S; const eq = at("equipo de dos"), ka = at("Kanban"), sp = at("Sprints de dos"), tu = at("el tutor"), ter = at("Una tarea"), g = [at("sus pruebas"), at("el otro integrante"), at("el informe")], ds = at("Dieciséis"), cu = at("cuatro hasta");
    const lap = Math.max(0, t - sp) * 0.5 * 6.283;
    const ck = g.reduce((a, c, i) => a + p(t, c + 0.4, 0.7), 0) / 3; const cardX = mix(COLX[1], COLX[3], ck);
    return <>
      <Pr x={150} y={140} s={110} c={C.indigo} k={pop(t, eq)} /><Pr x={270} y={140} s={110} c={C.blue} k={pop(t, eq + 0.15)} />
      <G o={vis(t, ka - 0.1)}>
        {COLX.map((x, i) => <Rc key={i} x={x} y={330} w={230} h={520} r={18} f={C.panel} s={i === 3 ? C.green : C.line} />)}
        {[[0, 170], [0, 280], [0, 390], [2, 170], [3, 170], [3, 280]].map(([c, y], i) => <Card key={i} x={COLX[c]} y={y} w={190} h={92} c={c === 3 ? C.green : C.line} k={pop(t, ka + 0.1 + i * 0.08)} lines={2} />)}
        <Card x={cardX} y={480} w={196} h={100} c={C.yellow} k={pop(t, ka + 0.6)} />
        {[FlaskConical, Users, FileText].map((I, i) => { const x = 885 + i * 250; return <React.Fragment key={i}><line x1={x} x2={x} y1={90} y2={590} stroke={t > g[i] + 0.2 ? C.green : C.line} strokeWidth={6} strokeDasharray="14 12" /><Bd I={I} x={x} y={620} s={90} k={pop(t, g[i])} c={t > g[i] ? C.green : C.soft} /></React.Fragment>; })}
      </G>
      <G o={vis(t, sp)} x={300} y={440}>
        <circle r={140} fill="none" stroke={C.line} strokeWidth={22} />
        <circle cx={140 * Math.cos(lap - 1.57)} cy={140 * Math.sin(lap - 1.57)} r={24} fill={C.yellow} />
        <Tx w={S.w(0)} x={0} y={0} s={36} />
        <G o={vis(t, tu)}><Ic I={Flag} x={0} y={-188} s={70} c={C.lilac} fill={C.lilac} k={pop(t, tu)} /><Pr x={196} y={-140} s={90} c={C.lilac} k={pop(t, tu + 0.1)} /></G>
      </G>
      <G o={vis(t, ds)}>
        {Array.from({ length: 20 }).map((_, i) => { const filled = i < 16; return <G key={i} x={700 + (i * 50)} y={760} k={pop(t, (filled ? ds + i * 0.06 : cu + (i - 16) * 0.1), 0.3)}><Rc x={0} y={0} w={40} h={60} r={8} f={filled ? C.indigo : "none"} s={filled ? C.indigo : C.soft} sw={3} /></G>; })}
        <Tx w={S.w(1)} x={625} y={760} s={76} a="end" k={pop(t, ds)} /><Tx w={S.w(2)} x={1695} y={760} s={76} a="start" k={pop(t, cu)} />
      </G>
    </>;
  },
};

/* 8 · Pruebas y ejemplo con área real */
const SIDE = 5.6; const BX = [300, 640, 1000];
const s8: SceneDef = {
  words: ["4.400", "2.500", "Verificable"],
  tok: (S) => {
    const { at } = S; const ej = at("una cartera de tres"), hh = at("El HHI");
    const lay = (a: number[][]): Layout => [...a.map(([x, y, s]) => ({ x, y, w: s, h: s, r: 12, o: 1 })), ...[0, 1, 2].map(() => ({ x: 960, y: 450, w: 0, h: 0, r: 0, o: 0 }))];
    const base = 440;
    return [[0.1, L.hidden(960, 120)], [ej + 0.3, lay([[BX[0], base, 70], [BX[1], base, 70], [BX[2], base, 70]])],
      [at("veinte", 1), lay([[BX[0], base, 20 * SIDE], [BX[1], base, 70], [BX[2], base, 70]])],
      [at("sesenta", 2), lay([[BX[0], base, 20 * SIDE], [BX[1], base, 60 * SIDE], [BX[2], base, 70]])],
      [at("y veinte"), lay([[BX[0], base, 20 * SIDE], [BX[1], base, 60 * SIDE], [BX[2], base, 20 * SIDE]])]];
  },
  draw: (S) => {
    const { t, at } = S; const nums: [number, number, string, string][] = [[62, 200, C.indigo, "sesenta y dos"], [33, 560, C.blue, "treinta y tres"], [27, 920, C.orange, "veintisiete"], [14, 1280, C.green, "catorce"]];
    const de = at("tres defectos"), ej = at("El ejemplo"), hh = at("El HHI"), ob = at("dos observaciones"), re = at("rehacer");
    const rulerX = 240, RW = 1240; const rk = p(t, hh, 1.1);
    return <>
      <G o={vis(t, 0.1, ej)}>
        {nums.map(([n, x, col, q]) => { const st = at(q); return <Dots key={n} n={n} cols={8} x={x} y={200} gap={38} r={14} color={() => col} k={(i) => pop(t, st + i * 0.018, 0.25)} />; })}
        {[0, 1, 2].map((i) => { const sq = p(t, at("corrigieron") + i * 0.25, 0.25); return <G key={i} x={1720} y={230 + i * 150}><G k={1}><Ic I={sq > 0.9 ? Check : Bug} s={110} c={sq > 0.9 ? C.green : C.red} k={pop(t, de + i * 0.1)} rot={sq > 0.9 ? 0 : Math.sin(t * 9 + i) * 14} /></G></G>; })}
      </G>
      <G o={vis(t, hh)}>
        <Rc x={rulerX + RW / 2} y={770} w={RW} h={60} r={12} f={C.panel} s={C.line} />
        {[[0, 400, TOK_COLORS[0]], [400, 3600, TOK_COLORS[1]], [4000, 400, TOK_COLORS[2]]].map(([a, v, col]: any, i) => <rect key={i} x={rulerX + (a / 10000) * RW + 2} y={742} width={Math.max(0, (v / 10000) * RW * rk - 4)} height={56} rx={8} fill={col} />)}
        <line x1={rulerX + 0.25 * RW} x2={rulerX + 0.25 * RW} y1={720} y2={825} stroke={C.white} strokeWidth={7} />
        <Tx w={S.w(1)} x={rulerX + 0.25 * RW} y={682} s={54} k={pop(t, hh + 0.5)} />
        <Tx w={S.w(0)} x={rulerX + 0.44 * RW + 20} y={682} s={70} c={C.lilac} k={pop(t, at("cuatro mil"))} />
      </G>
      <G o={vis(t, ob)}><Card x={1660} y={270} w={330} h={130} c={C.red} k={pop(t, at("concentración alta"))} /><Card x={1660} y={450} w={330} h={130} c={C.blue} k={pop(t, at("posición dominante"))} /></G>
      <G o={vis(t, re)}><Tx w={S.w(2)} x={1680} y={770} s={46} c={C.green} k={pop(t, re)} /><Tick x={1680} y={690} r={34} k={pop(t, re + 0.3)} /></G>
    </>;
  },
};

/* 9 · Objetivos */
const s9: SceneDef = {
  words: ["Núcleo cumplido", `8${NB}cambios`],
  tok: () => [[0.05, L.hidden(380, 370)]],
  draw: (S) => {
    const { t, at } = S; const cu = at("cumplido"), ca = at("una cartera cargada"), ma = at("verificación manual"), pr = at("la protección"), ci = at("Cinco personas"), dos = at("dos inversores"), de = at("los demás"), oc = at("ocho cambios"), na = at("no lo afirmamos");
    return <>
      <G x={380} y={370}>
        {[250, 170, 90].map((r, i) => <circle key={i} r={r * pop(t, at("objetivo general") + i * 0.1)} fill="none" stroke={C.line} strokeWidth={22} />)}
        <circle r={90 * pop(t, cu)} fill={C.green} />
        <Tx w={S.w(0)} x={0} y={320} s={56} c={C.green} k={pop(t, cu)} />
        <Ln x1={-300} y1={-230} x2={-14} y2={-14} k={p(t, ca, 0.7)} c={C.white} sw={6} head />
        <Ic I={Calculator} x={-60} y={-160} s={0} />
        <G o={vis(t, ma)}><Ic I={Calculator} x={200} y={-260} s={80} c={C.white} k={pop(t, ma)} /><Ic I={PenLine} x={300} y={-260} s={70} c={C.white} k={pop(t, ma + 0.15)} /></G>
        <Ic I={Shield} x={290} y={-120} s={90} c={C.blue} k={pop(t, pr)} />
      </G>
      <G o={vis(t, ci)}>
        {[0, 1, 2, 3, 4].map((i) => { const col = i < 2 ? (t > dos ? C.green : C.line) : t > de ? C.orange : C.line; return <React.Fragment key={i}><Pr x={880 + i * 170} y={170} s={150} c={col} k={pop(t, ci + i * 0.12)} />{i >= 2 ? <Ic I={Signpost} x={880 + i * 170 + 56} y={110} s={50} c={C.orange} k={pop(t, de + 0.2 + (i - 2) * 0.12)} /> : null}</React.Fragment>; })}
      </G>
      <G o={vis(t, oc)}>
        {Array.from({ length: 8 }).map((_, i) => <G key={i} x={880 + i * 88} y={mix(600, 400, pop(t, oc + i * 0.1))} o={p(t, oc + i * 0.1, 0.2)}><Rc x={0} y={0} w={72} h={72} r={14} f={C.indigo} /><Ic I={Wrench} s={38} /></G>)}
        <Tx w={S.w(1)} x={1600} y={400} s={54} a="start" k={pop(t, oc + 0.5)} />
      </G>
      <G o={vis(t, na)}>
        {[[TrendingUp, 0, at("ni rentabilidad")], [null, 1, at("ni predicción")], [Briefcase, 2, at("ni asesoramiento")]].map(([I, i, tt]: any) => <G key={i} x={1000 + i * 270} y={660}>{I ? <Ic I={I} s={130} c={C.soft} k={pop(t, tt)} /> : <CrystalBall x={0} y={0} s={130} k={pop(t, tt)} />}<Strike x={0} y={0} r={78} k={p(t, tt + 0.1, 0.4)} /></G>)}
      </G>
    </>;
  },
};

/* 10 · Cierre */
const s10: SceneDef = {
  words: ["Próximos pasos", "Gracias"],
  tok: (S) => [[S.at("Gracias") - 0.1, L.row(960, 700, 56, 18)]],
  draw: (S) => {
    const { t, at } = S; const pr = at("en producción"), re = at("reproducibles"), li = at("límites"), pa = at("Próximos pasos"), te = at("En el tercer"), gr = at("Gracias");
    const stops = [[420, 560], [960, 560], [1500, 560]]; const cu = [at("una segunda ronda"), at("las notificaciones"), at("la validación")];
    const k = cu.reduce((a, c, i) => a + (i === 0 ? 0 : p(t, c, 0.7) / 2), 0); const [dx, dy] = along(stops, k);
    return <>
      <G o={vis(t, pr, gr)}><G x={500} y={200}><Ic I={Server} s={150} c={C.white} k={pop(t, pr)} /><circle cx={50} cy={-38} r={13} fill={C.green} opacity={Math.sin(t * 5) > 0 ? 1 : 0.35} /></G>
        <Ic I={RefreshCw} x={960} y={200} s={150} c={C.lilac} k={pop(t, re)} rot={Math.max(0, t - re) * 80} /><Ic I={Fence} x={1420} y={200} s={150} c={C.orange} k={pop(t, li)} /></G>
      <G o={vis(t, pa, te)}>
        <Tx w={S.w(0)} x={960} y={400} s={70} k={pop(t, pa)} />
        <path d={`M 420 560 H 1500`} stroke={C.line} strokeWidth={10} strokeDasharray="20 18" />
        {[Users, BellRing, Coins].map((I, i) => <Bd key={i} I={I} x={stops[i][0]} y={stops[i][1]} s={150} k={pop(t, cu[i])} bg={t > cu[i] ? C.indigo : C.panel} />)}
        <circle cx={dx} cy={dy - 110} r={18} fill={C.yellow} />
      </G>
      <Frames x={960} y={460} s={1.8} on={[1, 1, 1]} o={vis(t, te, gr)} />
      <G o={vis(t, gr)}><Logo x={960} y={330} w={560} k={pop(t, gr)} /><Tx w={S.w(1)} x={960} y={510} s={80} k={pop(t, gr + 0.2)} /></G>
    </>;
  },
};

export const V2: SceneDef[] = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10];
