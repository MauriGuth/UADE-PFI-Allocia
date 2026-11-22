import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, LayoutChangeEvent, PanResponder, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavIcon, NavIconName } from "./icons";
import { useMotion } from "./motion";
import { alpha, fonts, makeStyles, useTheme } from "../lib/theme";

export interface TabItem {
  key: NavIconName;
  label: string;
  badge?: number;
}

const PAD = 5;
const HEIGHT = 66;
/** La lupa sobresale un poco por arriba y abajo de la barra y es bastante más ancha que una pestaña. */
const LENS_Y = 7;
const LENS_WIDTH = 1.55;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Barra de pestañas de vidrio líquido (como la de WhatsApp en iOS): ícono y nombre en cada pestaña.
 * En reposo, la pestaña elegida lleva una pastilla suave. Al tocar o arrastrar, la pastilla se convierte en una lupa de
 * vidrio más grande que la barra, con el borde irisado: sigue al dedo, se estira con la velocidad, agranda lo que tiene
 * debajo y, al soltar, se acomoda en la pestaña más cercana con un rebote y vuelve a ser pastilla.
 * Con «reducir movimiento» se coloca sin animación. Los lectores de pantalla usan las pestañas; la lupa es decorativa.
 */
export function LiquidTabBar({ tabs, active, onChange }: { tabs: TabItem[]; active: NavIconName; onChange: (k: NavIconName) => void }) {
  const { c, scheme } = useTheme();
  const s = useS();
  const { reduced } = useMotion();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const activeIdx = Math.max(0, tabs.findIndex((t) => t.key === active));
  const slot = width > 0 ? (width - PAD * 2) / tabs.length : 0;

  const x = useRef(new Animated.Value(0)).current;
  const lens = useRef(new Animated.Value(0)).current; // 0 = pastilla en reposo, 1 = lupa
  const stretch = useRef(new Animated.Value(1)).current;
  const placed = useRef(false);
  const live = useRef({ slot, activeIdx, tabs, onChange, reduced, x: 0, start: 0 });
  live.current = { ...live.current, slot, activeIdx, tabs, onChange, reduced };

  useEffect(() => {
    const id = x.addListener(({ value }) => (live.current.x = value));
    return () => x.removeListener(id);
  }, [x]);

  useEffect(() => {
    if (!slot) return;
    const to = activeIdx * slot;
    if (!placed.current || reduced) {
      x.setValue(to);
      placed.current = true;
      return;
    }
    Animated.spring(x, { toValue: to, stiffness: 300, damping: 20, mass: 1, useNativeDriver: true }).start();
  }, [activeIdx, slot, reduced, x]);

  const showLens = (on: boolean, delay = 0) => {
    if (live.current.reduced) return lens.setValue(0);
    Animated.timing(lens, {
      toValue: on ? 1 : 0,
      duration: on ? 140 : 320,
      delay,
      easing: on ? Easing.out(Easing.cubic) : Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderGrant: () => {
          live.current.start = live.current.x;
          showLens(true);
        },
        onPanResponderMove: (_, g) => {
          const L = live.current;
          const max = (L.tabs.length - 1) * L.slot;
          const nx = clamp(L.start + g.dx, -L.slot * 0.2, max + L.slot * 0.2);
          x.setValue(nx);
          if (!L.reduced) stretch.setValue(1 + Math.min(Math.abs(g.vx) * 0.1, 0.2));
          setHoverIdx(clamp(Math.round(nx / (L.slot || 1)), 0, L.tabs.length - 1));
        },
        onPanResponderRelease: () => settle(),
        onPanResponderTerminate: () => settle(),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function settle() {
    const L = live.current;
    const idx = clamp(Math.round(L.x / (L.slot || 1)), 0, L.tabs.length - 1);
    setHoverIdx(null);
    if (L.reduced) {
      x.setValue(idx * L.slot);
      stretch.setValue(1);
    } else {
      Animated.spring(x, { toValue: idx * L.slot, stiffness: 280, damping: 17, useNativeDriver: true }).start();
      Animated.timing(stretch, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }
    showLens(false, 160);
    if (idx !== L.activeIdx) L.onChange(L.tabs[idx].key);
  }

  const shown = hoverIdx ?? activeIdx;
  const lensW = slot * LENS_WIDTH;
  const lensH = HEIGHT + LENS_Y * 2;
  const dark = scheme === "dark";

  return (
    <View pointerEvents="box-none" style={[s.wrap, { bottom: Math.max(10, insets.bottom - 4) }]}>
      <View
        {...pan.panHandlers}
        accessibilityRole="tablist"
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        style={s.bar}
      >
        <View pointerEvents="none" style={s.sheen} />
        {/* Pastilla en reposo: tinte suave detrás de la pestaña elegida; se desvanece cuando aparece la lupa. */}
        {slot > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              s.pill,
              { width: slot, opacity: lens.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), transform: [{ translateX: x }] },
            ]}
          />
        ) : null}
        {tabs.map((t, i) => {
          const on = i === shown;
          const color = on ? c.secondary : c.ink;
          // Bajo la lupa el contenido se ve agrandado (más cuanto más cerca del centro) y, cerca de su borde, con la
          // dispersión de color del vidrio: copias roja y cian del ícono y del nombre, apenas desplazadas.
          const near = slot
            ? x.interpolate({ inputRange: [(i - 1) * slot, i * slot, (i + 1) * slot], outputRange: [0, 1, 0], extrapolate: "clamp" })
            : new Animated.Value(0);
          const edge = slot
            ? x.interpolate({
                // Máximo cuando el borde de la lupa (a ±0,78 pestañas de su centro) pasa sobre esta pestaña.
                inputRange: [(i - 1.05) * slot, (i - 0.78) * slot, (i - 0.5) * slot, (i + 0.5) * slot, (i + 0.78) * slot, (i + 1.05) * slot],
                outputRange: [0, 1, 0, 0, 1, 0],
                extrapolate: "clamp",
              })
            : new Animated.Value(0);
          const grow = Animated.add(1, Animated.multiply(Animated.multiply(near, lens), 0.14));
          const fringe = Animated.multiply(Animated.multiply(edge, lens), 0.42);
          const content = (tint: string, ghost: boolean) => (
            <>
              <NavIcon name={t.key} active={on} color={tint} size={24} />
              <Text
                selectable={false}
                maxFontSizeMultiplier={1.15}
                numberOfLines={1}
                style={[s.label, on && !ghost && { fontFamily: fonts.semibold }, { color: tint }]}
              >
                {t.label}
              </Text>
            </>
          );
          return (
            <Pressable
              key={t.key}
              accessibilityRole="tab"
              accessibilityLabel={t.badge ? `${t.label}, ${t.badge} sin leer` : t.label}
              accessibilityState={{ selected: t.key === active }}
              onPressIn={() => showLens(true)}
              onPressOut={() => showLens(false, 220)}
              onPress={() => i !== activeIdx && onChange(t.key)}
              style={s.tab}
            >
              <Animated.View style={{ alignItems: "center", transform: [{ scale: grow }] }}>
                {!reduced ? (
                  <>
                    <Animated.View pointerEvents="none" style={[s.ghost, { opacity: fringe, transform: [{ translateX: -1.1 }] }]}>
                      {content("#ff3d6e", true)}
                    </Animated.View>
                    <Animated.View pointerEvents="none" style={[s.ghost, { opacity: fringe, transform: [{ translateX: 1.1 }] }]}>
                      {content("#29d9ff", true)}
                    </Animated.View>
                  </>
                ) : null}
                <View style={{ alignItems: "center", gap: 3 }}>{content(color, false)}</View>
              </Animated.View>
              {t.badge ? <View style={s.badge} /> : null}
            </Pressable>
          );
        })}
        {/* Lupa de vidrio (como en iOS): ancha, casi transparente, con un filo fino de luz. Sin aro de colores: la
            dispersión aparece en el contenido que queda bajo sus bordes. */}
        {slot > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: PAD + slot / 2 - lensW / 2,
              top: -LENS_Y - 1,
              width: lensW,
              height: lensH,
              borderRadius: lensH * 0.46,
              opacity: lens,
              transform: [
                { translateX: x },
                { scaleX: Animated.multiply(stretch, lens.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] })) },
                { scaleY: lens.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) },
              ],
              shadowColor: "#000",
              shadowOpacity: dark ? 0.35 : 0.12,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
            }}
          >
            <Svg width={lensW} height={lensH}>
              <Defs>
                <LinearGradient id="lensFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#ffffff" stopOpacity={dark ? 0.07 : 0.32} />
                  <Stop offset="0.5" stopColor="#ffffff" stopOpacity={dark ? 0.015 : 0.08} />
                  <Stop offset="1" stopColor="#ffffff" stopOpacity={dark ? 0.05 : 0.22} />
                </LinearGradient>
                <LinearGradient id="lensRim" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#ffffff" stopOpacity={dark ? 0.75 : 0.95} />
                  <Stop offset="0.5" stopColor="#ffffff" stopOpacity={dark ? 0.28 : 0.55} />
                  <Stop offset="1" stopColor="#ffffff" stopOpacity={dark ? 0.6 : 0.9} />
                </LinearGradient>
              </Defs>
              <Rect x={0.75} y={0.75} width={lensW - 1.5} height={lensH - 1.5} rx={(lensH - 1.5) * 0.46} fill="url(#lensFill)" />
              <Rect x={0.75} y={0.75} width={lensW - 1.5} height={lensH - 1.5} rx={(lensH - 1.5) * 0.46} fill="none" stroke="url(#lensRim)" strokeWidth={1.3} />
              {!dark ? (
                <Rect x={0.75} y={0.75} width={lensW - 1.5} height={lensH - 1.5} rx={(lensH - 1.5) * 0.46} fill="none" stroke="#091426" strokeOpacity={0.1} strokeWidth={0.6} />
              ) : null}
            </Svg>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

