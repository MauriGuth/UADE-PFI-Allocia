import { LoadingState, ErrorState, SCREEN_BOTTOM_SPACE, SectionTitle, IconTile, Badge, ScreenTitle } from "../components/ui";
import { ProfileButton } from "../components/ProfileButton";
import { useAuth } from "../lib/auth";
import { PortfolioChart } from "../components/insight-charts";
import { useForegroundRefresh } from "../lib/use-foreground-refresh";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";
import { Analysis, ObservationsResponse, SignalsSnapshot, api, fmtPct, fmtUsd } from "../lib/api";
import { Donut, DonutHolding, HBars } from "../components/charts";
import { ObservationCard, ScenarioTabs, SEVERITY_ORDER } from "../components/cards";
import { ConcentrationPlain } from "../components/AnalysisSummary";
import { Card, Footer, Overline, ProvenanceDates } from "../components/ui";
import { GlobeNews, IconArrowRight, NavIcon, NavIconName } from "../components/icons";
import { MotionPressable } from "../components/motion";
import { fonts, makeStyles, useTheme } from "../lib/theme";
import { eventDate, usableHeadline } from "../lib/news";

const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
/** Fondo de la tarjeta principal: navy profundo con un brillo índigo arriba a la derecha (igual en ambos temas). */
function HeroBackground() {
  const { c } = useTheme();
  return (
    <Svg style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="heroBase" x1="0" y1="0" x2="0.6" y2="1">
          <Stop offset="0" stopColor={c.heroTop} />
          <Stop offset="1" stopColor={c.heroBottom} />
        </LinearGradient>
        <RadialGradient id="heroGlow" cx="100%" cy="0%" rx="75%" ry="95%" fx="100%" fy="0%">
          <Stop offset="0" stopColor={c.heroGlow} stopOpacity={0.5} />
          <Stop offset="1" stopColor={c.heroGlow} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroBase)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroGlow)" />
    </Svg>
  );
}

