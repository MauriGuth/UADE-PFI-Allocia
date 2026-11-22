import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import Svg, { Circle, Defs, G, Line, RadialGradient, Stop } from "react-native-svg";
import { CLASS_LABELS, ExposureItem, fmtPct, fmtUsd } from "../lib/api";
import { alpha, fonts, makeStyles, useTheme } from "../lib/theme";
import { MotionPressable, useMotion } from "./motion";
import { AssetMark } from "./AssetLogo";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Mezcla un color «#rrggbb» con negro (t < 0) o blanco (t > 0). */
function shade(hex: string, t: number): string {
  const h = hex.replace("#", "");
  const ch = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  const target = t < 0 ? 0 : 255;
  const k = Math.abs(t);
  return "#" + ch.map((v) => Math.round(v + (target - v) * k).toString(16).padStart(2, "0")).join("");
}

const pctLabel = (w: number) => (w > 0 && w < 0.01 ? "< 1 %" : fmtPct(w, 0));

export interface DonutHolding {
  ticker: string;
  assetClass?: string;
  weight: number;
}

/**
 * Donut de composición (mismo diseño que la web): aro con sombreado radial por segmento, dial de 72 marcas alrededor,
 * dibujo inicial animado y el total de posiciones en el centro. Tocar un segmento o su fila de la leyenda lo elige:
 * se adelanta, el centro muestra su porcentaje y su resumen, y debajo aparecen sus posiciones. Otro toque lo suelta.
 */
