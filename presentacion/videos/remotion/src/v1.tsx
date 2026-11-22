import React from "react";
import { AlertTriangle, ArrowRight, Bell, Bitcoin, Bot, Briefcase, Clock, Coins, Compass, Cog, DollarSign, Download, Eye, Factory, FileSearch, FileSpreadsheet, FileText, FlaskConical, Flag, Globe, Infinity as InfinityIcon, Landmark, Layers, Lightbulb, Lock, MessageSquareText, Network, PieChart, Radio, Ruler, Search, Shield, ShoppingCart, Sparkles, Tag, Trash2, TrendingUp, Upload, User, Users, Wallet, Workflow } from "lucide-react";
import { C, Bd, Card, CrystalBall, Dots, Dr, Frames, G, HBar, Ic, L, Layout, Ln, Logo, Pr, Rc, SceneDef, Strike, Tick, Tx, along, inOut, lin, mix, p, pop, size, vis } from "./core";
import viab from "./viab_series.json";

const NB = " ";
const Box: React.FC<{ I: any; x: number; y: number; w?: number; h?: number; o?: number; c?: string; k?: number }> = ({ I, x, y, w = 340, h = 280, o = 1, c = C.line, k = 1 }) => (
  <G x={x} y={y} o={o} k={k}><Rc x={0} y={0} w={w} h={h} f={C.panel} s={c} /><Bd I={I} y={-h / 2} s={92} bg={C.bg} c={C.white} /></G>
);
const Pts: number[][] = [[300, 620], [660, 620], [1260, 620], [1620, 620]];

/* 1 · Presentación */
const s1: SceneDef = {
  words: ["Proyecto Final UADE"],
  tok: (S) => [[S.at("multiactivo"), L.ring(960, 400, 430, 58, 215)]],
  draw: (S) => {
    const { t, at } = S; const a = at("Allocia"), probl = at("Acá contamos");
    const f2 = at("segundo video"), f3 = at("el tercero");
    const stations = [AlertTriangle, Users, Lightbulb, Coins]; const cues = [at("el problema"), at("la investigación"), at("la propuesta"), at("modelo de negocio")];
    const dotK = cues.reduce((acc, c, i) => acc + (i === 0 ? 0 : p(t, c, 0.5) / 3), 0);
    const [dx, dy] = along(Pts, dotK);
    return <>
      <Pr x={mix(760, 400, p(t, a, 0.6))} y={mix(440, 180, p(t, a, 0.6))} s={mix(230, 90, p(t, a, 0.6))} c={C.indigo} k={pop(t, at("Mauricio"))} />
      <Pr x={mix(1160, 1520, p(t, a, 0.6))} y={mix(440, 180, p(t, a, 0.6))} s={mix(230, 90, p(t, a, 0.6))} c={C.blue} k={pop(t, at("Máximo"))} />
      <Frames x={960} y={mix(740, 90, p(t, a, 0.6))} on={[1, t > f2 ? 1 : 0, t > f3 ? 1 : 0]} o={vis(t, at("primero"))} s={mix(1, 0.8, p(t, a, 0.6))} />
      <Logo x={960} y={400} w={520} k={pop(t, a, 0.55)} />
      <Tx w={S.w(0)} x={960} y={545} s={46} c={C.lilac} o={vis(t, a + 0.3, 1e9)} fw={700} />
      <G o={vis(t, at("geopolítico"), probl)}><Ic I={Globe} x={230} y={400} s={190} c={C.blue} sw={1.3} k={pop(t, at("geopolítico"))} />
        <circle cx={230} cy={400} r={95 + 70 * ((t * 1.2) % 1)} fill="none" stroke={C.red} strokeWidth={4} opacity={1 - ((t * 1.2) % 1)} /></G>
      <G o={vis(t, at("explicables"), probl)}><Ic I={Search} x={mix(1500, 1700, inOut(((t - at("explicables")) * 0.5) % 1))} y={400} s={170} c={C.lilac} sw={1.6} k={pop(t, at("explicables"))} /></G>
      <Ic I={Sparkles} x={1700} y={200} s={100} c={C.yellow} o={vis(t, at("inteligencia"), probl)} k={pop(t, at("inteligencia"))} />
      <G o={vis(t, probl, f2)}>
        <path d={`M 300 620 H 1620`} stroke={C.line} strokeWidth={8} />
        {stations.map((I, i) => <Bd key={i} I={I} x={Pts[i][0]} y={620} s={120} k={pop(t, cues[i])} c={t > cues[i] ? C.white : C.dim} bg={t > cues[i] ? C.indigo : C.panel} />)}
        <circle cx={dx} cy={dy - 90} r={14} fill={C.yellow} />
      </G>
      <Frames x={960} y={690} s={1.5} on={[1, t > f2 ? 1 : 0, t > f3 ? 1 : 0]} o={vis(t, f2 - 0.2)} />
    </>;
  },
};

