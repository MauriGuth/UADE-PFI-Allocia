import React, { useEffect, useId, useRef, useState } from "react";
import { Animated, Easing, Image, Modal, Pressable, Text, View, useWindowDimensions } from "react-native";
import { api, CLASS_LABELS, fmtPct, fmtUsd } from "../lib/api";
import { alpha, fonts, makeStyles, useTheme } from "../lib/theme";
import { fmtDateTime } from "./ui";
import { IconClose } from "./icons";
import { useMotion } from "./motion";
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Stop } from "react-native-svg";
import { localLogoFor } from "../lib/asset-logos";

// Logos ya pedidos a la API (igual que la web): un logo encontrado se recuerda toda la sesión; «sin logo» (p. ej. los
// ETF), unos minutos; un error pasajero no se recuerda: se vuelve a pedir la próxima vez que aparece el activo.
const logoCache = new Map<string, { uri: string | null; until: number }>();
const pending = new Map<string, Promise<string | null>>();
const MISS_TTL = 5 * 60_000;
const cachedLogo = (ticker: string) => {
  const hit = logoCache.get(ticker);
  return hit && hit.until > Date.now() ? hit : null;
};
function loadLogo(ticker: string): Promise<string | null> {
  const hit = cachedLogo(ticker);
  if (hit) return Promise.resolve(hit.uri);
  let p = pending.get(ticker);
  if (!p) {
    p = api
      .assetLogo(ticker)
      .then((r) => {
        const uri = typeof r?.dataUri === "string" && r.dataUri.startsWith("data:image/") ? r.dataUri : null;
        logoCache.set(ticker, { uri, until: uri ? Number.POSITIVE_INFINITY : Date.now() + MISS_TTL });
        return uri;
      })
      .catch(() => null)
      .finally(() => pending.delete(ticker));
    pending.set(ticker, p);
  }
  return p;
}

/**
 * Logo del activo en un círculo. Orden (igual que la web): el logo que entrega la API (Finnhub / CoinGecko); si no hay,
 * un logo local verificado (Simple Icons); si tampoco, las iniciales sobre el color de su clase.
 */
export function AssetMark({ ticker, assetClass, size = 40 }: { ticker: string; assetClass?: string; size?: number }) {
  const { c, scheme } = useTheme();
  const [uri, setUri] = useState<string | null>(cachedLogo(ticker)?.uri ?? null);
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    let alive = true;
    setBroken(false);
    setUri(cachedLogo(ticker)?.uri ?? null);
    loadLogo(ticker).then((u) => alive && setUri(u));
    return () => {
      alive = false;
    };
  }, [ticker]);
  const local = localLogoFor(ticker, assetClass);
  const remote = uri && !broken ? uri : null;
  // Los íconos de Finnhub son cuadrados con su propio fondo: si el logo es (casi) cuadrado, llena todo el círculo
  // (como hace la web); si es apaisado (un wordmark), va contenido sobre blanco.
  const [square, setSquare] = useState(false);
  useEffect(() => {
    setSquare(false);
    if (!remote) return;
    let alive = true;
    Image.getSize(
      remote,
      (w, h) => alive && setSquare(h > 0 && w / h > 0.9 && w / h < 1.1),
      () => undefined,
    );
    return () => {
      alive = false;
    };
  }, [remote]);
  const tint =
    assetClass === "cripto" ? c.amberBg : assetClass === "etf" ? c.greenBg : assetClass === "stablecoin" ? c.containerHigh : c.secondaryFixed;
  const ink =
    assetClass === "cripto" ? c.amber : assetClass === "etf" ? c.green : assetClass === "stablecoin" ? c.inkSoft : c.onSecondaryFixed;
  const gid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const hasLogo = !!remote || !!local;
  const dark = scheme === "dark";
  // Burbuja de vidrio (como en la web): sombra suave abajo, filo de luz y un reflejo arriba a la izquierda.
  return (
    <View
      accessible={false}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        shadowColor: "#091426",
        shadowOpacity: dark ? 0.5 : 0.16,
        shadowRadius: size * 0.16,
        shadowOffset: { width: 0, height: size * 0.08 },
        elevation: 3,
        backgroundColor: hasLogo ? "#ffffff" : tint,
      }}
    >
      <View style={{ flex: 1, borderRadius: size / 2, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
        {remote ? (
          <Image
            source={{ uri: remote }}
            style={square ? { width: size, height: size } : { width: size * 0.68, height: size * 0.68 }}
            resizeMode={square ? "cover" : "contain"} onError={() => setBroken(true)} />
        ) : local ? (
          <Svg width={size * 0.54} height={size * 0.54} viewBox="0 0 24 24" accessible={false}>
            <Path d={local.path} fill={local.color} />
          </Svg>
        ) : (
          <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: fonts.bold, color: ink, fontSize: Math.max(8, size * (ticker.length >= 4 ? 0.24 : 0.3)) }}>
            {ticker.slice(0, ticker.length > 4 ? 3 : 4)}
          </Text>
        )}
        <Svg pointerEvents="none" style={{ position: "absolute", top: 0, left: 0 }} width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id={`gloss${gid}`} cx="32%" cy="18%" rx="62%" ry="46%">
              <Stop offset="0" stopColor="#ffffff" stopOpacity={hasLogo ? 0.55 : 0.6} />
              <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
            </RadialGradient>
            <LinearGradient id={`rim${gid}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#ffffff" stopOpacity={0.95} />
              <Stop offset="0.55" stopColor="#ffffff" stopOpacity={0.15} />
              <Stop offset="1" stopColor={dark ? "#ffffff" : "#091426"} stopOpacity={dark ? 0.25 : 0.12} />
            </LinearGradient>
          </Defs>
          <Ellipse cx={40} cy={26} rx={30} ry={18} fill={`url(#gloss${gid})`} />
          <Circle cx={50} cy={50} r={48.6} fill="none" stroke={`url(#rim${gid})`} strokeWidth={2.4} />
        </Svg>
      </View>
    </View>
  );
}

