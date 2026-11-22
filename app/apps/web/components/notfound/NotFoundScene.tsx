"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { LogoWhite } from "../pub/logo";

/**
 * Página 404 de Allocia: una cartera a oscuras y una linterna que la recorre buscando lo que falta.
 * El haz se mueve solo (una trayectoria suave) y sigue al puntero o al dedo cuando la persona lo mueve; donde ilumina
 * aparecen el «404», la grilla del gráfico y una nota que en la oscuridad no se lee. Con «reducir movimiento» el haz
 * queda quieto en el centro. Todo es decorativo salvo el texto y los botones, que se leen siempre.
 */
export function NotFoundScene() {
  const scene = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scene.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const set = (x: number, y: number) => {
      el.style.setProperty("--x", `${x}px`);
      el.style.setProperty("--y", `${y}px`);
    };
    const rect = () => el.getBoundingClientRect();
    // Las capas iluminadas usan las coordenadas de la escena: se les pasa su propio desplazamiento.
    const offsets = () => {
      const r = rect();
      el.querySelectorAll<HTMLElement>("[data-lit]").forEach((n) => {
        const b = n.getBoundingClientRect();
        n.style.setProperty("--ox", `${b.left - r.left}px`);
        n.style.setProperty("--oy", `${b.top - r.top}px`);
      });
    };
    offsets();
    const ro = new ResizeObserver(offsets);
    ro.observe(el);
    if (reduced) {
      const r = rect();
      set(r.width / 2, r.height * 0.36);
      return () => ro.disconnect();
    }
    let raf = 0;
    let t = 0;
    let last = performance.now();
    let pointer: { x: number; y: number; at: number } | null = null;
    const pos = { x: rect().width * 0.3, y: rect().height * 0.4 };
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;
      const r = rect();
      // Trayectoria automática (Lissajous lenta) sobre la zona del «404».
      let tx = r.width * (0.5 + 0.3 * Math.sin(t * 0.55));
      let ty = r.height * (0.34 + 0.1 * Math.sin(t * 0.9 + 0.6));
      if (pointer && now - pointer.at < 2600) {
        tx = pointer.x;
        ty = pointer.y;
      }
      // La linterna sigue al objetivo con un poco de inercia, como una mano.
      pos.x += (tx - pos.x) * Math.min(1, dt * 5);
      pos.y += (ty - pos.y) * Math.min(1, dt * 5);
      set(pos.x, pos.y);
      raf = requestAnimationFrame(tick);
    };
    const move = (e: PointerEvent) => {
      const r = rect();
      pointer = { x: e.clientX - r.left, y: e.clientY - r.top, at: performance.now() };
    };
    const vis = () => {
      cancelAnimationFrame(raf);
      if (document.visibilityState === "visible") {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerdown", move);
    document.addEventListener("visibilitychange", vis);
    raf = requestAnimationFrame(tick);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerdown", move);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  const digits = (
    <svg viewBox="0 0 600 220" className="h-auto w-full" aria-hidden="true">
      {/* Grilla del gráfico: líneas de referencia con sus valores, como en un panel de cotizaciones. */}
      {[30, 80, 130, 180].map((y, i) => (
        <g key={y}>
          <line x1="0" x2="600" y1={y} y2={y} className="nf-grid" />
          <text x="596" y={y - 6} textAnchor="end" className="nf-axis">
            {["US$ 404", "US$ 303", "US$ 202", "US$ 101"][i]}
          </text>
        </g>
      ))}
      {/* Una línea de precio que se corta: el dato que falta. */}
      <path d="M0 170 L70 150 L120 160 L170 120 L215 132 L260 96" className="nf-line" />
      <path d="M260 96 L300 96" className="nf-line nf-line--gap" />
      <circle cx="260" cy="96" r="4.5" className="nf-dot" />
      <text x="300" y="168" textAnchor="middle" className="nf-digits">
        404
      </text>
    </svg>
  );

  return (
    <div ref={scene} className="nf-scene relative isolate flex min-h-dvh flex-col overflow-hidden text-white">
      <header className="relative z-20 px-6 pt-6 sm:px-10 sm:pt-8">
        <Link href="/resumen" aria-label="Allocia — ir al resumen" className="inline-block">
          <LogoWhite className="h-8 w-auto sm:h-9" priority />
        </Link>
      </header>

      <main className="relative z-20 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        {/* Dos copias del gráfico: la oscura siempre visible y la iluminada, recortada por el haz de la linterna. */}
        <div className="relative w-full max-w-[640px]">
          <div className="nf-dark">{digits}</div>
          <div data-lit className="nf-lit absolute inset-0">{digits}</div>
          <p data-lit className="nf-secret pointer-events-none absolute inset-x-0 top-[93%] text-center text-[11px] font-semibold uppercase tracking-[0.16em] sm:text-[12px] sm:tracking-[0.18em]">
            Activo no encontrado · dato no disponible
          </p>
        </div>

        <h1 className="mt-8 font-heading text-[28px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[36px]">
          Esta página no está en tu cartera
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-6 text-white/70">
          Revisamos con la linterna y no aparece: la dirección no existe o se movió. Tus datos siguen donde estaban.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/resumen" className="nf-btn nf-btn--primary">
            Volver al resumen
          </Link>
          <Link href="/cartera" className="nf-btn nf-btn--glass">
            Ir a Cartera
          </Link>
        </div>
        <p className="sr-only">Error 404: página no encontrada.</p>
      </main>
    </div>
  );
}
