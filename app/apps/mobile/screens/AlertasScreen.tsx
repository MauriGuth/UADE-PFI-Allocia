import { ProfileButton } from "../components/ProfileButton";
import { AlertView } from "../lib/alert-view";
import { Opportunities } from "../components/Opportunities";
import { AnalysisSummary } from "../components/AnalysisSummary";
import { ReportChart } from "../components/insight-charts";
import { MotionPressable as Pressable, useMotion } from "../components/motion";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, Platform, RefreshControl, ScrollView, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { api, MarketReport, MarketStatus } from '../lib/api';
import { ScenarioEmptyState } from '../components/cards';
import { AssetMark } from '../components/AssetLogo';
import { REPORT_STATE_LABEL, reportState } from '../lib/report-state';
import { BackButton, EdgeSwipeBack, useHardwareBack } from '../components/BackNav';
import { ActionButton, Badge, Card, Disclosure, IconTile, LoadingState, ProvenanceDates, SCREEN_BOTTOM_SPACE, ScreenTitle, SectionTitle, Segmented, fmtDateTime } from '../components/ui';
import { IconCheck, IconChevron, IconExternal, IconInfo, IconSpark } from '../components/icons';
import { alpha, fonts, makeStyles, useTheme } from '../lib/theme';

type Card = MarketReport & { alertId: string | null };
const DIRECTION = { up: { label: 'Posible suba', tone: 'ok' }, down: { label: 'Posible baja', tone: 'danger' }, neutral: { label: 'Escenario neutral', tone: 'neutral' } } as const;

