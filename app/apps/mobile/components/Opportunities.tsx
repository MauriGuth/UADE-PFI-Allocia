import React,{useCallback,useEffect,useRef,useState} from 'react';
import {AppState,Linking,Text,TextInput,View} from 'react-native';
import {api,MarketCandidate,OpportunityFeed} from '../lib/api';
import {ActionButton,Badge,Card,LoadingState,ProvenanceDates,Segmented} from './ui';
import {AnalysisSummary} from './AnalysisSummary';
import {fonts,useTheme} from '../lib/theme';
export function Opportunities({refreshSignal=0}:{refreshSignal?:number}={}){
  const {c:colors}=useTheme();
  const [feed,setFeed]=useState<OpportunityFeed|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[query,setQuery]=useState(''),[results,setResults]=useState<MarketCandidate[]>([]),[onlyFollowed,setOnlyFollowed]=useState(false),[loaded,setLoaded]=useState(false);
  const mounted=useRef(true),pending=useRef(false);
  const refresh=useCallback(async()=>{if(pending.current)return;pending.current=true;try{const r=await api.opportunities();if(mounted.current){setFeed(r);setError('');}}finally{pending.current=false;if(mounted.current)setLoaded(true);}},[]);
  useEffect(()=>{mounted.current=true;const run=()=>{if(AppState.currentState==='active')void refresh().catch(()=>{if(mounted.current)setError('No se pudieron cargar las oportunidades.');});};run();const timer=setInterval(run,30000);const listener=AppState.addEventListener('change',run);return()=>{mounted.current=false;clearInterval(timer);listener.remove();};},[refresh]);
  // Deslizar hacia abajo en Alertas también actualiza las oportunidades.
  useEffect(()=>{if(refreshSignal)void refresh().catch(()=>setError('No se pudieron cargar las oportunidades.'));},[refreshSignal,refresh]);
  async function action(fn:()=>Promise<unknown>){setBusy(true);setError('');try{await fn();await refresh();}catch(e){setError(e instanceof Error?e.message:'No se pudo completar. Reintentá.');}finally{setBusy(false);}}
  const text={fontSize:15,lineHeight:22,color:colors.inkSoft,fontFamily:fonts.regular};
  const h2={fontSize:18,fontFamily:fonts.bold,color:colors.ink,letterSpacing:-0.2};
  const strong={fontFamily:fonts.semibold,color:colors.ink};
  const visible=feed?.reports.filter(r=>!onlyFollowed||feed.watchlist.some(w=>w.ticker===r.ticker))??[];
  return <View style={{gap:16}}><Text style={{...h2,fontSize:20}}>Oportunidades fuera de tu cartera</Text><Text style={text}>Escenarios de posible suba para investigar. No garantizan ganancias ni son probabilidades calculadas.</Text>
    {error?<Text accessibilityRole="alert" style={{color:colors.red,fontFamily:fonts.regular}}>{error}</Text>:null}
    {!loaded?<LoadingState label="Buscando oportunidades…"/>:null}
    {feed?<>
      <Card style={{gap:10}}><Text style={h2}>Tus alertas de oportunidades</Text>
        <ActionButton disabled={busy} label={feed.preferences.enabled?'Desactivar alertas de oportunidades':'Activar alertas de oportunidades'} onPress={()=>void action(()=>api.opportunityPreferences(!feed.preferences.enabled,feed.preferences.scope))}/>
        <Text style={text}>Avisarme sobre:</Text>
        <Segmented value={feed.preferences.scope} onChange={(v)=>{if(!busy)void action(()=>api.opportunityPreferences(feed.preferences.enabled,v));}} options={[{key:'all',label:'Todo el universo'},{key:'watchlist',label:'Solo los que sigo'}]}/>
        <Text style={text}>Se guardan en la app. Activá push en «Configurar alertas y notificaciones» para recibirlas en el teléfono. Esta preferencia es independiente de las alertas de tu cartera.</Text>
      </Card>
      <Card style={{gap:10}}><Text style={h2}>Seguir sin comprar</Text><TextInput accessibilityLabel="Nombre o símbolo del activo" placeholder="Por ejemplo, Tesla o Bitcoin" placeholderTextColor={colors.inkSoft} value={query} onChangeText={setQuery} maxLength={60} style={{borderWidth:1,borderColor:colors.outlineVariant,backgroundColor:colors.card,borderRadius:12,padding:14,fontSize:16,color:colors.ink,fontFamily:fonts.regular}}/>
        <ActionButton secondary disabled={busy||query.trim().length<2} label="Buscar activos y criptos" onPress={()=>void action(async()=>{const r=await api.searchCatalog(query.trim());setResults(r.results);setNotice(r.unavailable.length?`Fuentes no disponibles: ${r.unavailable.join(', ')}.`:r.results.length?'Elegí un activo para seguirlo.':'Sin resultados. Probá otro nombre.');})}/>
        {results.map(c=><View key={c.provider+':'+c.id}><Text style={text}>{c.name} · {c.symbol}</Text><ActionButton secondary disabled={busy} label={'Seguir '+c.symbol} onPress={()=>void action(async()=>{const i=await api.importAsset(c);await api.followAsset(i.ticker);setResults([]);setNotice('Activo seguido. Podés solicitar su análisis ahora.');})}/></View>)}
        {feed.watchlist.map(w=><View key={w.ticker}><Text style={text}>{w.name} · {w.ticker}</Text><ActionButton secondary disabled={busy} label={'Dejar de seguir '+w.ticker} onPress={()=>void action(()=>api.unfollowAsset(w.ticker))}/></View>)}
        {!feed.watchlist.length?<Text style={text}>No seguís activos todavía.</Text>:null}
      </Card>
      <ActionButton disabled={busy} label={busy?'Procesando…':'Analizar oportunidades'} onPress={()=>void action(async()=>setNotice((await api.analyzeOpportunities()).message))}/>
      {notice?<Text accessibilityRole="alert" style={text}>{notice}</Text>:null}
      <Card style={{gap:8}}><Text style={h2}>Cobertura y solicitudes</Text><Text style={text}>{feed.notice}</Text><Text style={text}>Universo: {feed.coverage.map(a=>a.ticker).join(', ')||'sin universo configurado'}. También se revisan los activos seguidos.</Text>{feed.requests.map(r=><Text key={r.ticker} style={text}>{r.ticker} · {r.status==='complete'?'Análisis terminado; puede no haber un escenario alcista respaldado':r.attempts>=3?'No completado; reintentá más tarde':'En cola o en proceso'}</Text>)}</Card>
      <ActionButton secondary label={onlyFollowed?'Mostrar todo el universo cubierto':'Mostrar solo los que sigo'} onPress={()=>setOnlyFollowed(!onlyFollowed)}/>
      {!visible.length?<Card><Text style={text}>No hay oportunidades recientes con evidencia suficiente en esta selección. No se generan señales para completar la pantalla.</Text></Card>:null}
      {visible.map(r=><Card key={r.id}><View style={{flexDirection:'row',alignItems:'center',gap:10,flexWrap:'wrap'}}><Text style={{...h2,fontSize:22}}>{r.ticker}</Text><Badge tone="ok" label="Posible suba"/></View><Text style={{...text,fontSize:13,marginTop:8}}>Análisis del {new Date(r.createdAt).toLocaleString('es-AR')} · Fuera de tu cartera</Text>{r.payload.snapshot.quote?<ProvenanceDates prefix="Precio del informe" dataDate={r.payload.snapshot.quote.asOf} fetchedAt={r.createdAt}/>:null}<AnalysisSummary text={r.payload.report.summary}/>{r.opportunity.scenarios.map((s,i)=><View key={i} style={{gap:10,marginTop:16}}><Text style={text}><Text style={strong}>Qué tendría que pasar: </Text>{s.condition}</Text><Text style={text}><Text style={strong}>Posible efecto: </Text>{s.explanation}</Text>{s.sources.map(src=><ActionButton key={src.url} secondary label={'Fuente: '+src.title+' · '+new Date(src.publishedAt).toLocaleDateString('es-AR')} onPress={()=>void Linking.openURL(src.url).catch(()=>setError('No se pudo abrir la fuente.'))}/>)}</View>)}<Text style={{...h2,fontSize:16,marginTop:16}}>Riesgos y escenarios contrarios</Text>{r.payload.report.scenarios.filter(s=>s.direction!=='up').map((s,i)=><Text key={i} style={text}>{s.condition}: {s.explanation}</Text>)}{r.payload.report.limitations.map((l,i)=><Text key={i} style={text}>• {l}</Text>)}<Text style={text}>{r.opportunity.notice}</Text>{r.alertId?<ActionButton secondary disabled={busy} label="Marcar como leído" onPress={()=>void action(()=>api.readMarketAlert(r.alertId!))}/>:null}</Card>)}
    </>:null}
  </View>;
}
