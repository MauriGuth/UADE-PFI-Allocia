import React from "react";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";

// Íconos de Allocia (los mismos dibujos que la web, apps/web/components/nav-icons.tsx).
// Grilla de 24 pt, trazo redondeado. En la navegación, el activo es «jerárquico»: la forma de fondo se rellena al 22 % y
// el detalle que da el significado queda en el tono pleno, así la pestaña elegida se lee por forma y no solo por color.

export type NavIconName = "resumen" | "cartera" | "riesgo" | "senales" | "alertas" | "ajustes";

const SOFT = 0.22;

interface IconProps {
  size?: number;
  color: string;
  strokeWidth?: number;
}

function Base({ size = 22, color, strokeWidth = 1.8, children }: IconProps & { children: React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {children}
    </Svg>
  );
}

export function NavIcon({ name, color, active = false, size = 24 }: { name: NavIconName; color: string; active?: boolean; size?: number }) {
  const fill = active ? color : "none";
  const soft = active ? SOFT : undefined;
  const sw = active ? 1.95 : 1.7;
  switch (name) {
    case "resumen": {
      const tile = (x: number, y: number, strong: boolean) => (
        <Rect x={x} y={y} width={7.5} height={7.5} rx={2.4} fill={fill} fillOpacity={active ? (strong ? 1 : SOFT) : undefined} />
      );
      return (
        <Base size={size} color={color} strokeWidth={sw}>
          {tile(3.25, 3.25, true)}
          {tile(13.25, 3.25, false)}
          {tile(3.25, 13.25, false)}
          {tile(13.25, 13.25, true)}
        </Base>
      );
    }
    case "cartera":
      return (
        <Base size={size} color={color} strokeWidth={sw}>
          <Path d="M11 4.1A8.5 8.5 0 1 0 19.9 13H11z" fill={fill} fillOpacity={soft} />
          <Path d="M14 3.3a7.4 7.4 0 0 1 6.7 6.7H14z" fill={fill} />
        </Base>
      );
    case "riesgo":
      return (
        <Base size={size} color={color} strokeWidth={sw}>
          <Path d="M12 3 19 5.8v5.6c0 4.4-2.9 7.9-7 9.6-4.1-1.7-7-5.2-7-9.6V5.8z" fill={fill} fillOpacity={soft} />
          <Path d="M12 8.2v4.3" />
          <Circle cx={12} cy={15.6} r={0.6} fill={color} stroke="none" />
        </Base>
      );
    case "senales":
      return (
        <Base size={size} color={color} strokeWidth={sw}>
          {active ? <Rect x={2.5} y={4} width={19} height={16} rx={5} fill={color} fillOpacity={SOFT} stroke="none" /> : null}
          <Path d="M3.5 12.5h3.3l2.2-5 4 10 2.4-5h5.1" />
        </Base>
      );
    case "alertas":
      return (
        <Base size={size} color={color} strokeWidth={sw}>
          <Path
            d="M6.2 10a5.8 5.8 0 0 1 11.6 0v3.4l1.7 2.6a.9.9 0 0 1-.8 1.4H5.3a.9.9 0 0 1-.8-1.4l1.7-2.6z"
            fill={fill}
            fillOpacity={soft}
          />
          <Path d="M10 20.2a2.2 2.2 0 0 0 4 0" />
        </Base>
      );
    case "ajustes":
      return (
        <Base size={size} color={color} strokeWidth={sw}>
          <Path
            d="M10.3 3.6a1.8 1.8 0 0 1 3.4 0l.3.9a1.8 1.8 0 0 0 2.4 1l.9-.4a1.8 1.8 0 0 1 2.4 2.4l-.4.9a1.8 1.8 0 0 0 1 2.4l.9.3a1.8 1.8 0 0 1 0 3.4l-.9.3a1.8 1.8 0 0 0-1 2.4l.4.9a1.8 1.8 0 0 1-2.4 2.4l-.9-.4a1.8 1.8 0 0 0-2.4 1l-.3.9a1.8 1.8 0 0 1-3.4 0l-.3-.9a1.8 1.8 0 0 0-2.4-1l-.9.4a1.8 1.8 0 0 1-2.4-2.4l.4-.9a1.8 1.8 0 0 0-1-2.4l-.9-.3a1.8 1.8 0 0 1 0-3.4l.9-.3a1.8 1.8 0 0 0 1-2.4l-.4-.9a1.8 1.8 0 0 1 2.4-2.4l.9.4a1.8 1.8 0 0 0 2.4-1z"
            fill={fill}
            fillOpacity={soft}
          />
          <Circle cx={12} cy={12} r={3} />
        </Base>
      );
  }
}

