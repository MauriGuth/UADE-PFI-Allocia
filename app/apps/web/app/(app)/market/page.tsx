"use client";
import { Opportunities } from "@/components/Opportunities";
import { AnalysisSummary } from "@/components/AnalysisSummary";
import { BrowserNotifications } from "@/components/BrowserNotifications";
import { ALERTS_CHANGED } from "@/lib/alert-notifications";
import { LoadingState, ErrorState } from "@/components/ui/states";
import { AssetMark } from "@/components/ui/AssetIdentity";
import { IconCheck, IconChevron, IconChevronLeft, IconInfo } from "@/components/icons";
import { ScreenTitle } from "@/components/ui/primitives";
import { LiveStatus } from "@/components/ui/LiveStatus";
import { REPORT_STATE_LABEL, reportState } from "@/lib/report-state";
import { useState } from 'react';
import { useAsync } from '@/lib/use-async';
import { api } from '@/lib/client';
import { PROVENANCE_HELP, fmtProvenanceDate, provenanceLabels } from '@/lib/provenance';

const sameDay = (d: Date) => d.toDateString() === new Date().toDateString();
// Hora si es de hoy; si no, la fecha: lo justo para ordenar la bandeja de un vistazo.
const listTime = (iso: string) => {
  const d = new Date(iso);
  return sameDay(d)
    ? d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
};

