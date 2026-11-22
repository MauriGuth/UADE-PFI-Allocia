import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import motion from "./motion.json";

export const { fontFamily } = loadFont("normal", { weights: ["500", "700", "800"], subsets: ["latin", "latin-ext"] });
export const FPS = 30;
export const GAP = 0.3;
export const C = {
  bg: "#0B1220", panel: "#141D31", line: "#2A3650", dim: "#55617A", soft: "#9AA6BD", white: "#F4F6FB",
  indigo: "#6C63FF", blue: "#38BDF8", orange: "#F59E0B", yellow: "#FACC15", green: "#34D399", teal: "#2DD4BF",
  red: "#F43F5E", lilac: "#C4B5FD",
};
export const TOK_COLORS = [C.indigo, C.blue, C.orange, C.yellow, C.green, C.lilac];
export const WEIGHTS = [0.36, 0.22, 0.16, 0.12, 0.08, 0.06];

/* ---------- tiempo ---------- */
const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const inOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const p = (t: number, a: number, d = 0.5) => inOut(clamp((t - a) / d));
export const lin = (t: number, a: number, d = 1) => clamp((t - a) / d);
export const pop = (t: number, a: number, d = 0.45) => {
  const x = clamp((t - a) / d); const c = 1.9;
  return x === 0 ? 0 : 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};
export const vis = (t: number, a: number, b = 1e9, d = 0.3) => p(t, a, d) * (1 - p(t, b, d));
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
export const along = (pts: number[][], k: number) => {
  const n = pts.length - 1; const f = clamp(k) * n; const i = Math.min(n - 1, Math.floor(f)); const u = f - i;
  return [mix(pts[i][0], pts[i + 1][0], u), mix(pts[i][1], pts[i + 1][1], u)];
};
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, "");

/* ---------- datos ---------- */
export type Word = { w: string; t0: number; t1: number };
export type SceneData = { n: number; say: string; audio: string; dur: number; words: Word[] };
export type Cam = { x: number; y: number; z: number };
export type Tok = { x: number; y: number; w: number; h: number; r: number; o: number };
export type Layout = Tok[];
export type S = {
  t: number; dur: number; n: number;
  at: (q: string, occ?: number) => number;
  w: (i: number) => string;
};
export type SceneDef = {
  words: string[];
  cam?: (S: S) => [number, Partial<Cam>][];
  tok?: (S: S) => [number, Layout][];
  draw: (S: S) => React.ReactNode; // bajo la cámara, debajo de las fichas
  over?: (S: S) => React.ReactNode; // bajo la cámara, encima de las fichas
  hud?: (S: S) => React.ReactNode; // fuera de la cámara
};
const makeS = (d: SceneData, def: SceneDef, t: number): S => ({
  t, dur: d.dur, n: d.n,
  at: (q, occ = 1) => {
    const qs = norm(q).split(" ").filter(Boolean); const ws = d.words.map((x) => norm(x.w));
    let seen = 0;
    for (let i = 0; i <= ws.length - 1; i++) {
      let j = i; let k = 0;
      while (k < qs.length && j < ws.length) {
        const parts = ws[j].split(" ").filter(Boolean);
        if (parts.length === 0) { j++; continue; }
        const slice = qs.slice(k, k + parts.length).join(" ");
        if (slice !== parts.join(" ")) break;
        k += parts.length; j++;
      }
      if (k >= qs.length) { seen++; if (seen === occ) return d.words[i].t0 - 0.05; }
    }
    throw new Error(`Palabra clave no encontrada en escena ${d.n}: «${q}» (${occ})`);
  },
  w: (i) => { if (i >= def.words.length) throw new Error(`Escena ${d.n}: palabra ${i} no declarada`); return def.words[i]; },
});
export const countWords = (def: SceneDef) => def.words.join(" ").split(/\s+/).filter(Boolean).length;

