import { MotionPressable, Enter } from "./motion";
import React, { useState } from "react";
import { ActivityIndicator, StyleProp, Text, View, ViewStyle } from "react-native";
import { alpha, fonts, makeStyles, useTheme } from "../lib/theme";
import { IconChevron } from "./icons";

// Texto de ayuda compartido sobre las dos fechas de una señal o cotización.
export const DATE_HELP =
  "La fecha del dato es cuándo lo midió la fuente; la de consulta, cuándo Allocia lo pidió. Consultarlo hoy no hace que el dato sea de hoy.";

export const fmtDateTime = (value: string | null | undefined) => {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isFinite(t) ? new Date(t).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : null;
};

// Botón «?» que despliega un texto de ayuda breve. Área táctil ≥ 44 pt.
export function HelpTip({ text, label = "Ayuda" }: { text: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const u = useUi();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        hitSlop={8}
        style={u.helpButton}
      >
        <Text maxFontSizeMultiplier={1.5} style={u.helpButtonText}>?</Text>
      </MotionPressable>
      {open ? <Text style={[u.helpText, { flexBasis: "100%" }]}>{text}</Text> : null}
    </View>
  );
}

// Procedencia temporal de un dato: «Dato del …» y «Consultado el …», con ayuda opcional.
export function ProvenanceDates({
  dataDate,
  fetchedAt,
  help = true,
  prefix,
}: {
  dataDate?: string | null;
  fetchedAt?: string | null;
  help?: boolean;
  prefix?: string;
}) {
  const u = useUi();
  const data = fmtDateTime(dataDate);
  const fetched = fmtDateTime(fetchedAt);
  const dataLine = data ? `Dato del ${data}` : "Fecha del dato: no informada";
  return (
    <View style={u.provenance}>
      <View style={{ flex: 1 }}>
        <Text style={u.provenanceText}>
          {prefix ? `${prefix} · ` : ""}
          {dataLine}
          {fetched ? <Text> · Consultado el {fetched}</Text> : null}
        </Text>
      </View>
      {help ? <HelpTip text={DATE_HELP} label="Qué significan estas fechas" /> : null}
    </View>
  );
}

// Confirmación persistente: queda visible hasta que el usuario la cierre o haga otra acción.
export function PersistentNotice({
  message,
  detail,
  onClose,
}: {
  message: string;
  detail?: string;
  onClose: () => void;
}) {
  const u = useUi();
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={u.notice}>
      <View style={{ flex: 1 }}>
        <Text style={u.noticeTitle}>✓ {message}</Text>
        {detail ? <Text style={u.noticeDetail}>{detail}</Text> : null}
      </View>
      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar mensaje"
        onPress={onClose}
        hitSlop={6}
        style={u.noticeClose}
      >
        <Text maxFontSizeMultiplier={1.5} style={u.noticeCloseText}>✕</Text>
      </MotionPressable>
    </View>
  );
}