/* 2 · El problema */
const BOXX = [360, 960, 1560];
const sparks = ["M -120 40 L -60 10 L 0 25 L 60 -30 L 120 -45", "M -120 -30 L -60 30 L 0 -10 L 60 45 L 120 5", "M -120 20 L -60 15 L 0 18 L 60 10 L 120 12"];
const s2: SceneDef = {
  words: ["¿Por qué?", `39,5${NB}%`],
  cam: (S) => [[0, { x: 960, y: 450, z: 1 }], [S.at("en un broker") - 0.2, { x: 520, y: 380, z: 1.5 }], [S.at("en un exchange") - 0.2, { x: 960, y: 380, z: 1.5 }], [S.at("en una planilla") - 0.2, { x: 1400, y: 380, z: 1.5 }], [S.at("Cada aplicación"), { x: 960, y: 450, z: 1 }]],
  tok: (S) => {
    const { at } = S; const A = at("en un broker"), B = at("en un exchange"), Cc = at("en una planilla"), al = at("Y las alertas"), en = at("En la encuesta");
    const ini = L.ring(960, 400, 430, 58, 215);
    const brk = [[320, 300], [400, 300]]; const exc = [[920, 300], [1000, 300]]; const pla = [[1520, 300], [1600, 300]];
    const k1 = [brk[0], brk[1], ini.map((a) => [a.x, a.y])[2], ini.map((a) => [a.x, a.y])[3], ini.map((a) => [a.x, a.y])[4], ini.map((a) => [a.x, a.y])[5]];
    const k2 = [brk[0], brk[1], exc[0], exc[1], k1[4], k1[5]]; const k3 = [brk[0], brk[1], exc[0], exc[1], pla[0], pla[1]];
    return [[A, L.at(k1, 58)], [B, L.at(k2, 58)], [Cc, L.at(k3, 58)], [al, L.at(k3.map(([x, y]) => [x, y - 150]), 34)], [en, L.row(960, 80, 34, 14)]];
  },
  draw: (S) => {
    const { t, at } = S; const a = at("en un broker"), b = at("en un exchange"), c = at("en una planilla"), rd = at("Cada aplicación"), ni = at("pero ninguna");
    const al = at("Y las alertas"), en = at("En la encuesta"), cay = at("algo cayó"), pq = at("no explican");
    const up = p(t, al, 0.6);
    return <>
      <Pr x={960} y={410} s={210} c={C.white} k={pop(t, at("Un inversor"))} o={1 - p(t, a, 0.4)} />
      <G o={vis(t, a - 0.5, en)} y={-up * 160} >
        {[Landmark, Bitcoin, FileSpreadsheet].map((I, i) => <Box key={i} I={I} x={BOXX[i]} y={330} w={340} h={260} k={pop(t, [a, b, c][i] - 0.2)} />)}
        {sparks.map((d, i) => <G key={i} x={BOXX[i]} y={400}><Dr d={d} k={p(t, rd + i * 0.4, 0.8)} c={[C.blue, C.orange, C.green][i]} sw={5} /></G>)}
      </G>
      <G o={vis(t, ni, al)}>
        <G x={960} y={675}><Rc x={0} y={0} w={280} h={180} r={30} s={C.dim} sw={5} dash="16 14" /><Ic I={Wallet} s={100} c={C.dim} o={0.6} /></G>
        {[[Factory, 600, at("un sector")], [Globe, 960 + 330, at("una región")], [DollarSign, 1560, at("una moneda")]].map(([I, x, tt]: any, i) => <React.Fragment key={i}>
          <Ln x1={960} y1={675} x2={x} y2={675} k={p(t, tt, 0.5)} c={C.dim} dash="10 14" sw={4} />
          <Bd I={I} x={x} y={675} s={110} k={pop(t, tt)} c={C.soft} /></React.Fragment>)}
      </G>
      <G o={vis(t, al, en)}>
        <G x={520} y={440} rot={t > al && t < cay + 0.8 ? Math.sin(t * 40) * 14 : 0}><Ic I={Bell} s={210} c={C.yellow} sw={1.5} k={pop(t, al)} /></G>
        <G x={1250} y={430}><Dr d="M -320 -90 L -180 -70 L -60 -100 L 40 -90 L 120 100 L 300 120" k={p(t, cay - 0.2, 0.9)} c={C.red} sw={10} /></G>
      </G>
      <G o={vis(t, pq, en)}><G k={pop(t, pq)} x={960} y={720}><Rc x={0} y={0} w={760} h={200} r={36} f={C.red} /><Tx w={S.w(0)} x={0} y={5} s={130} /></G></G>
      <G o={vis(t, en)}>
        {[[Eye, 39.5, C.indigo, at("visión consolidada")], [PieChart, 31.6, C.blue, at("la diversificación")], [Clock, 35.8, C.orange, at("falta de tiempo")]].map(([I, v, col, tt]: any, i) => {
          const y = 240 + i * 190; const k = p(t, tt, 0.9);
          return <React.Fragment key={i}><Bd I={I} x={260} y={y} s={120} k={pop(t, tt)} c={col} /><HBar x={350} y={y} W={1320} h={70} v={v / 100} k={k} c={col} /></React.Fragment>;
        })}
        <Tx w={S.w(1)} x={350 + 1320 * 0.395 + 30} y={240} s={68} a="start" o={p(t, at("visión consolidada") + 0.7, 0.3)} />
      </G>
    </>;
  },
};