const useS = makeStyles((c, scheme) => ({
  wrap: { position: "absolute", left: 14, right: 14, alignItems: "center" },
  bar: {
    width: "100%",
    maxWidth: 480,
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    padding: PAD,
    flexDirection: "row",
    backgroundColor: scheme === "dark" ? "rgba(28,30,40,0.88)" : "rgba(255,255,255,0.86)",
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: scheme === "dark" ? "rgba(255,255,255,0.14)" : "rgba(9,20,38,0.08)",
    shadowColor: "#000",
    shadowOpacity: scheme === "dark" ? 0.5 : 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    ...(Platform.OS === "web" ? ({ backdropFilter: "blur(20px) saturate(1.8)" } as object) : null),
  },
  sheen: {
    position: "absolute",
    top: 0,
    left: 28,
    right: 28,
    height: 1,
    backgroundColor: scheme === "dark" ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.95)",
  },
  pill: {
    position: "absolute",
    top: PAD,
    left: PAD,
    bottom: PAD,
    borderRadius: (HEIGHT - PAD * 2) / 2,
    backgroundColor: scheme === "dark" ? "rgba(255,255,255,0.1)" : alpha(c.secondary, 0.1),
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center" },
  ghost: { position: "absolute", top: 0, left: 0, right: 0, alignItems: "center", gap: 3 },
  label: { fontSize: 10.5, fontFamily: fonts.medium, color: c.ink, letterSpacing: -0.1, ...(Platform.OS === "web" ? ({ userSelect: "none" } as object) : null) },
  badge: {
    position: "absolute",
    top: 8,
    right: "26%",
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: c.secondary,
    borderWidth: 1.5,
    borderColor: alpha(c.card, 0.9),
  },
}));
