'use client';
import {useEffect,useRef,useState, type FormEvent} from 'react';
import { ThemedLogo } from "@/components/theme/ThemedLogo";
import Link from 'next/link';

export function EmailAction({mode}:{mode:'forgot-password'|'reset-password'|'verify-email'}) {
  const [token,setToken]=useState('');
  const [ready,setReady]=useState(false);
  const [busy,setBusy]=useState(false);
  const [done,setDone]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const initialized=useRef(false);
  useEffect(()=>{
    if(initialized.current) return;
    initialized.current=true;
    setToken(new URLSearchParams(window.location.hash.slice(1)).get('token')??'');
    // Tokens stay out of HTTP URLs, referrers and browser history after opening.
    window.history.replaceState(null,'',window.location.pathname);
    setReady(true);
  },[]);
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setError('');
    const data=new FormData(event.currentTarget);
    const password=String(data.get('password')??'');
    if(mode==='reset-password' && password!==data.get('confirmation')) {setError('Las contraseñas no coinciden.');return;}
    if(mode==='reset-password' && new TextEncoder().encode(password).length>72) {setError('La contraseña supera el máximo de 72 bytes.');return;}
    setBusy(true);
    try {
      const body=mode==='forgot-password'?{email:String(data.get('email')).trim()}:mode==='reset-password'?{token,password}:{token};
      const response=await fetch(`/api/auth/action/${mode}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const result=await response.json();
      if(!response.ok) throw new Error(Array.isArray(result.message)?result.message[0]:result.message??'No se pudo completar la solicitud.');
      setDone(true);setToken('');
      setMessage(mode==='forgot-password'?'Si existe una cuenta con ese correo, recibirás un enlace. Revisá también spam.':mode==='reset-password'?'Contraseña actualizada. Iniciá sesión con tu nueva contraseña.':'Correo confirmado. Ya podés volver a tu cuenta.');
    } catch(e) {setError(e instanceof Error?e.message:'No se pudo completar la solicitud.');}
    finally {setBusy(false);}
  }
  const missingToken=ready && mode!=='forgot-password' && !token && !done;
  return <main className="grid min-h-screen place-items-center bg-bg px-4 py-10 sm:px-6">
   <div className="w-full max-w-md">
    <div className="mb-6 flex justify-center"><ThemedLogo alt="Allocia" priority className="h-auto w-[168px]" /></div>
    <section className="space-y-5 rounded-card border border-line bg-card p-6 shadow-card sm:p-8">
    <h1 className="font-heading text-2xl font-bold tracking-[-0.02em] text-ink">{mode==='forgot-password'?'Recuperar acceso':mode==='reset-password'?'Nueva contraseña':'Confirmar correo'}</h1>
    {missingToken && <p role="alert" className="alert-error">El enlace está incompleto. Solicitá uno nuevo desde {mode==='reset-password'?<Link href="/forgot-password" className="underline">recuperación de acceso</Link>:<Link href="/account" className="underline">tu cuenta</Link>}.</p>}
    {!done && !missingToken && <form onSubmit={submit} className="space-y-4"><fieldset disabled={!ready||busy} className="space-y-4">
      {mode==='forgot-password' && <label className="block text-sm font-semibold text-ink">Email<input className="input mt-1.5 font-normal" type="email" name="email" required maxLength={254} autoComplete="email" /></label>}
      {mode==='reset-password' && <><label className="block text-sm font-semibold text-ink">Nueva contraseña<input className="input mt-1.5 font-normal" type="password" name="password" required minLength={12} maxLength={72} autoComplete="new-password" /></label><label className="block text-sm font-semibold text-ink">Repetí la contraseña<input className="input mt-1.5 font-normal" type="password" name="confirmation" required minLength={12} maxLength={72} autoComplete="new-password" /></label></>}
      {mode==='verify-email' && <p className="text-sm leading-6 text-soft">Confirmá que este correo te pertenece.</p>}
      <button className="btn-primary w-full" type="submit">{busy?'Procesando…':mode==='forgot-password'?'Enviar enlace':mode==='reset-password'?'Guardar contraseña':'Confirmar correo'}</button>
    </fieldset></form>}
    {message && <p role="status" className="rounded-field bg-ok-bg px-3.5 py-3 text-[13px] font-medium leading-5 text-ok">{message}</p>}{error && <p role="alert" className="alert-error">{error}</p>}
    <Link href="/login?expired=1" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-secondary underline-offset-2 hover:underline">Volver a iniciar sesión</Link>
    </section>
   </div>
  </main>;
}
