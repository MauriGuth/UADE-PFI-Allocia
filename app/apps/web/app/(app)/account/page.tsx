"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import { DeleteAccountSection, downloadExport } from "@/components/account/DeleteAccountSection";
import { Card, Footer, Overline, ScreenTitle } from "@/components/ui/primitives";

// Pantalla «Cuenta y privacidad». «Cerrar sesión» es una acción normal; la baja
// vive en una sección propia al final, con el recordatorio de exportar antes.
export default function AccountPage() {
  const [error, setError] = useState("");
  const [emailMessage,setEmailMessage]=useState('');
  const [emailBusy,setEmailBusy]=useState(false);
  async function verifyEmail() {
    setEmailBusy(true);setEmailMessage('');
    try {
      const response=await fetch('/api/proxy/auth/request-verification',{method:'POST'});
      const result=await response.json();
      if(!response.ok) throw new Error(result.message??'No se pudo solicitar el correo.');
      setEmailMessage('Si tu correo todavía no está confirmado, recibirás un enlace. Revisá también spam.');
    } catch(e) {setEmailMessage(e instanceof Error?e.message:'No se pudo solicitar el correo.');}
    finally {setEmailBusy(false);}
  }
  function leave() { window.location.assign("/login"); }
  async function logout() { setError(""); try { await api.logout(); leave(); } catch { setError("No se pudo cerrar la sesión. Intentá nuevamente."); } }
  async function download() {
    setError("");
    try { await downloadExport(); }
    catch { setError("No se pudieron exportar tus datos."); }
  }
  return <div className="max-w-2xl space-y-4 md:space-y-6">
    <ScreenTitle title="Cuenta y privacidad" subtitle="Tu sesión, la verificación de tu correo y tus datos." />

    <Card>
      <Overline>Sesión</Overline>
      <p className="mt-2 text-[13px] leading-5 text-soft">Cerrar sesión solo sale de tu cuenta en este navegador. Tus datos se conservan y podés volver a entrar cuando quieras.</p>
      <button type="button" onClick={logout} className="btn-secondary btn-sm mt-3">Cerrar sesión</button>
    </Card>

    <Card>
      <Overline>Verificación de correo</Overline>
      <p className="mt-2 text-[13px] leading-5 text-soft">Te enviamos un enlace para confirmar que el correo es tuyo.</p>
      <button type="button" disabled={emailBusy} onClick={verifyEmail} className="btn-secondary btn-sm mt-3">{emailBusy?'Solicitando…':'Enviar enlace de confirmación'}</button>
      {emailMessage && <p role="status" className="mt-2 text-[13px] leading-5 text-ink">{emailMessage}</p>}
    </Card>

    <Card>
      <Overline>Tus datos</Overline>
      <p className="mt-2 text-[13px] leading-5 text-soft">Descargá una copia en formato JSON de tus posiciones, alertas y preferencias.</p>
      <button type="button" onClick={download} className="btn-secondary btn-sm mt-3">Descargar mis datos</button>
    </Card>

    {error && <p role="alert" className="alert-error">{error}</p>}

    <DeleteAccountSection />
    <Footer />
  </div>;
}
