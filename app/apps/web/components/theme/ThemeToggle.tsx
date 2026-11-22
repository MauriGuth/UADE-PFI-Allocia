"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { THEME_COLORS, THEME_KEY } from "./theme-script";

type Theme = "light" | "dark";

const systemTheme = (): Theme => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
const storedTheme = (): Theme | null => {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
};

function apply(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  // El color de la barra del navegador en el teléfono sigue al tema elegido (no solo al del sistema).
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
    m.removeAttribute("media");
    m.content = THEME_COLORS[theme];
  });
}

/**
 * Botón de modo oscuro. Por defecto la página sigue al sistema; al tocarlo se guarda la elección y deja de seguirlo.
 * El ícono (sol o luna) lo decide el CSS según `data-theme`, así que no parpadea al cargar; el estado de React solo
 * alimenta `aria-pressed`.
 */
export function ThemeToggle({ variant = "app", className = "" }: { variant?: "app" | "pub"; className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark((storedTheme() ?? systemTheme()) === "dark");
    // Mientras no haya elección guardada, un cambio del sistema (p. ej. el modo automático del teléfono) se refleja.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (storedTheme()) return;
      apply(systemTheme());
      setDark(systemTheme() === "dark");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function toggle() {
    const next: Theme = dark ? "light" : "dark";
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* sin almacenamiento: el cambio vale para esta visita */
    }
    apply(next);
    setDark(next === "dark");
  }

  const tone =
    variant === "pub"
      ? "text-pub-ink hover:bg-pub-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pub-ring"
      : "text-soft hover:bg-low hover:text-ink";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label="Modo oscuro"
      title={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors duration-200 ${tone} ${className}`}
    >
      <span aria-hidden="true" className="theme-icons relative block h-5 w-5">
        <Sun className="theme-sun absolute inset-0 h-5 w-5" strokeWidth={2.1} />
        <Moon className="theme-moon absolute inset-0 h-5 w-5" strokeWidth={2.1} />
      </span>
    </button>
  );
}