export default function ResumenScreen({ onNavigate }: { onNavigate?: (tab: NavIconName) => void }) {
  const { c } = useTheme();
  const s = useS();
  const { user } = useAuth();
  const firstName = (user?.name ?? "").trim().split(/\s+/)[0] ?? "";
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [signals, setSignals] = useState<SignalsSnapshot | null>(null);
  const [obs, setObs] = useState<ObservationsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMetrics, setShowMetrics] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [a, s, o] = await Promise.all([api.analysis(), api.signals().catch(() => null), api.observations()]);
      setAnalysis(a);
      setSignals(s);
      setObs(o);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useForegroundRefresh(load);

  const groups = useMemo(() => {
    const by = (k: "assetClass" | "sector" | "region") =>
      (analysis?.positions ?? []).reduce<Record<string, DonutHolding[]>>((acc, p) => {
        (acc[p[k]] ??= []).push({ ticker: p.ticker, assetClass: p.assetClass, weight: p.weight });
        return acc;
      }, {});
    const details = (analysis?.positions ?? []).reduce<Record<string, { count: number; value: number }>>((acc, p) => {
      const d = (acc[p.assetClass] ??= { count: 0, value: 0 });
      d.count++;
      d.value += p.value;
      return acc;
    }, {});
    return { byClass: by("assetClass"), bySector: by("sector"), byRegion: by("region"), details };
  }, [analysis]);

  if (error) return <ErrorState onRetry={() => { void load(); }}/>;
  if (!analysis || !obs) return <LoadingState label="Cargando tu resumen…"/>;

  const conc = analysis.concentration;
  const geoEvento = signals?.geo.eventos[0];
  const headline = usableHeadline(geoEvento?.titulo);

  if (analysis.positionCount === 0) {
    return (
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { flexGrow: 1, justifyContent: "center" }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.secondary} />}
      >
        <View style={{ alignItems: "center", paddingHorizontal: 24, gap: 10 }}>
          <IconTile size={64}><NavIcon name="cartera" color={c.secondary} size={30} /></IconTile>
          <Text style={s.emptyTitle}>Tu cartera está vacía</Text>
          <Text style={s.emptyText}>
            Cargá tu primer activo desde la pestaña Cartera y Allocia va a calcular tu
            composición, exposiciones y observaciones al instante.
          </Text>
          {onNavigate ? (
            <MotionPressable accessibilityRole="button" onPress={() => onNavigate("cartera")} style={s.emptyButton}>
              <Text style={s.emptyButtonText}>Cargar mi primer activo</Text>
            </MotionPressable>
          ) : null}
        </View>
      </ScrollView>
    );
  }

  const observaciones = [...obs.observaciones].sort((a, b) => SEVERITY_ORDER[a.severidad] - SEVERITY_ORDER[b.severidad]);
  const metrics: { label: string; value: string; unit?: string; note?: string }[] = [
    { label: "Tamaño", value: String(analysis.positionCount), unit: analysis.positionCount === 1 ? "posición" : "posiciones" },
    { label: "Mayor posición", value: conc.topPosition?.ticker ?? "—", note: conc.topPosition ? `${fmtPct(conc.topPosition.weight)} del total` : undefined },
    { label: "3 mayores", value: fmtPct(conc.top3Weight), note: "del valor total" },
    { label: "Concentración", value: capitalize(conc.hhiLevel), note: `HHI ${conc.hhi}` },
  ];
  const assets = Object.fromEntries(analysis.positions.map((p) => [p.ticker, { name: p.name, assetClass: p.assetClass }]));

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.secondary} />}
    >
      <ScreenTitle title="Resumen" subtitle={firstName ? `Hola, ${firstName}. Así está tu cartera hoy.` : "Así está tu cartera hoy."} right={<ProfileButton />} />
      {/* Valor total: la cifra manda; debajo, las cuatro cifras que la explican (todas reales). */}
      <View style={s.hero} accessible accessibilityLabel={`Valor total de cartera: ${fmtUsd(analysis.totalValue)}`}>
        <HeroBackground />
        <Text style={s.heroLabel}>Valor total de cartera</Text>
        <Text style={s.heroValue} adjustsFontSizeToFit numberOfLines={1}>{fmtUsd(analysis.totalValue)}</Text>
        <View style={s.heroFresh}>
          <View style={s.heroDot} />
          <Text style={s.heroHint}>Precios de referencia · se actualiza al abrir la app</Text>
        </View>
        <View style={s.heroGrid}>
          {metrics.map((m) => (
            <View key={m.label} style={s.heroCell}>
              <Text style={s.heroCellLabel}>{m.label}</Text>
              <Text style={s.heroCellValue} numberOfLines={1}>
                {m.value}
                {m.unit ? <Text style={s.heroCellUnit}> {m.unit}</Text> : null}
              </Text>
              {m.note ? <Text style={s.heroCellNote}>{m.note}</Text> : null}
            </View>
          ))}
        </View>
      </View>

      {/* Contexto de mercado: titular más reciente o, si no hay uno utilizable, el índice GPR. */}
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <IconTile><GlobeNews size={20} color={c.secondary} /></IconTile>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Contexto de mercado</Text>
            <Text style={s.caption}>Externo a tu cartera</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 3 }}>
            <Text style={s.caption}>Riesgo geopolítico</Text>
            <Badge label={capitalize(signals?.geo.gprLevel ?? "No disponible")} tone={signals?.geo.gprLevel === "elevado" ? "warn" : "neutral"} />
          </View>
        </View>
        <View style={s.divider} />
        {headline ? (
          <>
            <Text style={s.headline}>{headline}</Text>
            {geoEvento?.medio || geoEvento?.traducido === false ? (
              <Text style={s.caption}>
                {[geoEvento?.medio ?? null, geoEvento?.traducido === false ? "texto original, sin traducir" : null].filter(Boolean).join(" · ")}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={s.headline}>
            {signals?.geo.gprIndex != null
              ? `Índice de riesgo geopolítico en ${signals.geo.gprIndex.toFixed(1)} · tendencia ${signals.geo.tendencia}`
              : "Contexto externo no disponible por ahora"}
          </Text>
        )}
        {signals ? (
          <ProvenanceDates
            dataDate={headline && geoEvento ? (eventDate(geoEvento.fuente) ?? signals.provenance?.geo?.dataDate) : signals.provenance?.geo?.dataDate}
            fetchedAt={signals.provenance?.geo?.fetchedAt ?? signals.snapshotDate}
          />
        ) : null}
        {onNavigate ? (
          <MotionPressable accessibilityRole="button" onPress={() => onNavigate("senales")} style={s.linkRow}>
            <Text style={s.link}>Ver señales</Text>
            <IconArrowRight size={16} color={c.secondary} />
          </MotionPressable>
        ) : null}
      </Card>

      {/* Composición */}
      <Card>
        <Text style={s.cardTitle}>Composición</Text>
        <Text style={[s.caption, { marginBottom: 14 }]}>Por tipo de activo · tocá un grupo para ver sus posiciones</Text>
        <Donut
          data={analysis.composition.byClass}
          useClassLabels
          total={analysis.positionCount}
          details={groups.details}
          holdings={groups.byClass}
        />
      </Card>

      <Card><PortfolioChart analysis={analysis} /></Card>

      {/* En pocas palabras + concentración explicada */}
      <Card>
        <Text style={s.cardTitle}>Tu cartera, en pocas palabras</Text>
        <View style={s.pairRow}>
          {conc.topPosition ? (
            <View style={s.pairCell}>
              <Text style={s.caption}>Mayor inversión</Text>
              <Text style={s.pairValue}>
                {conc.topPosition.ticker} <Text style={s.pairUnit}>{fmtPct(conc.topPosition.weight)}</Text>
              </Text>
            </View>
          ) : null}
          <View style={s.pairCell}>
            <Text style={s.caption}>{Math.min(3, analysis.positionCount)} mayores juntas</Text>
            <Text style={s.pairValue}>{fmtPct(conc.top3Weight)}</Text>
          </View>
        </View>
        <Text style={s.body}>
          {conc.topPosition ? `${conc.topPosition.ticker} es tu mayor inversión: representa ${fmtPct(conc.topPosition.weight)} del valor de tu cartera. ` : ''}
          Tus {Math.min(3, analysis.positionCount)} inversiones más grandes reúnen el {fmtPct(conc.top3Weight)} del total.
        </Text>
        <Text style={[s.body, { color: c.inkSoft }]}>
          Cuanto más dinero concentres en pocos activos, más depende tu cartera de lo que les pase. Esto no predice si vas a ganar o perder.
        </Text>
        <ConcentrationPlain concentration={conc} positionCount={analysis.positionCount} />
        <MotionPressable accessibilityRole="button" accessibilityState={{ expanded: showMetrics }} onPress={() => setShowMetrics(!showMetrics)} style={{ minHeight: 44, paddingTop: 12, justifyContent: 'center' }}>
          <Text style={s.link}>{showMetrics ? 'Ocultar detalle del cálculo' : 'Cómo se calcula la concentración (HHI)'}</Text>
        </MotionPressable>
        {showMetrics && <View style={{ gap: 8 }}>
          <Text style={s.caption}>HHI {conc.hhi} (nivel {conc.hhiLevel}): suma de los pesos de cada posición elevados al cuadrado. Aumenta cuando pocos activos reúnen una mayor parte del dinero; no mide todo el riesgo.</Text>
          <Text style={s.caption}>Posiciones efectivas: {conc.effectiveN.toLocaleString('es-AR', { maximumFractionDigits: 1 })} activos con igual peso equivaldrían a tu reparto actual. Es una medida del reparto del dinero, no la cantidad de activos que tenés ni una garantía de seguridad.</Text>
        </View>}
      </Card>

      {/* Distribución de activos */}
      <SectionTitle>Cómo está repartido tu dinero</SectionTitle>
      <Card>
        <Overline>Por sector</Overline>
        <View style={{ marginTop: 6, marginHorizontal: -8 }}>
          <HBars data={analysis.composition.bySector} max={5} holdings={groups.bySector} />
        </View>
      </Card>
      <Card>
        <Overline>Por región</Overline>
        <View style={{ marginTop: 6, marginHorizontal: -8 }}>
          <HBars data={analysis.composition.byRegion} max={4} holdings={groups.byRegion} />
        </View>
      </Card>

      {/* Observaciones destacadas */}
      <SectionTitle
        action={
          onNavigate ? (
            <MotionPressable accessibilityRole="button" onPress={() => onNavigate("riesgo")} style={s.linkRow}>
              <Text style={s.link}>Ver todas</Text>
              <IconArrowRight size={16} color={c.secondary} />
            </MotionPressable>
          ) : undefined
        }
      >
        Observaciones destacadas
      </SectionTitle>
      {observaciones.length === 0 ? (
        <Card tone="low"><Text style={s.caption}>Sin observaciones por ahora.</Text></Card>
      ) : (
        observaciones.slice(0, 3).map((o) => <ObservationCard key={o.id} obs={o} />)
      )}

      {/* Escenarios */}
      <SectionTitle>Escenarios con fuentes</SectionTitle>
      <Text style={[s.caption, { marginTop: -6 }]}>Posibles efectos de hechos documentados sobre tus activos. Sin porcentajes de rendimiento supuestos.</Text>
      <ScenarioTabs
        escenarios={obs.escenariosConFuentes}
        tickers={analysis.positions.map((p) => p.ticker)}
        assets={assets}
        onRequested={() => { void load(); }}
      />

      <Footer />
    </ScrollView>
  );
}

