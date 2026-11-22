const assert=require('node:assert/strict');
const {MarketFeed}=require('../dist/market/feed');
(async()=>{
 const feed=new MarketFeed();let calls=0;
 const asset={ticker:'TESTREFRESH',kind:'equity',providerSymbol:'TESTREFRESH',currency:'USD'};
 const previousClose='2026-10-09T20:00:00.000Z';
 feed.fetchQuote=async()=>{calls++;return{price:100+calls,currency:'USD',asOf:previousClose,source:'fixture'};};
 const first=await feed.quote(asset);assert.equal(calls,1);assert.ok(first.checkedAt);assert.equal(first.asOf,previousClose);
 assert.equal((await feed.quote(asset)).price,101);assert.equal(calls,1);
 const key=JSON.stringify([asset.kind,asset.providerSymbol,asset.currency]);
 MarketFeed.quotesCache.get(key).value.checkedAt=new Date(Date.now()-6000).toISOString();
 const fresh=await feed.quote(asset,true);assert.equal(calls,2);assert.equal(fresh.price,102);assert.equal(fresh.asOf,previousClose);
 await feed.quote(asset,true);assert.equal(calls,2,'Repeated taps within five seconds coalesce');
 MarketFeed.quotesCache.get(key).value.checkedAt=new Date(Date.now()-6000).toISOString();
 await Promise.all([feed.quote(asset,true),feed.quote(asset,true),feed.quote(asset)]);assert.equal(calls,3);
 MarketFeed.quotesCache.get(key).value.checkedAt=new Date(Date.now()-6000).toISOString();feed.fetchQuote=async()=>null;
 assert.equal(await feed.quote(asset,true),null);assert.equal(MarketFeed.quotesCache.has(key),false);
 console.log('PASS: cache bound, manual bypass, real provider timestamp preserved, checkedAt, duplicate taps, concurrent callers, no stale fallback after failure.');
})().catch(e=>{console.error(e);process.exitCode=1;});