export default function MarketPage() {
  const [view,setView]=useState<"portfolio"|"opportunities">("portfolio");
  // Bandeja: análisis elegido y, en pantallas chicas, si se muestra el detalle (lista → detalle).
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [showDetail,setShowDetail]=useState(false);
  const state = useAsync(async () => {
    const [status, reports, alerts] = await Promise.all([api.marketStatus(), api.marketReports(), api.marketAlerts()]);
    return {status, reports, alerts};
  });
  const status = state.data?.status ?? null;
  const reports = state.data?.reports ?? [];
  const alerts = state.data?.alerts ?? [];
  const refresh = state.reload;
  const [error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');
  async function requestAnalysis(){setBusy(true);setError('');try{const r=await api.requestAnalysis();setNotice(r.message);await refresh();}catch(e){setError(e instanceof Error?e.message:'No se pudo solicitar el análisis');}finally{setBusy(false);}}
  async function toggle(){if(!status)return;setBusy(true);setError('');try {await api.marketPreferences(!status.alertsEnabled);await refresh();window.dispatchEvent(new Event(ALERTS_CHANGED));}catch{setError('No se pudo guardar tu preferencia.');}finally{setBusy(false);}}
  const unread=alerts.filter(a=>!a.readAt && a.reportId);
  const cards=[...reports.map(r=>({...r,alertId:unread.find(a=>String(a.reportId)===String(r.id))?.id??null})),...unread.filter(a=>!reports.some(r=>r.ticker===a.ticker)).map(a=>({...a,id:a.reportId,alertId:a.id}))].sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
  // Elegir un análisis solo lo muestra: no lo marca como leído (eso es el botón «Marcar como leído»).
  const selected=cards.find(c=>String(c.id)===selectedId)??cards[0]??null;
  const r=selected;
  const state_=reportState(r);
  const insufficient=state_.kind==='abstained';
  const failed=state_.kind==='failed'?state_:null;
  // Títulos de las fuentes en español cuando el análisis los tradujo; si no, el original.
  const titleOf=(id:string)=>r?.payload.report.sourceTitles?.find(t=>t.sourceId===id)?.title??r?.payload.snapshot.sources.find(x=>x.id===id)?.title;

  const detail = r && <article aria-label={`Análisis de ${r.ticker}`} className="card space-y-5 text-[15px] leading-7">
    <button type="button" onClick={()=>setShowDetail(false)} aria-label="Volver a las alertas" className="ios-back -mt-2 lg:hidden"><IconChevronLeft size={26}/>Alertas</button>
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
      <div className="flex min-w-0 items-center gap-4">
        <AssetMark ticker={r.ticker} size="lg"/>
        <div className="min-w-0">
          <h2 className="font-heading text-2xl font-extrabold leading-tight tracking-[-0.02em] text-ink md:text-[26px]">{r.ticker} <span className="font-semibold text-soft">· {r.region}</span></h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {failed
              ?<p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-danger-bg px-2.5 py-0.5 text-xs font-semibold text-danger"><IconInfo size={13}/>Análisis no completado</p>
              :insufficient
              ?<p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-warn-bg px-2.5 py-0.5 text-xs font-semibold text-warn"><IconInfo size={13}/>Evidencia insuficiente</p>
              :<p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-ok-bg px-2.5 py-0.5 text-xs font-semibold text-ok"><IconCheck size={13}/>Análisis de escenarios</p>}
            {r.alertId?<p className="inline-flex w-fit rounded-full bg-secondary-fixed px-2.5 py-0.5 text-xs font-semibold text-secondary-on-fixed">Nuevo</p>:null}
            <p className="text-caption text-soft">Generado {fmtProvenanceDate(r.createdAt) ?? r.createdAt}</p>
          </div>
        </div>
      </div>
      {r.alertId?<button className="btn-secondary btn-sm" onClick={async()=>{try{await api.readMarketAlert(r.alertId!);await refresh();window.dispatchEvent(new Event(ALERTS_CHANGED));}catch{setError('No se pudo marcar el análisis como leído.');}}}><IconCheck size={16}/> Marcar como leído</button>:null}
    </header>
    {!failed&&<AnalysisSummary text={r.payload.report.summary}/>}
    {/* Falla: el análisis no se completó (no es lo mismo que «no hubo evidencia»). Se muestra el motivo real. */}
    {failed&&<div role="status" className="flex gap-3.5 rounded-[14px] border border-danger/25 bg-danger-bg/40 p-4">
      <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-danger-bg text-danger"><IconInfo size={19}/></span>
      <div className="min-w-0 text-sm leading-6">
        <p className="font-semibold text-ink">No se pudo completar este análisis</p>
        <p className="text-soft">{failed.reason}</p>
        <p className="mt-1.5 text-caption text-soft">Las {r.payload.snapshot.sources.length} fuentes consultadas y el precio siguen disponibles abajo. No se muestran escenarios sin un análisis validado.</p>
        <button type="button" disabled={busy||!status} onClick={requestAnalysis} className="btn-secondary btn-sm mt-3">{busy?'Solicitando…':'Volver a intentar ahora'}</button>
      </div>
    </div>}
    {/* Abstención: es un resultado válido del sistema (no inventa escenarios sin evidencia), no un error. */}
    {insufficient&&<div className="flex gap-3.5 rounded-[14px] border border-line bg-low/60 p-4">
      <span aria-hidden="true" className="icon-tile h-10 w-10 rounded-[12px]"><IconInfo size={19}/></span>
      <div className="min-w-0 text-sm leading-6">
        <p className="font-semibold text-ink">Allocia se abstuvo de proponer escenarios</p>
        <p className="text-soft">Los escenarios se generan solo a partir de noticias y datos con fuente. Esta vez la evidencia no alcanzó, así que no se inventa ninguno.</p>
        <p className="mt-1.5 text-caption text-soft">{r.payload.snapshot.sources.length} {r.payload.snapshot.sources.length===1?'fuente consultada':'fuentes consultadas'} · {r.payload.report.limitations.length} {r.payload.report.limitations.length===1?'limitación':'limitaciones'} · detalle abajo</p>
      </div>
    </div>}
    {!insufficient&&!failed&&<p className="text-sm text-soft">Los escenarios son posibilidades, no resultados asegurados. Revisá las limitaciones y fuentes antes de decidir.</p>}
    {r.payload.report.scenarios.length>0&&<div className="grid gap-3 md:grid-cols-2">
      {r.payload.report.scenarios.map((s,i)=><div key={i} className={`rounded-[14px] border border-line p-4 text-sm leading-6 ${{up:'bg-ok-bg/50',down:'bg-danger-bg/40',neutral:'bg-low'}[s.direction]} ${i===r.payload.report.scenarios.length-1&&r.payload.report.scenarios.length%2===1?'md:col-span-2':''}`}>
        <strong className={`inline-block rounded-lg px-3 py-1 text-sm ${{up:'bg-ok-bg text-ok',down:'bg-danger-bg text-danger',neutral:'bg-high text-soft'}[s.direction]}`}>{{up:'Posible suba',down:'Posible baja',neutral:'Escenario neutral'}[s.direction]}</strong>
        <p className="mt-3"><strong>Si ocurre:</strong> {s.condition}</p>
        <p className="mt-2">Posible efecto: {s.explanation}</p>
        <p className="mt-2 text-xs text-soft">Fuentes: {s.sourceIds.map(titleOf).filter(Boolean).join(' · ')}</p>
      </div>)}
    </div>}
    <details className="group rounded-[14px] border border-line bg-card"><summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 rounded-[14px] px-4 font-semibold text-ink [&::-webkit-details-marker]:hidden"><span className="flex flex-wrap items-baseline gap-x-1.5"><span>Ver fuentes y limitaciones</span><span className="font-normal text-soft">· {r.payload.snapshot.sources.length} {r.payload.snapshot.sources.length===1?'fuente':'fuentes'}</span></span><IconChevron size={18} className="shrink-0 transition-transform group-open:rotate-180"/></summary>
      <div className="space-y-4 px-4 pb-4 pt-1">
      {r.payload.snapshot.quote&&<p className="text-sm text-soft">Precio usado en este análisis: {r.payload.snapshot.quote.price.toLocaleString("es-AR",{maximumFractionDigits:8})} {r.payload.snapshot.quote.currency} · <span title={PROVENANCE_HELP}>{provenanceLabels(r.payload.snapshot.quote.asOf, null).data}</span> · {r.payload.snapshot.quote.source}. Para consultar la cotización más reciente, abrí Cartera.</p>}
      {r.payload.masterSections?<details><summary className="cursor-pointer text-sm font-semibold text-secondary">Informe completo</summary>{r.payload.masterSections.map(s=><section key={s.section} className="mt-3"><h3 className="font-semibold">{s.section}</h3><p className="whitespace-pre-line">{s.detail}</p></section>)}</details>:null}
      {r.payload.snapshot.research?<details><summary className="cursor-pointer text-sm font-semibold text-secondary">Indicadores y datos de respaldo</summary><p>Serie diaria hasta: {r.payload.snapshot.research.technical.asOf??'no disponible'}</p><dl>{Object.entries(r.payload.snapshot.research.technical.values).filter(([,v])=>v!==null).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v!.toLocaleString('es-AR',{maximumFractionDigits:4})}</dd></div>)}</dl><p>{r.payload.snapshot.research.technical.method}</p><dl>{Object.entries(r.payload.snapshot.research.fundamentals.metrics).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v.toLocaleString('es-AR',{maximumFractionDigits:4})}</dd></div>)}</dl><p>{r.payload.snapshot.research.history.error}</p><p>{r.payload.snapshot.research.fundamentals.error}</p><p>Ratios según las unidades del proveedor; marketCapitalization en millones de USD. Consultados: {r.payload.snapshot.research.fundamentals.retrievedAt}.</p></details>:null}
      <div><p className="text-micro font-semibold tracking-[0.08em] text-soft">LIMITACIONES</p><ul className="mt-1.5 list-disc pl-5 text-sm text-soft marker:text-muted">{r.payload.report.limitations.map((l,i)=><li key={i}>{l}</li>)}</ul></div>
      <details><summary className="cursor-pointer text-sm font-semibold text-secondary">Consultar las fuentes y los extractos</summary><ul className="mt-3 space-y-3">{r.payload.snapshot.sources.map(s=><li key={s.id}><a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">{titleOf(s.id)??s.title}</a>{titleOf(s.id)&&titleOf(s.id)!==s.title?<p lang="en" className="text-xs text-muted">Título original: {s.title}</p>:null}<p className="text-xs" title={PROVENANCE_HELP}>{provenanceLabels(s.publishedAt, s.fetchedAt).data}{provenanceLabels(s.publishedAt, s.fetchedAt).fetched ? ` · ${provenanceLabels(s.publishedAt, s.fetchedAt).fetched}` : ''}</p>{r.payload.report.facts.filter(f=>f.sourceId===s.id).map((f,i)=><blockquote key={i} className="mt-1.5 border-l-[3px] border-outline pl-3"><p>«{f.translation??f.excerpt}»</p>{f.translation?<p lang="en" className="text-xs text-muted">Texto original: «{f.excerpt}»</p>:null}</blockquote>)}</li>)}</ul></details>
      </div>
    </details>
  </article>;

  return <section className="space-y-4 md:space-y-6">
    <ScreenTitle
      title="Mercados y alertas"
      subtitle="Noticias y escenarios posibles para tu cartera, con sus fuentes y límites."
      actions={view==='portfolio'?<>
        <LiveStatus label="Actualizar informes" updatedAt={state.updatedAt} busy={state.refreshing} error={state.error} onRefresh={()=>{void refresh();}}/>
        <button disabled={busy||!status} onClick={requestAnalysis} className="btn-primary btn-sm">{busy?"Procesando solicitud…":"Solicitar análisis de mi cartera"}</button>
      </>:undefined}
    />
    <div className="flex flex-wrap gap-2"><button className="pill" aria-pressed={view==='portfolio'} onClick={()=>setView('portfolio')}>Mi cartera</button><button className="pill" aria-pressed={view==='opportunities'} onClick={()=>setView('opportunities')}>Oportunidades</button></div>
    {view==='opportunities'?<><BrowserNotifications/><Opportunities/></>:<>
    {(error || state.error)&&<p role="alert" className="alert-error">{error || state.error}</p>}
    {notice?<p role="status" className="rounded-field bg-secondary-fixed px-3.5 py-3 text-sm font-medium text-secondary-on-fixed">{notice}</p>:null}
    {status?.analysisRequests?.length ? (() => {
      // Los pedidos en curso o con problemas se ven siempre; los ya listos se agrupan (cerrados) para que no empujen las alertas.
      const row = (q: NonNullable<typeof status.analysisRequests>[number]) => <div key={q.ticker} className="rounded-field bg-low p-3 text-sm"><strong className="text-ink">{q.ticker} · {{queued:'En espera',processing:'Analizando',ready:'Listo',failed:'No completado'}[q.state]}</strong><p>{q.message}</p><p className="mt-1 text-xs text-soft">{fmtProvenanceDate(q.createdAt) ?? q.createdAt}</p></div>;
      const open = status.analysisRequests.filter(q=>q.state!=='ready');
      const done = status.analysisRequests.filter(q=>q.state==='ready');
      return <section className="card space-y-3"><h2 className="section-title">Estado de tus solicitudes</h2><p className="text-sm text-soft">Se actualiza cada 30 segundos. Un pedido recibido todavía puede estar en proceso.</p>{open.map(row)}{done.length>0&&<details className="group rounded-xl border border-line bg-card"><summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">{done.length===1?'1 informe listo':`${done.length} informes listos`}<IconChevron size={18} className="shrink-0 transition-transform group-open:rotate-180"/></summary><div className="space-y-2 px-3 pb-3">{done.map(row)}</div></details>}</section>;
    })() : null}
    <div className={`grid grid-cols-[minmax(0,1fr)] gap-4 md:gap-6 ${cards.length?'lg:grid-cols-[minmax(300px,390px)_minmax(0,1fr)] lg:items-start':''}`}>
      <div className={`space-y-4 ${showDetail&&cards.length?'hidden lg:block lg:space-y-4':''}`}>
        {state.loading?<LoadingState label="Buscando tus análisis…"/>:!status?<ErrorState message="No pudimos cargar tus informes." onRetry={()=>{void refresh();}}/>:null}
        {state.data&&!state.error&&!cards.length&&<div className="card"><h2 className="section-title">Tus análisis aparecerán aquí</h2><p className="mt-2 text-base leading-6 text-soft">Agregá activos a tu cartera y tocá «Solicitar análisis de mi cartera». Podés seguir usando la app mientras se procesan.</p></div>}
        {cards.length>0&&<section aria-labelledby="bandeja-h" className="card !p-4 sm:!p-5">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1 pb-2">
            <h2 id="bandeja-h" className="section-title">Alertas recientes</h2>
            {unread.length>0&&<span className="rounded-full bg-secondary-fixed px-2.5 py-0.5 text-xs font-bold text-secondary-on-fixed">{unread.length} sin leer</span>}
          </div>
          <p className="px-1 pb-2 text-caption text-soft">Alertas de «Mi cartera». El número del menú Alertas también suma las de «Oportunidades».</p>
          <ul className="divide-y divide-line">
            {cards.map(c=>{
              const isSel=r!==null&&String(c.id)===String(r.id);
              return <li key={String(c.id)}>
                <button type="button" aria-current={isSel?'true':undefined} onClick={()=>{setSelectedId(String(c.id));setShowDetail(true);}}
                  className={`relative flex min-h-[64px] w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors ${isSel?'bg-secondary-fixed/55':'hover:bg-low'}`}>
                  {isSel?<span aria-hidden="true" className="absolute inset-y-3 left-0 w-[3px] rounded-r bg-secondary"/>:null}
                  <AssetMark ticker={c.ticker} size="md"/>
                  <span className="min-w-0 flex-1">
                    <span className={`block leading-5 text-ink ${c.alertId?'font-extrabold':'font-bold'}`}>{c.ticker} <span className="font-medium text-soft">· {c.region}</span></span>
                    <span className="block truncate text-[13px] leading-[18px] text-soft">{REPORT_STATE_LABEL[reportState(c).kind]}</span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-soft">{listTime(c.createdAt)}</span>
                  {c.alertId?<><span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-secondary"/><span className="sr-only">Sin leer</span></>:<span aria-hidden="true" className="h-2.5 w-2.5 shrink-0"/>}
                </button>
              </li>;
            })}
          </ul>
        </section>}
      </div>
      {cards.length>0&&<div className={`min-w-0 ${showDetail?'':'hidden lg:block'}`}>{detail}</div>}
    </div>
    {/* Avisos y configuración: fuera de la columna angosta de la bandeja, en un área compacta y rotulada debajo. */}
    <section aria-labelledby="avisos-h" className={`space-y-3 ${showDetail&&cards.length?'hidden lg:block':''}`}>
      <h2 id="avisos-h" className="section-title">Avisos y configuración</h2>
      <div className="grid items-start gap-3 md:grid-cols-2 md:gap-4">
        <BrowserNotifications/>
        {!state.loading&&status&&<div className="card !p-0"><details className="group"><summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 rounded-card px-5 text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">Configuración y cobertura de las alertas<IconChevron size={18} className="shrink-0 transition-transform group-open:rotate-180"/></summary><div className="px-5 pb-5"><p className="mt-1 text-sm text-soft">{status.configured?'Análisis automático configurado.':'El análisis automático todavía no está configurado.'} {status.calendarConfigured?'Calendarios regionales configurados.':'Falta configurar los calendarios de las bolsas.'}</p>
          <p className="mt-2 text-sm text-soft">Cobertura: {status.coverage.length?status.coverage.map(x=>`${x.ticker} (${x.exchange})`).join(', '):'sin activos habilitados'}. Última ejecución: {status.lastRun?.finishedAt?(fmtProvenanceDate(status.lastRun.finishedAt) ?? status.lastRun.finishedAt):'sin ejecuciones'} {status.lastRun?.status}.</p>
          <button disabled={busy} onClick={toggle} className="btn-secondary btn-sm mt-3">{status.alertsEnabled?'Desactivar alertas':'Activar alertas de mi cartera'}</button>
          <p className="mt-3 text-sm text-soft">Para recibir push con la app cerrada, habilitá las notificaciones desde la app móvil; en el navegador, usá «Notificaciones del navegador». El contenido de tu cartera no aparece en la pantalla bloqueada.</p></div></details></div>}
      </div>
    </section>
  </>}</section>;
}
