"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AlertCount } from "./AlertCount";
import { useActivePill } from "./ActivePill";
import { NAV, isActive } from "./nav";

const TABS = NAV.filter((n) => n.tab);

/** Escala de la pastilla mientras se la sostiene (se «levanta» como el vidrio de iOS). */
const LIFT = 1.12;
// Resortes (rigidez, amortiguación): la pastilla sigue al dedo con un poco de retraso y rebota al soltarla.
const SPRING = { k: 300, c: 21 };
const LIFT_SPRING = { k: 420, c: 27 };

interface Spring {
  x: number;
  vx: number;
  w: number;
  vw: number;
  g: number;
  vg: number;
  tx: number;
  tw: number;
  tg: number;
  y: number;
  h: number;
  visible: boolean;
  raf: number;
  last: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Barra de pestañas de vidrio líquido (móvil y tablet). La pastilla es un resorte: al tocar o arrastrar se levanta, se
 * estira según la velocidad y sigue al dedo; al soltar se acomoda en la pestaña más cercana con un rebote y navega a ella.
 * Con «reducir movimiento» se coloca directamente, sin resorte ni estirado. Teclado y lectores de pantalla usan los
 * enlaces normales: la pastilla es decorativa.
 */
export function LiquidTabBar({
  unread,
  unreadDescription,
  className = "",
  style,
}: {
  unread: number;
  unreadDescription: (href: string) => string | undefined;
  className?: string;
  style?: React.CSSProperties;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const rail = useRef<HTMLDivElement | null>(null);
  const pill = useRef<HTMLSpanElement | null>(null);
  const { box, animate } = useActivePill(rail, pathname);
  const activeIdx = TABS.findIndex((t) => isActive(pathname, t.href));

  const [pressed, setPressed] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  // Pestaña elegida que todavía no terminó de cargar: la pastilla y las etiquetas ya la muestran como activa.
  const [pending, setPending] = useState<number | null>(null);
  const pressedRef = useRef(false);
  const drag = useRef<{ startX: number; downIdx: number; dragging: boolean; moved: boolean } | null>(null);
  const spring = useRef<Spring>({
    x: 0, vx: 0, w: 0, vw: 0, g: 1, vg: 0, tx: 0, tw: 0, tg: 1, y: 0, h: 0, visible: false, raf: 0, last: 0,
  });
  const reduced = useRef(false);

  const paint = useCallback(() => {
    const el = pill.current;
    if (!el) return;
    const s = spring.current;
    const speed = Math.abs(s.vx);
    // Estirado en el sentido del movimiento y aplastado en el otro: se ve como un líquido que se arrastra.
    const sx = reduced.current ? 1 : 1 + Math.min(speed / 2600, 0.22);
    const sy = reduced.current ? 1 : 1 - Math.min(speed / 7000, 0.07);
    el.style.width = `${s.w}px`;
    el.style.height = `${s.h}px`;
    el.style.opacity = s.visible ? "1" : "0";
    el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) scale(${sx * s.g}, ${sy * s.g})`;
  }, []);

  const tick = useCallback(
    (now: number) => {
      const s = spring.current;
      const dt = Math.min((now - s.last) / 1000, 1 / 30);
      s.last = now;
      const a = (SPRING.k * (s.tx - s.x) - SPRING.c * s.vx);
      s.vx += a * dt;
      s.x += s.vx * dt;
      const aw = SPRING.k * (s.tw - s.w) - SPRING.c * s.vw;
      s.vw += aw * dt;
      s.w += s.vw * dt;
      const ag = LIFT_SPRING.k * (s.tg - s.g) - LIFT_SPRING.c * s.vg;
      s.vg += ag * dt;
      s.g += s.vg * dt;
      paint();
      const settled =
        Math.abs(s.vx) < 0.05 && Math.abs(s.tx - s.x) < 0.05 && Math.abs(s.vw) < 0.05 && Math.abs(s.tw - s.w) < 0.05 &&
        Math.abs(s.vg) < 0.002 && Math.abs(s.tg - s.g) < 0.002;
      if (settled) {
        s.x = s.tx; s.w = s.tw; s.g = s.tg; s.vx = s.vw = s.vg = 0;
        s.raf = 0;
        paint();
        return;
      }
      s.raf = requestAnimationFrame(tick);
    },
    [paint],
  );

  const run = useCallback(() => {
    const s = spring.current;
    if (reduced.current) {
      s.x = s.tx; s.w = s.tw; s.g = s.tg; s.vx = s.vw = s.vg = 0;
      paint();
      return;
    }
    if (s.raf) return;
    s.last = performance.now();
    s.raf = requestAnimationFrame(tick);
  }, [paint, tick]);

  const snap = useCallback(() => {
    const s = spring.current;
    cancelAnimationFrame(s.raf);
    s.raf = 0;
    s.x = s.tx; s.w = s.tw; s.g = s.tg; s.vx = s.vw = s.vg = 0;
    paint();
  }, [paint]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = mq.matches;
    const on = () => (reduced.current = mq.matches);
    mq.addEventListener("change", on);
    const s = spring.current;
    return () => {
      mq.removeEventListener("change", on);
      cancelAnimationFrame(s.raf);
    };
  }, []);

  // La pestaña activa de la ruta fija el destino de la pastilla (sin deslizar la primera vez ni al redimensionar).
  useLayoutEffect(() => {
    const s = spring.current;
    if (!box) {
      s.visible = false;
      paint();
      return;
    }
    s.y = box.y;
    s.h = box.h;
    if (pressedRef.current) return;
    const first = !s.visible;
    s.visible = true;
    s.tx = box.x;
    s.tw = box.w;
    s.tg = 1;
    if (first || !animate) snap();
    else run();
  }, [box, animate, paint, run, snap]);

  // La ruta ya cambió: deja de «adelantar» la pestaña elegida.
  useEffect(() => setPending(null), [pathname]);
  useEffect(() => {
    if (pending === null) return;
    const id = window.setTimeout(() => setPending(null), 2500);
    return () => window.clearTimeout(id);
  }, [pending]);

  const rects = () =>
    Array.from(rail.current?.querySelectorAll<HTMLElement>("a[data-tab]") ?? []).map((a) => ({
      left: a.offsetLeft,
      width: a.offsetWidth,
    }));

  const indexAt = (clientX: number) => {
    const root = rail.current;
    if (!root) return -1;
    const x = clientX - root.getBoundingClientRect().left;
    const r = rects();
    if (!r.length) return -1;
    let best = 0;
    for (let i = 0; i < r.length; i++) {
      const c = r[i].left + r[i].width / 2;
      if (Math.abs(x - c) < Math.abs(x - (r[best].left + r[best].width / 2))) best = i;
    }
    return best;
  };

  const aimAt = (idx: number) => {
    const r = rects()[idx];
    if (!r) return;
    const s = spring.current;
    s.tx = r.left;
    s.tw = r.width;
  };

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const idx = indexAt(e.clientX);
    if (idx < 0) return;
    drag.current = { startX: e.clientX, downIdx: idx, dragging: false, moved: false };
    pressedRef.current = true;
    setPressed(true);
    setHover(idx);
    const s = spring.current;
    s.visible = true;
    s.tg = reduced.current ? 1 : LIFT;
    aimAt(idx);
    run();

    const move = (ev: PointerEvent) => {
      const d = drag.current;
      const root = rail.current;
      if (!d || !root) return;
      if (!d.dragging && Math.abs(ev.clientX - d.startX) > 5) {
        d.dragging = true;
        d.moved = true;
      }
      if (!d.dragging) return;
      const r = rects();
      const first = r[0];
      const last = r[r.length - 1];
      const w = spring.current.tw || first.width;
      const left = ev.clientX - root.getBoundingClientRect().left - w / 2;
      const min = first.left;
      const max = last.left + last.width - w;
      // Más allá de los extremos la pastilla se resiste, como el vidrio al tirar de él.
      const over = left < min ? left - min : left > max ? left - max : 0;
      spring.current.tx = clamp(left, min, max) + over * 0.28;
      const i = indexAt(ev.clientX);
      setHover((h) => {
        if (h !== i && "vibrate" in navigator) navigator.vibrate?.(4);
        return i;
      });
      run();
    };
    const end = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      const d = drag.current;
      drag.current = null;
      pressedRef.current = false;
      setPressed(false);
      setHover(null);
      const s = spring.current;
      s.tg = 1;
      if (!d) return;
      const cancelled = ev.type === "pointercancel";
      const target = indexAt(ev.clientX);
      if (!cancelled && d.dragging && target >= 0) {
        aimAt(target);
        // El clic que sigue a un arrastre no debe activar el enlace sobre el que se soltó el dedo.
        const stop = (c: Event) => {
          c.preventDefault();
          c.stopPropagation();
        };
        window.addEventListener("click", stop, { capture: true, once: true });
        window.setTimeout(() => window.removeEventListener("click", stop, { capture: true }), 400);
        if (target !== activeIdx) {
          setPending(target);
          router.push(TABS[target].href);
        }
      } else if (!cancelled && target === d.downIdx) {
        // Toque simple: el enlace navega solo; la pastilla ya está en esa pestaña.
        aimAt(target);
        if (target !== activeIdx) setPending(target);
      } else if (box) {
        s.tx = box.x;
        s.tw = box.w;
      }
      run();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }

  const shown = pressed ? hover : (pending ?? (activeIdx >= 0 ? activeIdx : null));

  return (
    <nav
      className={`liquid-bar ${className}`}
      style={style}
      data-pressed={pressed ? "true" : undefined}
      aria-label="Navegación principal"
      onPointerDown={onPointerDown}
    >
      <div ref={rail} className="relative flex">
        <span
          ref={pill}
          aria-hidden="true"
          data-lift={pressed ? "true" : undefined}
          className="glass-pill liquid-pill pointer-events-none absolute left-0 top-0 rounded-full"
          style={{ opacity: 0, transformOrigin: "50% 50%", willChange: "transform" }}
        />
        {TABS.map((item, i) => {
          const active = shown === i;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tab=""
              draggable={false}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              aria-describedby={unreadDescription(item.href)}
              title={item.label}
              className="relative z-10 flex min-h-[46px] flex-1 flex-col items-center justify-center rounded-full md:w-[64px] md:flex-none"
            >
              <span
                className={`relative block transition-[color,transform] duration-300 ease-soft ${active ? "text-secondary" : "text-soft"} ${
                  pressed && active ? "scale-[1.14]" : ""
                }`}
              >
                <Icon size={24} active={active} />
                {item.href === "/market" && <AlertCount count={unread} className="-right-3.5 -top-2 ring-2 ring-card" />}
              </span>
              {/* Solo íconos a la vista; el nombre queda para lectores de pantalla (y como título al mantener el puntero). */}
              <span className="sr-only">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
