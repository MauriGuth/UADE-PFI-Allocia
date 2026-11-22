import { ProfileButton } from "../components/ProfileButton";
import { LoadingState, ErrorState, SCREEN_BOTTOM_SPACE, IconTile, Badge, Disclosure } from "../components/ui";
import { IndexGauge, ShareRing } from "../components/insight-charts";
import { useForegroundRefresh } from "../lib/use-foreground-refresh";
import React, { useEffect, useState } from "react";
import { Image, Linking, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SignalsSnapshot, api } from "../lib/api";
import { Card, DATE_HELP, Footer, ProvenanceDates, ScreenTitle, fmtDateTime } from "../components/ui";
import { GlobeNews, IconExternal, NavIcon } from "../components/icons";
import { publisherOf } from "../lib/sources";
import { SOURCE_LOGOS } from "../lib/source-logos";
import { eventDate } from "../lib/news";
import { fonts, makeStyles, useTheme } from "../lib/theme";

const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const PLACEHOLDER = /traducción no disponible/i;

/** Recuadro del medio: su logo (archivo local), su monograma o, si no se sabe quién la publicó, el globo neutro. */
function PublisherMark({ id, monogram, name }: { id: string | null; monogram: string | null; name?: string }) {
  const { c } = useTheme();
  const s = useS();
  const logo = id ? SOURCE_LOGOS[id] : undefined;
  if (logo) {
    // Fondo blanco también en oscuro: los logos de los medios son oscuros y se perderían sobre el azul noche.
    const h = 18;
    return (
      <View accessible accessibilityLabel={name} style={s.publisherLogo}>
        <Image source={logo.image} style={{ height: h, width: Math.min(h * logo.ratio, 96) }} resizeMode="contain" />
      </View>
    );
  }
  return (
    <View style={s.publisher}>
      {monogram ? (
        <Text maxFontSizeMultiplier={1.2} style={[s.publisherText, monogram.length > 2 && { fontSize: 11 }]}>{monogram}</Text>
      ) : (
        <GlobeNews size={18} color={c.secondary} />
      )}
    </View>
  );
}

