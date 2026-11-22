import Image from "next/image";
import { cn } from "@/lib/pub/cn";

type LogoProps = { className?: string; priority?: boolean };

const BRAND = "/brand/redesign";

// La altura la define cada uso (className); `h-8`/`h-9` solo aplican si no se indica ninguna.
export function LogoMark({ className, priority }: LogoProps) {
  return (
    <Image
      src={`${BRAND}/allocia-mark.png`}
      alt="Allocia"
      width={778}
      height={541}
      priority={priority}
      className={cn("w-auto", className ?? "h-8")}
    />
  );
}

export function Logo({ className, priority }: LogoProps) {
  return (
    <>
      <Image
        src={`${BRAND}/allocia-logo.png`}
        alt="Allocia — Inteligencia para tu cartera"
        width={1226}
        height={272}
        priority={priority}
        className={cn("logo-light w-auto", className ?? "h-9")}
      />
      {/* En el tema oscuro se muestra la versión blanca (decorativa: el nombre accesible ya lo da la clara). */}
      <Image
        src={`${BRAND}/allocia-logo-white.png`}
        alt=""
        width={1226}
        height={272}
        priority={priority}
        className={cn("logo-dark w-auto", className ?? "h-9")}
      />
    </>
  );
}

export function LogoWhite({ className, priority }: LogoProps) {
  return (
    <Image
      src={`${BRAND}/allocia-logo-white.png`}
      alt="Allocia — Inteligencia para tu cartera"
      width={1226}
      height={272}
      priority={priority}
      className={cn("w-auto", className ?? "h-9")}
    />
  );
}
