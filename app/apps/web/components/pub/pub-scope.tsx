import type { ReactNode } from "react";
import "./pub.css";
import { cn } from "@/lib/pub/cn";

/** Contenedor de las pantallas públicas rediseñadas; encapsula fuentes y estilos base. */
export function PubScope({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("pub", className)}>{children}</div>;
}