/* 3 · Investigación */
const PX = [1180, 1420, 1660];
const s3: SceneDef = {
  words: ["190", "85", "3", "Confiaría"],
  cam: (S) => [[0, { x: 620, y: 400, z: 1.35 }], [S.at("tres entrevistas") - 0.2, { x: 960, y: 450, z: 1 }], [S.at("Octavio"), { x: 800, y: 430, z: 1.12 }], [S.at("Esa frase"), { x: 960, y: 450, z: 1 }]],
  tok: (S) => {
    const { at } = S; const rep = at("cartera repartida"), oc = at("Octavio"), car = at("su cartera"), gu = at("Esa frase");
    return [
      [rep, L.at([[PX[0] - 45, 400], [PX[0] + 45, 400], [PX[1] - 45, 400], [PX[1] + 45, 400], [PX[2] - 45, 400], [PX[2] + 45, 400]], 36)],
      [oc, L.at([[PX[0] - 45, 900], [PX[0] + 45, 900], [PX[1] - 45, 900], [PX[1] + 45, 900], [PX[2] - 45, 900], [PX[2] + 45, 900]], 0)],
      [car, L.block(1290, 340, 26, 5)],
      [gu, L.block(1290, 340, 26, 5)],
    ];
  },
  draw: (S) => {
    const { t, at } = S; const n190 = at("ciento noventa"), n85 = at("ochenta y cinco"), n3 = at("tres entrevistas"), des = at("desconfían"), fu = at("sin fundamento"), oc = at("Octavio"), gu = at("Esa frase");
    const inf = at("qué información"), rie = at("qué riesgo"), car = at("su cartera");
    const fall = p(t, fu + 0.2, 0.8);
    return <>
      <G o={vis(t, n190 - 0.1, oc)}>
        <Dots n={190} cols={19} x={130} y={300} gap={40} r={15} k={(i) => pop(t, n190 + i * 0.008, 0.3)} color={(i) => i < 85 && t > n85 + i * 0.012 ? C.indigo : C.line} />
        <Tx w={S.w(0)} x={130} y={205} s={110} a="start" k={pop(t, n190)} />
        <Tx w={S.w(1)} x={510} y={205} s={110} a="start" c={C.indigo} k={pop(t, n85)} />
      </G>
      <G o={vis(t, n3, oc)}>
        {PX.map((x, i) => <Pr key={i} x={x} y={270} s={150} c={C.white} k={pop(t, n3 + i * 0.15)} />)}
        <Tx w={S.w(2)} x={1420} y={120} s={100} k={pop(t, n3)} />
        <G x={1420} y={mix(590, 800, fall)} rot={fall * 28} o={vis(t, des, oc)}><Card x={0} y={0} w={280} h={130} c={C.red} /></G>
        <Rc x={1420} y={740} w={70} h={mix(170, 0, p(t, fu, 0.25))} r={6} f={C.soft} o={vis(t, des, fu + 0.3)} />
      </G>
      <G o={vis(t, oc)}>
        <Pr x={330} y={480} s={280} c={C.white} k={pop(t, oc)} />
        <path d="M 520 470 L 620 420 L 620 520 Z" fill={C.panel} opacity={p(t, oc + 0.2, 0.3)} />
        <G k={p(t, oc + 0.1, 0.4)} x={980} y={410}><Rc x={0} y={0} w={760} h={420} r={44} f={C.panel} /></G>
        <Tx w={S.w(3)} x={980} y={285} s={70} o={p(t, oc + 0.5, 0.3)} />
        {[[FileText, 750, inf], [AlertTriangle, 980, rie], [Wallet, 1210, car]].map(([I, x, tt]: any, i) => <React.Fragment key={i}>
          <Bd I={I} x={i === 2 ? 1210 : x} y={i === 2 ? 450 : 450} s={130} k={pop(t, tt)} c={C.white} /><Tick x={x + 55} y={505} k={pop(t, tt + 0.2)} /></React.Fragment>)}
        <G o={vis(t, gu)}><Ln x1={1540} y1={540} x2={1600} y2={290} k={p(t, gu + 0.4, 0.6)} c={C.yellow} sw={6} head /><Ic I={Compass} x={1520} y={620} s={150} c={C.yellow} sw={1.5} k={pop(t, gu)} rot={mix(-120, 45, p(t, gu + 0.2, 1))} /><Logo x={1600} y={200} w={330} k={pop(t, gu + 0.8)} /></G>
      </G>
    </>;
  },
};

