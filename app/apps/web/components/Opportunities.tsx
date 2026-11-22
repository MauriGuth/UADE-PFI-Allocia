"use client";
import { PROVENANCE_HELP, fmtProvenanceDate, provenanceLabels } from '@/lib/provenance';
import { useState } from 'react';
import { api, MarketCandidate } from '@/lib/client';
import { useAsync } from '@/lib/use-async';
import { AnalysisSummary } from './AnalysisSummary';
import { AssetMark } from './ui/AssetIdentity';
import { LiveStatus } from './ui/LiveStatus';
export function Opportunities() {
  const state=useAsync(()=>api.opportunities());
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[query,setQuery]=useState(''),[results,setResults]=useState<MarketCandidate[]>([]),[onlyFollowed,setOnlyFollowed]=useState(false);
  async function action(fn:()=>Promise<unknown>){setBusy(true);setError('');try{await fn();await state.reload();}catch(e){setError(e instanceof Error?e.message:'No se pudo completar. Reintentá.');}finally{setBusy(false);}}
  async function search(){await action(async()=>{const r=await api.searchCatalog(query.trim());setResults(r.results);setNotice(r.unavailable.length?`Fuentes temporalmente no disponibles: ${r.unavailable.join(', ')}.`:r.results.length?'Elegí un activo para seguirlo sin comprarlo.':'No encontramos resultados. Probá otro nombre.');});}
  const feed=state.data;
  return <section className="space-y-5" aria-label="Oportunidades fuera de mi cartera">
    <h2 className="font-heading text-xl font-bold text-ink md:text-2xl">Oportunidades fuera de tu cartera</h2>
    <p className="max-w-prose text-sm leading-6 text-soft md:text-base">Escenarios de posible suba para investigar antes de decidir. No garantizan ganancias ni son probabilidades calculadas.</p>
    {(error||state.error)&&<p role="alert" className="alert-error">{error||state.error}</p>}
    {state.loading?<p role="status" className="text-sm text-soft">Buscando oportunidades…</p>:null}
    <div><LiveStatus label="Actualizar oportunidades" updatedAt={state.updatedAt} busy={busy||state.refreshing} error={state.error} onRefresh={()=>void action(()=>state.reload())}/></div>
    {feed&&<>
      <div className="card space-y-3"><h3 className="section-title">Tus alertas de oportunidades</h3>
        <button className="btn-primary" disabled={busy} onClick={()=>void action(()=>api.opportunityPreferences(!feed.preferences.enabled,feed.preferences.scope))}>{feed.preferences.enabled?'Desactivar alertas de oportunidades':'Activar alertas de oportunidades'}</button>
        <label className="block text-sm font-semibold text-ink">Qué querés seguir <select className="select mt-2 block w-full max-w-sm font-normal" disabled={busy} value={feed.preferences.scope} onChange={e=>void action(()=>api.opportunityPreferences(feed.preferences.enabled,e.target.value as 'all'|'watchlist'))}><option value="all">Todo el universo cubierto</option><option value="watchlist">Solo mis activos seguidos</option></select></label>
        <p className="text-sm text-soft">Se guardan en la app. Para recibir push con la app cerrada, habilitá las notificaciones en el teléfono; en el navegador, activá «Notificaciones del navegador» arriba. Esta preferencia es independiente de las alertas de tu cartera.</p>
      </div>
      <div className="card space-y-3"><h3 className="section-title">Seguir un activo sin tenerlo en cartera</h3>
        <form className="flex flex-wrap gap-3" onSubmit={e=>{e.preventDefault();void search();}}><input className="input min-w-0 flex-1" aria-label="Nombre o símbolo del activo" placeholder="Por ejemplo, Tesla o Bitcoin" maxLength={60} value={query} onChange={e=>setQuery(e.target.value)}/><button className="btn-secondary" disabled={busy||query.trim().length<2}>Buscar</button></form>
        {results.map(c=><div key={c.provider+':'+c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-field bg-low px-3.5 py-2.5 text-sm"><span>{c.name} · {c.symbol}</span><button className="btn-soft" disabled={busy} onClick={()=>void action(async()=>{const i=await api.importAsset(c);await api.followAsset(i.ticker);setResults([]);setNotice('Activo seguido. Podés solicitar su análisis ahora.');})}>Seguir</button></div>)}
        {feed.watchlist.map(w=><div key={w.ticker} className="flex flex-wrap items-center justify-between gap-3 rounded-field bg-low px-3.5 py-2.5 text-sm"><span className="flex items-center gap-3"><AssetMark ticker={w.ticker} size="sm" />{w.name} · {w.ticker}</span><button className="btn-soft" disabled={busy} onClick={()=>void action(()=>api.unfollowAsset(w.ticker))}>Dejar de seguir {w.ticker}</button></div>)}
        {!feed.watchlist.length&&<p className="text-sm text-soft">No seguís activos todavía.</p>}
      </div>
      <button className="btn-primary" disabled={busy} onClick={()=>void action(async()=>setNotice((await api.analyzeOpportunities()).message))}>{busy?'Procesando…':'Analizar oportunidades'}</button>
      {notice&&<p role="status" className="rounded-field bg-secondary-fixed px-3.5 py-3 text-sm font-medium text-secondary-on-fixed">{notice}</p>}
      <details className="card"><summary className="cursor-pointer font-semibold text-ink">Cobertura y estado de los análisis</summary><p className="mt-1 text-sm text-soft">{feed.notice}</p><p className="mt-2 text-sm text-soft">Universo: {feed.coverage.map(a=>a.ticker).join(', ')||'sin universo configurado'}. También se revisan los activos seguidos.</p>{feed.requests.map(r=><p key={r.ticker} className="mt-2 text-sm text-soft">{r.ticker} · {r.status==='complete'?'Análisis terminado; puede no haber un escenario alcista respaldado':r.attempts>=3?'No completado; reintentá más tarde':'En cola o en proceso'}</p>)}</details>
      <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-ink"><input type="checkbox" className="h-5 w-5 accent-secondary" checked={onlyFollowed} onChange={e=>setOnlyFollowed(e.target.checked)}/>Mostrar solo los que sigo</label>
      {!feed.reports.filter(r=>!onlyFollowed||feed.watchlist.some(w=>w.ticker===r.ticker)).length&&<div className="card text-sm text-soft">No hay oportunidades recientes con evidencia suficiente en esta selección. No se generan señales para completar la pantalla.</div>}
      {feed.reports.filter(r=>!onlyFollowed||feed.watchlist.some(w=>w.ticker===r.ticker)).map(r=><article className="card space-y-3" key={r.id}><div className="flex items-center gap-3"><AssetMark ticker={r.ticker} size="md" /><h3 className="font-heading text-xl font-bold text-ink">{r.ticker} · Posible suba</h3></div><p className="text-sm text-soft">{fmtProvenanceDate(r.createdAt) ?? r.createdAt} · Fuera de tu cartera</p><AnalysisSummary text={r.payload.report.summary}/>{r.opportunity.scenarios.map((s,i)=><div key={i} className="space-y-1 rounded-field bg-low p-4 text-sm leading-6"><p><strong>Qué tendría que pasar:</strong> {s.condition}</p><p><strong>Posible efecto:</strong> {s.explanation}</p><details><summary className="cursor-pointer font-semibold text-secondary">Fuentes de este escenario</summary>{s.sources.map(src=><p key={src.url}><a href={src.url} target="_blank" rel="noopener noreferrer" className="font-medium text-secondary underline underline-offset-2">{src.title}</a> · <span title={PROVENANCE_HELP}>{provenanceLabels(src.publishedAt, null).data}</span></p>)}</details></div>)}<details className="text-sm leading-6 text-soft"><summary className="cursor-pointer font-semibold text-ink">Riesgos y escenarios contrarios</summary>{r.payload.report.scenarios.filter(s=>s.direction!=='up').map((s,i)=><p key={i}>{s.condition}: {s.explanation}</p>)}{r.payload.report.limitations.map((l,i)=><p key={i}>{l}</p>)}</details><p className="text-sm text-soft">{r.opportunity.notice}</p>{r.alertId&&<button disabled={busy} className="btn-soft" onClick={()=>void action(()=>api.readMarketAlert(r.alertId!))}>Marcar como leído</button>}</article>)}
    </>}
  </section>;
}