/* ---------- capas de fichas ---------- */
const N = TOK_COLORS.length;
export const L = {
  hidden: (x = 960, y = 450): Layout => TOK_COLORS.map(() => ({ x, y, w: 0, h: 0, r: 0, o: 0 })),
  ring: (cx: number, cy: number, R: number, s = 56, ry = R): Layout =>
    TOK_COLORS.map((_, i) => ({ x: cx + R * Math.cos((i / N) * 6.283 - 1.57), y: cy + ry * Math.sin((i / N) * 6.283 - 1.57), w: s, h: s, r: s * 0.28, o: 1 })),
  row: (cx: number, cy: number, s = 56, gap = 18): Layout =>
    TOK_COLORS.map((_, i) => ({ x: cx + (i - (N - 1) / 2) * (s + gap), y: cy, w: s, h: s, r: s * 0.28, o: 1 })),
  block: (cx: number, cy: number, s = 60, gap = 8): Layout =>
    TOK_COLORS.map((_, i) => ({ x: cx + ((i % 3) - 1) * (s + gap), y: cy + (Math.floor(i / 3) - 0.5) * (s + gap), w: s, h: s, r: s * 0.24, o: 1 })),
  at: (pts: number[][], s = 56): Layout => pts.map(([x, y, ss]) => ({ x, y, w: ss ?? s, h: ss ?? s, r: (ss ?? s) * 0.28, o: 1 })),
  bars: (cx: number, base: number, H: number, bw = 60, gap = 16): Layout =>
    WEIGHTS.map((v, i) => { const h = (v / WEIGHTS[0]) * H; return { x: cx + (i - (N - 1) / 2) * (bw + gap), y: base - h / 2, w: bw, h, r: 8, o: 1 }; }),
  stack: (x0: number, y: number, W: number, h: number, g = 4): Layout => {
    let a = x0; return WEIGHTS.map((v) => { const w = v * W; const o = { x: a + w / 2, y, w: w - g, h, r: 8, o: 1 }; a += w; return o; });
  },
};
export const size = (l: Layout, k: number, o = 1): Layout => l.map((a) => ({ ...a, w: a.w * k, h: a.h * k, r: a.r * k, o }));
const blendTok = (a: Tok, b: Tok, k: number): Tok => ({ x: mix(a.x, b.x, k), y: mix(a.y, b.y, k), w: mix(a.w, b.w, k), h: mix(a.h, b.h, k), r: mix(a.r, b.r, k), o: mix(a.o, b.o, k) });

/* ---------- primitivas ---------- */
export const G: React.FC<{ x?: number; y?: number; k?: number; o?: number; rot?: number; children?: React.ReactNode }> = ({ x = 0, y = 0, k = 1, o = 1, rot = 0, children }) =>
  o <= 0.001 ? null : <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${Math.max(0, k)})`} opacity={Math.min(1, o)}>{children}</g>;
export const Ic: React.FC<{ I: any; x?: number; y?: number; s?: number; c?: string; o?: number; k?: number; rot?: number; sw?: number; fill?: string }> = ({ I, x = 0, y = 0, s = 80, c = C.white, o = 1, k = 1, rot = 0, sw = 1.8, fill = "none" }) => (
  <G x={x} y={y} k={k} o={o} rot={rot}><I x={-s / 2} y={-s / 2} width={s} height={s} color={c} strokeWidth={sw} fill={fill} /></G>
);
export const Bd: React.FC<{ I: any; x?: number; y?: number; s?: number; c?: string; bg?: string; o?: number; k?: number; on?: number }> = ({ I, x = 0, y = 0, s = 110, c = C.white, bg = C.panel, o = 1, k = 1, on = 1 }) => (
  <G x={x} y={y} k={k} o={o}>
    <circle r={s / 2} fill={bg} stroke={c} strokeOpacity={0.35 + 0.65 * on} strokeWidth={3} />
    <I x={-s * 0.28} y={-s * 0.28} width={s * 0.56} height={s * 0.56} color={c} strokeWidth={1.9} fill="none" />
  </G>
);
export const Rc: React.FC<{ x: number; y: number; w: number; h: number; r?: number; f?: string; s?: string; sw?: number; o?: number; dash?: string }> = ({ x, y, w, h, r = 18, f = "none", s = "none", sw = 3, o = 1, dash }) =>
  o <= 0.001 ? null : <rect x={x - w / 2} y={y - h / 2} width={Math.max(0, w)} height={Math.max(0, h)} rx={r} fill={f} stroke={s} strokeWidth={sw} opacity={o} strokeDasharray={dash} />;
export const Dr: React.FC<{ d: string; k?: number; c?: string; sw?: number; o?: number; f?: string; dash?: string }> = ({ d, k = 1, c = C.white, sw = 4, o = 1, f = "none", dash }) =>
  k <= 0 || o <= 0 ? null : dash ? <path d={d} fill={f} stroke={c} strokeWidth={sw} opacity={o * k} strokeLinecap="round" strokeDasharray={dash} /> :
    <path d={d} pathLength={1} fill={f} stroke={c} strokeWidth={sw} opacity={o} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${k} 1.01`} />;