/* 4 · Estado del arte */
const X0 = 520, SEG = 228;
const COLS = [PieChart, Layers, Radio, Globe, MessageSquareText];
const ROWS = [[1, 0, 0, 0, 0.5], [0.5, 0.5, 0, 0, 0], [0.5, 1, 0.5, 0, 0], [0.5, 0.5, 1, 0, 0], [1, 1, 1, 1, 1]];
const rowY = (i: number) => 175 + i * 136;
const s4: SceneDef = {
  words: ["Morningstar", "Sharesight", "Kubera", "CoinStats"],
  tok: (S) => {
    const { at } = S; const d = at("diferencial");
    return [[at("Relevamos"), L.at([0, 1, 2, 3, 4, 5].map((i) => [X0 - 240 + i * 34, rowY(4)]), 28)], [at("Ninguna") + 1.1, L.at([0, 1, 2, 3, 4, 5].map((i) => [X0 + 20 + i * 34, rowY(4) - 44]), 28)], [d, L.at([0, 1, 2, 3, 4, 5].map((i) => [X0 + 5 * SEG - 150 + i * 34, rowY(4) - 44]), 28)]];
  },
  draw: (S) => {
    const { t, at } = S; const cues = [at("Morningstar"), at("Sharesight"), at("Kubera"), at("CoinStats")]; const ni = at("Ninguna"), d = at("diferencial");
    const dimO = 1 - 0.65 * p(t, d, 0.5);
    return <>
      {COLS.map((I, i) => <Ic key={i} I={I} x={X0 + SEG * (i + 0.5)} y={78} s={72} c={C.soft} k={pop(t, at("Relevamos") + i * 0.12)} />)}
      {ROWS.map((r, i) => {
        const y = rowY(i); const cue = i < 4 ? cues[i] : ni + 1.5; const firstGap = r.findIndex((v) => v === 0); const stop = firstGap < 0 ? 5 : firstGap;
        const roll = lin(t, cue + 0.2, 0.55 * Math.max(stop, 0.5)); const fall = firstGap >= 0 ? p(t, cue + 0.2 + 0.55 * stop, 0.5) : 0;
        const dotX = X0 + SEG * stop * roll;
        return <G key={i} o={vis(t, cue - 0.15) * (i === 4 ? 1 : dimO)}>
          {i < 4 ? <Tx w={S.w(i)} x={X0 - 30} y={y} s={40} a="end" fw={700} /> : <Logo x={X0 - 130} y={y} w={190} />}
          {r.map((v, j) => {
            const on = lin(t, cue + 0.2 + 0.4 * j, 0.3);
            return v === 0 ? <Rc key={j} x={X0 + SEG * (j + 0.5)} y={y} w={SEG - 14} h={26} r={13} s={C.dim} sw={3} dash="8 10" /> :
              <rect key={j} x={X0 + SEG * j + 7} y={y - 13} width={(SEG - 14) * on * v} height={26} rx={13} fill={i === 4 ? C.green : v === 1 ? C.indigo : C.dim} />;
          })}
          {i < 4 ? <circle cx={dotX} cy={y + fall * 70} r={20 * (1 - fall * 0.5)} fill={TOKC[i]} opacity={(t > cue + 0.1 ? 1 : 0) * (1 - fall)} /> : null}
          {i < 4 && firstGap >= 0 ? <Strike x={X0 + SEG * (stop + 0.08)} y={y} r={18} k={lin(t, cue + 0.3 + 0.55 * stop, 0.3)} /> : null}
        </G>;
      })}
      <Tick x={X0 + 5 * SEG + 50} y={rowY(4) - 62} r={32} k={pop(t, d + 0.8)} />
    </>;
  },
};
const TOKC = [C.indigo, C.blue, C.orange, C.yellow];

