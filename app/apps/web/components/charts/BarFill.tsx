"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Relleno de una barra de métrica. La primera vez que la barra entra en pantalla crece desde cero hasta su valor real
 * (una sola vez: no se repite al volver a desplazarse ni en cada render); después, si el valor cambia de verdad, se
 * desliza hasta el nuevo. Durante el llenado un brillo recorre la barra y el extremo lleva una luz tenue.
 * Con «reducir movimiento» la regla global deja las transiciones instantáneas. Al imprimir se muestra el valor final.
 */
export function BarFill({ percent, tone = "primary" }: { percent: number; tone?: "primary" | "secondary" }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const p = Math.max(0, Math.min(100, percent));
  return (
    <span
      ref={ref}
      data-tone={tone}
      data-seen={seen ? "true" : undefined}
      className="bar-fill"
      style={{ width: seen ? `${p}%` : 0, ["--w" as string]: `${p}%` }}
    />
  );
}