/** Hora corta para la bandeja: hoy → «14:05»; otro día → «22/11». */
function listTime(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  const today = new Date();
  return d.toDateString() === today.toDateString()
    ? d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

/** Detalle de un análisis: encabezado, resumen, escenarios (o la abstención), y fuentes/limitaciones/informe completo. */
function ReportDetail({ r, onBack, onRead, reading, onError, refreshQuietly, onRetry, retrying }: { r: Card; onBack: () => void; onRead: () => void; reading: boolean; onError: (m: string) => void; refreshQuietly: () => void; onRetry: () => void; retrying: boolean }) {
  const { c } = useTheme();
  const s = useS();
  const st = reportState(r);
  const insufficient = st.kind === 'abstained';
  const failed = st.kind === 'failed' ? st : null;
  const sources = r.payload.snapshot.sources;
  // Títulos en español cuando el análisis los tradujo; si no, el original.
  const titleOf = (id: string) => r.payload.report.sourceTitles?.find((t) => t.sourceId === id)?.title ?? sources.find((x) => x.id === id)?.title;
  const limits = r.payload.report.limitations;
  return (
    <View style={{ gap: 14 }}>
      <View style={{ marginTop: -8, marginBottom: -6 }}>
        <BackButton label="Alertas" onPress={onBack} />
      </View>
      <View style={s.detailCard}>
        <View style={s.detailHead}>
          <AssetMark ticker={r.ticker} size={56} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text accessibilityRole="header" style={s.detailTitle}>
              {r.ticker} <Text style={s.detailRegion}>· {r.region}</Text>
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {failed
                ? <Badge tone="danger" label="Análisis no completado" icon={<IconInfo size={13} color={c.red} />} />
                : insufficient
                ? <Badge tone="warn" label="Evidencia insuficiente" icon={<IconInfo size={13} color={c.amber} />} />
                : <Badge tone="ok" label="Análisis de escenarios" icon={<IconCheck size={13} color={c.green} />} />}
              {r.alertId ? <Badge tone="brand" label="Nuevo" /> : null}
            </View>
            <Text style={s.caption}>Generado {fmtDateTime(r.createdAt) ?? r.createdAt}</Text>
          </View>
        </View>
        {r.alertId ? (
          <View style={{ marginTop: 12 }}>
            <ActionButton small secondary disabled={reading} label={reading ? 'Guardando…' : 'Marcar como leído'} icon={(col) => <IconCheck size={17} color={col} />} onPress={onRead} />
          </View>
        ) : null}
        <View style={s.rule} />
        {!failed ? <AnalysisSummary text={r.payload.report.summary} /> : null}
        {/* Falla: el análisis no se completó (no es lo mismo que «no hubo evidencia»). Se muestra el motivo real. */}
        {failed ? (
          <View accessibilityRole="alert" style={[s.abstain, { borderColor: alpha(c.red, 0.3), backgroundColor: alpha(c.redBg, 0.6) }]}>
            <View style={[s.failIcon]}><IconInfo size={19} color={c.red} /></View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={s.abstainTitle}>No se pudo completar este análisis</Text>
              <Text style={s.body}>{failed.reason}</Text>
              <Text style={s.caption}>Las {sources.length} fuentes consultadas y el precio siguen disponibles abajo. No se muestran escenarios sin un análisis validado.</Text>
              <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                <ActionButton small secondary disabled={retrying} label={retrying ? 'Solicitando…' : 'Volver a intentar ahora'} onPress={onRetry} />
              </View>
            </View>
          </View>
        ) : null}
        {/* Abstención: es un resultado válido (no inventa escenarios sin evidencia), no un error. */}
        {insufficient ? (
          <View style={s.abstain}>
            <IconTile size={40}><IconInfo size={19} color={c.secondary} /></IconTile>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={s.abstainTitle}>Allocia se abstuvo de proponer escenarios</Text>
              <Text style={s.body}>Los escenarios se generan solo a partir de noticias y datos con fuente. Esta vez la evidencia no alcanzó, así que no se inventa ninguno.</Text>
              <Text style={s.caption}>
                {sources.length} {sources.length === 1 ? 'fuente consultada' : 'fuentes consultadas'} · {limits.length} {limits.length === 1 ? 'limitación' : 'limitaciones'} · detalle abajo
              </Text>
            </View>
          </View>
        ) : failed ? null : (
          <Text style={[s.body, { marginTop: 12 }]}>Los escenarios son posibilidades, no resultados asegurados. Revisá las limitaciones y fuentes antes de decidir.</Text>
        )}
        <ReportChart research={r.payload.snapshot.research} />
        {r.payload.report.scenarios.length > 0 ? (
          <View style={{ gap: 10, marginTop: 12 }}>
            {r.payload.report.scenarios.map((sc, i) => (
              <View key={i} style={[s.scenario, { backgroundColor: sc.direction === 'up' ? alpha(c.greenBg, 0.6) : sc.direction === 'down' ? alpha(c.redBg, 0.5) : c.containerLow }]}>
                <Badge tone={DIRECTION[sc.direction].tone} label={DIRECTION[sc.direction].label} />
                <Text style={s.scenarioText}><Text style={s.strong}>Si ocurre: </Text>{sc.condition}</Text>
                <Text style={s.scenarioText}><Text style={s.strong}>Posible efecto: </Text>{sc.explanation}</Text>
                <Text style={s.caption}>Fuentes: {sc.sourceIds.map(titleOf).filter(Boolean).join(' · ')}</Text>
              </View>
            ))}
          </View>
        ) : st.kind === 'analysis' ? (
          <View style={{ marginTop: 12 }}>
            <ScenarioEmptyState tickers={[r.ticker]} onRequested={refreshQuietly} compact />
          </View>
        ) : null}
        <View style={{ marginTop: 14 }}>
          <Disclosure framed title="Ver fuentes y limitaciones" meta={`${sources.length} ${sources.length === 1 ? 'fuente' : 'fuentes'}`}>
            <View style={{ gap: 14 }}>
              {r.payload.snapshot.quote ? (
                <View>
                  <Text style={s.body}>
                    Precio usado en este análisis: {r.payload.snapshot.quote.price.toLocaleString('es-AR', { maximumFractionDigits: 8 })} {r.payload.snapshot.quote.currency} · {r.payload.snapshot.quote.source}. Para consultar la cotización más reciente, abrí Cartera.
                  </Text>
                  <ProvenanceDates prefix="Precio" dataDate={r.payload.snapshot.quote.asOf} fetchedAt={r.createdAt} />
                </View>
              ) : null}
              {r.payload.masterSections ? (
                <Disclosure title="Informe completo" meta={`${r.payload.masterSections.length} secciones`}>
                  <View style={{ gap: 2 }}>
                    {r.payload.masterSections.map((sec, i) => (
                      <View key={sec.section} style={[s.section, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
                        <View style={s.sectionHead}>
                          <View style={s.sectionNum}><Text style={s.sectionNumText}>{i + 1}</Text></View>
                          <Text style={s.sectionTitle}>{sec.section.replace(/^\d+\.\s*/, '')}</Text>
                        </View>
                        <Text style={s.sectionText}>{sec.detail}</Text>
                      </View>
                    ))}
                  </View>
                </Disclosure>
              ) : null}
              {r.payload.snapshot.research ? (
                <Disclosure title="Indicadores y datos de respaldo">
                  <View style={{ gap: 8 }}>
                    <Text style={s.caption}>{r.payload.snapshot.research.technical.asOf ? 'Serie diaria hasta ' + new Date(r.payload.snapshot.research.technical.asOf).toLocaleDateString('es-AR') : 'Históricos no disponibles con el acceso actual; no se estiman indicadores.'}</Text>
                    <View style={s.table}>
                      {[...Object.entries(r.payload.snapshot.research.technical.values).filter(([, v]) => v !== null), ...Object.entries(r.payload.snapshot.research.fundamentals.metrics)].map(([k, v], i) => (
                        <View key={k} style={[s.tableRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
                          <Text style={s.tableKey}>{k}</Text>
                          <Text style={s.tableValue}>{(v as number).toLocaleString('es-AR', { maximumFractionDigits: 4 })}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={s.caption}>{r.payload.snapshot.research.technical.method}</Text>
                    {r.payload.snapshot.research.history.error ? <Text style={s.caption}>{r.payload.snapshot.research.history.error}</Text> : null}
                    {r.payload.snapshot.research.fundamentals.error ? <Text style={s.caption}>{r.payload.snapshot.research.fundamentals.error}</Text> : null}
                    <Text style={s.caption}>Ratios según las unidades del proveedor; marketCapitalization en millones de USD.</Text>
                  </View>
                </Disclosure>
              ) : null}
              <View>
                <Text style={s.overline}>LIMITACIONES</Text>
                {limits.map((l, i) => <Text key={i} style={[s.body, { marginTop: 4 }]}>• {l}</Text>)}
              </View>
              <Disclosure title="Consultar las fuentes y los extractos">
                <View style={{ gap: 12 }}>
                  {sources.map((src) => (
                    <View key={src.id}>
                      <Pressable accessibilityRole="link" onPress={() => { if (src.url.startsWith('https://')) Linking.openURL(src.url).catch(() => onError('No se pudo abrir la fuente.')); }} style={s.sourceLink}>
                        <Text style={s.sourceText}>{titleOf(src.id) ?? src.title}</Text>
                        <IconExternal size={15} color={c.secondary} />
                      </Pressable>
                      <ProvenanceDates prefix="Publicación" dataDate={src.publishedAt} fetchedAt={src.fetchedAt} help={false} />
                      {titleOf(src.id) && titleOf(src.id) !== src.title ? <Text style={s.caption}>Título original: {src.title}</Text> : null}
                      {r.payload.report.facts.filter((f) => f.sourceId === src.id).map((f, i) => (
                        <View key={i} style={s.quote}>
                          <Text style={s.quoteText}>«{f.translation ?? f.excerpt}»</Text>
                          {f.translation ? <Text style={s.caption}>Texto original: «{f.excerpt}»</Text> : null}
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </Disclosure>
            </View>
          </Disclosure>
        </View>
      </View>
    </View>
  );
}

export default function AlertasScreen({view,onViewChange:setView}:{view:AlertView;onViewChange:(view:AlertView)=>void}) {
  const {success}=useMotion();
  const { c } = useTheme();
  const s = useS();
  const [status,setStatus]=useState<MarketStatus|null>(null),[reports,setReports]=useState<MarketReport[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [alerts,setAlerts]=useState<(MarketReport & {reportId:string;readAt:string|null})[]>([]);
  // Tickers de la cartera, para mostrar un estado vacío explícito por activo sin informe.
  const [holdings,setHoldings]=useState<string[]>([]);
  const [loaded,setLoaded]=useState(false),[refreshing,setRefreshing]=useState(false);
  const [reading,setReading]=useState<string|null>(null);
  const [selectedId,setSelectedId]=useState<string|null>(null);
  // Deslizar hacia abajo actualiza (informes y oportunidades); el refresco automático de fondo no muestra el indicador.
  const [pulling,setPulling]=useState(false),[oppSignal,setOppSignal]=useState(0);
  const onPull=()=>{setPulling(true);setOppSignal(n=>n+1);refresh().catch(()=>setError('No se pudieron actualizar los informes.')).finally(()=>setPulling(false));};
  const scroll=useRef<ScrollView|null>(null);
  const mounted=useRef(true),inFlight=useRef(false);
  const refresh=useCallback(async()=>{
    if(inFlight.current)return;
    inFlight.current=true;
    if(mounted.current)setRefreshing(true);
    try{
      const [s,r,a,h]=await Promise.all([api.marketStatus(),api.marketReports(),api.marketAlerts(),api.holdings().catch(()=>null)]);
      if(mounted.current){setStatus(s);setReports(r);setAlerts(a);if(h)setHoldings(h.map(p=>p.ticker));setError('');}
    }finally{inFlight.current=false;if(mounted.current){setLoaded(true);setRefreshing(false);}}
  },[]);
  useEffect(()=>{
    mounted.current=true;
    const update=()=>{if(AppState.currentState==='active')refresh().catch(()=>{if(mounted.current)setError('No se pudieron actualizar los informes.');});};
    update();
    const timer=setInterval(update,30_000);
    const appState=AppState.addEventListener('change',state=>{if(state==='active')update();});
    const notifications=Notifications.addNotificationReceivedListener(notification=>{if(notification.request.content.data?.screen==='alerts')update();});
    return ()=>{mounted.current=false;clearInterval(timer);appState.remove();notifications.remove();};
  },[refresh]);
  const [notice,setNotice]=useState('');
  async function requestAnalysis(){setBusy(true);setError('');try{const r=await api.requestAnalysis();setNotice(r.message);success(r.queued>0 ? 'Análisis en cola' : 'Estado de los análisis actualizado');await refresh();}catch(e){setError(e instanceof Error?e.message:'No se pudo solicitar el análisis');}finally{setBusy(false);}}
  async function enablePush() {
    setBusy(true);setError('');
    try {
      if(!status?.pushEnabled) throw new Error('Las notificaciones push todavía no están habilitadas en el servidor.');
      if(Platform.OS==='android') await Notifications.setNotificationChannelAsync('market',{name:'Análisis de mercado',importance:Notifications.AndroidImportance.DEFAULT});
      const permission=await Notifications.requestPermissionsAsync();
      if(permission.status!=='granted') throw new Error('No se otorgó permiso para notificaciones. Podés activarlo en Ajustes del dispositivo.');
      const projectId=Constants.expoConfig?.extra?.eas?.projectId??Constants.easConfig?.projectId;
      if(!projectId) throw new Error('Falta configurar el proyecto de notificaciones.');
      const {data}=await Notifications.getExpoPushTokenAsync({projectId});
      await api.registerDevice(data);await api.marketPreferences(true);await refresh();
      Alert.alert('Notificaciones activadas','Recibirás un aviso cuando haya nuevos análisis. Las cantidades de tu cartera no se muestran en el aviso.');
    }catch(e){setError(e instanceof Error?e.message:'No se pudieron activar las notificaciones.');}finally{setBusy(false);}
  }
  async function toggle(){setBusy(true);try{await api.marketPreferences(!status?.alertsEnabled);await refresh();}catch{setError('No se pudo guardar la preferencia.');}finally{setBusy(false);}}
  const unread=alerts.filter(a=>!a.readAt && a.reportId);
  const cards:Card[]=[...reports.map(r=>({...r,alertId:unread.find(a=>String(a.reportId)===String(r.id))?.id??null})),...unread.filter(a=>!reports.some(r=>r.ticker===a.ticker)).map(a=>({...a,id:a.reportId,alertId:a.id}))].sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
  const withoutReport=holdings.filter(t=>!cards.some(c=>c.ticker===t));
  const refreshQuietly=()=>{void refresh().catch(()=>{});};
  const selected=selectedId?cards.find(c=>String(c.id)===selectedId)??null:null;
  const open=(id:string)=>{setSelectedId(id);requestAnimationFrame(()=>scroll.current?.scrollTo({y:0,animated:false}));};
  const inDetail=!!selected&&view==='portfolio';
  const back=()=>setSelectedId(null);
  useHardwareBack(inDetail,back);

  const body = <ScrollView ref={scroll} style={{backgroundColor:c.bg}} contentContainerStyle={s.content} refreshControl={<RefreshControl tintColor={c.secondary} refreshing={pulling} onRefresh={onPull}/>}>
    {inDetail&&selected ? (
      <ReportDetail
        r={selected}
        onBack={back}
        reading={reading===selected.alertId}
        onError={setError}
        refreshQuietly={refreshQuietly}
        onRetry={()=>{void requestAnalysis();}}
        retrying={busy}
        onRead={()=>{const id=selected.alertId!;setReading(id);void api.readMarketAlert(id).then(async()=>{success("Análisis marcado como leído");await refresh();}).catch(()=>setError('No se pudo marcar el análisis como leído.')).finally(()=>setReading(null));}}
      />
    ) : <>
    <ScreenTitle right={<ProfileButton />} title="Mercados y alertas" subtitle="Noticias y escenarios posibles para tu cartera, con sus fuentes y límites."/>
    <Segmented value={view} onChange={setView} options={[{key:'portfolio',label:'Mi cartera'},{key:'opportunities',label:'Oportunidades'}]}/>
    {error?<Text accessibilityRole="alert" style={s.error}>{error}</Text>:null}
    {view==='opportunities'?<Opportunities refreshSignal={oppSignal}/>:<>
    <ActionButton small disabled={busy||!status} onPress={requestAnalysis} icon={(col)=><IconSpark size={17} color={col}/>} label={busy?"Procesando solicitud…":"Solicitar análisis de mi cartera"}/>
    {notice?<Text accessibilityRole="alert" style={s.notice}>{notice}</Text>:null}
    {!loaded ? <LoadingState label="Buscando tus análisis…"/> : null}
    {status?.analysisRequests?.length ? <Card>
      <Text style={s.cardTitle}>Estado de tus solicitudes</Text>
      <Text style={s.caption}>Se actualiza cada 30 segundos. Un pedido recibido todavía puede estar en proceso.</Text>
      {status.analysisRequests.filter(r=>r.state!=='ready').map(r=><View key={r.ticker} style={s.request}><Text style={s.strong}>{r.ticker} · {{queued:'En espera',processing:'Analizando',ready:'Listo',failed:'No completado'}[r.state]}</Text><Text style={s.body}>{r.message}</Text><Text style={s.caption}>{fmtDateTime(r.createdAt)}</Text></View>)}
      {status.analysisRequests.some(r=>r.state==='ready')?<Disclosure title={(()=>{const n=status.analysisRequests!.filter(r=>r.state==='ready').length;return n===1?'1 informe listo':`${n} informes listos`;})()}>{status.analysisRequests.filter(r=>r.state==='ready').map(r=><View key={r.ticker} style={s.request}><Text style={s.strong}>{r.ticker} · Listo</Text><Text style={s.body}>{r.message}</Text></View>)}</Disclosure>:null}
    </Card>:null}
    {loaded&&!error&&!cards.length&&!withoutReport.length?<Card><Text style={s.cardTitle}>Tus análisis aparecerán aquí</Text><Text style={[s.body,{marginTop:8}]}>Agregá activos a tu cartera y tocá «Solicitar análisis». Podés seguir usando la app mientras se procesan.</Text></Card>:null}
    {cards.length>0?<Card style={{paddingHorizontal:10,paddingVertical:12}}>
      <View style={s.inboxHead}>
        <Text style={s.cardTitle}>Alertas recientes</Text>
        {unread.length>0?<Badge tone="brand" label={`${unread.length} sin leer`}/>:null}
      </View>
      {cards.map((r,i)=><Pressable key={String(r.id)} accessibilityRole="button" accessibilityLabel={`${r.ticker}, ${REPORT_STATE_LABEL[reportState(r).kind].toLowerCase()}${r.alertId?', sin leer':''}`} onPress={()=>open(String(r.id))} style={[s.inboxRow,i>0&&{borderTopWidth:1,borderTopColor:c.border}]}>
        <AssetMark ticker={r.ticker} size={42}/>
        <View style={{flex:1}}>
          <Text style={[s.inboxTicker,r.alertId?{fontFamily:fonts.bold}:null]}>{r.ticker} <Text style={s.inboxRegion}>· {r.region}</Text></Text>
          <Text style={s.caption} numberOfLines={1}>{REPORT_STATE_LABEL[reportState(r).kind]}</Text>
        </View>
        <Text style={s.inboxTime}>{listTime(r.createdAt)}</Text>
        <View style={[s.unreadDot,{backgroundColor:r.alertId?c.secondary:'transparent'}]}/>
        <IconChevron right size={16} color={c.faint}/>
      </Pressable>)}
    </Card>:null}
    {loaded&&!error&&withoutReport.length?<ScenarioEmptyState tickers={withoutReport} onRequested={refreshQuietly}/>:null}
    {status ? <>
      <SectionTitle>Avisos y configuración</SectionTitle>
      <Card>
        <Disclosure title="Configurar alertas y notificaciones">
          <View style={{gap:10}}>
            <Text style={s.body}>{status.configured?'Análisis automático configurado.':'El análisis automático todavía no está configurado.'} Los escenarios son condicionales y pueden no cumplirse. No son órdenes para operar.</Text>
            <ActionButton small secondary disabled={busy} onPress={toggle} label={status.alertsEnabled?'Desactivar alertas':'Activar alertas dentro de la app'}/>
            <ActionButton small secondary disabled={busy} onPress={enablePush} label="Habilitar notificaciones push"/>
            <Text style={s.caption}>El contenido de tu cartera no aparece en la pantalla bloqueada.</Text>
          </View>
        </Disclosure>
      </Card>
    </> : null}
  </>}</>}</ScrollView>;
  return inDetail ? <EdgeSwipeBack onBack={back}>{body}</EdgeSwipeBack> : body;
}

const useS = makeStyles((c) => ({
  content: { padding: 16, gap: 14, paddingBottom: SCREEN_BOTTOM_SPACE },
  cardTitle: { fontSize: 17, fontFamily: fonts.bold, color: c.ink, letterSpacing: -0.2 },
  caption: { fontSize: 13, lineHeight: 18, fontFamily: fonts.regular, color: c.inkSoft },
  body: { fontSize: 14.5, lineHeight: 21, fontFamily: fonts.regular, color: c.inkSoft },
  strong: { fontFamily: fonts.semibold, color: c.ink },
  overline: { fontSize: 11.5, fontFamily: fonts.semibold, letterSpacing: 0.8, color: c.inkSoft },
  error: { fontSize: 14, fontFamily: fonts.regular, color: c.red, backgroundColor: c.redBg, borderRadius: 12, padding: 12, overflow: 'hidden' },
  notice: { fontSize: 14, fontFamily: fonts.medium, color: c.onSecondaryFixed, backgroundColor: c.secondaryFixed, borderRadius: 12, padding: 12, overflow: 'hidden' },
  request: { marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: c.containerLow, gap: 2 },
  inboxHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 8, paddingBottom: 6 },
  inboxRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8, paddingVertical: 10 },
  inboxTicker: { fontSize: 15.5, fontFamily: fonts.semibold, color: c.ink },
  inboxRegion: { fontFamily: fonts.medium, color: c.inkSoft },
  inboxTime: { fontSize: 13, fontFamily: fonts.regular, color: c.inkSoft, fontVariant: ['tabular-nums'] },
  unreadDot: { width: 9, height: 9, borderRadius: 5 },
  detailCard: { backgroundColor: c.card, borderRadius: 22, borderWidth: 1, borderColor: c.border, padding: 18 },
  detailHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  detailTitle: { fontSize: 26, fontFamily: fonts.bold, color: c.ink, letterSpacing: -0.6 },
  detailRegion: { fontFamily: fonts.semibold, color: c.inkSoft },
  rule: { height: 1, backgroundColor: c.border, marginTop: 16 },
  abstain: { flexDirection: 'row', gap: 14, marginTop: 14, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: alpha(c.containerLow, 0.7) },
  failIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: c.redBg },
  abstainTitle: { fontSize: 15, fontFamily: fonts.semibold, color: c.ink },
  scenario: { gap: 8, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: c.border },
  scenarioText: { fontSize: 14.5, lineHeight: 21, fontFamily: fonts.regular, color: c.ink },
  section: { paddingVertical: 12, gap: 6 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionNum: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: c.secondaryFixed },
  sectionNumText: { fontSize: 12.5, fontFamily: fonts.bold, color: c.onSecondaryFixed },
  sectionTitle: { flex: 1, fontSize: 15, fontFamily: fonts.semibold, color: c.ink },
  sectionText: { fontSize: 14, lineHeight: 21, fontFamily: fonts.regular, color: c.inkSoft },
  table: { borderRadius: 12, borderWidth: 1, borderColor: c.border, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingHorizontal: 12, paddingVertical: 9 },
  tableKey: { flex: 1, fontSize: 13, fontFamily: fonts.regular, color: c.inkSoft },
  tableValue: { fontSize: 13, fontFamily: fonts.semibold, color: c.ink, fontVariant: ['tabular-nums'] },
  sourceLink: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8 },
  sourceText: { flex: 1, fontSize: 14, fontFamily: fonts.semibold, color: c.secondary, textDecorationLine: 'underline' },
  quote: { marginTop: 6, paddingLeft: 10, borderLeftWidth: 3, borderLeftColor: c.outlineVariant, gap: 2 },
  quoteText: { fontSize: 13.5, lineHeight: 20, fontFamily: fonts.regular, color: c.ink },
}));
