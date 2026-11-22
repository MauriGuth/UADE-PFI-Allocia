import type { ReactNode } from "react";
import { AlertCircle, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/pub/cn";

export function AuthSubmitButton({
  busy,
  disabled,
  softDisabled = false,
  children,
}: {
  busy: boolean;
  /** Deshabilitado de verdad (p. ej. mientras se envía): no recibe toques. */
  disabled: boolean;
  /**
   * Faltan datos: el botón se ve apagado y se anuncia como deshabilitado (aria-disabled), pero el toque sigue llegando al
   * formulario, que explica qué falta. Un botón con `disabled` en el teléfono simplemente «no hace nada».
   */
  softDisabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      aria-disabled={softDisabled || undefined}
      aria-busy={busy}
      className={cn(
        "flex h-12 w-full items-center justify-center gap-2 rounded-pub-md bg-pub-ink text-[15px] font-semibold text-pub-ink-foreground",
        "transition-colors hover:bg-pub-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pub-ring",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-pub-ink",
        "aria-disabled:opacity-60 aria-disabled:hover:bg-pub-ink",
      )}
    >
      {busy ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Un momento…
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Un <p> (no un <div>) para conservar el selector `p[role=alert]` de las pruebas e2e existentes.
export function AuthNotice({ tone, id, children }: { tone: "error" | "info"; id?: string; children: ReactNode }) {
  const Icon = tone === "error" ? AlertCircle : Info;
  return (
    <p
      id={id}
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-pub-lg border px-3.5 py-3 text-[13px] leading-relaxed text-pub-ink",
        tone === "error" ? "border-pub-danger/30 bg-pub-danger-soft" : "border-pub-ring/30 bg-pub-accent",
      )}
    >
      <Icon
        className={cn("mt-0.5 size-4 shrink-0", tone === "error" ? "text-pub-danger" : "text-pub-primary")}
        aria-hidden="true"
      />
      <span>{children}</span>
    </p>
  );
}