/* 5 · Cinco pasos */
const ST = [220, 590, 960, 1330, 1700];
const STI = [User, Upload, Workflow, Ruler, FileSearch];
const s5: SceneDef = {
  words: ["Cinco pasos", "Usuario decide"],
  cam: (S) => { const { at } = S; return [[0, { x: 960, y: 450, z: 1 }], [at("Uno"), { x: 480, y: 420, z: 1.55 }], [at("Tres"), { x: 960, y: 450, z: 1.55 }], [at("Cuatro"), { x: 1330, y: 450, z: 1.55 }], [at("Cinco", 2), { x: 1440, y: 450, z: 1.55 }], [at("El usuario decide"), { x: 960, y: 450, z: 1 }]]; },
  tok: (S) => {
    const { at } = S; const y = 390;
    return [
      [at("Uno"), L.ring(ST[0], y, 150, 44, 130)],
      [at("Dos"), L.row(ST[1], y + 150, 26, 8)],
      [at("Tres"), L.block(ST[2], y + 160, 44, 10)],
      [at("Cuatro"), L.bars(ST[3], y + 240, 180, 34, 8)],
      [at("Cinco", 2), L.row(ST[4], y + 185, 22, 6)],
    ];
  },
  draw: (S) => {
    const { t, at } = S; const cues = [at("Uno"), at("Dos"), at("Tres"), at("Cuatro"), at("Cinco", 2)]; const dec = at("El usuario decide"), no = at("no opera"); const y = 390;
    const up = p(t, dec, 0.7);
    return <G y={0}>
      <Tx w={S.w(0)} x={960} y={110} s={82} o={vis(t, at("cinco pasos"), cues[0])} k={pop(t, at("cinco pasos"))} />
      {STI.map((I, i) => <React.Fragment key={i}>
        {i > 0 ? <Ln x1={ST[i - 1] + 76} y1={y - 60} x2={ST[i] - 76} y2={y - 60} k={p(t, cues[i] - 0.1, 0.4)} c={C.indigo} head sw={6} /> : null}
        <Bd I={I} x={ST[i]} y={y - 60} s={140} k={pop(t, cues[i])} bg={t > cues[i] && t < (cues[i + 1] ?? dec) ? C.indigo : C.panel} /></React.Fragment>)}
      
      <G o={vis(t, cues[2] + 0.6, cues[3])} x={ST[2]}><Ic I={Clock} x={-120} y={y + 80} s={70} c={C.lilac} k={pop(t, at("cotizaciones"))} /><Ic I={Radio} x={120} y={y + 80} s={70} c={C.lilac} k={pop(t, at("señales"))} /></G>
      <G o={vis(t, at("índice de concentración"), cues[4])}><Dr d={`M ${ST[3] - 90} ${y + 20} A 90 90 0 0 1 ${ST[3] + 90} ${y + 20}`} k={p(t, at("índice de concentración"), 0.7)} c={C.orange} sw={12} /></G>
      <Card x={ST[4]} y={y + 90} w={290} h={130} c={C.green} k={pop(t, cues[4] + 0.2)} lines={0}>
        {[at("la regla"), at("las métricas"), at("la evidencia")].map((tt, i) => <Tick key={i} x={-80 + i * 80} y={-24} r={24} k={pop(t, tt)} />)}
      </Card>
      <G o={vis(t, dec)}>
        <Pr x={mix(ST[0], 660, up)} y={700} s={150} c={C.white} k={pop(t, dec)} />
        <Tx w={S.w(1)} x={1010} y={710} s={76} k={pop(t, dec + 0.2)} />
      </G>
      <G o={vis(t, no)}><Ic I={Bot} x={1500} y={700} s={120} c={C.soft} /><Strike x={1500} y={700} r={70} k={p(t, no, 0.5)} /></G>
    </G>;
  },
};

/* 6 · Web y móvil */
export const Laptop: React.FC<{ x: number; y: number; o?: number; k?: number; children?: React.ReactNode }> = ({ x, y, o = 1, k = 1, children }) => (
  <G x={x} y={y} o={o} k={k}><Rc x={0} y={0} w={480} h={300} r={18} f={C.panel} s={C.soft} sw={6} /><path d="M -290 165 H 290 L 260 190 H -260 Z" fill={C.soft} />{children}</G>
);
export const PhoneD: React.FC<{ x: number; y: number; o?: number; k?: number; children?: React.ReactNode }> = ({ x, y, o = 1, k = 1, children }) => (
  <G x={x} y={y} o={o} k={k}><Rc x={0} y={0} w={190} h={370} r={34} f={C.panel} s={C.soft} sw={6} /><rect x={-28} y={-168} width={56} height={8} rx={4} fill={C.soft} />{children}</G>
);
export const MiniBars: React.FC<{ s?: number; k: number }> = ({ s = 1, k }) => <g transform={`scale(${s})`}>{[0.36, 0.22, 0.16, 0.12, 0.08, 0.06].map((v, i) => <rect key={i} x={-105 + i * 36} y={80 - v * 400 * k} width={26} height={v * 400 * k} rx={5} fill={[C.indigo, C.blue, C.orange, C.yellow, C.green, C.lilac][i]} />)}</g>;
const s6: SceneDef = {
  words: ["Una cuenta", "iOS", "Android"],
  tok: (S) => {
    const { at } = S; const lo = at("Lo que se carga");
    return [[0.1, L.hidden(560, 500)], [lo - 0.1, L.at([[560, 470], [560, 470], [560, 470], [560, 470], [560, 470], [560, 470]], 50)], [lo + 0.7, L.at([[960, 170], [960, 170], [960, 170], [960, 170], [960, 170], [960, 170]], 50)], [lo + 1.5, L.at([[1400, 470], [1400, 470], [1400, 470], [1400, 470], [1400, 470], [1400, 470]], 50)], [lo + 2.3, L.hidden(1400, 470)]];
  },
  draw: (S) => {
    const { t, at } = S; const w = at("una plataforma web"), m = at("una aplicación móvil"), mit = at("casi la mitad"), dos = at("dos clientes"), lo = at("Lo que se carga"), ios = at("iOS");
    const lx = mix(960, 560, p(t, m, 0.7));
    return <>
      <Laptop x={lx} y={500} k={pop(t, w)}>{t > lo + 0.4 ? <MiniBars k={p(t, lo + 0.4, 0.5)} /> : null}</Laptop>
      <PhoneD x={mix(2200, 1400, p(t, m, 0.8))} y={500}>{t > lo + 1.9 ? <MiniBars s={0.66} k={p(t, lo + 1.9, 0.5)} /> : null}</PhoneD>
      <G o={vis(t, mit, dos)}>
        <Dots n={190} cols={38} x={280} y={135} gap={36} r={13} color={(i) => (i < 86 && t > mit + i * 0.006 ? C.indigo : C.line)} k={(i) => (i < 86 ? 1 - 0.0 * i : 1)} />
      </G>
      <G o={vis(t, dos)}>
        <Ln x1={lx} y1={345} x2={930} y2={190} k={p(t, dos + 0.2, 0.5)} c={C.indigo} sw={6} />
        <Ln x1={1400} y1={310} x2={990} y2={190} k={p(t, dos + 0.4, 0.5)} c={C.indigo} sw={6} />
        <Bd I={User} x={960} y={170} s={150} k={pop(t, dos)} bg={C.indigo} />
        <Tx w={S.w(0)} x={1050} y={100} s={58} a="start" k={pop(t, at("misma cuenta"))} />
      </G>
      <Tx w={S.w(1)} x={1590} y={420} s={58} a="start" k={pop(t, ios)} />
      <Tx w={S.w(2)} x={1590} y={500} s={58} a="start" k={pop(t, at("Android"))} />
      <G o={vis(t, at("sin instalar"), lo)}><Ic I={Download} x={lx} y={500} s={110} c={C.soft} /><Strike x={lx} y={500} r={65} k={p(t, at("sin instalar"), 0.5)} /></G>
    </>;
  },
};