// Pantalla "Señales": contexto geopolítico, noticias con su medio y señales emergentes (igual que la web).
export default function SenalesScreen() {
  const { c } = useTheme();
  const s = useS();
  const [signals, setSignals] = useState<SignalsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = () => { setError(null); return api
      .signals()
      .then(setSignals)
      .catch((e) => setError(e.message)); };

  useEffect(() => {
    load();
  }, []);

  useForegroundRefresh(load);

  if (error) return <ErrorState onRetry={() => { void load(); }}/>;
  if (!signals) return <LoadingState label="Cargando señales…"/>;

  const prov: NonNullable<SignalsSnapshot["provenance"]> = signals.provenance ?? {};
  const consultado = (key: string) => prov[key]?.fetchedAt ?? signals.snapshotDate;
  const level = signals.geo.gprLevel;

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
        title="Señales de mercado"
        subtitle={`Contexto externo de tu cartera · consultado el ${fmtDateTime(signals.snapshotDate) ?? "fecha no informada"}`}
      />

      {/* Riesgo geopolítico: el índice (no se estima a partir de noticias) */}
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <IconTile><GlobeNews size={20} color={c.secondary} /></IconTile>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Contexto global y geopolítico</Text>
            <Text style={s.caption}>Índice GPR · no se estima a partir de noticias</Text>
          </View>
        </View>
        <View style={s.gprRow}>
          <Text style={s.gprValue}>{signals.geo.gprIndex ?? "—"}</Text>
          <View style={{ flex: 1, gap: 4 }}>
            <Badge label={`Nivel ${level}`} tone={level === "elevado" ? "warn" : "neutral"} />
            <Text style={s.caption}>Tendencia {signals.geo.tendencia}</Text>
          </View>
        </View>
        <ProvenanceDates prefix={prov.geo?.source ?? "Índice GPR"} dataDate={prov.geo?.dataDate} fetchedAt={consultado("geo")} />
      </Card>

      {/* Noticias: medio → titular → resumen → fechas → fuente original */}
      <Card>
        <Text style={s.cardTitle}>Noticias del contexto global</Text>
        <Text style={s.caption}>Titulares recientes con su medio. Si la traducción no está disponible, se muestra el texto original.</Text>
        <View style={{ marginTop: 10 }}>
          {signals.geo.eventos.length === 0 && <Text style={s.body}>No hay noticias recientes disponibles. Los indicadores se consultan por separado.</Text>}
          {signals.geo.eventos.map((e, i) => {
            const brand = publisherOf(e);
            const placeholder = PLACEHOLDER.test(e.titulo);
            const url = e.fuente.includes("https://") ? e.fuente.slice(e.fuente.indexOf("https://")).split(/\s/)[0] : null;
            return (
              <View key={i} style={[s.news, i > 0 && s.newsDivider]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <PublisherMark id={brand?.id ?? null} monogram={brand?.monogram ?? null} name={brand?.name} />
                  <Text style={s.medio} numberOfLines={1}>{brand ? brand.name : "Medio no identificado"}</Text>
                  {e.impacto && e.impacto !== "no evaluado" ? (
                    <Badge label={`Impacto ${e.impacto}`} tone={e.impacto === "alto" ? "danger" : e.impacto === "medio" ? "warn" : "neutral"} />
                  ) : null}
                </View>
                <Text style={s.newsTitle}>{placeholder ? "Titular disponible en la fuente original" : e.titulo}</Text>
                {!placeholder && e.descripcion ? <Text style={s.body} numberOfLines={4}>{e.descripcion}</Text> : null}
                {e.sectores.length > 0 && <Text style={s.meta}>Sectores: {e.sectores.join(', ')}</Text>}
                <ProvenanceDates dataDate={eventDate(e.fuente)} fetchedAt={consultado("geo")} help={false} />
                <View style={s.newsFoot}>
                  <Text style={s.meta}>{e.traducido === false || placeholder ? "Texto original, sin traducir" : "Traducción al español"}</Text>
                  {url ? (
                    <Pressable accessibilityRole="link" onPress={() => Linking.openURL(url).catch(() => undefined)} style={s.linkRow} hitSlop={6}>
                      <Text style={s.link}>Leer fuente original</Text>
                      <IconExternal size={15} color={c.secondary} />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Señales emergentes */}
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <IconTile><NavIcon name="senales" color={c.secondary} size={20} /></IconTile>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Señales emergentes</Text>
            <Text style={s.caption}>Sentimiento y estructura del mercado cripto</Text>
          </View>
        </View>
        <IndexGauge title="Sentimiento del mercado cripto" value={signals.emerging.fearGreedIndex} left="Miedo extremo" right="Codicia extrema" note={`Miedo y codicia · Alternative.me · ${signals.emerging.fearGreedLabel}. Es un índice de sentimiento, no una probabilidad de suba.`}/>
        <View style={s.divider} />
        <ShareRing title="Participación de Bitcoin" value={signals.emerging.btcDominance} note="Porcentaje de la capitalización total cripto que corresponde a Bitcoin. Fuente: CoinGecko. No mide la probabilidad de éxito."/>
        <View style={s.divider} />
        <View style={s.tvl}>
          <Text style={s.caption}>Valor bloqueado en DeFi</Text>
          <Text style={s.tvlValue}>
            {signals.emerging.defiTvlUsd == null ? 'No disponible' : `US$ ${(signals.emerging.defiTvlUsd / 1e9).toLocaleString('es-AR', { maximumFractionDigits: 1 })} mil millones`}
          </Text>
          <Text style={s.meta}>Fuente: DefiLlama</Text>
        </View>
        <Disclosure title="Fechas de cada dato">
          <ProvenanceDates prefix={prov.fearGreed?.source ?? "Miedo y codicia"} dataDate={prov.fearGreed?.dataDate} fetchedAt={consultado("fearGreed")} />
          <ProvenanceDates prefix={prov.btcDominance?.source ?? "Participación de Bitcoin"} dataDate={prov.btcDominance?.dataDate} fetchedAt={consultado("btcDominance")} help={false} />
          <ProvenanceDates prefix={prov.defi?.source ?? "DeFi"} dataDate={prov.defi?.dataDate} fetchedAt={consultado("defi")} help={false} />
        </Disclosure>
      </Card>

      <Card>
        <Text style={s.cardTitle}>Probabilidades implícitas del mercado</Text>
        <Text style={s.caption}>Precios de mercados de predicción. No son una predicción propia.</Text>
        <View style={{ gap: 4, marginTop: 8 }}>
          {signals.emerging.predictionMarkets.length === 0 && <Text style={s.body}>No hay mercados pertinentes con precios recientes disponibles.</Text>}
          {signals.emerging.predictionMarkets.map((p, i) => (
            <View key={i} style={i > 0 ? s.newsDivider : undefined}>
              <ShareRing title={p.pregunta + (p.traducido === false ? " (sin traducir)" : "")} value={typeof p.probabilidad === "number" ? p.probabilidad*100 : null} note="Precio del resultado expresado como probabilidad implícita. No es una certeza; puede cambiar."/>
              <Text style={s.meta}>Fuente: {p.fuente}</Text>
            </View>
          ))}
          {signals.emerging.predictionMarkets.length > 0 && (
            <ProvenanceDates prefix={prov.predictionMarkets?.source ?? "Mercados de predicción"} dataDate={prov.predictionMarkets?.dataDate} fetchedAt={consultado("predictionMarkets")} />
          )}
        </View>
      </Card>

      <Card tone="low">
        <Disclosure title="Fuentes y disponibilidad" meta={`${Object.keys(prov).length} fuentes`}>
          {Object.entries(prov).map(([key,p]) => <ProvenanceDates key={key} prefix={`${p.source} (${p.origin})`} dataDate={p.dataDate} fetchedAt={p.fetchedAt ?? signals.snapshotDate} help={false} />)}
          <Text style={[s.body, { marginTop: 10 }]}>{DATE_HELP}</Text>
          <Text style={s.body}>«—» indica un dato no disponible, no un valor cero. Los precios de mercados de predicción no son probabilidades calibradas. Origen de los datos: {signals.origen}.</Text>
        </Disclosure>
      </Card>
      <Footer />
    </ScrollView>
  );
}

const useS = makeStyles((c) => ({
  scroll: { flex: 1, backgroundColor: c.bg },
  content: { padding: 16, gap: 14, paddingBottom: SCREEN_BOTTOM_SPACE },
  cardTitle: { fontSize: 17, fontFamily: fonts.bold, color: c.ink, letterSpacing: -0.2 },
  caption: { fontSize: 13, lineHeight: 18, fontFamily: fonts.regular, color: c.inkSoft },
  body: { fontSize: 14, lineHeight: 20, fontFamily: fonts.regular, color: c.inkSoft },
  meta: { fontSize: 12.5, fontFamily: fonts.regular, color: c.muted },
  gprRow: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 14, marginBottom: 4 },
  gprValue: { fontSize: 40, fontFamily: fonts.bold, color: c.ink, letterSpacing: -1.2 },
  divider: { height: 1, backgroundColor: c.border, marginVertical: 10 },
  news: { gap: 6, paddingVertical: 14 },
  newsDivider: { borderTopWidth: 1, borderTopColor: c.border },
  publisher: {
    minWidth: 40,
    height: 30,
    paddingHorizontal: 6,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.containerLow,
    borderWidth: 1,
    borderColor: c.border,
  },
  publisherLogo: { height: 30, paddingHorizontal: 9, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff", borderWidth: 1, borderColor: c.border },
  publisherText: { fontSize: 12.5, fontFamily: fonts.bold, color: c.ink, letterSpacing: 0.2 },
  medio: { flex: 1, fontSize: 13.5, fontFamily: fonts.medium, color: c.inkSoft },
  newsTitle: { fontSize: 15.5, lineHeight: 22, fontFamily: fonts.bold, color: c.ink, marginTop: 4 },
  newsFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 40 },
  link: { fontSize: 14, fontFamily: fonts.semibold, color: c.secondary },
  tvl: { gap: 2, paddingVertical: 4 },
  tvlValue: { fontSize: 24, fontFamily: fonts.bold, color: c.ink, letterSpacing: -0.5 },
}));
