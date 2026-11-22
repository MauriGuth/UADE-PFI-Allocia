const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),path=require('node:path');
const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/alert-view.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const flush=()=>new Promise(r=>setImmediate(r)),saved=new Map();
function mount(id,pending=false){
 const slots=[],effects=[];let i=0,first=true,resolve;
 const react={useState(v){const n=i++;if(first)slots[n]=v;return[slots[n],x=>slots[n]=x];},useRef(v){const n=i++;if(first)slots[n]={current:v};return slots[n];},useCallback:f=>f,useEffect:f=>{if(first)effects.push(f);}};
 const exports={};vm.runInNewContext(code,{exports,require:n=>n==='react'?react:{getItemAsync:k=>pending?new Promise(r=>resolve=r):Promise.resolve(saved.get(k)),setItemAsync:async(k,v)=>{saved.set(k,v);}}});
 const render=()=>{i=0;const result=exports.useAlertView(id);if(first){first=false;effects.forEach(f=>f());}return result;};render();return{render,resolve:v=>resolve(v)};
}
(async()=>{
 let a=mount('1');await flush();a.render()[1]('opportunities');await flush();assert.equal(a.render()[0],'opportunities');
 a=mount('1');await flush();assert.equal(a.render()[0],'opportunities');
 const b=mount('2');await flush();assert.equal(b.render()[0],'portfolio');
 const race=mount('1',true);race.render()[1]('portfolio');race.resolve('opportunities');await flush();assert.equal(race.render()[0],'portfolio');
 race.render()[1]('opportunities');race.render()[1]('portfolio');await flush();assert.equal(saved.get('allocia.alert-view.v1.1'),'portfolio');
 saved.set('allocia.alert-view.v1.3','invalid');const invalid=mount('3');await flush();assert.equal(invalid.render()[0],'portfolio');
 const app=fs.readFileSync(path.join(__dirname,'../App.tsx'),'utf8');assert.ok(app.includes('onViewChange={setAlertView}'));assert.ok(app.includes('clearLastNotificationResponse()'));
 console.log('PASS: selection, cold launch, account isolation, late restoration, ordered writes, invalid data, controlled screen.');
})().catch(e=>{console.error(e);process.exitCode=1;});
