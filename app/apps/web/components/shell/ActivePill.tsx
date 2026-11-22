"use client";

import { type RefObject, useCallback, useEffect, useLayoutEffect, useState } from "react";

export interface PillBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Mide el enlace activo (`aria-current="page"`) dentro de `container` y devuelve su caja, para que la pastilla de vidrio
 * se deslice hasta él. El contenedor debe ser `position: relative` (es el `offsetParent` de los enlaces). Sin enlace
 * activo (p. ej. /account) no hay caja y la pastilla se oculta. `animate` arranca en falso: la primera posición, y cualquier
 * cambio de tamaño de pantalla, se aplican sin deslizar; solo el cambio de pestaña se anima.
 */
export function useActivePill(container: RefObject<HTMLElement | null>, routeKey: string) {
  const [box, setBox] = useState<PillBox | null>(null);
  const [animate, setAnimate] = useState(false);

  const measure = useCallback(() => {
    const el = container.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!container.current || !el) {
      setBox(null);
      return;
    }
    const next = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
    setBox((prev) => (prev && prev.x === next.x && prev.y === next.y && prev.w === next.w && prev.h === next.h ? prev : next));
  }, [container]);

  useLayoutEffect(() => {
    measure();
  }, [measure, routeKey]);

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setAnimate(false);
      measure();
    });
    ro.observe(el);
    // Las tipografías tardan en cargar y pueden mover los enlaces unos píxeles.
    void document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [container, measure]);

  // Tras colocar la pastilla por primera vez (o tras un redimensionado) se habilita la animación para los próximos cambios.
  useEffect(() => {
    if (!box || animate) return;
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [box, animate]);

  return { box, animate };
}

/** Pastilla de vidrio que se desliza detrás del enlace activo (con rebote suave). Decorativa. */
export function ActivePill({ box, animate, className = "" }: { box: PillBox | null; animate: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`glass-pill pointer-events-none absolute left-0 top-0 ${className}`}
      style={{
        width: box?.w ?? 0,
        height: box?.h ?? 0,
        transform: `translate(${box?.x ?? 0}px, ${box?.y ?? 0}px)`,
        opacity: box ? 1 : 0,
        transition: animate
          ? "transform 520ms cubic-bezier(0.34, 1.2, 0.64, 1), width 520ms cubic-bezier(0.34, 1.2, 0.64, 1), height 520ms cubic-bezier(0.34, 1.2, 0.64, 1), opacity 200ms ease"
          : "none",
      }}
    />
  );
}