export const Ln: React.FC<{ x1: number; y1: number; x2: number; y2: number; k?: number; c?: string; sw?: number; o?: number; head?: boolean; dash?: string }> = ({ x1, y1, x2, y2, k = 1, c = C.dim, sw = 4, o = 1, head, dash }) => {
  if (k <= 0 || o <= 0) return null;
  const x = mix(x1, x2, k), y = mix(y1, y2, k); const a = Math.atan2(y2 - y1, x2 - x1);
  return <g opacity={o}><line x1={x1} y1={y1} x2={x} y2={y} stroke={c} strokeWidth={sw} strokeLinecap="round" strokeDasharray={dash} />
    {head ? <path d={`M ${x - 18 * Math.cos(a - 0.5)} ${y - 18 * Math.sin(a - 0.5)} L ${x} ${y} L ${x - 18 * Math.cos(a + 0.5)} ${y - 18 * Math.sin(a + 0.5)}`} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /> : null}</g>;
};
export const Strike: React.FC<{ x: number; y: number; r?: number; k?: number; o?: number }> = ({ x, y, r = 60, k = 1, o = 1 }) => (
  <g opacity={o}><Ln x1={x - r} y1={y - r} x2={x + r} y2={y + r} k={clamp(k * 2)} c={C.red} sw={10} /><Ln x1={x + r} y1={y - r} x2={x - r} y2={y + r} k={clamp(k * 2 - 1)} c={C.red} sw={10} /></g>
);
export const Tick: React.FC<{ x: number; y: number; r?: number; k?: number; c?: string }> = ({ x, y, r = 26, k = 1, c = C.green }) =>
  k <= 0 ? null : <G x={x} y={y} k={k}><circle r={r} fill={c} /><path d={`M ${-r * 0.45} 0 L ${-r * 0.1} ${r * 0.36} L ${r * 0.5} ${-r * 0.36}`} fill="none" stroke={C.bg} strokeWidth={r * 0.24} strokeLinecap="round" strokeLinejoin="round" /></G>;