/* 7 · Requerimientos */
const s7: SceneDef = {
  words: ["12", "10", "Nunca opera"],
  tok: (S) => [[S.at("fija el límite"), L.block(590, 760, 34, 8)]],
  cam: (S) => { const l = S.at("fija el límite"); return [[0, { x: 960, y: 450, z: 1 }], [l + 0.45, { y: 462 }], [l + 0.6, { y: 450 }]]; },
  draw: (S) => {
    const { t, at } = S; const a = at("doce"), b = at("diez"), deb = at("el sistema debe"), cen = at("Los centrales"), lim = at("fija el límite"), nun = at("nunca opera");
    const tile = (i: number, base: number, col: string, x0: number, cue: number) => {
      const r = Math.floor(i / 4), cc = i % 4; const drop = pop(t, cue + i * 0.05, 0.4);
      const y = mix(-120, 240 + r * 110, drop);
      return <rect key={base + i} x={x0 + cc * 110 - 46} y={y - 46} width={92} height={92} rx={18} fill={col} />;
    };
    const shrink = p(t, cen, 0.6);
    const icons: [any, number][] = [[Lock, at("cuenta propia")], [PieChart, at("composición")], [Radio, at("señales")], [Search, at("observaciones")], [FileText, at("informes")], [Trash2, at("baja de cuenta")]];
    const wall = p(t, lim, 0.4);
    return <>
      <G o={1 - shrink}>
        {Array.from({ length: 12 }).map((_, i) => tile(i, 0, C.indigo, 260, a))}
        {Array.from({ length: 10 }).map((_, i) => tile(i, 100, C.blue, 1160, b))}
        <Tx w={S.w(0)} x={425} y={120} s={110} k={pop(t, a)} /><Tx w={S.w(1)} x={1325} y={120} s={110} k={pop(t, b)} />
        {[0, 1, 2, 3].map((i) => <Tick key={i} x={260 + i * 110 + 30} y={210} r={22} k={pop(t, deb + i * 0.2)} />)}
      </G>
      <G o={p(t, cen, 0.4)}>
        {icons.map(([I, tt], i) => { const col = i % 3; const row = Math.floor(i / 3); return <Bd key={i} I={I} x={mix(250 + col * 240, 250 + col * 240, 1)} y={210 + row * 240} s={170} k={pop(t, tt)} bg={t > tt ? C.indigo : C.panel} />; })}
      </G>
      <G o={wall}><rect x={1020} y={mix(-900, 40, wall)} width={36} height={820} rx={6} fill={C.red} /></G>
      <G o={vis(t, nun - 0.3)}>
        <Ic I={ShoppingCart} x={1270} y={310} s={140} c={C.soft} /><Strike x={1270} y={310} r={80} k={p(t, nun, 0.5)} />
        <Ic I={TrendingUp} x={1580} y={310} s={140} c={C.soft} /><Strike x={1580} y={310} r={80} k={p(t, nun + 0.3, 0.5)} />
        <Tx w={S.w(2)} x={1425} y={560} s={92} c={C.red} k={pop(t, nun)} />
      </G>
    </>;
  },
};

