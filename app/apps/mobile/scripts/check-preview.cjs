// This gate records evidence; do not mark a check true without its test result.
const fs=require('node:fs');
const path=require('node:path');
async function main(){
  if(process.env.EAS_BUILD_PROFILE==='development')return;
  const r=JSON.parse(fs.readFileSync(path.join(__dirname,'../preview-readiness.json'),'utf8'));
  const validationBuild=process.env.EAS_BUILD_PROFILE==='preview' && r.previewAuthorization?.purpose==='physical-device-validation';
  const required=['deployedApiAndDatabase','allCatalogQuotes','accountRecoveryDelivery','nativeCredentialsConfigured'];
  if(!validationBuild)required.push('masterPromptDataAndAnalysis','scheduledAnalysisAndAlerts');
  if(validationBuild)console.log('Build de prueba autorizado: pendientes de IA completa y observación del calendario conservados; no certifica producción.');
  const pending=required.filter(k=>r.checks?.[k]!==true);
  const age=Date.now()-Date.parse(r.verifiedAt);
  if(!Number.isFinite(age)||age<0||age>24*3600_000)pending.push('evidencia de las últimas 24 horas');
  if(!/^[a-f0-9]{40}$/.test(r.verifiedApiCommit??''))pending.push('commit de API verificado');
  if(pending.length)throw new Error('Preview bloqueado: '+pending.join(', '));
  const base=process.env.EXPO_PUBLIC_API_URL;
  if(!base||new URL(base).protocol!=='https:')throw new Error('Falta API HTTPS');
  const response=await fetch(new URL('/health',base),{signal:AbortSignal.timeout(10000),redirect:'error'});
  if(!response.ok)throw new Error('API no disponible');
  const health=await response.json();
  if(health.status!=='ok'||health.commit!==r.verifiedApiCommit)throw new Error('La API publicada no coincide con la versión probada');
  console.log('Evidencia previa vigente. El build permite completar las pruebas físicas pendientes.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
