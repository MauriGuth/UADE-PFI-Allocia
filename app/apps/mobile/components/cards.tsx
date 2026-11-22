import React, { useEffect, useRef, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { Observation, EvidenceScenario, MarketStatus, api } from "../lib/api";
import { ActionButton, Badge, ProvenanceDates } from "./ui";
import { IconChevron, IconExternal } from "./icons";
import { AssetMark } from "./AssetLogo";
import { alpha, fonts, makeStyles, useTheme } from "../lib/theme";

// Origen de una observación: calculada solo con la cartera o combinada con una señal externa.
// Los ids/categorías provienen de apps/api/src/observations (concentración, diversificación,
// exposición, contexto, señales); la evidencia de tipo «señal externa» marca el contexto externo.
export type ObservationScope = "cartera" | "externo";
export function observationScope(obs: Pick<Observation, "categoria" | "evidencia">): ObservationScope {
  if (obs.categoria === "contexto" || obs.categoria === "señales") return "externo";
  if (obs.evidencia.some((e) => e.tipo === "señal externa")) return "externo";
  return "cartera";
}
export const SCOPE_LABEL: Record<ObservationScope, { label: string; fg: "ok" | "brand"; bg: "ok" | "brand"; help: string }> = {
  cartera: { label: "Sobre tu cartera", fg: "ok", bg: "ok", help: "Calculada solo con las posiciones que cargaste." },
  externo: { label: "Contexto externo", fg: "brand", bg: "brand", help: "Combina tu cartera con una señal externa (riesgo geopolítico, tasas, recesión, energía, sentimiento)." },
};
export function ScopeBadge({ scope }: { scope: ObservationScope }) {
  const sc = SCOPE_LABEL[scope];
  return (
    <View accessibilityLabel={`Origen: ${sc.label}`}>
      <Badge label={sc.label} tone={sc.bg} />
    </View>
  );
}

export const SEVERITY = {
  alerta: { label: "ALTA PRIORIDAD", tone: "solidDanger" },
  atencion: { label: "MODERADA", tone: "neutral" },
  info: { label: "INFO", tone: "brand" },
} as const;
export const SEVERITY_ORDER = { alerta: 0, atencion: 1, info: 2 } as const;

export const observationRule = (obs: Observation) => obs.evidencia.find((e) => e.tipo === "regla")?.valor ?? null;

// Tarjeta de observación explicable (igual que la web): qué se detectó (alcance, prioridad y título), por qué (la regla,
// siempre visible) y la evidencia con su fuente en un desplegable.
export function ObservationCard({ obs, logoTicker, logoAssetClass }: { obs: Observation; logoTicker?: string; logoAssetClass?: string }) {
  const [open, setOpen] = useState(false);
  const { c } = useTheme();
  const s = useS();
  const sev = SEVERITY[obs.severidad];
  const scope = observationScope(obs);
  const rule = observationRule(obs);
  return (
    <View style={s.obsCard}>
      <View style={s.obsTop}>
        <ScopeBadge scope={scope} />
        <Badge label={sev.label} tone={sev.tone} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 12 }}>
        {logoTicker ? <AssetMark ticker={logoTicker} assetClass={logoAssetClass} size={30} /> : null}
        <Text accessibilityRole="header" style={s.obsTitle}>{obs.titulo}</Text>
      </View>
      <Text style={s.obsMessage}>{obs.mensaje}</Text>
      {rule ? (
        <View style={s.ruleBox} accessible accessibilityLabel={`Regla aplicada: ${rule}`}>
          <View style={s.ruleBar} />
          <Text style={s.ruleLine}>
            <Text style={s.ruleKey}>Regla aplicada</Text> · {rule}
          </Text>
        </View>
      ) : null}
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={s.obsButton}>
        <Text style={s.obsButtonText}>
          {open ? "Ocultar evidencia" : "¿Por qué esta observación?"}
          {!open && obs.evidencia.length ? (
            <Text style={s.obsButtonMeta}> · {obs.evidencia.length} {obs.evidencia.length === 1 ? "dato" : "datos"}</Text>
          ) : null}
        </Text>
        <IconChevron up={open} size={18} color={c.secondary} />
      </Pressable>
      {open && (
        <View style={s.evidenceBox}>
          <Text style={s.evidenceHeading}>EVIDENCIA UTILIZADA</Text>
          {obs.evidencia.map((e, i) => (
            <View key={i} style={[s.evidenceRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.evidenceText}>
                  <Text style={s.evidenceTag}> {e.tipo} </Text> {e.descripcion}
                </Text>
                <Text style={s.evidenceSource}>Fuente: {e.fuente}</Text>
              </View>
              <Text style={s.evidenceValue}>{e.valor}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export const SCENARIO_EMPTY_TEXT =
  "Todavía no hay un informe reciente para este activo. Los escenarios se generan a partir de noticias y datos con fuente; sin evidencia suficiente, no se inventan.";

type RequestState = NonNullable<MarketStatus["analysisRequests"]>[number];
export const REQUEST_STATE_LABEL: Record<RequestState["state"], string> = {
  queued: "Pedido en cola",
  processing: "En proceso",
  ready: "Listo",
  failed: "No se pudo",
};

// Estado vacío explícito para escenarios/informes por activo, con el pedido de análisis en la
// misma pantalla. Usa api.requestAnalysis (o la función que se pase) y consulta
// api.marketStatus().analysisRequests para mostrar el estado del pedido.
export function ScenarioEmptyState({
  tickers = [],
  request = api.requestAnalysis,
  onRequested,
  compact = false,
}: {
  tickers?: string[];
  request?: () => Promise<{ queued: number; message: string }>;
  onRequested?: () => void;
  compact?: boolean;
}) {
  const { c } = useTheme();
  const s = useS();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [requests, setRequests] = useState<RequestState[] | null>(null);
  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickerKey = tickers.join(",");

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function poll(attempt = 0) {
    try {
      const status = await api.marketStatus();
      if (!mounted.current) return;
      const wanted = tickerKey ? tickerKey.split(",") : null;
      const list = (status.analysisRequests ?? []).filter((r) => !wanted || wanted.includes(r.ticker));
      setRequests(list);
      const pending = list.some((r) => r.state === "queued" || r.state === "processing");
      if (list.some((r) => r.state === "ready")) onRequested?.();
      if (pending && attempt < 12) timer.current = setTimeout(() => void poll(attempt + 1), 10_000);
    } catch {
      /* El estado es informativo; un fallo de consulta no invalida el pedido. */
    }
  }

  async function onRequest() {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await request();
      if (!mounted.current) return;
      setNotice(r.message || (r.queued > 0 ? "Pedido en cola." : "No había activos pendientes de analizar."));
      await poll();
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : "No se pudo solicitar el análisis.");
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  return (
    <View style={[s.emptyBox, compact && { padding: 14 }]}>
      <Text style={s.emptyTitle}>{tickers.length > 1 ? "Sin informes recientes" : "Sin informe reciente"}</Text>
      {tickers.length ? (
        <View style={s.tickerRow}>
          {tickers.slice(0, 14).map((t) => (
            <View key={t} style={s.tickerChip}>
              <Text style={s.tickerChipText}>{t}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <Text style={s.emptyText}>{SCENARIO_EMPTY_TEXT}</Text>
      <ActionButton disabled={busy} label={busy ? "Solicitando…" : "Solicitar análisis ahora"} onPress={() => void onRequest()} />
      {notice ? <Text accessibilityRole="alert" style={s.emptyText}>{notice}</Text> : null}
      {error ? <Text accessibilityRole="alert" style={[s.emptyText, { color: c.red }]}>{error}</Text> : null}
      {requests ? (
        requests.length ? (
          <View accessibilityLiveRegion="polite" style={{ gap: 4 }}>
            {requests.map((r) => (
              <Text key={r.ticker} style={s.emptyText}>
                <Text style={s.ruleKey}>{r.ticker}: </Text>
                {REQUEST_STATE_LABEL[r.state]}{r.message ? ` · ${r.message}` : ""}
              </Text>
            ))}
          </View>
        ) : (
          <Text style={s.emptyText}>Sin pedidos registrados para estos activos por ahora.</Text>
        )
      ) : null}
    </View>
  );
}

const DIRECTION = {
  up: { label: "Posible suba", tone: "ok" },
  down: { label: "Posible baja", tone: "danger" },
  neutral: { label: "Posible estabilidad", tone: "neutral" },
} as const;

/** Escenarios con fuentes agrupados por activo (como la web), con estado vacío para los activos sin informe. */
export function ScenarioTabs({
  escenarios = [],
  tickers = [],
  assets = {},
  onRequested,
}: {
  escenarios?: EvidenceScenario[];
  tickers?: string[];
  assets?: Record<string, { assetClass?: string; name?: string }>;
  onRequested?: () => void;
}) {
  const { c } = useTheme();
  const s = useS();
  const missing = tickers.filter((t) => !escenarios.some((e) => e.ticker === t));
  const groups = escenarios.reduce<Record<string, EvidenceScenario[]>>((acc, e) => ((acc[e.ticker] ??= []).push(e), acc), {});
  return (
    <View style={{ gap: 14 }}>
      {!escenarios.length ? <ScenarioEmptyState tickers={missing} onRequested={onRequested} /> : null}
      {Object.entries(groups).map(([ticker, list]) => (
        <View key={ticker} style={s.group}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <AssetMark ticker={ticker} assetClass={assets[ticker]?.assetClass} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={s.obsTitle}>{ticker}</Text>
              {assets[ticker]?.name ? <Text style={s.emptyText}>{assets[ticker]!.name}</Text> : null}
            </View>
          </View>
          {list.map((e) => (
            <View key={e.id} style={s.scenario}>
              <Badge label={DIRECTION[e.direction].label} tone={DIRECTION[e.direction].tone} />
              <View style={s.flow}>
                <Text style={s.flowKey}>Qué tendría que pasar</Text>
                <Text style={s.scenarioDesc}>{e.condition}</Text>
                <Text style={[s.flowKey, { marginTop: 8 }]}>Posible efecto</Text>
                <Text style={s.scenarioDesc}>{e.explanation}</Text>
              </View>
              <Text style={s.scenarioNote}>
                Análisis del {new Date(e.generatedAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}. Es una interpretación condicional, no un hecho futuro confirmado ni una probabilidad calculada.
              </Text>
              {e.sources.map((source) => (
                <View key={source.url}>
                  <Pressable accessibilityRole="link" onPress={() => Linking.openURL(source.url).catch(() => undefined)} style={s.sourceLink}>
                    <Text style={s.sourceText} numberOfLines={2}>{source.title}</Text>
                    <IconExternal size={15} color={c.secondary} />
                  </Pressable>
                  <ProvenanceDates dataDate={source.publishedAt} fetchedAt={e.generatedAt} help={false} />
                </View>
              ))}
              {e.limitations.length ? (
                <View style={{ gap: 2 }}>
                  {e.limitations.map((l, i) => (
                    <Text key={i} style={s.scenarioNote}>• {l}</Text>
                  ))}
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ))}
      {escenarios.length && missing.length ? <ScenarioEmptyState tickers={missing} onRequested={onRequested} compact /> : null}
    </View>
  );
}

const useS = makeStyles((c) => ({
  obsCard: {
    backgroundColor: c.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.border,
    padding: 18,
  },
  obsTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
  obsTitle: { flex: 1, fontSize: 17, fontFamily: fonts.bold, color: c.ink, lineHeight: 23, letterSpacing: -0.2 },
  obsMessage: { fontSize: 14.5, fontFamily: fonts.regular, lineHeight: 21, color: c.inkSoft, marginTop: 6 },
  ruleBox: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: alpha(c.containerLow, 0.8),
  },
  ruleBar: { width: 4, height: 15, borderRadius: 2, backgroundColor: c.secondary, marginTop: 2 },
  ruleLine: { flex: 1, fontSize: 13, fontFamily: fonts.regular, lineHeight: 19, color: c.inkSoft },
  ruleKey: { fontFamily: fonts.semibold, color: c.ink },
  obsButton: { marginTop: 8, minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  obsButtonText: { flex: 1, fontSize: 14.5, fontFamily: fonts.semibold, color: c.secondary },
  obsButtonMeta: { fontFamily: fonts.regular, color: c.inkSoft },
  evidenceBox: { borderRadius: 14, borderWidth: 1, borderColor: c.border, overflow: "hidden" },
  evidenceHeading: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    letterSpacing: 0.8,
    color: c.inkSoft,
    backgroundColor: c.containerLow,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  evidenceRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", paddingHorizontal: 14, paddingVertical: 10 },
  evidenceTag: { fontSize: 11.5, fontFamily: fonts.semibold, color: c.ink, backgroundColor: c.containerLow },
  evidenceText: { fontSize: 13, fontFamily: fonts.regular, lineHeight: 19, color: c.inkSoft },
  evidenceValue: { maxWidth: "42%", fontSize: 13, fontFamily: fonts.bold, color: c.ink, textAlign: "right", fontVariant: ["tabular-nums"] },
  evidenceSource: { color: c.muted, fontSize: 12, fontFamily: fonts.regular, marginTop: 2 },
  emptyBox: {
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: c.containerLow,
    borderWidth: 1,
    borderColor: c.border,
  },
  emptyTitle: { fontSize: 16, fontFamily: fonts.semibold, color: c.ink, lineHeight: 21 },
  emptyText: { fontSize: 14, fontFamily: fonts.regular, lineHeight: 20, color: c.inkSoft },
  tickerRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tickerChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: c.card, borderWidth: 1, borderColor: c.border },
  tickerChipText: { fontSize: 12.5, fontFamily: fonts.semibold, color: c.ink },
  group: { gap: 12, padding: 16, borderRadius: 20, backgroundColor: c.card, borderWidth: 1, borderColor: c.border },
  scenario: { gap: 10, padding: 14, borderRadius: 16, backgroundColor: c.containerLow },
  flow: { borderLeftWidth: 3, borderLeftColor: c.secondary, paddingLeft: 12 },
  flowKey: { fontSize: 12.5, fontFamily: fonts.semibold, color: c.ink },
  scenarioDesc: { fontSize: 14, fontFamily: fonts.regular, lineHeight: 20, color: c.inkSoft, marginTop: 2 },
  scenarioNote: { fontSize: 12, fontFamily: fonts.regular, lineHeight: 17, color: c.muted },
  sourceLink: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8 },
  sourceText: { flex: 1, fontSize: 14, fontFamily: fonts.semibold, color: c.secondary, textDecorationLine: "underline" },
}));
