import Image from "next/image";
import type { ReactNode } from "react";

// Pantalla dividida (wireframe "Iniciar sesión"/"Registro"): panel de marca a la
// izquierda en escritorio y formulario a la derecha; en móvil, solo el formulario.
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-card p-12 lg:flex">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(60%_50%_at_20%_100%,#e2dfff_0%,transparent_70%),radial-gradient(50%_45%_at_100%_0%,#eceef0_0%,transparent_70%)]"
        />
        <div className="relative">
          <Image
            src="/brand/allocia-logo.png"
            alt="Allocia — Inteligencia para tu cartera"
            width={1200}
            height={299}
            priority
            className="h-auto w-[240px]"
          />
        </div>
        <div className="relative max-w-md">
          <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-ink">Inteligencia de Cartera</h2>
          <p className="mt-3 text-base leading-7 text-soft">
            Analizá tu portafolio multiactivo con contexto geopolítico, señales de mercado y
            recomendaciones que siempre explican su porqué.
          </p>
        </div>
        <p className="relative text-[11px] text-muted">
          Prototipo académico (UADE · PFI 2026). No constituye asesoramiento financiero.
        </p>
      </aside>
      <main className="flex flex-col justify-center bg-bg px-6 py-10 sm:px-12">
        <div className="mb-8 flex justify-center lg:hidden">
          <Image
            src="/brand/allocia-logo.png"
            alt="Allocia"
            width={1200}
            height={299}
            priority
            className="h-auto w-[180px]"
          />
        </div>
        {children}
      </main>
    </div>
  );
}