/** Mundo con un punto de noticia: contexto de mercado y respaldo neutro cuando una nota no tiene medio identificado. */
export function GlobeNews({ size = 20, color }: IconProps) {
  return (
    <Base size={size} color={color} strokeWidth={1.6}>
      <Path d="M19.6 10.2A8.2 8.2 0 1 1 13.8 4" />
      <Path d="M3.9 12h16.2" opacity={0.7} />
      <Path d="M12 3.8c-2.2 2.3-3.3 5-3.3 8.2s1.1 5.9 3.3 8.2c2.2-2.3 3.3-5 3.3-8.2" />
      <Circle cx={18.6} cy={5.4} r={2.4} fill={color} stroke="none" />
    </Base>
  );
}

export const IconSun = (p: IconProps) => (
  <Base {...p}>
    <Circle cx={12} cy={12} r={4} />
    <Path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
  </Base>
);
export const IconMoon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M20.2 14.6A8.3 8.3 0 0 1 9.4 3.8a8.3 8.3 0 1 0 10.8 10.8z" />
  </Base>
);
export const IconPhone = (p: IconProps) => (
  <Base {...p}>
    <Rect x={6.5} y={2.75} width={11} height={18.5} rx={3} />
    <Path d="M10.5 18h3" />
  </Base>
);
export const IconChevron = ({ up = false, right = false, ...p }: IconProps & { up?: boolean; right?: boolean }) => (
  <Base {...p}>
    <Path d={right ? "m9 6 6 6-6 6" : up ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} />
  </Base>
);
export const IconArrowLeft = (p: IconProps) => (
  <Base {...p}>
    <Path d="M19 12H5M11 18l-6-6 6-6" />
  </Base>
);
export const IconArrowRight = (p: IconProps) => (
  <Base {...p}>
    <Path d="M5 12h14M13 6l6 6-6 6" />
  </Base>
);
export const IconCheck = (p: IconProps) => (
  <Base {...p}>
    <Path d="m5 12.5 4.5 4.5L19 7.5" />
  </Base>
);
export const IconInfo = (p: IconProps) => (
  <Base {...p}>
    <Circle cx={12} cy={12} r={9} />
    <Path d="M12 11v5.5" />
    <Circle cx={12} cy={7.8} r={0.6} fill={p.color} stroke="none" />
  </Base>
);
export const IconClose = (p: IconProps) => (
  <Base {...p}>
    <Path d="M6 6l12 12M18 6 6 18" />
  </Base>
);
export const IconPlus = (p: IconProps) => (
  <Base {...p}>
    <Path d="M12 5v14M5 12h14" />
  </Base>
);
export const IconRefresh = (p: IconProps) => (
  <Base {...p}>
    <Path d="M20 11a8 8 0 0 0-14.3-4.6L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0 0 14.3 4.6l1.7-2.1M20 20v-4.5h-4.5" />
  </Base>
);
export const IconExternal = (p: IconProps) => (
  <Base {...p}>
    <Path d="M14 4h6v6M20 4l-8.5 8.5M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
  </Base>
);
export const IconPencil = (p: IconProps) => (
  <Base {...p}>
    <Path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
    <Path d="m13.5 6.5 4 4" />
  </Base>
);
export const IconTrash = (p: IconProps) => (
  <Base {...p}>
    <Path d="M4.5 7h15M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4.5h6V7" />
  </Base>
);
export const IconUserX = (p: IconProps) => (
  <Base {...p}>
    <Circle cx={10} cy={8} r={4} />
    <Path d="M3 20.5a7 7 0 0 1 11.5-5.4M16.5 15.5l5 5M21.5 15.5l-5 5" />
  </Base>
);
export const IconLogout = (p: IconProps) => (
  <Base {...p}>
    <Path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14M10 16.5 5.5 12 10 7.5M5.5 12H15" />
  </Base>
);
export const IconDownload = (p: IconProps) => (
  <Base {...p}>
    <Path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />
  </Base>
);
export const IconMail = (p: IconProps) => (
  <Base {...p}>
    <Rect x={3} y={5} width={18} height={14} rx={3} />
    <Path d="m4 7 8 6 8-6" />
  </Base>
);
export const IconSpark = (p: IconProps) => (
  <Base {...p}>
    <Path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.3l-1.9-5.5L4.5 10.9 10.1 9z" />
  </Base>
);
export const IconBell = (p: IconProps) => <NavIcon name="alertas" color={p.color} size={p.size} />;
export const IconDot = ({ size = 8, color }: { size?: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 8 8">
    <Circle cx={4} cy={4} r={4} fill={color} />
  </Svg>
);
export const IconLine = ({ color }: { color: string }) => (
  <Svg width={4} height={14} viewBox="0 0 4 14">
    <Line x1={2} y1={2} x2={2} y2={12} stroke={color} strokeWidth={3} strokeLinecap="round" />
  </Svg>
);