export const Tx: React.FC<{ w: string; x: number; y: number; s?: number; c?: string; o?: number; k?: number; a?: "start" | "middle" | "end"; fw?: number }> = ({ w, x, y, s = 90, c = C.white, o = 1, k = 1, a = "middle", fw = 800 }) => (
  <G x={x} y={y} k={k} o={o}><text textAnchor={a} dominantBaseline="middle" fontFamily={fontFamily} fontWeight={fw} fontSize={s} fill={c} letterSpacing={-0.5}>{w}</text></G>
);
export const Pr: React.FC<{ x: number; y: number; s?: number; c?: string; o?: number; k?: number }> = ({ x, y, s = 90, c = C.white, o = 1, k = 1 }) => (
  <G x={x} y={y} k={k} o={o}><circle cy={-s * 0.28} r={s * 0.2} fill={c} /><path d={`M ${-s * 0.36} ${s * 0.42} a ${s * 0.36} ${s * 0.4} 0 0 1 ${s * 0.72} 0 z`} fill={c} /></G>
);
export const Dots: React.FC<{ n: number; cols: number; x: number; y: number; gap?: number; r?: number; color: (i: number) => string; k?: (i: number) => number }> = ({ n, cols, x, y, gap = 30, r = 10, color, k }) => (
  <>{Array.from({ length: n }).map((_, i) => { const kk = k ? k(i) : 1; return kk <= 0 ? null : <circle key={i} cx={x + (i % cols) * gap} cy={y + Math.floor(i / cols) * gap} r={r * kk} fill={color(i)} />; })}</>
);
export const HBar: React.FC<{ x: number; y: number; W: number; h?: number; v: number; k?: number; c?: string; track?: boolean }> = ({ x, y, W, h = 44, v, k = 1, c = C.indigo, track = true }) => (
  <>{track ? <rect x={x} y={y - h / 2} width={W} height={h} rx={h / 2} fill={C.panel} /> : null}<rect x={x} y={y - h / 2} width={Math.max(h * Math.min(1, k * 4), W * v * k)} height={h} rx={h / 2} fill={c} opacity={k > 0 ? 1 : 0} /></>
);
export const Logo: React.FC<{ x: number; y: number; w?: number; o?: number; k?: number }> = ({ x, y, w = 560, o = 1, k = 1 }) => {
  const h = w * (241 / 917);
  return <G x={x} y={y} k={k} o={o}><rect x={-w / 2 - 24} y={-h / 2 - 18} width={w + 48} height={h + 36} rx={26} fill="#fff" /><image href={staticFile("allocia_logo.png")} x={-w / 2} y={-h / 2} width={w} height={h} /></G>;
};
export const Card: React.FC<{ x: number; y: number; w?: number; h?: number; c?: string; o?: number; k?: number; rot?: number; lines?: number; children?: React.ReactNode }> = ({ x, y, w = 240, h = 150, c = C.indigo, o = 1, k = 1, rot = 0, lines = 2, children }) => (
  <G x={x} y={y} o={o} k={k} rot={rot}><Rc x={0} y={0} w={w} h={h} f={C.panel} s={c} sw={4} />
    {Array.from({ length: lines }).map((_, i) => <rect key={i} x={-w / 2 + 24} y={-h / 2 + 28 + i * 26} width={(w - 48) * (i % 2 ? 0.66 : 1)} height={11} rx={5} fill={C.dim} />)}{children}</G>
);
export const Frames: React.FC<{ x: number; y: number; on: number[]; s?: number; o?: number }> = ({ x, y, on, s = 1, o = 1 }) => (
  <G x={x} y={y} k={s} o={o}>{[0, 1, 2].map((i) => <g key={i} transform={`translate(${(i - 1) * 150} 0)`}>
    <Rc x={0} y={0} w={126} h={78} r={14} f={on[i] > 0.5 ? C.indigo : C.panel} s={on[i] > 0.5 ? C.indigo : C.line} />
    <path d="M -12 -16 L 16 0 L -12 16 Z" fill={on[i] > 0.5 ? C.white : C.dim} /></g>)}</G>
);
/* Bola de cristal: no existe en el set de íconos. */
export const CrystalBall: React.FC<{ x: number; y: number; s?: number; o?: number; k?: number }> = ({ x, y, s = 120, o = 1, k = 1 }) => (
  <G x={x} y={y} o={o} k={k}><circle cy={-s * 0.12} r={s * 0.42} fill={C.panel} stroke={C.lilac} strokeWidth={4} /><path d={`M ${-s * 0.2} ${-s * 0.28} a ${s * 0.26} ${s * 0.26} 0 0 1 ${s * 0.22} ${-s * 0.1}`} stroke={C.lilac} strokeWidth={4} fill="none" strokeLinecap="round" /><path d={`M ${-s * 0.34} ${s * 0.42} L ${-s * 0.22} ${s * 0.22} L ${s * 0.22} ${s * 0.22} L ${s * 0.34} ${s * 0.42} Z`} fill={C.lilac} /></G>
);
export type FocusKey = [number, number[] | null];
/* Captura real con cámara interna y foco (coordenadas de la imagen original). */
export const Shot: React.FC<{ src: string; iw?: number; ih?: number; x: number; y: number; w: number; t: number; focus?: FocusKey[]; o?: number; k?: number; dim?: number; children?: React.ReactNode; id: string; radius?: number }> = ({ src, iw = 1280, ih = 800, x, y, w, t, focus = [], o = 1, k = 1, dim = 0.72, children, id, radius = 22 }) => {
  const s0 = w / iw; const h = ih * s0;
  const view = (f: number[] | null) => {
    if (!f) return { s: s0, cx: iw / 2, cy: ih / 2, r: [0, 0, iw, ih], d: 0 };
    const [a, b, c, d] = f; const z = Math.min((w * 0.86) / (c - a), (h * 0.86) / (d - b), s0 * 3);
    let cx = (a + c) / 2, cy = (b + d) / 2; const hw = w / 2 / z, hh = h / 2 / z;
    cx = Math.max(hw, Math.min(iw - hw, cx)); cy = Math.max(hh, Math.min(ih - hh, cy));
    return { s: Math.max(s0, z), cx, cy, r: f, d: 1 };
  };
  let cur = view(null); let prev = view(null); let tk = -99;
  for (const [ft, f] of focus) { if (t >= ft) { prev = cur; cur = view(f); tk = ft; } }
  const e = p(t, tk, 0.8); const s = mix(prev.s, cur.s, e); const cx = mix(prev.cx, cur.cx, e), cy = mix(prev.cy, cur.cy, e);
  const r = prev.r.map((v, i) => mix(v, cur.r[i], e)); const d = mix(prev.d, cur.d, e);
  return (
    <G x={x} y={y} o={o} k={k}>
      <defs><clipPath id={id}><rect x={-w / 2} y={-h / 2} width={w} height={h} rx={radius} /></clipPath></defs>
      <rect x={-w / 2 - 3} y={-h / 2 - 3} width={w + 6} height={h + 6} rx={radius + 3} fill={C.line} />
      <g clipPath={`url(#${id})`}>
        <g transform={`scale(${s}) translate(${-cx} ${-cy})`}>
          <image href={staticFile(src)} x={0} y={0} width={iw} height={ih} />
          {d > 0.01 ? <path fillRule="evenodd" fill={C.bg} opacity={dim * d} d={`M -2000 -2000 H 4000 V 4000 H -2000 Z M ${r[0]} ${r[1]} H ${r[2]} V ${r[3]} H ${r[0]} Z`} /> : null}
          {d > 0.01 ? <rect x={r[0]} y={r[1]} width={r[2] - r[0]} height={r[3] - r[1]} rx={8} fill="none" stroke={C.indigo} strokeWidth={3 / s} opacity={d} /> : null}
          {children}
        </g>
      </g>
    </G>
  );
};
export const Click: React.FC<{ t: number; from: number[]; to: number[]; a: number; hide?: number; s?: number; I: any }> = ({ t, from, to, a, hide = 1e9, s = 56, I }) => {
  const k = p(t, a - 0.7, 0.7); const x = mix(from[0], to[0], k), y = mix(from[1], to[1], k); const ring = lin(t, a, 0.5);
  return <G o={vis(t, a - 0.9, hide)}>{ring > 0 && ring < 1 ? <circle cx={to[0]} cy={to[1]} r={s * ring * 1.2} fill="none" stroke={C.white} strokeWidth={4} opacity={1 - ring} /> : null}
    <g transform={`translate(${x + s * 0.36} ${y + s * 0.36})`}><I x={-s / 2} y={-s / 2} width={s} height={s} fill={C.white} color={C.bg} strokeWidth={1.6} /></g></G>;
};

