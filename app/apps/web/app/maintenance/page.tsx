import { ThemedLogo } from "@/components/theme/ThemedLogo";
import Link from "next/link";

export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-6">
      <section className="w-full max-w-lg space-y-5 rounded-card border border-line bg-card p-8 shadow-card sm:p-10">
        <ThemedLogo alt="Allocia" priority className="h-auto w-[150px]" />
        <h1 className="font-heading text-3xl font-bold tracking-[-0.02em] text-ink">Estamos preparando Allocia</h1>
        <p className="leading-7 text-soft">El acceso a las cuentas está temporalmente deshabilitado mientras completamos la actualización del servicio. Volvé más tarde.</p>
        <Link className="inline-flex min-h-[44px] items-center text-sm font-semibold text-secondary underline-offset-2 hover:underline" href="/privacy">Política de privacidad</Link>
      </section>
    </main>
  );
}
