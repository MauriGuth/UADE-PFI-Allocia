import type { ReactNode } from "react";

/**
 * Íconos de navegación de Allocia.
 *
 * Criterios (inspirados en los principios de SF Symbols, sin copiar dibujos de Apple):
 *   · Una sola grilla de 24 px con margen óptico de 2.5 px y el mismo peso visual en todos.
 *   · Trazo de 1.7 con puntas y uniones redondeadas; esquinas con radio generoso.
 *   · En reposo, contorno. Activo, «jerárquico»: la forma de fondo se rellena con el color al 22 % y el detalle que da el
 *     significado (la porción de la torta, el signo de riesgo, el badajo) queda en el tono pleno, con un trazo apenas más
 *     grueso. Así la pestaña elegida se lee por forma y no solo por color.
 */
export interface NavIconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  active?: boolean;
}

function Base({ size = 22, className, strokeWidth, active, children }: NavIconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth ?? (active ? 1.9 : 1.7)}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

const SOFT = 0.22; // relleno de la capa secundaria en el estado activo

/** Resumen: cuatro paneles; activo, dos destacados en diagonal. */
export function NavResumen(p: NavIconProps) {
  const tile = (x: number, y: number, strong: boolean) => (
    <rect
      x={x}
      y={y}
      width="7.5"
      height="7.5"
      rx="2.4"
      fill={p.active ? "currentColor" : "none"}
      fillOpacity={p.active ? (strong ? 1 : SOFT) : undefined}
    />
  );
  return (
    <Base {...p}>
      {tile(3.25, 3.25, true)}
      {tile(13.25, 3.25, false)}
      {tile(3.25, 13.25, false)}
      {tile(13.25, 13.25, true)}
    </Base>
  );
}

/** Cartera: torta con una porción separada (cómo se reparte el dinero). */
export function NavCartera(p: NavIconProps) {
  return (
    <Base {...p}>
      <path d="M11 4.1A8.5 8.5 0 1 0 19.9 13H11z" fill={p.active ? "currentColor" : "none"} fillOpacity={p.active ? SOFT : undefined} />
      <path d="M14 3.3a7.4 7.4 0 0 1 6.7 6.7H14z" fill={p.active ? "currentColor" : "none"} />
    </Base>
  );
}

/** Desglose: capas apiladas; activo, la superior llena. */
export function NavDesglose(p: NavIconProps) {
  return (
    <Base {...p}>
      <path d="M12 3.5 20.5 8 12 12.5 3.5 8z" fill={p.active ? "currentColor" : "none"} />
      <path d="M3.5 12 12 16.5 20.5 12" />
      <path d="M3.5 16 12 20.5 20.5 16" opacity={p.active ? 0.55 : 1} />
    </Base>
  );
}

/** Riesgo: escudo con signo de atención (revisar la exposición, no una alarma). */
export function NavRiesgo(p: NavIconProps) {
  return (
    <Base {...p}>
      <path
        d="M12 3 19 5.8v5.6c0 4.4-2.9 7.9-7 9.6-4.1-1.7-7-5.2-7-9.6V5.8z"
        fill={p.active ? "currentColor" : "none"}
        fillOpacity={p.active ? SOFT : undefined}
      />
      <path d="M12 8.2v4.3" />
      <circle cx="12" cy="15.6" r="0.55" fill="currentColor" stroke="none" />
    </Base>
  );
}

/** Señales: pulso del mercado dentro de un marco redondeado. */
export function NavSenales(p: NavIconProps) {
  return (
    <Base {...p}>
      {p.active ? <rect x="2.5" y="4" width="19" height="16" rx="5" fill="currentColor" fillOpacity={SOFT} stroke="none" /> : null}
      <path d="M3.5 12.5h3.3l2.2-5 4 10 2.4-5h5.1" />
    </Base>
  );
}

/** Alertas: campana; activo, cuerpo relleno y badajo pleno. */
export function NavAlertas(p: NavIconProps) {
  return (
    <Base {...p}>
      <path
        d="M6.2 10a5.8 5.8 0 0 1 11.6 0v3.4l1.7 2.6a.9.9 0 0 1-.8 1.4H5.3a.9.9 0 0 1-.8-1.4l1.7-2.6z"
        fill={p.active ? "currentColor" : "none"}
        fillOpacity={p.active ? SOFT : undefined}
      />
      <path d="M10 20.2a2.2 2.2 0 0 0 4 0" />
    </Base>
  );
}

/** Informe: hoja con renglones y esquina plegada. */
export function NavInforme(p: NavIconProps) {
  return (
    <Base {...p}>
      <path
        d="M7 3h7l5 5v10.5A2.5 2.5 0 0 1 16.5 21h-9.5A2.5 2.5 0 0 1 4.5 18.5v-13A2.5 2.5 0 0 1 7 3z"
        fill={p.active ? "currentColor" : "none"}
        fillOpacity={p.active ? SOFT : undefined}
      />
      <path d="M14 3v3.5A1.5 1.5 0 0 0 15.5 8H19" />
      <path d="M8.5 12.5h7M8.5 16h4.5" />
    </Base>
  );
}

/** Ajustes: engranaje de dientes redondeados. */
export function NavAjustes(p: NavIconProps) {
  return (
    <Base {...p}>
      <path
        d="M10.3 3.6a1.8 1.8 0 0 1 3.4 0l.3.9a1.8 1.8 0 0 0 2.4 1l.9-.4a1.8 1.8 0 0 1 2.4 2.4l-.4.9a1.8 1.8 0 0 0 1 2.4l.9.3a1.8 1.8 0 0 1 0 3.4l-.9.3a1.8 1.8 0 0 0-1 2.4l.4.9a1.8 1.8 0 0 1-2.4 2.4l-.9-.4a1.8 1.8 0 0 0-2.4 1l-.3.9a1.8 1.8 0 0 1-3.4 0l-.3-.9a1.8 1.8 0 0 0-2.4-1l-.9.4a1.8 1.8 0 0 1-2.4-2.4l.4-.9a1.8 1.8 0 0 0-1-2.4l-.9-.3a1.8 1.8 0 0 1 0-3.4l.9-.3a1.8 1.8 0 0 0 1-2.4l-.4-.9a1.8 1.8 0 0 1 2.4-2.4l.9.4a1.8 1.8 0 0 0 2.4-1z"
        fill={p.active ? "currentColor" : "none"}
        fillOpacity={p.active ? SOFT : undefined}
      />
      <circle cx="12" cy="12" r="3" />
    </Base>
  );
}

/**
 * Mundo / contexto global: globo con meridiano y paralelos, y un punto de noticia arriba a la derecha. Se usa para el
 * contexto de mercado y como respaldo neutro cuando una noticia no tiene medio identificado.
 */
export function GlobeNews({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className}>
      <path d="M19.6 10.2A8.2 8.2 0 1 1 13.8 4" />
      <path d="M3.9 12h16.2" opacity="0.7" />
      <path d="M12 3.8c-2.2 2.3-3.3 5-3.3 8.2s1.1 5.9 3.3 8.2c2.2-2.3 3.3-5 3.3-8.2" />
      <circle cx="18.6" cy="5.4" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
