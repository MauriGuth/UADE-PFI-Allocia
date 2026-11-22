"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders children on a fixed-size design canvas and scales it uniformly to fit
 * the available region, so floating cards keep their exact relative composition
 * at every viewport instead of colliding.
 */
export function ScaledStage({
  width,
  height,
  maxScale = 1.3,
  children,
}: {
  width: number;
  height: number;
  maxScale?: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ scale: number; top: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      const scale = Math.min(w / width, h / height, maxScale);
      setBox({ scale, top: Math.max(0, (h - height * scale) / 2) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [width, height, maxScale]);

  return (
    <div ref={ref} className="relative min-h-0 flex-1">
      <div
        className="absolute left-0 origin-top-left"
        style={{
          width,
          height,
          top: box?.top ?? 0,
          transform: `scale(${box?.scale ?? 1})`,
          // Oculto hasta medir el contenedor (evita un salto de escala); sin fundido para no depender de opacidad parcial.
          visibility: box ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
