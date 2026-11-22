import { ThemedLogo } from "@/components/theme/ThemedLogo";

export default function PrivacyPage() {
  return <main className="bg-bg px-4 py-10 sm:px-6">
   <div className="mx-auto max-w-3xl">
    <div className="mb-6 flex justify-center sm:justify-start"><ThemedLogo alt="Allocia" priority className="h-auto w-[168px]" /></div>
    <article className="space-y-4 rounded-card border border-line bg-card p-6 shadow-card sm:p-10 [&>p]:text-[15px] [&>p]:leading-7 [&>p]:text-soft">
    <h1 className="font-heading text-3xl font-bold tracking-[-0.02em] text-ink">Política de privacidad</h1>
    <p>Versión 9 de octubre de 2026. Este texto debe ser revisado por el responsable legal antes de publicar el servicio.</p>
    <h2 className="section-title pt-3">Responsables y contacto</h2>
    <p>Mauricio Huentelaf y Maximo Rosso. Para consultas sobre privacidad o solicitudes relacionadas con tus datos, escribí a <a className="font-medium text-secondary underline underline-offset-2" href="mailto:mauhuentelaf@uade.edu.ar">mauhuentelaf@uade.edu.ar</a> o <a className="font-medium text-secondary underline underline-offset-2" href="mailto:maxrosso@uade.edu.ar">maxrosso@uade.edu.ar</a>.</p>
    <h2 className="section-title pt-3">Datos y finalidad</h2>
    <p>Allocia trata nombre, correo, credenciales protegidas, activos y cantidades de la cartera, preferencias de alertas y dispositivos de notificación. Se usan para autenticar la cuenta, calcular la composición, generar informes de los activos elegidos y entregar alertas solicitadas.</p>
    <p>Las cantidades de la cartera permanecen cifradas en el backend y no se envían al proveedor de inteligencia artificial. El proveedor recibe información pública del activo y las fuentes recuperadas. Las notificaciones no muestran cantidades en la pantalla bloqueada.</p>
    <h2 className="section-title pt-3">Conservación y terceros</h2>
    <p>Las alertas e informes se conservan hasta 90 días. La arquitectura prevista utiliza Vercel para la web, Railway para la API y la base de datos, Resend para correos de acceso y verificación, Anthropic para el análisis de texto, Finnhub y CoinGecko para datos de mercado y Expo para notificaciones push. Resend recibe el correo destinatario y el enlace de acceso o verificación; no recibe tu cartera. Antes del lanzamiento deben completarse el domicilio de los responsables, los países de tratamiento y los plazos de conservación de los respaldos.</p>
    <h2 className="section-title pt-3">Tus decisiones y derechos</h2>
    <p>Podés desactivar alertas, exportar tus datos y eliminar la cuenta desde Cuenta. La eliminación borra la cuenta, las posiciones, las alertas asociadas y los dispositivos registrados. Podés solicitar acceso, rectificación, actualización o supresión y retirar el consentimiento mediante los correos de contacto indicados arriba.</p>
    <h2 className="section-title pt-3">Alcance financiero</h2>
    <p>Los informes describen escenarios condicionales con fuentes y limitaciones. No ejecutan operaciones ni garantizan resultados. La clasificación jurídica del servicio y el texto público deben ser revisados con asesoría local antes de ofrecerlo al público inversor.</p>
    </article>
   </div>
  </main>;
}
