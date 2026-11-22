import { validateGrounding } from '../market/analyzer';
import { EvidenceScenario } from './observations.types';
export function evidenceScenarios(rows:any[],now=Date.now()):EvidenceScenario[] {
  const fresh=(s:string,max:number)=>Number.isFinite(Date.parse(s))&&Date.parse(s)<=now+60000&&now-Date.parse(s)<=max;
  const out:EvidenceScenario[]=[];
  for(const row of rows){
    try {
      if(!fresh(row.createdAt,24*3600_000))continue;
      const {snapshot,report}=row.payload;
      const validated=validateGrounding(report,snapshot);
      if(validated.status!=='analysis')continue;
      validated.scenarios.forEach((s,i)=>{
        const sources=s.sourceIds.map(id=>snapshot.sources.find((x:any)=>x.id===id));
        if(sources.some((x:any)=>!x||!fresh(x.publishedAt,48*3600_000)||!x.url.startsWith('https://')))return;
        // A reference alone is insufficient: each scenario source needs a checked literal fact.
        if(s.sourceIds.some(id=>!validated.facts.some(f=>f.sourceId===id)))return;
        out.push({id:`${row.id}-${i}`,ticker:row.ticker,generatedAt:row.createdAt,direction:s.direction,condition:s.condition,explanation:s.explanation,limitations:[...new Set([...report.limitations,...validated.limitations])],sources:sources.map((x:any)=>({title:validated.sourceTitles?.find(t=>t.sourceId===x.id)?.title??x.title,url:x.url,publishedAt:x.publishedAt}))});
      });
    }catch{/* Invalid or incomplete historical reports never produce substitute scenarios. */}
  }
  return out;
}
