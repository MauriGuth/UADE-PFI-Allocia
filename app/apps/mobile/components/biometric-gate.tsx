import React, { useEffect, useRef, useState } from 'react';
import { AppState, Platform, Pressable, Text, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../lib/auth';
import { fonts, useTheme } from '../lib/theme';

/** Password login unlocks once; restored sessions and every background return lock. */
export function BiometricGate({ children }: { children: React.ReactNode }) {
  const { restored, forgetSession } = useAuth();
  const { c: colors } = useTheme();
  const [locked, setLocked] = useState(restored);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Desbloqueá para ver tu cartera.');
  const [label, setLabel] = useState('Desbloquear con biometría');
  const inFlight = useRef(false);
  const generation = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener('change', state => {
      setForeground(state === 'active');
      if (state === 'background') {
        generation.current++;
        setLocked(true);
      }
    });
    // Android notification shade can blur without changing AppState.
    const blur = Platform.OS === 'android' ? AppState.addEventListener('blur', () => { setForeground(false); setLocked(true); }) : null;
    const focus = Platform.OS === 'android' ? AppState.addEventListener('focus', () => setForeground(true)) : null;
    void LocalAuthentication.supportedAuthenticationTypesAsync().then(types => {
      if (!mounted.current) return;
      setLabel(Platform.OS === 'ios' && types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
        ? 'Desbloquear con Face ID' : types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
          ? 'Desbloquear con huella' : 'Desbloquear con biometría');
    }).catch(() => {});
    return () => { mounted.current = false; generation.current++; subscription.remove(); blur?.remove(); focus?.remove(); };
  }, []);

  async function unlock() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    const attempt = generation.current;
    try {
      if (!(await LocalAuthentication.hasHardwareAsync()) || !(await LocalAuthentication.isEnrolledAsync())) {
        setMessage('Configurá Face ID o huella en los ajustes del teléfono, o ingresá de nuevo con tu contraseña.');
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquear Allocia', cancelLabel: 'Cancelar',
        disableDeviceFallback: true, fallbackLabel: '', biometricsSecurityLevel: 'strong',
      });
      if (!mounted.current || attempt !== generation.current) return;
      if (result.success) setLocked(false);
      else setMessage('La app sigue bloqueada. Reintentá o ingresá con tu contraseña.');
    } catch {
      if (mounted.current) setMessage('No se pudo usar la biometría. Reintentá o ingresá con tu contraseña.');
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  if (!locked && foreground) return <>{children}</>;
  return <View style={{ flex: 1, justifyContent: 'center', padding: 28, backgroundColor: colors.bg, gap: 20 }}>
    <Text style={{ fontFamily: fonts.bold, fontSize: 28, color: colors.ink }}>Allocia bloqueada</Text>
    <Text accessibilityLiveRegion="polite" style={{ color: colors.inkSoft, fontSize: 16 }}>{message}</Text>
    <Pressable accessibilityRole="button" disabled={busy || !foreground} onPress={unlock} style={{ minHeight: 52, padding: 16, borderRadius: 999, backgroundColor: colors.primary, opacity: busy ? 0.5 : 1 }}>
      <Text style={{ color: colors.onPrimary, textAlign: 'center', fontFamily: fonts.semibold }}>{busy ? 'Verificando…' : label}</Text>
    </Pressable>
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => { void forgetSession().catch(() => setMessage('No se pudo cerrar la sesión local. Reintentá.')); }} style={{ minHeight: 48, padding: 14 }}>
      <Text style={{ textAlign: 'center', color: colors.secondary }}>Ingresar con contraseña</Text>
    </Pressable>
  </View>;
}
