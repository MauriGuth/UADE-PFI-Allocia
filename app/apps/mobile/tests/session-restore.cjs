const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),path=require('node:path');
const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/auth.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
class ApiError extends Error{constructor(status){super('fixture');this.status=status;}}
const flush=()=>new Promise(r=>setImmediate(r));
(async()=>{
 const slots=[],effects=[],stored=new Map([['allocia_token','secret'],['allocia_user','{}']]);let index=0,first=true,mode='offline',release;
 const React={createContext:()=>({Provider:'provider'}),createElement:(type,props)=>({type,props}),useState(v){const i=index++;if(first)slots[i]=v;return[slots[i],x=>slots[i]=x];},useRef(v){const i=index++;if(first)slots[i]={current:v};return slots[i];},useCallback:f=>f,useMemo:f=>f(),useEffect:f=>{if(first)effects.push(f);}};
 const exports={};vm.runInNewContext(code,{exports,require:n=>({'react':React,'expo-secure-store':{getItemAsync:async k=>stored.get(k),deleteItemAsync:async k=>stored.delete(k),setItemAsync:async(k,v)=>stored.set(k,v)},'./api':{ApiError,setAuthToken(){},setOnUnauthorized(){},api:{me:async()=>{if(mode==='offline')throw Error('network');if(mode==='401')throw new ApiError(401);if(mode==='pending')return new Promise(r=>release=r);return{id:1};}}}})[n]});
 const render=()=>{index=0;const tree=exports.AuthProvider({children:null});if(first){first=false;effects.forEach(f=>f());}return tree.props.value;};
 render();await flush();let v=render();assert.ok(v.restoreError);assert.equal(v.user,null);assert.ok(stored.has('allocia_token'));
 mode='ok';await v.retryRestore();v=render();assert.equal(v.user.id,1);assert.equal(v.restored,true);assert.equal(v.restoreError,null);
 mode='401';await v.retryRestore();v=render();assert.equal(v.user,null);assert.equal(stored.has('allocia_token'),false);
 stored.set('allocia_token','new');mode='pending';const pending=v.retryRestore();await flush();await render().forgetSession();release({id:2});await pending;assert.equal(render().user,null);
 console.log('PASS: offline preserves session without revealing account, retry restores behind biometrics, unauthorized clears, late response cannot restore a cleared session.');
})().catch(e=>{console.error(e);process.exitCode=1;});
