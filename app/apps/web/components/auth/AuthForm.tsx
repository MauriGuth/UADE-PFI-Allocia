"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import { ArrowLeft, Lock, Mail, User } from "lucide-react";
import { api } from "@/lib/client";
import { missingFields, missingMessage, passwordHint, type AuthField as FieldKey } from "@/lib/auth-requirements";
import { AuthField } from "../pub/auth/auth-field";
import { AuthNotice, AuthSubmitButton } from "../pub/auth/auth-parts";
import { Logo } from "../pub/logo";

/** Solo rutas internas: evita redirecciones abiertas con ?next=//evil.com. */
export function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
    ? next
    : "/resumen";
}

// Formulario compartido de inicio de sesión y registro. La lógica (validación, llamadas a
// `api`, redirección) es la original; solo cambió la presentación (rediseño público).
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const ids = { name: useId(), email: useId(), password: useId(), privacy: useId(), notice: useId(), error: useId() };
  const isLogin = mode === "login";
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Se pasa a true al intentar enviar con datos incompletos: desde ahí se explica qué falta (y se actualiza al corregir).
  const [tried, setTried] = useState(false);

  const missing = missingFields({ mode, name, email, password, privacyAccepted });
  const canSubmit = missing.length === 0;
  const fieldId: Record<FieldKey, string> = { name: ids.name, email: ids.email, password: ids.password, privacy: ids.privacy };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!canSubmit) {
      // Antes el botón estaba deshabilitado y el toque no hacía nada. Ahora se dice qué falta y se lleva al primer campo.
      setTried(true);
      document.getElementById(fieldId[missing[0]])?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Copiar/pegar o el autocompletado suelen sumar espacios: el backend los rechaza.
      const cleanEmail = email.trim();
      if (isLogin) await api.login(cleanEmail, password);
      else await api.register(name.trim(), cleanEmail, password, privacyAccepted);
      router.replace(safeNext(params.get("next")));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setBusy(false);
    }
  }

  const heading =
    "mt-6 font-heading text-[30px] font-extrabold leading-tight tracking-[-0.025em] text-pub-ink text-balance sm:text-[34px]";

  return (
    <>
      {isLogin ? (
        <Logo className="mb-10 h-9 self-start lg:hidden" priority />
      ) : (
        <Link href="/" aria-label="Volver al inicio de Allocia" className="mb-8 w-fit rounded-pub-md">
          <Logo className="h-10" priority />
        </Link>
      )}
      <Link
        href="/"
        className="group inline-flex w-fit items-center gap-2 rounded-pub-md text-sm font-medium text-pub-muted-foreground transition-colors hover:text-pub-ink"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
        Volver
      </Link>

      <h1 className={heading}>{isLogin ? "Bienvenido de nuevo" : "Creá tu cuenta"}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-pub-muted-foreground">
        {isLogin
          ? "Ingresá con tu email y contraseña para ver tu cartera."
          : "En menos de un minuto empezás a analizar tu portafolio."}
      </p>

      {isLogin && params.get("expired") && !error && (
        <div className="mt-6">
          <AuthNotice tone="info">Tu sesión venció. Iniciá sesión de nuevo para continuar.</AuthNotice>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-9">
        <fieldset disabled={!hydrated} className="flex flex-col gap-5">
          {!isLogin && (
            <AuthField
              id={ids.name}
              label="Nombre"
              icon={User}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              autoComplete="name"
              required
              minLength={2}
              maxLength={80}
            />
          )}
          <AuthField
            id={ids.email}
            label="Email"
            icon={Mail}
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            maxLength={254}
          />
          <AuthField
            id={ids.password}
            label="Contraseña"
            icon={Lock}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isLogin ? "Tu contraseña" : "Mínimo 12 caracteres"}
            hint={isLogin ? null : passwordHint(password)}
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={isLogin ? undefined : 12}
            maxLength={128}
            aria-describedby={error ? ids.error : undefined}
          />

          {!isLogin && (
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-pub-ink">
              <input
                id={ids.privacy}
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                required
                className="mt-0.5 size-[18px] shrink-0 cursor-pointer rounded accent-pub-primary"
              />
              <span>
                Acepto la{" "}
                <Link
                  className="font-semibold text-pub-primary underline underline-offset-4 hover:text-pub-ink"
                  href="/privacy"
                  target="_blank"
                >
                  política de privacidad
                </Link>
                .
              </span>
            </label>
          )}
          {tried && !canSubmit && (
            <AuthNotice tone="info" id={ids.notice}>
              {missingMessage(mode, missing)}
            </AuthNotice>
          )}
          {error && (
            <AuthNotice tone="error" id={ids.error}>
              {error}
            </AuthNotice>
          )}

          <div className="mt-2">
            <AuthSubmitButton busy={busy} disabled={busy} softDisabled={!canSubmit}>
              {isLogin ? "Iniciar sesión" : "Crear cuenta"}
            </AuthSubmitButton>
          </div>
        </fieldset>
      </form>
      {isLogin && (
        <Link
          href="/forgot-password"
          className="mx-auto mt-5 text-sm font-medium text-pub-ink underline underline-offset-4 transition-colors hover:text-pub-primary"
        >
          Olvidé mi contraseña
        </Link>
      )}

      <p className="mt-10 border-t border-pub-border pt-8 text-center text-sm text-pub-muted-foreground">
        {isLogin ? (
          <>
            ¿No tenés cuenta?{" "}
            <Link href="/register" className="font-semibold text-pub-primary underline underline-offset-4 hover:text-pub-ink">
              Registrate
            </Link>
          </>
        ) : (
          <>
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="font-semibold text-pub-primary underline underline-offset-4 hover:text-pub-ink">
              Iniciá sesión
            </Link>
          </>
        )}
      </p>
    </>
  );
}
