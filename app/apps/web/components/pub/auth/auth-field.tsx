"use client";

import { useId, useState, type ComponentType, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/pub/cn";

type AuthFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  type?: "text" | "email" | "password";
  /** Aviso breve bajo el campo (p. ej. cuánto falta para el mínimo). Se lee junto con el campo. */
  hint?: string | null;
};

export function AuthField({ label, icon: Icon, type = "text", className, id, hint, ...props }: AuthFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const hintId = `${inputId}-hint`;
  const describedBy = [props["aria-describedby"], hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={inputId} className="text-[11px] font-bold uppercase tracking-[0.08em] text-pub-ink">
        {label}
      </label>
      <div
        className={cn(
          "group relative flex h-12 items-center rounded-pub-lg border border-pub-input bg-pub-card transition-[border-color,box-shadow] duration-200",
          "hover:border-pub-lilac focus-within:border-pub-ring focus-within:shadow-[0_0_0_4px_rgba(143,123,243,0.18)]",
        )}
      >
        <Icon
          aria-hidden={true}
          className="pointer-events-none absolute left-3.5 size-[18px] text-pub-subtle transition-colors group-focus-within:text-pub-primary"
        />
        <input
          id={inputId}
          type={isPassword && visible ? "text" : type}
          className={cn(
            "size-full rounded-pub-lg bg-transparent pl-11 text-[15px] text-pub-ink outline-none placeholder:text-pub-subtle focus-visible:[box-shadow:none]",
            isPassword ? "pr-12" : "pr-4",
          )}
          {...props}
          aria-describedby={describedBy}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={visible}
            aria-controls={inputId}
            className="absolute right-2 flex size-9 items-center justify-center rounded-pub-md text-pub-primary transition-colors hover:bg-pub-accent"
          >
            {visible ? (
              <EyeOff className="size-[18px]" aria-hidden="true" />
            ) : (
              <Eye className="size-[18px]" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      {hint ? (
        <p id={hintId} className="text-[12.5px] leading-snug text-pub-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
