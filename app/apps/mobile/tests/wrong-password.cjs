// Ejecuta el cliente HTTP real de la app móvil con un fetch simulado.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),path=require('node:path');
const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/api.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
async function deleteWith(status,message){
 const exports={};let closed=0;
 vm.runInNewContext(code,{exports,process:{env:{EXPO_PUBLIC_API_URL:'http://127.0.0.1:4000'}},__DEV__:true,fetch:async()=>({ok:false,status,text:async()=>JSON.stringify({message})})});
 exports.setAuthToken('token-de-prueba');exports.setOnUnauthorized(()=>{closed++;});
 const error=await exports.api.deleteAccount('mala').then(()=>null,e=>e);
 return {closed,error};
}
(async()=>{
 const wrong=await deleteWith(401,'Contraseña incorrecta');
 assert.equal(wrong.closed,0,'una contraseña incorrecta no debe cerrar la sesión');assert.equal(wrong.error.message,'Contraseña incorrecta');assert.equal(wrong.error.status,401);
 for(const message of ['Sesión requerida','Sesión inválida o vencida','Cuenta inexistente']){const r=await deleteWith(401,message);assert.equal(r.closed,1,`${message}: debe cerrar la sesión`);}
 console.log('PASS: una contraseña incorrecta informa el error sin cerrar la sesión; una sesión inválida o vencida sí la cierra.');
})().catch(e=>{console.error(e);process.exitCode=1;});
