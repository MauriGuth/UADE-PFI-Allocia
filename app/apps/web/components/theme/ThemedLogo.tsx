import Image from "next/image";

type Props = { className?: string; width?: number; height?: number; priority?: boolean; alt?: string };

// Cada uso pinta las dos versiones y el tema muestra una (reglas .logo-light / .logo-dark en globals.css): el logo oscuro
// es azul marino y se perdería sobre el fondo del tema oscuro. La versión para fondo oscuro es decorativa (alt vacío)
// para que el nombre accesible no se repita.
export function ThemedLogo({ className, width = 1200, height = 299, priority, alt = "Allocia — Inteligencia para tu cartera" }: Props) {
  return (
    <>
      <Image src="/brand/allocia-logo.png" alt={alt} width={width} height={height} priority={priority} className={`logo-light ${className ?? ""}`} />
      <Image
        src="/brand/redesign/allocia-logo-white.png"
        alt=""
        width={1226}
        height={272}
        priority={priority}
        className={`logo-dark ${className ?? ""}`}
      />
    </>
  );
}

export function ThemedMark({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <>
      <Image src="/brand/allocia-mark.png" alt="" width={31} height={22} priority={priority} className={`logo-light ${className ?? ""}`} />
      <Image src="/brand/redesign/allocia-mark-white.png" alt="" width={778} height={541} priority={priority} className={`logo-dark ${className ?? ""}`} />
    </>
  );
}