/* ---------- subtítulos ---------- */
type Page = { words: Word[]; t0: number; t1: number };
const paginate = (ws: Word[]): Page[] => {
  const out: Page[] = []; let cur: Word[] = []; let chars = 0;
  ws.forEach((w, i) => {
    cur.push(w); chars += w.w.length + 1; const next = ws[i + 1];
    const hard = /[.:;?!]$/.test(w.w); const soft = /,$/.test(w.w) && chars > 22;
    if (!next || hard || soft || chars + next.w.length > 58) { out.push({ words: cur, t0: cur[0].t0, t1: w.t1 }); cur = []; chars = 0; }
  });
  return out;
};
const Subs: React.FC<{ d: SceneData; t: number }> = ({ d, t }) => {
  const pages = React.useMemo(() => paginate(d.words), [d]);
  const page = pages.find((pg, i) => t >= pg.t0 - 0.08 && t < (pages[i + 1]?.t0 ?? 1e9) - 0.08);
  if (!page) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 42, display: "flex", justifyContent: "center" }}>
      <div style={{ fontFamily, fontWeight: 700, fontSize: 40, lineHeight: 1.25, padding: "12px 30px", borderRadius: 16, background: "#000000", maxWidth: 1560, textAlign: "center" }}>
        {page.words.map((w, i) => <span key={i} style={{ color: t >= w.t0 - 0.03 ? C.white : "#7F8AA3" }}>{w.w}{i < page.words.length - 1 ? " " : ""}</span>)}
      </div>
    </div>
  );
};

