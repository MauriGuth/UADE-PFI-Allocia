const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname,'../components/biometric-gate.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
function harness(restored=true){
 const slots=[],listeners={},effects=[];let index=0,first=true,authCalls=0,forgot=0,result={success:false},hardware=true;
 const React={createElement:(type,props,...children)=>({type,props:props||{},children}),Fragment:'fragment',useState(initial){const i=index++;if(first)slots[i]=initial;return[slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useRef(initial){const i=index++;if(first)slots[i]={current:initial};return slots[i];},useEffect(fn){if(first)effects.push(fn);}};
 const local={AuthenticationType:{FINGERPRINT:1,FACIAL_RECOGNITION:2},supportedAuthenticationTypesAsync:async()=>[2],hasHardwareAsync:async()=>hardware,isEnrolledAsync:async()=>true,authenticateAsync:async options=>{authCalls++;assert.equal(options.disableDeviceFallback,true);assert.equal(options.biometricsSecurityLevel,'strong');return typeof result==='function'?result():result;}};
 const exports={};vm.runInNewContext(code,{exports,require:name=>({'react':React,'react-native':{AppState:{currentState:'active',addEventListener:(event,fn)=>{listeners[event]=fn;return{remove(){}};}},Platform:{OS:'ios'},Pressable:'button',Text:'text',View:'view'},'expo-local-authentication':local,'../lib/auth':{useAuth:()=>({restored,forgetSession:async()=>{forgot++;}})},'../lib/theme':{colors:{},fonts:{},useTheme:()=>({c:{}})}})[name]});
 function render(){index=0;const tree=exports.BiometricGate({children:'PRIVATE HOLDINGS'});if(first){first=false;effects.forEach(f=>f());}return tree;}
 const buttons=t=>t.children.filter(x=>x?.type==='button');
 return{render,buttons,event:state=>listeners.change(state),setResult:r=>result=r,setHardware:r=>hardware=r,get calls(){return authCalls;},get forgot(){return forgot;}};
}
(async()=>{
 const h=harness();assert.equal(h.render().type,'view');
 await h.buttons(h.render())[0].props.onPress();assert.equal(h.render().type,'view');
 h.setResult({success:true});await h.buttons(h.render())[0].props.onPress();assert.equal(h.render().type,'fragment');
 h.event('background');h.event('active');assert.equal(h.render().type,'view');
 let release;h.setResult(()=>new Promise(r=>release=r));const pending=h.buttons(h.render())[0].props.onPress();await new Promise(r=>setImmediate(r));
 await h.buttons(h.render())[0].props.onPress();assert.equal(h.calls,3);
 h.event('background');h.event('active');release({success:true});await pending;assert.equal(h.render().type,'view');
 h.setHardware(false);await h.buttons(h.render())[0].props.onPress();assert.equal(h.render().type,'view');h.buttons(h.render())[1].props.onPress();assert.equal(h.forgot,1);
 const fresh=harness(false);assert.equal(fresh.render().type,'fragment');fresh.event('inactive');assert.equal(fresh.render().type,'view');fresh.event('background');fresh.event('active');assert.equal(fresh.render().type,'view');
 console.log('PASS: restore lock, cancellation, success, background relock, stale-result rejection, concurrent prompt guard, unavailable hardware, password fallback, inactive privacy cover. Native biometrics mocked; physical device verification pending.');
})().catch(e=>{console.error(e);process.exitCode=1;});
