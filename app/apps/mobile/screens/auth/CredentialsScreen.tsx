import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { useAuth } from "../../lib/auth";
import { fonts, makeStyles, useTheme } from "../../lib/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "../../components/BackNav";
import { BrandMark } from "../../components/BrandMark";
import { api } from '../../lib/api';

// Pantalla compartida de inicio de sesión y registro, según los wireframes
// "Iniciar sesión" y "Registro" del diseño de Allocia.
export default function CredentialsScreen({
  mode,
  onBack,
  onSwitch,
}: {
  mode: "login" | "register";
  onBack: () => void;
  onSwitch: () => void;
}) {
  const { login, register } = useAuth();
  const { c: colors } = useTheme();
  const s = useS();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [notice,setNotice]=useState('');
  async function recover() {
    if(!email.trim()) {setError('Ingresá tu email para recuperar el acceso.');return;}
    setBusy(true);setError(null);setNotice('');
    try {await api.forgotPassword(email.trim());setNotice('Si existe una cuenta con ese correo, recibirás un enlace. Revisá también spam.');}
    catch(e) {setError(e instanceof Error?e.message:'No se pudo solicitar el correo.');}
    finally {setBusy(false);}
  }
  async function openPrivacy() {
    const url=process.env.EXPO_PUBLIC_PRIVACY_URL;
    if(!url?.startsWith('https://')) {setError('La política de privacidad todavía no está disponible.');return;}
    try {await Linking.openURL(url);} catch {setError('No se pudo abrir la política de privacidad.');}
  }

  const isLogin = mode === "login";
  const canSubmit =
    email.trim().length > 3 && password.length >= (isLogin ? 1 : 12) &&
    (isLogin || (name.trim().length >= 2 && privacyAccepted));

  async function onSubmit() {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (isLogin) await login(email, password);
      else await register(name, email, password);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingTop: insets.top + 12 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.backRow}>
          <BackButton label="Inicio" onPress={onBack} />
        </View>

        <View style={s.brand}>
          <BrandMark height={30} />
        </View>
        <Text accessibilityRole="header" style={s.title}>{isLogin ? "Bienvenido de nuevo" : "Creá tu cuenta"}</Text>
        <Text style={s.subtitle}>
          {isLogin
            ? "Ingresá con tu email y contraseña para ver tu cartera."
            : "En menos de un minuto empezás a analizar tu portafolio."}
        </Text>

        {/* Campos agrupados en una sola tarjeta, como los formularios de iOS. */}
        <View style={s.group}>
          {!isLogin && (
            <View style={s.row}>
              <Text style={s.label}>Nombre</Text>
              <TextInput
                accessibilityLabel="Nombre"
                value={name}
                onChangeText={setName}
                placeholder="Tu nombre"
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
                autoComplete="name"
                style={s.input}
              />
            </View>
          )}
          <View style={[s.row, !isLogin && s.rowDivider]}>
            <Text style={s.label}>Email</Text>
            <TextInput
              accessibilityLabel="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              style={s.input}
            />
          </View>
          <View style={[s.row, s.rowDivider]}>
            <Text style={s.label}>Contraseña</Text>
            <TextInput
              accessibilityLabel="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder={isLogin ? "Tu contraseña" : "Mínimo 12 caracteres"}
              placeholderTextColor={colors.muted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={isLogin ? "current-password" : "new-password"}
              style={[s.input, { paddingRight: 44 }]}
            />
            <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} accessibilityState={{ selected: showPassword }} onPress={() => setShowPassword(v => !v)} style={s.eye}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.inkSoft} strokeWidth={1.8}>
                <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <Circle cx={12} cy={12} r={3} />
                {showPassword && <Path d="m3 3 18 18" />}
              </Svg>
            </Pressable>
          </View>
        </View>

        {!isLogin && (
          <View style={s.consentRow}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: privacyAccepted }}
              accessibilityLabel="Aceptar política de privacidad"
              onPress={() => setPrivacyAccepted((value) => !value)}
              style={[s.checkbox, privacyAccepted && s.checkboxChecked]}
            >
              <Text style={s.checkmark}>{privacyAccepted ? "✓" : ""}</Text>
            </Pressable>
            <Text style={s.consentText}>
              Acepto el tratamiento de mi cuenta y cartera según la{" "}
              <Text
                style={s.privacyLink}
                onPress={openPrivacy}
              >
                política de privacidad
              </Text>.
            </Text>
          </View>
        )}

        {error && <Text style={s.error}>{error}</Text>}
        {notice && <Text accessibilityLiveRegion="polite" style={s.subtitle}>{notice}</Text>}

        <Pressable
          accessibilityRole="button"
          onPress={onSubmit}
          disabled={!canSubmit || busy}
          style={[s.primary, (!canSubmit || busy) && { opacity: 0.4 }]}
        >
          <Text style={s.primaryText}>
            {busy ? "Un momento…" : isLogin ? "Iniciar sesión" : "Crear cuenta"}
          </Text>
        </Pressable>

        {isLogin && <Pressable disabled={busy} onPress={recover} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center" }}><Text style={[s.switchText, { color: colors.secondary, fontFamily: fonts.medium, marginTop: 14 }]}>Olvidé mi contraseña</Text></Pressable>}

        <Pressable onPress={onSwitch} hitSlop={8}>
          <Text style={s.switchText}>
            {isLogin ? (
              <>
                ¿No tenés cuenta? <Text style={s.switchLink}>Registrate</Text>
              </>
            ) : (
              <>
                ¿Ya tenés cuenta? <Text style={s.switchLink}>Iniciá sesión</Text>
              </>
            )}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useS = makeStyles((colors, scheme) => ({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, paddingBottom: 40, flexGrow: 1 },
  backRow: { marginTop: -6, marginBottom: 18 },
  brand: { marginBottom: 18 },
  title: { fontSize: 32, lineHeight: 38, fontFamily: fonts.bold, color: colors.ink, letterSpacing: -0.8 },
  subtitle: { fontSize: 15.5, fontFamily: fonts.regular, color: colors.inkSoft, marginTop: 8, marginBottom: 26, lineHeight: 22 },
  group: {
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: scheme === "dark" ? 1 : 0,
    borderColor: colors.border,
    shadowColor: "#091426",
    shadowOpacity: scheme === "dark" ? 0 : 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 16,
    overflow: "hidden",
  },
  row: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4, justifyContent: "center" },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.outlineVariant, marginLeft: 16, paddingLeft: 0 },
  label: { fontSize: 12.5, fontFamily: fonts.semibold, color: colors.inkSoft },
  input: { paddingVertical: 8, fontSize: 17, fontFamily: fonts.regular, color: colors.ink, minHeight: 40 },
  eye: { position: "absolute", right: 6, top: 0, bottom: 0, width: 44, alignItems: "center", justifyContent: "center" },
  consentRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14, paddingHorizontal: 4 },
  checkbox: { width: 24, height: 24, borderWidth: 1.5, borderColor: colors.outlineVariant, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  checkmark: { color: colors.onSecondary, fontFamily: fonts.bold },
  consentText: { flex: 1, color: colors.inkSoft, fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 19 },
  privacyLink: { color: colors.secondary, fontFamily: fonts.semibold },
  error: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.red,
    backgroundColor: colors.redBg,
    borderRadius: 14,
    padding: 12,
    marginBottom: 6,
    overflow: "hidden",
  },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    minHeight: 54,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  primaryText: { color: colors.onPrimary, fontSize: 17, fontFamily: fonts.semibold },
  switchText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.inkSoft,
    textAlign: "center",
    marginTop: 22,
  },
  switchLink: { color: colors.secondary, fontFamily: fonts.semibold },
}));
