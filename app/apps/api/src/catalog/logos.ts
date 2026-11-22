import { MarketAsset } from '../market/config';
import { marketJson } from '../market/feed';

export interface AssetLogo { dataUri: string | null; source: string | null }
const cache=new Map<string,{until:number;value:AssetLogo}>();
const pending=new Map<string,Promise<AssetLogo>>();
const hosts=new Set(['finnhub.io','static2.finnhub.io','static.finnhub.io','static9.finnhub.io','assets.coingecko.com','coin-images.coingecko.com']);
export function allowedLogoUrl(value:unknown): URL | null {
  try { const u=new URL(String(value)); return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&hosts.has(u.hostname)?u:null; } catch {return null;}
}
async function load(asset:MarketAsset):Promise<AssetLogo> {
  let url:URL|null=null;
  const source=asset.kind==='crypto'?'CoinGecko':'Finnhub';
  if(asset.kind==='crypto') {
    if(!process.env.COINGECKO_API_KEY)return {dataUri:null,source:null};
    const endpoint=new URL(`https://api.coingecko.com/api/v3/coins/${encodeURIComponent(asset.providerSymbol)}`);
    endpoint.search=new URLSearchParams({localization:'false',tickers:'false',market_data:'false',community_data:'false',developer_data:'false'}).toString();
    const metadata=await marketJson(endpoint,{'x-cg-demo-api-key':process.env.COINGECKO_API_KEY});
    url=allowedLogoUrl(metadata.image?.small??metadata.image?.thumb);
  } else {
    if(!process.env.FINNHUB_API_KEY)return {dataUri:null,source:null};
    const endpoint=new URL('https://finnhub.io/api/v1/stock/profile2');endpoint.searchParams.set('symbol',asset.providerSymbol);
    const metadata=await marketJson(endpoint,{'X-Finnhub-Token':process.env.FINNHUB_API_KEY});
    url=allowedLogoUrl(metadata.logo);
  }
  if(!url)return {dataUri:null,source:null};
  // No provider secrets, browser cookies or user holdings go to the image host.
  let imageUrl:URL=url;
  const signal=AbortSignal.timeout(5000);
  let res:Response|undefined;
  for(let redirects=0;redirects<3;redirects++) {
    res=await fetch(imageUrl,{redirect:'manual',signal});
    if(![301,302,303,307,308].includes(res.status))break;
    const location=res.headers.get('location');await res.body?.cancel();
    const next=location?allowedLogoUrl(new URL(location,imageUrl).href):null;
    if(!next)return {dataUri:null,source:null};
    imageUrl=next;
  }
  if(!res)return {dataUri:null,source:null};
  const type=res.headers.get('content-type')?.split(';')[0];
  if(!res.ok||!['image/png','image/jpeg','image/webp'].includes(type??''))return {dataUri:null,source:null};
  const reader=res.body?.getReader();if(!reader)return {dataUri:null,source:null};
  const chunks:Uint8Array[]=[];let size=0;
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>300_000){await reader.cancel();return {dataUri:null,source:null};}chunks.push(value);}
  const bytes=Buffer.concat(chunks);
  const valid=type==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):type==='image/jpeg'?bytes[0]===255&&bytes[1]===216:bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
  return valid?{dataUri:`data:${type};base64,${bytes.toString('base64')}`,source}:{dataUri:null,source:null};
}
export async function assetLogo(asset:MarketAsset):Promise<AssetLogo> {
 const key=`${asset.kind}:${asset.providerSymbol}`;
 const hit=cache.get(key);if(hit&&hit.until>Date.now())return hit.value;
 if(pending.has(key))return pending.get(key)!;
 const job=load(asset).catch(()=>({dataUri:null,source:null})).then(value=>{
  if(cache.size>=128)cache.delete(cache.keys().next().value!);
  cache.set(key,{until:Date.now()+(value.dataUri?86400:300)*1000,value});return value;
 }).finally(()=>pending.delete(key));pending.set(key,job);return job;
}