const useS = makeStyles((c) => ({
  scroll: { flex: 1, backgroundColor: c.bg },
  content: { padding: 16, gap: 14, paddingBottom: SCREEN_BOTTOM_SPACE },
  hero: { borderRadius: 22, overflow: "hidden", padding: 20, paddingTop: 18 },
  heroLabel: { fontSize: 12, fontFamily: fonts.semibold, letterSpacing: 1.2, color: "rgba(255,255,255,0.7)", textTransform: "uppercase" },
  heroValue: { fontSize: 40, lineHeight: 46, fontFamily: fonts.bold, color: "#ffffff", letterSpacing: -1.4, marginTop: 6, fontVariant: ["tabular-nums"] },
  heroFresh: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  heroHint: { flex: 1, fontSize: 13, fontFamily: fonts.regular, color: "rgba(255,255,255,0.75)" },
  heroGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  heroCell: { flexBasis: "47%", flexGrow: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "rgba(255,255,255,0.07)" },
  heroCellLabel: { fontSize: 12, fontFamily: fonts.regular, color: "rgba(255,255,255,0.65)" },
  heroCellValue: { fontSize: 19, lineHeight: 25, fontFamily: fonts.bold, color: "#ffffff", marginTop: 2, letterSpacing: -0.3 },
  heroCellUnit: { fontSize: 13, fontFamily: fonts.semibold, color: "rgba(255,255,255,0.7)" },
  heroCellNote: { fontSize: 12, fontFamily: fonts.regular, color: "rgba(255,255,255,0.6)", fontVariant: ["tabular-nums"] },
  cardTitle: { fontSize: 17, fontFamily: fonts.bold, color: c.ink, letterSpacing: -0.2 },
  caption: { fontSize: 13, lineHeight: 18, fontFamily: fonts.regular, color: c.inkSoft },
  body: { fontSize: 14.5, lineHeight: 21, fontFamily: fonts.regular, color: c.ink, marginTop: 10 },
  headline: { fontSize: 15.5, lineHeight: 22, fontFamily: fonts.semibold, color: c.ink },
  divider: { height: 1, backgroundColor: c.border, marginVertical: 14 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44, alignSelf: "flex-start" },
  link: { fontSize: 14.5, fontFamily: fonts.semibold, color: c.secondary },
  pairRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  pairCell: { flex: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: c.containerLow },
  pairValue: { fontSize: 22, lineHeight: 28, fontFamily: fonts.bold, color: c.ink, marginTop: 2, letterSpacing: -0.4 },
  pairUnit: { fontSize: 15, fontFamily: fonts.semibold, color: c.inkSoft },
  emptyTitle: { fontSize: 22, fontFamily: fonts.bold, color: c.ink, marginTop: 8 },
  emptyText: { fontSize: 15, fontFamily: fonts.regular, color: c.inkSoft, textAlign: "center", lineHeight: 22 },
  emptyButton: { marginTop: 8, minHeight: 50, paddingHorizontal: 24, borderRadius: 999, backgroundColor: c.primary, alignItems: "center", justifyContent: "center" },
  emptyButtonText: { fontSize: 16, fontFamily: fonts.semibold, color: c.onPrimary },
}));
