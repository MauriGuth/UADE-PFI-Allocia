import Link from "next/link";
import { ThemeToggle } from "../theme/ThemeToggle";
import { Logo } from "./logo";

export function SiteHeader() {
  return (
    <header className="relative z-30">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 md:h-[60px]">
        <Link
          href="/"
          aria-label="Allocia, ir al inicio"
          className="rounded-pub-md focus-visible:ring-2 focus-visible:ring-pub-ring"
        >
          <Logo className="h-6 sm:h-9" />
        </Link>
        <nav aria-label="Cuenta" className="flex shrink-0 items-center gap-2 sm:gap-5">
          <ThemeToggle variant="pub" className="!h-9 !w-9 sm:!h-10 sm:!w-10" />
          <Link
            href="/login"
            className="text-[13px] font-semibold whitespace-nowrap text-pub-ink transition-colors hover:text-pub-primary sm:text-sm"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="inline-flex h-9 items-center rounded-pub-md bg-pub-ink px-4 text-sm font-semibold text-pub-ink-foreground transition-colors hover:bg-pub-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pub-ring max-sm:px-3.5 max-sm:text-[13px] sm:px-5"
          >
            Empezar
          </Link>
        </nav>
      </div>
    </header>
  );
}
