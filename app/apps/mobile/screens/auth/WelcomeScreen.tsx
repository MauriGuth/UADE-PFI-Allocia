import React from "react";
import { StatusBar, Text, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandMark } from "../../components/BrandMark";
import { ActionButton } from "../../components/ui";
import { fonts, makeStyles, useTheme } from "../../lib/theme";

/** Brillo suave de la marca detrás del logo (el fondo es el del tema: claro u oscuro). */
function Glow() {
  const { c, scheme } = useTheme();
  return (
    <Svg style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%" preserveAspectRatio="none">
      <Defs>
        <RadialGradient id="welcomeGlow" cx="50%" cy="30%" rx="75%" ry="42%">
          <Stop offset="0" stopColor={c.secondary} stopOpacity={scheme === "dark" ? 0.28 : 0.16} />
          <Stop offset="0.6" stopColor={c.secondary} stopOpacity={scheme === "dark" ? 0.06 : 0.04} />
          <Stop offset="1" stopColor={c.secondary} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#welcomeGlow)" />
    </Svg>
  );
}

export default function WelcomeScreen({
  onLogin,
  onRegister,
}: {
  onLogin: () => void;
  onRegister: () => void;
}) {
  const s = useS();
  const { scheme } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.container, { paddingTop: insets.top, paddingBottom: Math.max(24, insets.bottom + 12) }]}>
      <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />
      <Glow />
      <View style={s.hero}>
        <BrandMark height={56} />
        <Text accessibilityRole="header" style={s.name}>Allocia</Text>
        <Text style={s.tagline}>Inteligencia para tu cartera</Text>
        <Text style={s.subtitle}>
          Entendé cómo está repartido tu dinero, con contexto de mercado y explicaciones que siempre muestran su fuente.
        </Text>
      </View>
      <View style={s.actions}>
        <ActionButton label="Crear cuenta" onPress={onRegister} />
        <ActionButton secondary label="Ya tengo cuenta" onPress={onLogin} />
        <Text style={s.footer}>Prototipo académico (UADE · PFI 2026). No constituye asesoramiento financiero.</Text>
      </View>
    </View>
  );
}

const useS = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.bg, paddingHorizontal: 24 },
  hero: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  name: { fontSize: 44, fontFamily: fonts.bold, color: c.ink, letterSpacing: -1.6, marginTop: 22 },
  tagline: { fontSize: 17, fontFamily: fonts.medium, color: c.secondary, marginTop: 2 },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: c.inkSoft,
    lineHeight: 23,
    textAlign: "center",
    marginTop: 18,
    maxWidth: 340,
  },
  actions: { gap: 12 },
  footer: { fontSize: 12, fontFamily: fonts.regular, color: c.muted, textAlign: "center", marginTop: 8, lineHeight: 17 },
}));
