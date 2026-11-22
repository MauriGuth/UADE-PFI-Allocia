import type { ComponentType } from "react";
import { NavAjustes, NavAlertas, NavCartera, NavDesglose, NavInforme, NavResumen, NavRiesgo, NavSenales } from "../nav-icons";

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string; strokeWidth?: number; active?: boolean }>;
  /** true = pestaña de la app móvil (se muestra en la barra inferior en móvil web). */
  tab: boolean;
}

// Los cinco módulos de la app móvil (Resumen, Cartera, Riesgo, Señales, Ajustes)
// más dos vistas propias de escritorio: Desglose e Informe.
export const NAV: NavItem[] = [
  { href: "/resumen", label: "Resumen", icon: NavResumen, tab: true },
  { href: "/cartera", label: "Cartera", icon: NavCartera, tab: true },
  { href: "/desglose", label: "Desglose", icon: NavDesglose, tab: false },
  { href: "/riesgo", label: "Riesgo", icon: NavRiesgo, tab: true },
  { href: "/senales", label: "Señales", icon: NavSenales, tab: true },
  { href: "/market", label: "Alertas", icon: NavAlertas, tab: true },
  { href: "/informe", label: "Informe", icon: NavInforme, tab: false },
  { href: "/ajustes", label: "Ajustes", icon: NavAjustes, tab: true },
];

// Grupos del menú lateral (rediseño): mismas siete+una entradas, solo agrupadas.
export const NAV_GROUPS: { label: string; hrefs: string[] }[] = [
  { label: "Portafolio", hrefs: ["/resumen", "/cartera", "/desglose", "/riesgo"] },
  { label: "Mercado", hrefs: ["/senales", "/market"] },
  { label: "Herramientas", hrefs: ["/informe", "/ajustes"] },
];

export const isActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(href + "/");