/* ---------- línea de tiempo ---------- */
const sampleTok = (keys: [number, Layout][], T: number): Layout => {
  let idx = -1; for (let i = 0; i < keys.length; i++) if (T >= keys[i][0]) idx = i;
  if (idx < 0) return L.hidden();
  const cur = keys[idx]; const prev = idx > 0 ? keys[idx - 1][1] : L.hidden(cur[1][0].x, cur[1][0].y);
  return cur[1].map((b, i) => blendTok(prev[i], b, p(T, cur[0] + i * 0.035, 0.65)));
};
const sampleCam = (keys: [number, Cam][], T: number): Cam => {
  let idx = -1; for (let i = 0; i < keys.length; i++) if (T >= keys[i][0]) idx = i;
  const home = { x: 960, y: 450, z: 1 }; if (idx < 0) return home;
  const prev = idx > 0 ? keys[idx - 1][1] : home; const cur = keys[idx][1]; const e = p(T, keys[idx][0], 0.9);
  return { x: mix(prev.x, cur.x, e), y: mix(prev.y, cur.y, e), z: mix(prev.z, cur.z, e) };
};
const FRAME_H = 1080;
export const Stage: React.FC<{ id: string; defs: SceneDef[] }> = ({ id, defs }) => {
  const frame = useCurrentFrame(); const T = frame / FPS;
  const v = (motion as any)[id]; const scenes: SceneData[] = v.scenes;
  const timeline = React.useMemo(() => {
    let a = 0; const starts = scenes.map((s) => { const x = a; a += s.dur + GAP; return x; });
    const tok: [number, Layout][] = []; const cam: [number, Cam][] = [];
    let lastCam: Cam = { x: 960, y: 450, z: 1 };
    scenes.forEach((s, i) => {
      const S0 = makeS(s, defs[i], 0);
      (defs[i].tok?.(S0) ?? []).forEach(([tt, l]) => tok.push([starts[i] + tt, l]));
      const ck = defs[i].cam?.(S0) ?? [[0, { x: 960, y: 450, z: 1 }] as [number, Partial<Cam>]];
      ck.forEach(([tt, c]) => { lastCam = { ...lastCam, ...c }; cam.push([starts[i] + tt, lastCam]); });
    });
    return { starts, tok, cam, total: a };
  }, [id]);
  const i = (() => { let r = 0; timeline.starts.forEach((st, k) => { if (T >= st) r = k; }); return r; })();
  const c = sampleCam(timeline.cam, T);
  const toks = sampleTok(timeline.tok, T);
  const layer = (kind: "draw" | "over" | "hud") => [i - 1, i].map((k) => {
    if (k < 0) return null; const d = defs[k]; const fn = d[kind]; if (!fn) return null;
    const lt = T - timeline.starts[k]; const end = scenes[k].dur + GAP;
    if (lt > end + 0.35) return null;
    return <g key={k} opacity={1 - p(lt, end - 0.1, 0.35)}>{fn(makeS(scenes[k], d, lt))}</g>;
  });
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {scenes.map((s, k) => <Sequence key={k} from={Math.round(timeline.starts[k] * FPS)} durationInFrames={Math.ceil(s.dur * FPS) + 2} layout="none"><Audio src={staticFile(s.audio)} /></Sequence>)}
      <svg width={1920} height={FRAME_H} viewBox={`0 0 1920 ${FRAME_H}`} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(960 450) scale(${c.z}) translate(${-c.x} ${-c.y})`}>
          {layer("draw")}
          {toks.map((b, k) => b.o <= 0.01 || b.w <= 0 ? null : <rect key={k} x={b.x - b.w / 2} y={b.y - b.h / 2} width={b.w} height={b.h} rx={b.r} fill={TOK_COLORS[k]} opacity={b.o} />)}
          {layer("over")}
        </g>
        {layer("hud")}
      </svg>
      <Subs d={scenes[i]} t={T - timeline.starts[i]} />
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 8, width: `${(T / timeline.total) * 100}%`, background: C.indigo }} />
    </AbsoluteFill>
  );
};
export const totalFrames = (id: string) => Math.ceil(((motion as any)[id].scenes.reduce((a: number, s: SceneData) => a + s.dur + GAP, 0)) * FPS);
