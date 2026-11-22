"use client";

import { useEffect, useRef, useState } from "react";
import { changeDirection } from "@/lib/live-prices";

/**
 * Cifra que se actualiza en su lugar. Cuando el valor cambia por un refresco automático, se tiñe un instante de verde
 * (suba) o rojo (baja) y vuelve a su color; no parpadea ni se mueve. El cambio también se anuncia en texto oculto para
 * lectores de pantalla solo si `announce` está activo (para no saturar una tabla).
 */
export function LiveValue({
  value,
  children,
  className = "",
}: {
  value: number | null | undefined;
  children: React.ReactNode;
  className?: string;
}) {
  const prev = useRef(value);
  const [dir, setDir] = useState<"up" | "down" | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const d = changeDirection(prev.current, value);
    prev.current = value;
    if (!d) return;
    setDir(d);
    setTick((t) => t + 1);
    const id = window.setTimeout(() => setDir(null), 1600);
    return () => window.clearTimeout(id);
  }, [value]);

  return (
    <span key={tick} data-change={dir ?? undefined} className={`live-value ${className}`}>
      {children}
    </span>
  );
}
