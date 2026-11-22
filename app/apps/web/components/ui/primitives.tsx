import { PhoneTitleActions } from "../shell/PhoneTitleActions";
import type { ReactNode } from "react";

export function ScreenTitle({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  // Título y subtítulo a la izquierda; las acciones del encabezado, a la derecha y alineadas con la
  // línea del título en TODAS las rutas (antes iban pegadas al pie del subtítulo y cambiaban de altura
  // según cuántas líneas ocupara el texto). En pantallas angostas pasan debajo, a ancho completo.
  // En el teléfono no hay cabecera fija (como en la app): el tema y la cuenta van a la derecha del título.
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <h1 className="min-w-0 flex-1 font-heading text-[30px] font-extrabold leading-tight tracking-[-0.03em] text-ink md:text-[38px]">
            {title}
          </h1>
          <PhoneTitleActions />
        </div>
        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-[15px] leading-6 text-soft md:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div className="no-print flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end md:pt-0.5">{actions}</div> : null}
    </div>
  );
}

export function Card({
  children,
  tone = "card",
  className = "",
  as: Tag = "div",
  ...rest
}: {
  children: ReactNode;
  tone?: "card" | "low";
  className?: string;
  as?: "div" | "section" | "article";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={`${tone === "low" ? "card-low" : "card"} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export function Overline({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow ${className}`}>{children}</p>;
}

export function Divider({ className = "" }: { className?: string }) {
  return <hr className={`my-[14px] border-0 border-t border-line ${className}`} />;
}

export function Footer() {
  return (
    <p className="mt-2 text-micro text-muted">
      Prototipo académico Allocia (UADE · PFI 2026 · Rosso, Huentelaf). La información presentada no
      constituye asesoramiento financiero.
    </p>
  );
}

export function Metric({
  label,
  icon,
  children,
  hint,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <Card className="!p-3.5 sm:!p-5">
      <p className="eyebrow flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p className="mt-1.5 text-[17px] font-semibold tabular-nums text-ink md:text-xl">{children}</p>
      {hint ? <p className="mt-1 text-xs text-soft">{hint}</p> : null}
    </Card>
  );
}