/* 8 · Freemium */
const s8: SceneDef = {
  words: ["Gratis", "Pro", `6${NB}USD`],
  tok: (S) => {
    const { at } = S; const pro = at("el plan Pro");
    return [[at("hasta diez") - 2, L.hidden(960, 100)], [pro, L.at([[1060, 300], [1140, 300], [1220, 300], [1300, 300], [1380, 300], [1460, 300]], 62)], [at("La encuesta"), L.at([[1120, 150], [1190, 150], [1260, 150], [1330, 150], [1400, 150], [1470, 150]], 44)]];
  },
  draw: (S) => {
    const { t, at } = S; const ten = at("hasta diez"), pro = at("el plan Pro"), six = at("seis dólares"), ili = at("ilimitadas"), enc = at("La encuesta"), mit = at("la mitad"), uno = at("uno de cada cuatro"), lim = at("El límite legal");
    const sh = p(t, enc, 0.7); const bounce = lin(t, ten + 1.6, 0.8); const by = -Math.abs(Math.sin(bounce * 6.28)) * 80 * (1 - bounce);
    const boxY = mix(330, 150, sh); const bh = mix(320, 170, sh);
    return <>
      <G o={vis(t, 0.1)}><Rc x={490} y={boxY} w={700} h={bh} f={C.panel} s={C.line} />
        <Tx w={S.w(0)} x={490} y={boxY - bh / 2 - 44} s={58} o={1 - sh} />
        {Array.from({ length: 10 }).map((_, i) => { const r = Math.floor(i / 5), c = i % 5; return <rect key={i} x={205 + c * 118} y={boxY - 44 * (1 - sh) * 2 + r * mix(118, 62, sh) - 36} width={mix(98, 52, sh)} height={mix(98, 52, sh)} rx={14} fill={C.indigo} opacity={p(t, ten + i * 0.09, 0.15)} />; })}
        {bounce > 0 && bounce < 1 ? <rect x={800} y={330 + by - 40} width={70} height={70} rx={14} fill={C.red} opacity={1 - bounce} /> : null}
      </G>
      <G o={vis(t, pro)}>
        <Rc x={1340} y={boxY} w={700} h={bh} f={C.panel} s={C.indigo} sw={5} dash="24 10" />
        <Tx w={S.w(1)} x={1200} y={boxY - bh / 2 - 44} s={58} o={1 - sh} c={C.indigo} />
        <G x={1460} y={boxY - bh / 2 - 44} o={1 - sh}><Tx w={S.w(2)} x={0} y={0} s={58} k={pop(t, six)} c={C.yellow} /></G>
        <G o={1 - sh}><Ic I={InfinityIcon} x={1590} y={300} s={110} c={C.white} k={pop(t, ili)} /></G>
        {[[FileText, at("informes")], [Bell, at("alertas")], [Download, at("exportación")]].map(([I, tt]: any, i) => <Ic key={i} I={I} x={1150 + i * 190} y={420} s={80} c={C.lilac} o={1 - sh} k={pop(t, tt)} />)}
      </G>
      <G o={vis(t, mit)}>
        {Array.from({ length: 10 }).map((_, i) => <Pr key={i} x={200 + (i % 5) * 110} y={380 + Math.floor(i / 5) * 170} s={130} c={i < 5 && t > mit + i * 0.15 ? C.indigo : C.line} />)}
      </G>
      <G o={vis(t, uno)}>
        {[0, 1, 2, 3].map((i) => <Pr key={i} x={880 + i * 120} y={470} s={150} c={i === 0 && t > uno + 0.4 ? C.yellow : C.line} k={pop(t, uno + i * 0.08)} />)}
      </G>
      <G o={vis(t, lim)}>
        <Ic I={Search} x={1500} y={400} s={130} c={C.white} k={pop(t, at("vende análisis"))} />
        <Ic I={Tag} x={1600} y={320} s={80} c={C.yellow} k={pop(t, at("vende análisis") + 0.2)} />
        <Ic I={Briefcase} x={1560} y={620} s={110} c={C.soft} k={pop(t, at("asesoramiento"))} /><Strike x={1560} y={620} r={70} k={p(t, at("asesoramiento") + 0.1, 0.5)} />
      </G>
    </>;
  },
};

