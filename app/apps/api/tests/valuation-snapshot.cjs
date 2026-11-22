const assert=require('node:assert/strict');
const {PortfolioService}=require('../dist/portfolio/portfolio.service');
(async()=>{
 process.env.NODE_ENV='test';delete process.env.LIVE_PRICES;
 let quantity='2',reads=0;
 const repo={find:async({where})=>{reads++;return [{id:where.userId,userId:where.userId,ticker:'TEST',quantity,instrument:{name:'Test',assetClass:'accion',sector:'Test',region:'Test',currency:'USD',refPrice:'10'}}]}};
 const service=new PortfolioService(repo,{});
 const first=await service.getPositions(1),second=await service.getPositions(1);
 assert.equal(first[0].valuationId,second[0].valuationId);assert.equal(reads,2);
 first[0].value=999;assert.equal((await service.getPositions(1))[0].value,20);
 assert.notEqual((await service.getPositions(2))[0].valuationId,second[0].valuationId);
 quantity='3';const edited=await service.getPositions(1);assert.equal(edited[0].value,30);assert.notEqual(edited[0].valuationId,second[0].valuationId);
 const forced=await service.getPositions(1,true);assert.notEqual(forced[0].valuationId,edited[0].valuationId);
 service.snapshots.get(1).expires=0;const expired=await service.getPositions(1);assert.notEqual(expired[0].valuationId,forced[0].valuationId);
 const parallel=await Promise.all([service.getPositions(1,true),service.getPositions(1,true)]);assert.equal(parallel[0][0].valuationId,parallel[1][0].valuationId);
 service.valuePositions=async()=>{throw new Error('provider unavailable')};await assert.rejects(service.getPositions(1,true),/provider unavailable/);assert.equal(service.snapshots.has(1),false);
 console.log('PASS: same valuation across endpoints, owner isolation, fresh holdings, immutable responses, forced refresh, expiry, concurrency, failure clears snapshot');
})().catch(e=>{console.error(e);process.exitCode=1});