export function Donut({
  data,
  useClassLabels,
  total,
  size = 188,
  details,
  holdings,
}: {
  data: ExposureItem[];
  useClassLabels?: boolean;
  total?: number;
  size?: number;
  details?: Record<string, { count: number; value: number }>;
  holdings?: Record<string, DonutHolding[]>;
}) {
  const { c, cat, scheme } = useTheme();
  const s = useDonutStyles();
  const { reduced } = useMotion();
  const [sel, setSel] = useState<number | null>(null);
  const draw = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) {
      draw.setValue(1);
      return;
    }
    const a = Animated.timing(draw, { toValue: 1, duration: 950, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [draw, reduced]);

  const stroke = Math.round((size * 22) / 176);
  const r = (size - stroke) / 2 - Math.round(size * 0.075);
  const rIn = r - stroke / 2;
  const rOut = r + stroke / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const gap = Math.max(2.5, size / 60);
  const color = (i: number) => cat[i % cat.length];
  const label = (d: ExposureItem) => (useClassLabels ? CLASS_LABELS[d.key] ?? d.key : d.key);

  const segments = useMemo(() => {
    let offset = 0;
    return data.map((d, i) => {
      const valid = Number.isFinite(d.weight) && d.weight > 0;
      const start = offset;
      offset += valid ? d.weight * circ : 0;
      return { d, i, valid, start, len: valid ? Math.max(d.weight * circ - gap, 1.5) : 0 };
    });
  }, [data, circ, gap]);

  const shown = sel;
  const detailLines = (d: ExposureItem): string[] => {
    const x = details?.[d.key];
    if (!x) return [];
    return [x.count === 1 ? "1 posición" : `${x.count} posiciones`, fmtUsd(x.value)];
  };
  const toggle = (i: number) => setSel((v) => (v === i ? null : i));
  const selectedHoldings = sel !== null ? (holdings?.[data[sel].key] ?? []).slice().sort((a, b) => b.weight - a.weight) : [];
  const summary = data.map((d) => `${label(d)} ${fmtPct(d.weight, 0)}`).join(", ");

  return (
    <View>
      <View style={s.row}>
        <View style={{ width: size, height: size }} accessible accessibilityLabel={`Composición: ${summary}`}>
          <Svg width={size} height={size}>
            <Defs>
              <RadialGradient id="hole" cx="50%" cy="38%" r="62%">
                <Stop offset="0%" stopColor={c.card} />
                <Stop offset="100%" stopColor={c.containerLow} />
              </RadialGradient>
              {segments.map(({ i }) => (
                <RadialGradient key={i} id={`g${i}`} gradientUnits="userSpaceOnUse" cx={cx} cy={cx} r={rOut + 2} fx={cx} fy={cx}>
                  <Stop offset={(rIn - 1) / (rOut + 2)} stopColor={shade(color(i), -0.28)} />
                  <Stop offset={(rIn + stroke * 0.45) / (rOut + 2)} stopColor={color(i)} />
                  <Stop offset={1} stopColor={shade(color(i), 0.3)} />
                </RadialGradient>
              ))}
            </Defs>
            <Circle cx={cx} cy={cx} r={rIn - 5} fill="url(#hole)" />
            <Circle cx={cx} cy={cx} r={r} fill="none" stroke={c.border} strokeWidth={stroke} opacity={0.45} />
            {/* Dial: marcas finas; las que caen sobre el grupo elegido toman su color. */}
            {Array.from({ length: 72 }, (_, k) => {
              const frac = k / 72;
              const a = frac * 2 * Math.PI - Math.PI / 2;
              const major = k % 6 === 0;
              const r1 = rOut + 5;
              const r2 = rOut + (major ? 10 : 8);
              const seg = shown !== null ? segments[shown] : null;
              const on = !!seg && seg.valid && frac * circ >= seg.start && frac * circ <= seg.start + seg.len;
              return (
                <Line
                  key={k}
                  x1={cx + Math.cos(a) * r1}
                  y1={cx + Math.sin(a) * r1}
                  x2={cx + Math.cos(a) * r2}
                  y2={cx + Math.sin(a) * r2}
                  stroke={on && shown !== null ? color(shown) : c.outlineVariant}
                  strokeWidth={major ? 1.4 : 1}
                  strokeLinecap="round"
                  opacity={on ? 1 : major ? 0.6 : 0.32}
                />
              );
            })}
            {segments.map(({ d, i, valid, start, len }) => {
              if (!valid) return null;
              const isShown = shown === i;
              const mid = ((start + len / 2) / circ) * 2 * Math.PI - Math.PI / 2;
              const lift = isShown ? 4 : 0;
              return (
                <G key={d.key} x={Math.cos(mid) * lift} y={Math.sin(mid) * lift} opacity={shown !== null && !isShown ? 0.38 : 1}>
                  <AnimatedCircle
                    cx={cx}
                    cy={cx}
                    r={r}
                    fill="none"
                    stroke={`url(#g${i})`}
                    strokeWidth={isShown ? stroke + 4 : stroke}
                    strokeDasharray={draw.interpolate({ inputRange: [0, 1], outputRange: [`0 ${circ}`, `${len} ${circ}`] })}
                    strokeDashoffset={-start}
                    rotation={-90}
                    originX={cx}
                    originY={cx}
                    onPress={() => toggle(i)}
                  />
                </G>
              );
            })}
            <Circle cx={cx} cy={cx} r={rIn - 0.5} fill="none" stroke={c.donutEdge} strokeWidth={1} />
            <Circle cx={cx} cy={cx} r={rOut + 0.5} fill="none" stroke={alpha(scheme === "dark" ? "#ffffff" : "#191c1e", 0.06)} strokeWidth={1} />
          </Svg>
          <View pointerEvents="none" style={s.center}>
            {shown === null || !data[shown] ? (
              total !== undefined ? (
                <>
                  <Text style={s.centerValue}>{total}</Text>
                  <Text style={s.centerCaption}>{total === 1 ? "posición" : "posiciones"}</Text>
                </>
              ) : null
            ) : (
              <>
                <Text numberOfLines={1} style={s.centerCaption}>{label(data[shown])}</Text>
                <Text style={s.centerValue}>{pctLabel(data[shown].weight)}</Text>
                {detailLines(data[shown]).map((l) => (
                  <Text key={l} style={s.centerMicro}>{l}</Text>
                ))}
              </>
            )}
          </View>
        </View>
        <View style={s.legend}>
          {data.map((d, i) => (
            <MotionPressable
              key={d.key}
              accessibilityRole="button"
              accessibilityState={{ selected: sel === i }}
              accessibilityLabel={`${label(d)}: ${fmtPct(d.weight)}`}
              onPress={() => toggle(i)}
              style={[s.legendRow, shown === i && s.legendRowOn, shown !== null && shown !== i && { opacity: 0.55 }]}
            >
              <View style={[s.swatch, { backgroundColor: color(i) }]} />
              <Text style={s.legendLabel} numberOfLines={1}>{label(d)}</Text>
              <Text style={s.legendValue}>{pctLabel(d.weight)}</Text>
            </MotionPressable>
          ))}
        </View>
      </View>
      {sel !== null && selectedHoldings.length > 0 ? (
        <View style={s.holdings}>
          <Text style={s.holdingsTitle}>
            {label(data[sel])} · {selectedHoldings.length === 1 ? "1 posición" : `${selectedHoldings.length} posiciones`}
          </Text>
          <View style={s.chips}>
            {selectedHoldings.slice(0, 8).map((h) => (
              <View key={h.ticker} style={s.chip}>
                <AssetMark ticker={h.ticker} assetClass={h.assetClass} size={24} />
                <Text style={s.chipTicker}>{h.ticker}</Text>
                <Text style={s.chipPct}>{fmtPct(h.weight)}</Text>
              </View>
            ))}
            {selectedHoldings.length > 8 ? <Text style={s.chipPct}>y {selectedHoldings.length - 8} más</Text> : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const useDonutStyles = makeStyles((c) => ({
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", columnGap: 22, rowGap: 14 },
  center: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  centerValue: { fontSize: 30, lineHeight: 34, fontFamily: fonts.bold, color: c.ink, letterSpacing: -0.6, fontVariant: ["tabular-nums"] },
  centerCaption: { fontSize: 12.5, fontFamily: fonts.medium, color: c.inkSoft },
  centerMicro: { fontSize: 11, fontFamily: fonts.regular, color: c.inkSoft },
  legend: { flexGrow: 1, flexBasis: 150, gap: 2 },
  legendRow: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, paddingHorizontal: 10 },
  legendRowOn: { backgroundColor: c.containerLow },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, fontSize: 14.5, fontFamily: fonts.regular, color: c.ink },
  legendValue: { fontSize: 14.5, fontFamily: fonts.semibold, color: c.ink, fontVariant: ["tabular-nums"] },
  holdings: { marginTop: 14, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.containerLow },
  holdingsTitle: { fontSize: 12.5, fontFamily: fonts.semibold, color: c.inkSoft, paddingHorizontal: 2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8, alignItems: "center" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 3,
    paddingLeft: 3,
    paddingRight: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.card,
  },
  chipTicker: { fontSize: 13, fontFamily: fonts.semibold, color: c.ink },
  chipPct: { fontSize: 13, fontFamily: fonts.regular, color: c.inkSoft, fontVariant: ["tabular-nums"] },
}));

/** Relleno de barra que crece al aparecer (y al cambiar de valor). */
export function BarFill({ value, color, height = 8, delay = 0 }: { value: number; color: string; height?: number; delay?: number }) {
  const { reduced } = useMotion();
  const { c } = useTheme();
  const w = useRef(new Animated.Value(reduced ? value : 0)).current;
  useEffect(() => {
    if (reduced) {
      w.setValue(value);
      return;
    }
    const a = Animated.timing(w, { toValue: value, duration: 700, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [value, reduced, delay, w]);
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: c.container, overflow: "hidden" }}>
      <Animated.View
        style={{
          height,
          borderRadius: height / 2,
          backgroundColor: color,
          width: w.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"], extrapolate: "clamp" }),
        }}
      />
    </View>
  );
}

/**
 * Barras de exposición (sector, región): etiqueta y porcentaje arriba, barra animada abajo. Con `holdings`, tocar una fila
 * muestra qué posiciones la forman.
 */
export function HBars({ data, max = 6, holdings }: { data: ExposureItem[]; max?: number; holdings?: Record<string, DonutHolding[]> }) {
  const { c } = useTheme();
  const s = useBarStyles();
  const [open, setOpen] = useState<string | null>(null);
  const rows = data.slice(0, max);
  return (
    <View style={s.wrap}>
      {rows.map((d, i) => {
        const list = holdings?.[d.key] ?? [];
        const expanded = open === d.key && list.length > 0;
        const Row = (
          <>
            <View style={s.labelRow}>
              <Text style={s.label} numberOfLines={1}>{d.key}</Text>
              <Text style={s.value}>{pctLabel(d.weight)}</Text>
            </View>
            <BarFill value={Math.max(d.weight * 100, 1.5)} color={c.secondary} delay={i * 70} />
          </>
        );
        return (
          <View key={d.key}>
            {holdings ? (
              <MotionPressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                accessibilityLabel={`${d.key}: ${fmtPct(d.weight)}. ${list.length} posiciones`}
                onPress={() => setOpen(expanded ? null : d.key)}
                style={[s.pressRow, expanded && { backgroundColor: c.containerLow }]}
              >
                {Row}
              </MotionPressable>
            ) : (
              <View style={s.pressRow}>{Row}</View>
            )}
            {expanded ? (
              <View style={s.chips}>
                {list
                  .slice()
                  .sort((a, b) => b.weight - a.weight)
                  .slice(0, 8)
                  .map((h) => (
                    <View key={h.ticker} style={s.chip}>
                      <AssetMark ticker={h.ticker} assetClass={h.assetClass} size={22} />
                      <Text style={s.chipTicker}>{h.ticker}</Text>
                      <Text style={s.chipPct}>{fmtPct(h.weight)}</Text>
                    </View>
                  ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const useBarStyles = makeStyles((c) => ({
  wrap: { gap: 4 },
  pressRow: { paddingVertical: 8, paddingHorizontal: 8, borderRadius: 12 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 7, gap: 10 },
  label: { flex: 1, fontSize: 14, fontFamily: fonts.regular, color: c.ink },
  value: { fontSize: 14, fontFamily: fonts.semibold, color: c.ink, fontVariant: ["tabular-nums"] },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 8, paddingBottom: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 3,
    paddingLeft: 3,
    paddingRight: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.card,
  },
  chipTicker: { fontSize: 13, fontFamily: fonts.semibold, color: c.ink },
  chipPct: { fontSize: 13, fontFamily: fonts.regular, color: c.inkSoft, fontVariant: ["tabular-nums"] },
}));
