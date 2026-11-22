import React, { useState } from "react";
import { Alert, Linking, Share, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ActionButton, Card, Footer, SCREEN_BOTTOM_SPACE, ScreenTitle } from "../components/ui";
import { IconChevron, IconDownload, IconExternal, IconLogout, IconMail, IconMoon, IconPhone, IconSun, IconUserX } from "../components/icons";
import { BrandMark } from "../components/BrandMark";
import { useAuth } from "../lib/auth";
import { alpha, fonts, makeStyles, useTheme } from "../lib/theme";
import {api} from '../lib/api';

const FUENTES = [
  { nombre: "Finnhub", uso: "Cotizaciones, noticias y fundamentales según cobertura habilitada", url: "https://finnhub.io/" },
  { nombre: "Datos proporcionados por CoinGecko", uso: "Precios e históricos cripto con fecha del proveedor", url: "https://www.coingecko.com/en/api" },
  { nombre: "FRED · Federal Reserve Bank of St. Louis", uso: "Series oficiales de tasas e inflación de EE. UU.; no datos en tiempo real", url: "https://fred.stlouisfed.org/" },
];

export default function AjustesScreen() {
  const { user, logout, deleteAccount } = useAuth();
  const { c, preference, setPreference } = useTheme();
  const s = useS();
  const initials = (user?.name ?? "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
  const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);
  const [emailBusy,setEmailBusy]=useState(false);
  const [exporting, setExporting] = useState(false);
  // Exportación existente (api.exportData + menú nativo de compartir); se reutiliza también
  // como paso previo a la eliminación de la cuenta.
  async function exportData() {
    if (exporting) return;
    setExporting(true);
    try {
      const data = await api.exportData();
      await Share.share({ title: 'Mis datos de Allocia', message: JSON.stringify(data, null, 2) });
    } catch (e) {
      Alert.alert('No se pudo exportar', e instanceof Error ? e.message : 'Intentá nuevamente.');
    } finally { setExporting(false); }
  }
  async function verifyEmail() {
    setEmailBusy(true);
    try {await api.requestVerification();Alert.alert('Verificación de correo','Si tu correo todavía no está confirmado, recibirás un enlace. Revisá también spam.');}
    catch(e) {Alert.alert('No se pudo solicitar el correo',e instanceof Error?e.message:'Intentá nuevamente.');}
    finally {setEmailBusy(false);}
  }

  function onLogout() {
    Alert.alert("Cerrar sesión", "¿Querés salir de tu cuenta? Tus posiciones y alertas se conservan para la próxima vez que ingreses.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cerrar sesión", onPress: () => logout().catch(()=>Alert.alert("No se pudo cerrar la sesión", "Reintentá cuando tengas conexión.")) },
    ]);
  }

  // Flujo de baja existente: confirmación con contraseña; sin cambios en la lógica.
  function onDeleteAccount() {
    Alert.alert("Eliminar cuenta", "¿Confirmás la eliminación definitiva de la cuenta y sus posiciones?",[{text:"Cancelar",style:"cancel"},{text:"Eliminar",style:"destructive",onPress:async()=>{setBusy(true);try{await deleteAccount(password);}catch{Alert.alert("No se pudo eliminar", "Verificá tu contraseña y conexión.");}finally{setBusy(false);}}}]);
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      <ScreenTitle title="Ajustes" subtitle="Tu cuenta, la apariencia de la app y las fuentes de datos." />

      {/* Cuenta */}
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.accountName}>{user?.name}</Text>
            <Text style={s.accountEmail}>{user?.email}</Text>
          </View>
        </View>
        <View style={s.list}>
          <Row icon={<IconMail size={19} color={c.secondary} />} label={emailBusy ? "Solicitando…" : "Confirmar mi correo"} onPress={verifyEmail} disabled={emailBusy} />
          <Row icon={<IconLogout size={19} color={c.secondary} />} label="Cerrar sesión" hint="Salís de tu cuenta en este teléfono. No borra tus datos." onPress={onLogout} />
        </View>
        <Text style={s.hint}>Cerrar sesión solo te saca de la app en este teléfono; tus datos quedan guardados.</Text>
      </Card>

      {/* Apariencia */}
      <Card>
        <Text style={s.cardTitle}>Apariencia</Text>
        <Text style={s.hint}>El tema oscuro usa el azul noche de Allocia. «Igual que el teléfono» sigue la configuración del sistema.</Text>
        <View accessibilityRole="radiogroup" style={s.themeRow}>
          {([
            { key: "system", label: "Igual que el teléfono", icon: (col: string) => <IconPhone size={22} color={col} /> },
            { key: "light", label: "Claro", icon: (col: string) => <IconSun size={22} color={col} /> },
            { key: "dark", label: "Oscuro", icon: (col: string) => <IconMoon size={21} color={col} /> },
          ] as const).map((o) => {
            const on = preference === o.key;
            return (
              <Pressable
                key={o.key}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => setPreference(o.key)}
                style={[s.themeOption, on && s.themeOptionOn]}
              >
                {o.icon(on ? c.secondary : c.inkSoft)}
                <Text style={[s.themeLabel, on && { color: c.ink, fontFamily: fonts.semibold }]}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Mis datos */}
      <Card>
        <Text style={s.cardTitle}>Mis datos</Text>
        <Text style={s.body}>Obtené una copia de tu cuenta y posiciones. El menú del teléfono te permite elegir dónde guardar o compartir el texto JSON.</Text>
        <View style={s.list}>
          <Row icon={<IconDownload size={19} color={c.secondary} />} label={exporting ? 'Preparando…' : 'Exportar mis datos'} onPress={exportData} disabled={exporting} />
        </View>
      </Card>

      {/* Producto */}
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <BrandMark height={22} />
          <Text style={s.productName}>Allocia</Text>
        </View>
        <Text style={s.productDesc}>
          Análisis de portafolios multiactivo con riesgo geopolítico y recomendaciones explicables
          mediante IA. Prototipo del Proyecto Final de Ingeniería (UADE, 2026).
        </Text>
        {[
          ["Versión", "0.2.0 · versión en validación"],
          ["Autores", "Huentelaf, Mauricio · Rosso, Máximo"],
          ["Cotizaciones", "Consultar fecha y fuente en cada informe"],
        ].map(([k, v]) => (
          <View key={k} style={s.metaRow}>
            <Text style={s.metaKey}>{k}</Text>
            <Text style={s.metaValue}>{v}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={s.cardTitle}>Fuentes de datos</Text>
        <View style={{ marginTop: 6 }}>
          {FUENTES.map((f, i) => (
            <Pressable key={i} accessibilityRole="link" onPress={()=>Linking.openURL(f.url).catch(()=>Alert.alert("No se pudo abrir la fuente"))} style={[s.sourceRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.fuenteNombre}>{f.nombre}</Text>
                <Text style={s.fuenteUso}>{f.uso}</Text>
              </View>
              <IconExternal size={16} color={c.secondary} />
            </Pressable>
          ))}
        </View>
      </Card>

      <Card tone="low">
        <Text style={s.cardTitle}>Aviso</Text>
        <Text style={s.aviso}>
          Las observaciones y recomendaciones generadas por el sistema tienen fines informativos y
          académicos. Cada salida expone la evidencia y las reglas que la originaron, y no
          constituye asesoramiento financiero ni una orden de operación.
        </Text>
      </Card>

      {/* Zona de riesgo: separada del resto y al final, para que no se confunda con cerrar sesión. */}
      <Card style={s.dangerCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={s.dangerBadge}><IconUserX size={22} color={c.red} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.dangerTitle}>Eliminar tu cuenta</Text>
            <Text style={s.hint}>Esta acción es distinta de cerrar sesión</Text>
          </View>
        </View>
        <Text style={s.body}>Borra tu cuenta, tus posiciones, alertas y dispositivos. No se puede deshacer.</Text>
        <View style={{ marginTop: 12 }}>
          <ActionButton small secondary disabled={exporting} label={exporting ? 'Preparando…' : 'Exportar mis datos antes de eliminar'} icon={(col) => <IconDownload size={17} color={col} />} onPress={exportData} />
        </View>
        <Text style={[s.hint,{marginTop:14}]}>Para confirmar, ingresá tu contraseña.</Text>
        <TextInput accessibilityLabel="Contraseña para eliminar cuenta" placeholder="Tu contraseña" placeholderTextColor={c.muted} secureTextEntry value={password} onChangeText={setPassword} style={s.input} />
        <View style={{ marginTop: 12 }}>
          <ActionButton variant="danger" disabled={busy||!password} label={busy?"Eliminando…":"Eliminar mi cuenta y datos"} onPress={onDeleteAccount} />
        </View>
      </Card>

      <Footer />
    </ScrollView>
  );
}

/** Fila de acción de una lista agrupada (ícono, texto y flecha). */
function Row({ icon, label, hint, onPress, disabled }: { icon: React.ReactNode; label: string; hint?: string; onPress: () => void; disabled?: boolean }) {
  const { c } = useTheme();
  const s = useS();
  return (
    <Pressable accessibilityRole="button" accessibilityHint={hint} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={[s.row, disabled && { opacity: 0.5 }]}>
      <View style={s.rowIcon}>{icon}</View>
      <Text style={s.rowLabel}>{label}</Text>
      <IconChevron right size={16} color={c.faint} />
    </Pressable>
  );
}

const useS = makeStyles((c) => ({
  scroll: { flex: 1, backgroundColor: c.bg },
  content: { padding: 16, gap: 14, paddingBottom: SCREEN_BOTTOM_SPACE },
  cardTitle: { fontSize: 17, fontFamily: fonts.bold, color: c.ink, letterSpacing: -0.2 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: c.secondaryFixed },
  avatarText: { fontSize: 18, fontFamily: fonts.bold, color: c.onSecondaryFixed },
  accountName: { fontSize: 18, fontFamily: fonts.bold, color: c.ink },
  accountEmail: { fontSize: 14, fontFamily: fonts.regular, color: c.inkSoft, marginTop: 2 },
  list: { marginTop: 14, borderRadius: 16, borderWidth: 1, borderColor: c.border, overflow: "hidden" },
  row: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, backgroundColor: c.card },
  rowIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: alpha(c.secondary, 0.1) },
  rowLabel: { flex: 1, fontSize: 15.5, fontFamily: fonts.medium, color: c.ink },
  body: { fontSize: 14.5, fontFamily: fonts.regular, color: c.inkSoft, lineHeight: 21, marginTop: 8 },
  hint: { fontSize: 13, fontFamily: fonts.regular, color: c.inkSoft, lineHeight: 18, marginTop: 8 },
  themeRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  themeOption: {
    flex: 1,
    minHeight: 86,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: c.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 6,
    backgroundColor: c.containerLow,
  },
  themeOptionOn: { borderColor: c.secondary, backgroundColor: alpha(c.secondary, 0.1) },
  themeLabel: { fontSize: 13, fontFamily: fonts.medium, color: c.inkSoft, textAlign: "center" },
  dangerCard: { borderColor: alpha(c.red, 0.45), borderWidth: 1.5 },
  dangerBadge: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: c.redBg },
  dangerTitle: { fontSize: 17, fontFamily: fonts.bold, color: c.red },
  input: { borderWidth: 1, borderColor: c.outlineVariant, borderRadius: 12, padding: 13, marginTop: 8, fontSize: 16, fontFamily: fonts.regular, color: c.ink, backgroundColor: c.card },
  productName: { fontSize: 20, fontFamily: fonts.bold, color: c.ink },
  productDesc: {
    fontSize: 13.5,
    fontFamily: fonts.regular,
    color: c.inkSoft,
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  metaKey: { fontSize: 13.5, fontFamily: fonts.regular, color: c.inkSoft },
  metaValue: { flexShrink: 1, textAlign: "right", fontSize: 13.5, fontFamily: fonts.medium, color: c.ink },
  sourceRow: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  fuenteNombre: { fontSize: 14.5, fontFamily: fonts.semibold, color: c.ink },
  fuenteUso: { fontSize: 12.5, fontFamily: fonts.regular, color: c.inkSoft, marginTop: 2, lineHeight: 17 },
  aviso: { fontSize: 13.5, fontFamily: fonts.regular, color: c.inkSoft, lineHeight: 19, marginTop: 8 },
}));