export interface BubblePosition {
  ticker: string;
  name: string;
  assetClass: string;
  currency: string;
  quantity: number;
  refPrice: number | null;
  value: number | null;
  weight: number | null;
  priceAsOf?: string;
  priceStatus?: "recent" | "reference" | "demo";
}

const fmtQty = (q: number) => q.toLocaleString("es-AR", { maximumFractionDigits: 8 });

/**
 * Logo que, al tocarlo, abre una burbuja de vidrio con el resumen de la posición (precio, peso, valor y cantidad).
 * La burbuja nace del logo y se cierra tocando afuera, con la cruz o con el botón «atrás». Solo usa datos de la cartera.
 */
export function AssetBubble({ position: p, size = 44 }: { position: BubblePosition; size?: number }) {
  const s = useS();
  const { c } = useTheme();
  const { reduced } = useMotion();
  const win = useWindowDimensions();
  const trigger = useRef<View | null>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const grow = useRef(new Animated.Value(0)).current;

  function open() {
    trigger.current?.measureInWindow((x, y, w, h) => {
      setAnchor({ x, y, w, h });
      grow.setValue(reduced ? 1 : 0);
      if (!reduced) Animated.spring(grow, { toValue: 1, stiffness: 340, damping: 24, useNativeDriver: true }).start();
    });
  }
  function close() {
    if (reduced) return setAnchor(null);
    Animated.timing(grow, { toValue: 0, duration: 150, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => setAnchor(null));
  }

  const width = Math.min(300, win.width - 32);
  const estH = 250;
  let left = 16,
    top = 0;
  if (anchor) {
    left = Math.min(Math.max(16, anchor.x), win.width - width - 16);
    const below = anchor.y + anchor.h + 10;
    top = below + estH < win.height - 100 ? below : Math.max(16, anchor.y - estH - 10);
  }
  const fromBelow = anchor ? top > anchor.y : true;
  const price =
    p.refPrice === null ? "No disponible" : `${p.refPrice.toLocaleString("es-AR", { maximumFractionDigits: p.refPrice < 1 ? 6 : 2 })} ${p.currency}`;
  const fresh =
    p.priceStatus === "demo" ? "Dato de demostración" : p.priceAsOf ? `Precio del ${fmtDateTime(p.priceAsOf)}` : "Sin fecha de precio informada";

  return (
    <>
      <Pressable
        ref={trigger}
        accessibilityRole="button"
        accessibilityLabel={`Resumen de ${p.ticker}`}
        onPress={open}
        hitSlop={4}
        style={({ pressed }) => ({ transform: [{ scale: pressed && !reduced ? 0.92 : 1 }] })}
      >
        <AssetMark ticker={p.ticker} assetClass={p.assetClass} size={size} />
      </Pressable>
      <Modal visible={!!anchor} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
        <Pressable accessibilityLabel="Cerrar resumen" style={{ flex: 1, backgroundColor: alpha("#000000", 0.08) }} onPress={close} />
        {anchor ? (
          <Animated.View
            accessibilityViewIsModal
            style={[
              s.bubble,
              {
                width,
                left,
                top,
                opacity: grow,
                transform: [
                  { translateY: grow.interpolate({ inputRange: [0, 1], outputRange: [fromBelow ? -14 : 14, 0] }) },
                  { scale: grow.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
                ],
              },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
              <AssetMark ticker={p.ticker} assetClass={p.assetClass} size={46} />
              <View style={{ flex: 1 }}>
                <Text accessibilityRole="header" style={s.ticker}>{p.ticker}</Text>
                <Text style={s.name} numberOfLines={2}>{p.name}</Text>
                <Text style={s.cls}>{CLASS_LABELS[p.assetClass] ?? p.assetClass}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar resumen" onPress={close} hitSlop={8} style={s.close}>
                <IconClose size={16} color={c.muted} />
              </Pressable>
            </View>
            <View style={s.grid}>
              {[
                ["Precio", price],
                ["Peso en cartera", p.weight === null ? "No disponible" : fmtPct(p.weight)],
                ["Valor de la posición", p.value === null ? "No disponible" : fmtUsd(p.value)],
                ["Cantidad", fmtQty(p.quantity)],
              ].map(([k, v]) => (
                <View key={k} style={s.cell}>
                  <Text style={s.cellLabel}>{k}</Text>
                  <Text style={s.cellValue}>{v}</Text>
                </View>
              ))}
            </View>
            <Text style={s.fresh}>{fresh}</Text>
          </Animated.View>
        ) : null}
      </Modal>
    </>
  );
}

const useS = makeStyles((c, scheme) => ({
  bubble: {
    position: "absolute",
    borderRadius: 26,
    padding: 16,
    backgroundColor: scheme === "dark" ? "rgba(26,36,62,0.97)" : "rgba(255,255,255,0.97)",
    borderWidth: 1,
    borderColor: c.glassBorder,
    shadowColor: c.glassShadow,
    shadowOpacity: scheme === "dark" ? 0.6 : 0.22,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 16,
  },
  ticker: { fontSize: 19, fontFamily: fonts.bold, color: c.ink, letterSpacing: -0.3 },
  name: { fontSize: 13.5, fontFamily: fonts.regular, color: c.inkSoft, lineHeight: 18 },
  cls: { fontSize: 12, fontFamily: fonts.regular, color: c.muted, marginTop: 1 },
  close: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", marginTop: -4, marginRight: -4 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 14, padding: 12, borderRadius: 16, backgroundColor: c.containerLow, rowGap: 10 },
  cell: { width: "50%", paddingRight: 8 },
  cellLabel: { fontSize: 12, fontFamily: fonts.regular, color: c.inkSoft },
  cellValue: { fontSize: 15, fontFamily: fonts.semibold, color: c.ink, fontVariant: ["tabular-nums"], marginTop: 1 },
  fresh: { fontSize: 12, fontFamily: fonts.regular, color: c.muted, marginTop: 8, paddingHorizontal: 4 },
}));

/** Compatibilidad: logo con el símbolo debajo (usado en listas compactas). */
export function AssetLogo({ ticker }: { ticker: string }) {
  const { c } = useTheme();
  return (
    <View style={{ width: 58, alignItems: "center", gap: 5, marginRight: 10 }}>
      <AssetMark ticker={ticker} />
      <Text style={{ fontFamily: fonts.semibold, fontSize: 10, color: c.ink }} numberOfLines={1}>{ticker}</Text>
    </View>
  );
}
