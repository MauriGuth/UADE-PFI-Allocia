// Read-only public quotes, never holdings or model requests.
const fs=require('node:fs');
const path=require('node:path');
const {MarketFeed}=require('../dist/market/feed');
async function main(){
 if(!process.argv.includes('--live'))throw new Error('Se requiere --live');
 const assets=JSON.parse(fs.readFileSync(path.join(__dirname,'../config/market-universe.catalog.json'),'utf8'));
 const results=[];const feed=new MarketFeed();
 // Sequential here to stay below provider burst limits during a one-off audit.
 for(const a of assets){const q=await feed.quote(a);results.push({ticker:a.ticker,providerSymbol:a.providerSymbol,available:!!q,source:q?.source??null,asOf:q?.asOf??null,currency:q?.currency??null});}
 const evidence={checkedAt:new Date().toISOString(),catalogCount:assets.length,available:results.filter(r=>r.available).length,databaseAccess:false,results};
 fs.mkdirSync(path.join(__dirname,'../evidence'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../evidence/catalog-coverage.json'),JSON.stringify(evidence,null,2)+'\n');
 console.log(JSON.stringify(evidence));if(evidence.available!==assets.length)process.exitCode=1;
}
main().catch(()=>{console.error('No se pudo completar la auditoría de cobertura');process.exitCode=1});
