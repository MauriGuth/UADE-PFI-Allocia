const assert=require('node:assert/strict');
const {assetLogo,allowedLogoUrl}=require('../dist/catalog/logos');
(async()=>{
 process.env.FINNHUB_API_KEY='synthetic-only';
 assert.equal(allowedLogoUrl('http://finnhub.io/logo.png'),null);
 assert.equal(allowedLogoUrl('https://finnhub.io.evil.test/logo.png'),null);
 assert.equal(allowedLogoUrl('https://127.0.0.1/logo.png'),null);
 assert.equal(allowedLogoUrl('https://user:pass@finnhub.io/logo.png'),null);
 const original=global.fetch;let calls=0;
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=','base64');
 const asset=n=>({ticker:n,providerSymbol:n,kind:'equity'});
 try{
 global.fetch=async(url,options)=>{calls++;assert.equal(options.redirect,String(url).includes('/stock/profile2')?'error':'manual');if(String(url).includes('/stock/profile2'))return Response.json({logo:'https://static2.finnhub.io/logo.png'});assert.equal(options.headers,undefined);return new Response(png,{headers:{'content-type':'image/png'}});};
 const [a,b]=await Promise.all([assetLogo(asset('LOGOTEST')),assetLogo(asset('LOGOTEST'))]);assert.match(a.dataUri,/^data:image\/png;base64,/);assert.deepEqual(a,b);assert.equal(calls,2);await assetLogo(asset('LOGOTEST'));assert.equal(calls,2);
 global.fetch=async()=>Response.json({logo:'https://127.0.0.1/secret'});assert.equal((await assetLogo(asset('UNSAFE'))).dataUri,null);
 global.fetch=async(url)=>String(url).includes('/stock/profile2')?Response.json({logo:'https://finnhub.io/image.svg'}):new Response('<svg/>',{headers:{'content-type':'image/svg+xml'}});assert.equal((await assetLogo(asset('SVG'))).dataUri,null);
 global.fetch=async(url)=>String(url).includes('/stock/profile2')?Response.json({logo:'https://finnhub.io/image.png'}):new Response('not PNG',{headers:{'content-type':'image/png'}});assert.equal((await assetLogo(asset('FALSEPNG'))).dataUri,null);
 global.fetch=async(url)=>String(url).includes('/stock/profile2')?Response.json({logo:'https://static2.finnhub.io/image.png'}):String(url).includes('static2')?new Response(null,{status:302,headers:{location:'https://static9.finnhub.io/image.png'}}):new Response(png,{headers:{'content-type':'image/png'}});assert.ok((await assetLogo(asset('REDIRECT'))).dataUri);
 global.fetch=async(url)=>String(url).includes('/stock/profile2')?Response.json({logo:'https://finnhub.io/image.png'}):new Response(null,{status:302,headers:{location:'https://127.0.0.1/private'}});assert.equal((await assetLogo(asset('REDIRECTUNSAFE'))).dataUri,null);
 global.fetch=async()=>{throw new Error('unavailable')};assert.equal((await assetLogo(asset('FAIL'))).dataUri,null);
 console.log('PASS: logo cache, concurrent deduplication, HTTPS allowlist, credential isolation, SVG rejection, signature validation, unavailable fallback');
 }finally{global.fetch=original;}
})().catch(e=>{console.error(e);process.exitCode=1});
