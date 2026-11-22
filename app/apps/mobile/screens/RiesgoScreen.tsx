import { ProfileButton } from "../components/ProfileButton";
import { LoadingState, ErrorState, SCREEN_BOTTOM_SPACE, SectionTitle } from "../components/ui";
import { PortfolioChart } from "../components/insight-charts";
import { Card } from "../components/ui";
import { useForegroundRefresh } from "../lib/use-foreground-refresh";
import React, { useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { Analysis, ObservationsResponse, api } from "../lib/api";
import { ObservationCard, SCOPE_LABEL, SEVERITY_ORDER, ScopeBadge } from "../components/cards";
import { ConcentrationPlain } from "../components/AnalysisSummary";
import { Footer, ScreenTitle } from "../components/ui";
import { fonts, makeStyles, useTheme } from "../lib/theme";

// Pantalla "Riesgo": qué revisar en la cartera, con la concentración arriba y cada observación explicada
// (qué se detectó, la regla que la disparó y la evidencia con su fuente).
export default function RiesgoScreen() {
  const { c } = useTheme();
  const s = useS();
  const [analysis,setAnalysis] = useState<Analysis|null>(null);
  const [obs, setObs] = useState<ObservationsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = () => {
    setError(null);
    return Promise.all([api.observations(),api.analysis().catch(()=>null)])
      .then(([o,a])=>{setObs(o);setAnalysis(a);})
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
  }, []);

  useForegroundRefresh(load);

  if (error) return <ErrorState onRetry={() => { void load(); }}/>;
  if (!obs) return <LoadingState label="Cargando observaciones…"/>;

  const observaciones = [...obs.observaciones].sort(
    (a, b) => SEVERITY_ORDER[a.severidad] - SEVERITY_ORDER[b.severidad],
  );
  const counts = {
    alerta: observaciones.filter((o) => o.severidad === "alerta").length,
    atencion: observaciones.filter((o) => o.severidad === "atencion").length,
    info: observaciones.filter((o) => o.severidad === "info").length,
  };

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl
          tintColor={c.secondary}
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
    >
      <ScreenTitle right={<ProfileButton />}
        title="Qué revisar en tu cartera"
        subtitle="Los puntos que merecen atención, explicados a partir de tus activos. Abrí cada detalle para ver el motivo."
      />
      {analysis && analysis.positionCount>0 ? (
        <Card>
          <Text style={s.cardTitle}>Concentración de tu cartera</Text>
          <Text style={s.caption}>Cuánto depende tu cartera de pocos activos.</Text>
          <ConcentrationPlain concentration={analysis.concentration} positionCount={analysis.positionCount} />
        </Card>
      ) : null}
      {analysis && analysis.positionCount>0 ? <Card><PortfolioChart analysis={analysis}/></Card> : null}

      {observaciones.length > 0 ? (
        <>
          <SectionTitle>Observaciones</SectionTitle>
          <View style={s.summaryRow}>
            {[
              { n: counts.alerta, label: "Alta prioridad", color: c.red },
              { n: counts.atencion, label: "Moderadas", color: c.amberAccent },
              { n: counts.info, label: "Informativas", color: c.secondary },
            ].map((x) => (
              <View key={x.label} style={s.summaryCell} accessible accessibilityLabel={`${x.n} ${x.label}`}>
                <View style={[s.summaryDot, { backgroundColor: x.color }]} />
                <Text style={s.summaryN}>{x.n}</Text>
                <Text style={s.summaryLabel}>{x.label}</Text>
              </View>
            ))}
          </View>
          <View style={s.legend}>
            <Text style={s.legendTitle}>Cada observación indica su origen</Text>
            <View style={s.legendRow}><ScopeBadge scope="cartera" /><Text style={s.legendText}>{SCOPE_LABEL.cartera.help}</Text></View>
            <View style={s.legendRow}><ScopeBadge scope="externo" /><Text style={s.legendText}>{SCOPE_LABEL.externo.help}</Text></View>
          </View>
        </>
      ) : (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>Sin observaciones por ahora</Text>
          <Text style={s.emptyText}>
            Cargá activos en tu cartera y el motor de análisis va a generar observaciones
            explicables sobre concentración, exposición y contexto.
          </Text>
        </View>
      )}
      {observaciones.map((o) => (
        <ObservationCard key={o.id} obs={o} />
      ))}
      <Footer />
    </ScrollView>
  );
}

const useS = makeStyles((c) => ({
  scroll: { flex: 1, backgroundColor: c.bg },
  content: { padding: 16, gap: 14, paddingBottom: SCREEN_BOTTOM_SPACE },
  cardTitle: { fontSize: 17, fontFamily: fonts.bold, color: c.ink, letterSpacing: -0.2 },
  caption: { fontSize: 13.5, lineHeight: 19, fontFamily: fonts.regular, color: c.inkSoft, marginTop: 2 },
  summaryRow: { flexDirection: "row", gap: 8 },
  summaryCell: { flex: 1, padding: 12, borderRadius: 16, backgroundColor: c.card, borderWidth: 1, borderColor: c.border },
  summaryDot: { width: 8, height: 8, borderRadius: 4 },
  summaryN: { fontSize: 24, fontFamily: fonts.bold, color: c.ink, marginTop: 6, letterSpacing: -0.4 },
  summaryLabel: { fontSize: 12, fontFamily: fonts.regular, color: c.inkSoft },
  empty: {
    backgroundColor: c.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.border,
    padding: 22,
    alignItems: "center",
  },
  legend: { gap: 8, padding: 14, borderRadius: 16, backgroundColor: c.containerLow },
  legendTitle: { fontSize: 13.5, fontFamily: fonts.semibold, color: c.ink },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  legendText: { flex: 1, fontSize: 12.5, fontFamily: fonts.regular, lineHeight: 17, color: c.inkSoft },
  emptyTitle: { fontSize: 17, fontFamily: fonts.semibold, color: c.ink },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: c.inkSoft,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 6,
  },
}));
