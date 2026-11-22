// Explicit opt-in: reads public provider data and spends at most two model calls.
// Never connects to the database or creates notifications. Never prints secrets,
// provider error bodies, portfolio data, or the generated financial commentary.
const fs = require('node:fs');
const path = require('node:path');
const { MarketFeed } = require('../dist/market/feed');
const { analyzeSnapshot } = require('../dist/market/analyzer');

async function main() {
  if (!process.argv.includes('--live')) throw new Error('Pass --live explicitly');
  for (const key of ['ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL', 'FINNHUB_API_KEY', 'COINGECKO_API_KEY']) {
    if (!process.env[key]) throw new Error(`Missing ${key}`);
  }
  const feed = new MarketFeed();
  const assets = [
    { ticker:'AAPL',name:'Apple',region:'US',exchange:'NASDAQ',providerSymbol:'AAPL',currency:'USD',kind:'equity' },
    { ticker:'BTC',name:'Bitcoin',region:'GLOBAL',exchange:'CRYPTO',providerSymbol:'bitcoin',currency:'USD',kind:'crypto' },
  ];
  const results = [];
  const requested=process.argv.find(a=>a.startsWith('--ticker='))?.split('=')[1];
  if(requested && !assets.some(a=>a.ticker===requested)) throw new Error('Ticker de prueba desconocido');
  for (const asset of assets.filter(a=>!requested||a.ticker===requested)) {
    const snapshot = await feed.snapshot(asset);
    const result = { ticker:asset.ticker, quoteAvailable:!!snapshot.quote, quoteAsOf:snapshot.quote?.asOf,
      sourceCount:snapshot.sources.length, sourceScopes:[...new Set(snapshot.sources.map(s=>s.scope))],
      missing:snapshot.missing, generation:'not_run' };
    try {
      const analysis = await analyzeSnapshot(snapshot);
      result.generation = analysis.report.status;
      result.model = analysis.model;
      result.usage = analysis.usage;
      result.groundedFactCount = analysis.report.facts.length;
      result.scenarioCount = analysis.report.scenarios.length;
    } catch (error) {
      result.generation = 'failed';
      // Only safe categories; SDK errors can embed HTTP headers and prompts.
      result.errorType = /^[A-Za-z_]{1,80}$/.test(error?.name ?? '') ? error.name : 'Error';
      if (Number.isInteger(error?.statusCode)) result.httpStatus = error.statusCode;
      if (['length','stop','error','content-filter','other','unknown'].includes(error?.finishReason)) result.finishReason=error.finishReason;
      if(error?.usage) result.usage={inputTokens:error.usage.inputTokens,outputTokens:error.usage.outputTokens};
      const cause=error?.cause;
      if(/^[A-Za-z_]{1,80}$/.test(cause?.name??'')) result.causeType=cause.name;
    }
    results.push(result);
    console.log(JSON.stringify(result));
  }
  const evidence = { checkedAt:new Date().toISOString(), databaseAccess:false, notificationsSent:false, results };
  const directory = path.join(__dirname, '../evidence');
  fs.mkdirSync(directory, {recursive:true});
  fs.writeFileSync(path.join(directory,'providers-live.json'), JSON.stringify(evidence,null,2)+'\n');
  if (results.some(r=>r.generation !== 'analysis')) process.exitCode = 1;
}
main().catch(() => { console.error('Provider smoke could not run; verify configuration and build.'); process.exitCode=1; });
