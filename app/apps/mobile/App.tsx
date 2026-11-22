import { LiquidTabBar, TabItem } from "./components/LiquidTabBar";
import { NavIconName } from "./components/icons";
import { Enter, MotionProvider, MotionPressable as Pressable } from "./components/motion";
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics, useSafeAreaInsets } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import * as SystemUI from "expo-system-ui";
import { useAlertView } from "./lib/alert-view";
import AlertasScreen from "./screens/AlertasScreen";
import React, { useEffect, useMemo, useState } from "react";
import { NavContext } from "./lib/nav";
import { StatusBar, Text, View } from "react-native";
import { EdgeSwipeBack, useHardwareBack } from "./components/BackNav";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { BiometricGate } from "./components/biometric-gate";
import { AuthProvider, useAuth } from "./lib/auth";
import WelcomeScreen from "./screens/auth/WelcomeScreen";
import CredentialsScreen from "./screens/auth/CredentialsScreen";
import ResumenScreen from "./screens/ResumenScreen";
import CarteraScreen from "./screens/CarteraScreen";
import RiesgoScreen from "./screens/RiesgoScreen";
import SenalesScreen from "./screens/SenalesScreen";
import AjustesScreen from "./screens/AjustesScreen";
import { ThemeProvider, fonts, useTheme } from "./lib/theme";

type Tab = NavIconName;

const TABS: TabItem[] = [
  { key: "resumen", label: "Resumen" },
  { key: "cartera", label: "Cartera" },
  { key: "riesgo", label: "Riesgo" },
  { key: "senales", label: "Señales" },
  { key: "alertas", label: "Alertas" },
  { key: "ajustes", label: "Ajustes" },
];

/** Ingreso o registro, con «volver» por gesto desde el borde y con el botón atrás de Android. */
function Credentials({ mode, onBack, onSwitch }: { mode: "login" | "register"; onBack: () => void; onSwitch: () => void }) {
  useHardwareBack(true, onBack);
  return (
    <EdgeSwipeBack onBack={onBack}>
      <CredentialsScreen mode={mode} onBack={onBack} onSwitch={onSwitch} />
    </EdgeSwipeBack>
  );
}

function AuthFlow() {
  const [screen, setScreen] = useState<"welcome" | "login" | "register">("welcome");
  if (screen === "welcome") {
    return (
      <WelcomeScreen
        onLogin={() => setScreen("login")}
        onRegister={() => setScreen("register")}
      />
    );
  }
  return <Credentials mode={screen} onBack={() => setScreen("welcome")} onSwitch={() => setScreen(screen === "login" ? "register" : "login")} />;
}

function MainTabs() {
  const { user } = useAuth();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [alertView,setAlertView] = useAlertView(String(user!.id));
  const [tab, setTab] = useState<Tab>("resumen");
  useEffect(()=>{
    Notifications.setNotificationHandler({handleNotification:async()=>({
      shouldShowBanner:true,shouldShowList:true,shouldPlaySound:true,shouldSetBadge:false,
    })});
    const handle=(response:Notifications.NotificationResponse|null)=>{if(response?.notification.request.content.data?.screen==='alerts'){setAlertView(response.notification.request.content.data.kind==='opportunity'?'opportunities':'portfolio');setTab('alertas');Notifications.clearLastNotificationResponse();}};
    handle(Notifications.getLastNotificationResponse());
    const subscription=Notifications.addNotificationResponseReceivedListener(handle);
    return ()=>{subscription.remove();Notifications.setNotificationHandler(null);};
  },[setAlertView]);
  const nav = useMemo(() => ({ go: setTab }), []);
  return (
    <NavContext.Provider value={nav}>
    <View style={{ flex: 1 }}>
      {/* Sin cabecera fija: cada pantalla abre con su título grande (estilo iOS). Solo se respeta la barra de estado. */}
      <View style={{ height: insets.top, backgroundColor: c.bg }} />
      <Enter key={tab} style={{ flex: 1 }}>
        {tab === "resumen" && <ResumenScreen onNavigate={setTab} />}
        {tab === "cartera" && <CarteraScreen />}
        {tab === "riesgo" && <RiesgoScreen />}
        {tab === "senales" && <SenalesScreen />}
        {tab === "alertas" && <AlertasScreen view={alertView} onViewChange={setAlertView} />}
        {tab === "ajustes" && <AjustesScreen />}
      </Enter>
      <LiquidTabBar tabs={TABS} active={tab} onChange={setTab} />
    </View>
    </NavContext.Provider>
  );
}

function Root() {
  const { user, ready, restoreError, retryRestore, forgetSession } = useAuth();
  const { c } = useTheme();
  if (!ready) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  if (restoreError) return <View style={{ flex: 1, padding: 28, justifyContent: 'center', gap: 20, backgroundColor: c.bg }}>
    <Text style={{ color: c.ink, fontSize: 24, fontFamily: fonts.bold }}>No pudimos conectar</Text>
    <Text accessibilityRole="alert" style={{ color: c.inkSoft, fontSize: 16, lineHeight: 23, fontFamily: fonts.regular }}>{restoreError}</Text>
    <Pressable accessibilityRole="button" onPress={() => { void retryRestore(); }} style={{ minHeight: 52, padding: 16, backgroundColor: c.primary, borderRadius: 999 }}><Text style={{ color: c.onPrimary, textAlign: 'center', fontFamily: fonts.semibold, fontSize: 16 }}>Reintentar</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={() => { void forgetSession(); }} style={{ minHeight: 48, padding: 16 }}><Text style={{ textAlign: 'center', color: c.secondary, fontFamily: fonts.semibold }}>Ingresar con otra cuenta</Text></Pressable>
  </View>;
  return user ? <BiometricGate><MainTabs key={user.id} /></BiometricGate> : <AuthFlow />;
}

function ThemedShell() {
  const { scheme, c } = useTheme();
  // Fondo nativo de la ventana con el color del tema (sin destellos blancos al abrir modales o el teclado en oscuro).
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(c.bg).catch(() => {});
  }, [c.bg]);
  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} backgroundColor={c.bg} />
      <MotionProvider><Root /></MotionProvider>
    </SafeAreaView>
  );
}

export default function App() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!loaded) return null;

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider>
        <AuthProvider>
          <ThemedShell />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