export function ScreenTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  const u = useUi();
  return (
    <View style={{ marginBottom: 2, flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Text accessibilityRole="header" style={u.title}>{title}</Text>
        {subtitle ? <Text style={u.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

/** Título de sección dentro de una pantalla, con una acción opcional a la derecha. */
export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  const u = useUi();
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginTop: 8 }}>
      <Text accessibilityRole="header" style={u.sectionTitle}>{children}</Text>
      {action}
    </View>
  );
}

export function Card({
  children,
  tone = "card",
  style,
}: {
  children: React.ReactNode;
  tone?: "card" | "low";
  style?: StyleProp<ViewStyle>;
}) {
  const u = useUi();
  return <Enter style={[u.card, tone === "low" && u.cardLow, style]}>{children}</Enter>;
}

export function Overline({ children }: { children: React.ReactNode }) {
  const u = useUi();
  return <Text style={u.overline}>{children}</Text>;
}

type BadgeTone = "neutral" | "brand" | "ok" | "warn" | "danger" | "solidDanger";
/** Etiqueta corta en forma de píldora (estado, prioridad, alcance). */
export function Badge({ label, tone = "neutral", icon }: { label: string; tone?: BadgeTone; icon?: React.ReactNode }) {
  const { c } = useTheme();
  const u = useUi();
  const map: Record<BadgeTone, [string, string]> = {
    neutral: [c.containerHigh, c.inkSoft],
    brand: [c.secondaryFixed, c.onSecondaryFixed],
    ok: [c.greenBg, c.green],
    warn: [c.amberBg, c.amber],
    danger: [c.redBg, c.red],
    solidDanger: [c.red, c.onRed],
  };
  const [bg, fg] = map[tone];
  return (
    <View style={[u.badge, { backgroundColor: bg }]}>
      {icon}
      <Text maxFontSizeMultiplier={1.4} style={[u.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

/** Recuadro de ícono de sección: vidrio claro con el ícono en violeta. */
export function IconTile({ children, size = 40 }: { children: React.ReactNode; size?: number }) {
  const u = useUi();
  return <View style={[u.iconTile, { width: size, height: size, borderRadius: size * 0.34 }]}>{children}</View>;
}

/** Desplegable con flecha que gira. */
export function Disclosure({
  title,
  meta,
  children,
  defaultOpen = false,
  framed = false,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  framed?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { c } = useTheme();
  const u = useUi();
  return (
    <View style={framed ? u.disclosureFrame : undefined}>
      <MotionPressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={[u.disclosureHead, framed && { paddingHorizontal: 14 }]}
      >
        <Text style={[u.disclosureTitle, framed && { color: c.ink }]}>
          {title}
          {meta ? <Text style={u.disclosureMeta}> · {meta}</Text> : null}
        </Text>
        <IconChevron up={open} size={18} color={framed ? c.inkSoft : c.secondary} />
      </MotionPressable>
      {open ? <Enter style={framed ? { paddingHorizontal: 14, paddingBottom: 14 } : undefined}>{children}</Enter> : null}
    </View>
  );
}

/** Control segmentado (pestañas internas). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { key: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const u = useUi();
  return (
    <View accessibilityRole="tablist" style={u.segmented}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <MotionPressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.key)}
            style={[u.segment, on && u.segmentOn]}
          >
            <Text maxFontSizeMultiplier={1.4} style={[u.segmentText, on && u.segmentTextOn]}>{o.label}</Text>
          </MotionPressable>
        );
      })}
    </View>
  );
}

export function Footer() {
  const u = useUi();
  return (
    <Text style={u.footer}>
      Prototipo académico Allocia (UADE · PFI 2026 · Rosso, Huentelaf). La información
      presentada no constituye asesoramiento financiero.
    </Text>
  );
}

export function LoadingState({ label = "Cargando información…" }: { label?: string }) {
  const { c } = useTheme();
  return (
    <View accessibilityLiveRegion="polite" accessibilityLabel={label} style={{ padding: 16, gap: 16, width: "100%" }}>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <ActivityIndicator color={c.secondary} />
        <Text style={{ fontSize: 16, color: c.inkSoft, flex: 1, fontFamily: fonts.regular }}>{label}</Text>
      </View>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ gap: 12 }}>
        {[0, 1].map((i) => (
          <View key={i} style={{ padding: 20, borderRadius: 18, backgroundColor: c.card, gap: 12, borderWidth: 1, borderColor: c.border }}>
            <View style={{ height: 18, width: "55%", backgroundColor: c.container, borderRadius: 6 }} />
            <View style={{ height: 30, width: "80%", backgroundColor: c.containerLow, borderRadius: 6 }} />
            <View style={{ height: 16, width: "65%", backgroundColor: c.containerLow, borderRadius: 6 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

type ButtonVariant = "primary" | "secondary" | "soft" | "danger";
export function ActionButton({
  label,
  onPress,
  disabled = false,
  secondary = false,
  variant,
  icon,
  small = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  variant?: ButtonVariant;
  icon?: (color: string) => React.ReactNode;
  small?: boolean;
}) {
  const { c, scheme } = useTheme();
  const v: ButtonVariant = variant ?? (secondary ? "secondary" : "primary");
  // Estilos de botón de iOS: «relleno» (principal), «gris» (secundario, sin borde), «tintado» (acento) y destructivo.
  const look: Record<ButtonVariant, { bg: string; fg: string }> = {
    primary: { bg: c.primary, fg: c.onPrimary },
    secondary: { bg: scheme === "dark" ? alpha("#ffffff", 0.1) : alpha("#767680", 0.12), fg: c.ink },
    soft: { bg: alpha(c.secondary, scheme === "dark" ? 0.22 : 0.12), fg: c.secondary },
    danger: { bg: c.red, fg: c.onRed },
  };
  const l = look[v];
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        minHeight: small ? 44 : 50,
        paddingHorizontal: small ? 14 : 18,
        paddingVertical: small ? 10 : 13,
        borderRadius: 999,
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: l.bg,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon ? icon(l.fg) : null}
      <Text style={{ fontSize: small ? 15 : 16, fontFamily: fonts.semibold, textAlign: "center", color: l.fg }}>{label}</Text>
    </MotionPressable>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { c } = useTheme();
  return (
    <View style={{ padding: 24, gap: 16 }}>
      <Text accessibilityRole="alert" style={{ fontSize: 17, color: c.ink, fontFamily: fonts.semibold }}>
        No pudimos actualizar la información
      </Text>
      <Text style={{ fontSize: 16, color: c.inkSoft, fontFamily: fonts.regular }}>Revisá tu conexión y volvé a intentar.</Text>
      <ActionButton label="Reintentar" onPress={onRetry} />
    </View>
  );
}

/** Pie de página común de las pantallas con desplazamiento (deja espacio para la barra flotante). */
export const SCREEN_BOTTOM_SPACE = 120;

export const useUi = makeStyles((c, scheme) => ({
  title: { fontSize: 28, fontFamily: fonts.bold, color: c.ink, letterSpacing: -0.6, lineHeight: 34 },
  subtitle: { fontSize: 15, fontFamily: fonts.regular, color: c.inkSoft, marginTop: 6, lineHeight: 22 },
  sectionTitle: { flex: 1, fontSize: 19, fontFamily: fonts.bold, color: c.ink, letterSpacing: -0.3 },
  card: {
    backgroundColor: c.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.border,
    padding: 18,
    shadowColor: c.glassShadow,
    shadowOpacity: scheme === "dark" ? 0.35 : 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  cardLow: { backgroundColor: c.containerLow, shadowOpacity: 0, elevation: 0 },
  overline: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    letterSpacing: 0.4,
    color: c.inkSoft,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, fontFamily: fonts.semibold },
  iconTile: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(c.secondary, scheme === "dark" ? 0.2 : 0.12),
    borderWidth: 1,
    borderColor: alpha(c.secondary, 0.18),
  },
  disclosureFrame: { borderWidth: 1, borderColor: c.border, borderRadius: 16, backgroundColor: c.card },
  disclosureHead: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  disclosureTitle: { flex: 1, fontSize: 15, fontFamily: fonts.semibold, color: c.secondary },
  disclosureMeta: { fontFamily: fonts.regular, color: c.inkSoft },
  segmented: {
    flexDirection: "row",
    backgroundColor: c.containerLow,
    borderRadius: 999,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: c.border,
  },
  segment: { flex: 1, minHeight: 42, borderRadius: 999, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  segmentOn: {
    backgroundColor: c.card,
    shadowColor: c.glassShadow,
    shadowOpacity: scheme === "dark" ? 0.4 : 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentText: { fontSize: 14.5, fontFamily: fonts.medium, color: c.inkSoft },
  segmentTextOn: { color: c.ink, fontFamily: fonts.semibold },
  footer: { fontSize: 12, fontFamily: fonts.regular, color: c.muted, lineHeight: 18, marginTop: 8, textAlign: "center", paddingHorizontal: 8 },
  helpButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  helpButtonText: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: c.secondary,
    color: c.secondary,
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    overflow: "hidden",
  },
  helpText: { fontSize: 13, fontFamily: fonts.regular, lineHeight: 19, color: c.inkSoft },
  provenance: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  provenanceText: { fontSize: 12.5, fontFamily: fonts.regular, lineHeight: 18, color: c.inkSoft },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: c.greenBg,
    borderColor: alpha(c.green, 0.4),
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 6,
  },
  noticeTitle: { fontSize: 15, fontFamily: fonts.semibold, color: c.green, lineHeight: 21 },
  noticeDetail: { fontSize: 13, fontFamily: fonts.regular, color: c.ink, lineHeight: 19, marginTop: 2 },
  noticeClose: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  noticeCloseText: { fontSize: 16, fontFamily: fonts.semibold, color: c.green },
}));