/* 9 · Viabilidad: curvas reales del modelo (scripts/viabilidad.py) */
const XM = (m: number) => 250 + (m / 36) * 1400; const YV = (v: number) => 450 - v * 0.0105;
const curve = (a: number[]) => "M " + XM(0) + " " + YV(-10324) + " " + a.map((v, i) => `L ${XM(i + 1)} ${YV(v)}`).join(" ");
const s9: SceneDef = {
  words: ["10.300", "133–163", "Mes 21"],
  cam: (S) => { const { at } = S; return [[0, { x: 960, y: 450, z: 1 }], [at("Inversión inicial"), { x: 620, y: 490, z: 1.5 }], [at("El punto de equilibrio"), { x: 960, y: 450, z: 1 }], [at("mes veintiuno") - 0.3, { x: 1180, y: 400, z: 1.3 }], [at("Es viable"), { x: 960, y: 450, z: 1 }]]; },
  tok: (S) => [[S.at("Para la viabilidad"), L.row(180, 60, 26, 6)]],
  draw: (S) => {
    const { t, at } = S; const ax = at("treinta y seis meses"), inv = at("Inversión inicial"), cf = at("costos fijos"), eq = at("El punto de equilibrio"), pe = at("El pesimista"), ba = at("el base"), op = at("el optimista"), vi = at("Es viable");
    const opx = p(t, op, 1.2); const flag = XM(21);
    const drip = t > cf && t < eq ? (t * 1.4) % 1 : 0;
    return <>
      <Ln x1={XM(0)} y1={YV(0)} x2={XM(36)} y2={YV(0)} k={p(t, ax, 1)} c={C.soft} sw={5} />
      {Array.from({ length: 13 }).map((_, i) => <line key={i} x1={XM(i * 3)} x2={XM(i * 3)} y1={YV(0) - 8} y2={YV(0) + 8} stroke={C.soft} strokeWidth={3} opacity={lin(t, ax + i * 0.07, 0.2)} />)}
      <rect x={XM(0) - 34} y={YV(0)} width={68} height={p(t, inv, 0.8) * (YV(-10324) - YV(0))} fill={C.red} rx={6} />
      <Tx w={S.w(0)} x={XM(0) + 60} y={YV(-5000)} s={64} a="start" c={C.red} k={pop(t, inv + 0.4)} />
      {drip > 0 ? <circle cx={XM(0) + 2} cy={YV(-10324) + drip * 90} r={10} fill={C.orange} opacity={1 - drip} /> : null}
      <G o={vis(t, eq)}>
        <Dots n={163} cols={163} x={330} y={72} gap={8} r={3.6} color={(i) => (i >= 132 ? C.yellow : C.line)} k={(i) => lin(t, eq + i * 0.006, 0.1)} />
        <Tx w={S.w(1)} x={1650} y={72} s={56} a="start" c={C.yellow} k={pop(t, at("ciento treinta y tres"))} />
      </G>
      <Dr d={curve(viab.Pesimista)} k={p(t, pe, 1)} c={C.red} sw={6} />
      <Dr d={curve(viab.Base)} k={p(t, ba, 1)} c={C.orange} sw={6} />
      <Dr d={curve(viab.Optimista)} k={opx} c={C.green} sw={8} />
      <G o={vis(t, at("mes veinticinco"))}><circle cx={XM(25)} cy={YV(viab.Base[24])} r={14} fill={C.orange} /></G>
      <G o={vis(t, at("recupera"))}>
        <line x1={flag} x2={flag} y1={YV(0)} y2={YV(0) - 130} stroke={C.green} strokeWidth={6} />
        <Ic I={Flag} x={flag + 26} y={YV(0) - 130} s={70} c={C.green} fill={C.green} k={pop(t, at("mes veintiuno"))} />
        <Tx w={S.w(2)} x={flag - 40} y={YV(0) - 110} s={66} a="end" c={C.green} k={pop(t, at("mes veintiuno"))} />
      </G>
      <G o={vis(t, vi)}><Pr x={1760} y={520} s={100} c={C.white} k={pop(t, at("usuarios reales"))} /><Pr x={1840} y={520} s={100} c={C.white} k={pop(t, at("usuarios reales") + 0.15)} /><Ln x1={1680} y1={500} x2={XM(36) + 18} y2={YV(viab.Optimista[35]) + 40} k={p(t, at("la conversión"), 0.7)} c={C.green} head sw={5} /></G>
    </>;
  },
};

/* 10 · Cierre */
const s10: SceneDef = {
  words: ["Entender y verificar", "Gracias"],
  tok: (S) => {
    const { at } = S; return [[0.1, L.block(960, 390, 56, 8)], [at("segundo video"), L.row(960, 700, 40, 40)], [at("Gracias"), L.row(960, 620, 56, 18)]];
  },
  draw: (S) => {
    const { t, at } = S; const pr = at("no promete"), en = at("entender"), sv = at("En el segundo"), gr = at("Gracias");
    const icons: [any, number][] = [[Network, at("arquitectura")], [Cog, at("motor de reglas")], [Sparkles, at("capa de inteligencia")], [Shield, at("seguridad")], [FlaskConical, at("y pruebas")]];
    return <>
      <G o={vis(t, pr, en)}><CrystalBall x={960} y={160} s={220} k={pop(t, pr)} /><Strike x={960} y={150} r={100} k={p(t, at("predecir"), 0.5)} /></G>
      <G o={vis(t, en, sv)}>
        <Ic I={Search} x={500} y={390} s={170} c={C.lilac} k={pop(t, at("entender"))} />
        <Tick x={1420} y={390} r={70} k={pop(t, at("verificar"))} />
        <Tx w={S.w(0)} x={960} y={140} s={84} k={pop(t, en)} />
      </G>
      <G o={vis(t, sv, gr)}>
        <Frames x={960} y={170} s={1.5} on={[1, 1, 0]} />
        {icons.map(([I, tt], i) => <Bd key={i} I={I} x={960 + (i - 2) * 230} y={460} s={160} k={pop(t, tt)} bg={C.indigo} />)}
      </G>
      <G o={vis(t, gr)}><Logo x={960} y={300} w={560} k={pop(t, gr)} /><Tx w={S.w(1)} x={960} y={480} s={80} k={pop(t, gr + 0.2)} /></G>
    </>;
  },
};

export const V1: SceneDef[] = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10];
