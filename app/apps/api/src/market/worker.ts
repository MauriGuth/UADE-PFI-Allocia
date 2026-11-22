import { opportunity } from './opportunities';
import 'dotenv/config';
import { masterSections } from './research';
import { followUp, verdict } from './follow-up';
import db from '../database';
import { DataSource } from 'typeorm';
import { dueSlots, universe } from './config';
import { MarketSnapshot, MarketFeed } from './feed';
import { describeAnalysisFailure, analyzeSnapshot, insufficient, PROMPT_VERSION } from './analyzer';
import { dispatchAccountEmails } from '../auth/account-email';

export async function tick(data: DataSource, now = new Date(), dependencies = {snapshot: (asset: ReturnType<typeof universe>[number]) => new MarketFeed().snapshot(asset), analyze: analyzeSnapshot}) {
  const runner=data.createQueryRunner(); await runner.connect();
  const [{locked}]=await runner.query('SELECT pg_try_advisory_lock(1791417600) AS locked');
  if(!locked) { await runner.release(); return; }
  try {
    await dispatchAccountEmails(data);
    const configured=process.env.MARKET_ANALYSIS_ENABLED==='false'?[]:universe();
    const discovered=await runner.query('SELECT DISTINCT i."marketMapping" FROM instruments i WHERE i."marketMapping" IS NOT NULL AND (EXISTS(SELECT 1 FROM positions p WHERE p.ticker=i.ticker) OR EXISTS(SELECT 1 FROM market_watchlist w WHERE w.ticker=i.ticker)) LIMIT 500');
    const assets=process.env.MARKET_ANALYSIS_ENABLED==='false'?[]:[...new Map([...configured,...discovered.map((r:any)=>r.marketMapping)].map(a=>[a.ticker,a])).values()];
    let slots: ReturnType<typeof dueSlots>;
    try { slots=dueSlots(now); }
    catch { console.error(JSON.stringify({event:'market_calendar_invalid',at:now.toISOString()})); slots=dueSlots(now,false); }
    const pending=await runner.query("SELECT slot FROM market_runs WHERE status IN ('pending','partial','running') AND attempts<3 AND \"createdAt\">now()-interval '1 hour' ORDER BY id LIMIT 100");
    const work=[...slots.map(s=>({...s,ticker:null as string|null})),...pending.map((r:any)=>({slot:r.slot,exchange:String(r.slot).split(':')[0],ticker:String(r.slot).startsWith('REQUEST:')?String(r.slot).split(':').at(-1):null}))];
    for(const due of work) {
      const selected=assets.filter(a=>due.ticker?a.ticker===due.ticker:a.exchange===due.exchange); if(!selected.length) continue;
      await runner.query(`INSERT INTO market_runs(slot) VALUES($1) ON CONFLICT DO NOTHING`,[due.slot]);
      const [run]=await runner.query(`SELECT * FROM market_runs WHERE slot=$1`,[due.slot]);
      if(run.status==='complete'||run.attempts>=3) continue;
      await runner.query(`UPDATE market_runs SET status='running',attempts=attempts+1 WHERE id=$1`,[run.id]);
      let partial=false;
      for(const asset of selected) {
        await dispatchAccountEmails(data);
        if((await runner.query(`SELECT id FROM market_reports WHERE "runId"=$1 AND ticker=$2`,[run.id,asset.ticker])).length) continue;
        const [{count}]=await runner.query(`SELECT count(*) FROM market_reports WHERE "createdAt">=date_trunc('day',now())`);
        if(Number(count)>=Number(process.env.AI_MAX_REPORTS_PER_DAY??100)) { partial=true; break; }
        let snapshot: MarketSnapshot;
        try { snapshot=await dependencies.snapshot(asset); }
        catch {
          // A transient source failure must not starve unrelated assets or push.
          // No report is inserted: the incomplete run can retry this asset only.
          partial=true;
          console.warn(JSON.stringify({event:'market_snapshot_failed',ticker:asset.ticker}));
          continue;
        }
        let analysis: Awaited<ReturnType<typeof analyzeSnapshot>>;
        try { analysis=await dependencies.analyze(snapshot); }
        catch (error) {
          // El motivo real (sin crédito, clave rechazada, modelo inexistente, demora, citas sin respaldo) se guarda y se
          // muestra: no es lo mismo que «no hubo evidencia suficiente».
          const failure=describeAnalysisFailure(error);
          analysis={report:insufficient(snapshot,failure.reason),usage:null,model:null,failure} as typeof analysis;
        }
        const [prior]=await runner.query('SELECT id,"createdAt",payload FROM market_reports WHERE ticker=$1 ORDER BY id DESC LIMIT 1',[asset.ticker]);
        const comparison=followUp(snapshot,analysis.report,prior);
        const payload={...analysis,masterSections:[...masterSections(snapshot.research,analysis.report,snapshot.quote,snapshot.macro),{section:'Seguimiento del análisis anterior',...comparison},verdict(snapshot,analysis.report)],snapshot,promptVersion:PROMPT_VERSION,generatedAt:new Date().toISOString(),notice:'Escenarios posibles, no predicciones garantizadas ni órdenes de operación.'};
        // Store the report and matching alerts together. Holdings never enter the model call.
        await runner.startTransaction();
        try {
          const [report]=await runner.query(`INSERT INTO market_reports("runId",ticker,region,payload) VALUES($1,$2,$3,$4) RETURNING id`,[run.id,asset.ticker,asset.region,JSON.stringify(payload)]);
          if(analysis.report.status==='analysis') {
            const isOpportunity=!!opportunity({id:report.id,ticker:asset.ticker,createdAt:new Date().toISOString(),payload});
            const alerts=await runner.query(`INSERT INTO market_alerts("userId","reportId",kind)
              SELECT u.id,$1::bigint,CASE WHEN EXISTS(SELECT 1 FROM positions p WHERE p."userId"=u.id AND p.ticker=$2) THEN 'portfolio' ELSE 'opportunity' END
              FROM users u WHERE (u."alertsEnabled"=true AND EXISTS(SELECT 1 FROM positions p WHERE p."userId"=u.id AND p.ticker=$2))
              OR ($3::boolean AND u."opportunitiesEnabled"=true AND NOT EXISTS(SELECT 1 FROM positions p WHERE p."userId"=u.id AND p.ticker=$2)
                AND (u."opportunityScope"='all' OR EXISTS(SELECT 1 FROM market_watchlist w WHERE w."userId"=u.id AND w.ticker=$2)))
              ON CONFLICT DO NOTHING RETURNING id,"userId"`,[report.id,asset.ticker,isOpportunity]);
            // Always keep the in-app alert. Cooldown applies only to automatic push;
            // a manual request may notify its requester once for this report.
            const requester=/^REQUEST:[^:]+:(\d+):[^:]+$/.exec(due.slot)?.[1]??null;
            for(const alert of alerts) await runner.query(`INSERT INTO push_outbox("alertId",token)
              SELECT $1::bigint,d.token FROM push_devices d WHERE d."userId"=$2
              AND ($2::text=$3::text OR NOT EXISTS (
                SELECT 1 FROM push_outbox o JOIN market_alerts a ON a.id=o."alertId"
                JOIN market_reports r ON r.id=a."reportId"
                WHERE a."userId"=$2 AND r.ticker=$4 AND a.id<>$1::bigint
                AND o."createdAt">now()-interval '6 hours')) ON CONFLICT DO NOTHING`,[alert.id,alert.userId,requester,asset.ticker]);
          }
          await runner.commitTransaction();
        } catch(e) { await runner.rollbackTransaction(); throw e; }
      }
      await runner.query(`UPDATE market_runs SET status=$1,"finishedAt"=now(),error=$2 WHERE id=$3`,[partial?'partial':'complete',partial?'Análisis incompleto: límite diario o fuente temporalmente no disponible':null,run.id]);
    }
    await dispatchPush(data);
    // Public reports and in-app alerts have bounded retention; cascading deletes remove outbox entries.
    await runner.query(`DELETE FROM market_alerts WHERE "createdAt"<now()-interval '90 days'`);
    await runner.query(`DELETE FROM market_reports WHERE "createdAt"<now()-interval '90 days' AND id NOT IN (SELECT "reportId" FROM market_alerts)`);
    await runner.query(`DELETE FROM market_runs WHERE "createdAt"<now()-interval '90 days' AND id NOT IN (SELECT "runId" FROM market_reports)`);
  } finally { await runner.query('SELECT pg_advisory_unlock(1791417600)'); await runner.release(); }
}
export async function dispatchPush(data: DataSource) {
  if(process.env.PUSH_ENABLED!=='true') return;
  if(!process.env.EXPO_ACCESS_TOKEN) throw new Error('Falta autenticación de Expo Push');
  // The caller owns the scheduler advisory lock, so any previous 'sending'
  // row is an interrupted, ambiguous POST. Never resend it automatically.
  await data.query(`UPDATE push_outbox SET status='unknown' WHERE status='sending'`);
  // Consent is checked at delivery time too.
  const pending=await data.query(`SELECT o.*,a.kind,r.ticker,r.payload,r."createdAt" AS "reportCreatedAt" FROM push_outbox o JOIN market_alerts a ON a.id=o."alertId" JOIN market_reports r ON r.id=a."reportId" JOIN users u ON u.id=a."userId" JOIN push_devices d ON d.token=o.token AND d."userId"=u.id WHERE o.status='pending' AND o.attempts<3 AND ((a.kind='portfolio' AND u."alertsEnabled"=true) OR (a.kind='opportunity' AND u."opportunitiesEnabled"=true AND NOT EXISTS(SELECT 1 FROM positions p WHERE p."userId"=u.id AND p.ticker=r.ticker) AND (u."opportunityScope"='all' OR EXISTS(SELECT 1 FROM market_watchlist w WHERE w."userId"=u.id AND w.ticker=r.ticker)))) AND o."createdAt">now()-interval '6 hours' ORDER BY o.id LIMIT 100`);
  for(const p of pending) {
    if(p.kind==='opportunity'&&(!opportunity({ticker:p.ticker,payload:p.payload,createdAt:p.reportCreatedAt})||(await data.query('SELECT id FROM market_reports WHERE ticker=$1 AND id>(SELECT "reportId" FROM market_alerts WHERE id=$2) LIMIT 1',[p.ticker,p.alertId])).length)) {await data.query("UPDATE push_outbox SET status='expired' WHERE id=$1",[p.id]);continue;}

    await data.query(`UPDATE push_outbox SET attempts=attempts+1,status='sending' WHERE id=$1`,[p.id]);
    try {
      const response=await fetch('https://exp.host/--/api/v2/push/send',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.EXPO_ACCESS_TOKEN}`},body:JSON.stringify({to:p.token,title:'Allocia',body:p.kind==='opportunity'?`${p.ticker}: detectamos un escenario de posible suba. Revisá la condición, las fuentes y los riesgos; puede no cumplirse.`:'Tenés un nuevo análisis disponible. Abrí la app para ver las fuentes y los riesgos.',data:{screen:'alerts',kind:p.kind},channelId:'market',ttl:21600}),signal:AbortSignal.timeout(10000)});
      if(!response.ok) throw new Error('No se confirmó la recepción');
      const body=await response.json() as any;
      if(body.data?.status==='ok' && typeof body.data.id==='string') await data.query(`UPDATE push_outbox SET status='ticket',ticket=$1 WHERE id=$2`,[body.data.id,p.id]);
      else if(body.data?.details?.error==='DeviceNotRegistered') await data.query(`DELETE FROM push_devices WHERE token=$1`,[p.token]);
      else await data.query(`UPDATE push_outbox SET status='failed' WHERE id=$1`,[p.id]);
    } catch { // Ambiguous POST must not be retried automatically: avoid duplicate notifications.
      await data.query(`UPDATE push_outbox SET status='unknown' WHERE id=$1`,[p.id]);
    }
  }
  const tickets=await data.query(`SELECT id,token,ticket FROM push_outbox WHERE status='ticket' AND "createdAt"<now()-interval '15 minutes' LIMIT 100`);
  if(tickets.length) {
    try {
    const response=await fetch('https://exp.host/--/api/v2/push/getReceipts',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.EXPO_ACCESS_TOKEN}`},body:JSON.stringify({ids:tickets.map(t=>t.ticket)}),signal:AbortSignal.timeout(10000)});
    if(response.ok) { const body=await response.json() as any; for(const t of tickets) { const receipt=body.data?.[t.ticket]; if(!receipt) continue; if(receipt.details?.error==='DeviceNotRegistered') await data.query(`DELETE FROM push_devices WHERE token=$1`,[t.token]); else await data.query(`UPDATE push_outbox SET status=$1 WHERE id=$2`,[receipt.status==='ok'?'accepted':'failed',t.id]); } }
    } catch { console.warn(JSON.stringify({event:'push_receipts_unavailable'})); }
  }
  await data.query(`UPDATE push_outbox SET status='expired' WHERE status IN ('pending','ticket') AND "createdAt"<now()-interval '24 hours'`);
}
async function main() {
  await db.initialize();
  const stop=()=>{stopping=true;}; let stopping=false;
  process.on('SIGINT',stop);process.on('SIGTERM',stop);
  do { try { await tick(db); } catch { console.error(JSON.stringify({event:'market_worker_failed',at:new Date().toISOString()})); } if(process.argv.includes('--once')) break; await new Promise(r=>setTimeout(r,30000)); } while(!stopping);
  await db.destroy();
}
if(require.main===module) main().catch(()=>{console.error('No se pudo iniciar el worker');process.exitCode=1;});
