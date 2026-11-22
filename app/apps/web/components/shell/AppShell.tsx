"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { SIDEBAR_KEY } from "../theme/theme-script";
import { ThemedLogo, ThemedMark } from "../theme/ThemedLogo";
import { ThemeToggle } from "../theme/ThemeToggle";
import { ActivePill, useActivePill } from "./ActivePill";
import { LiquidTabBar } from "./LiquidTabBar";
import { AssetSearch } from "./AssetSearch";
import { OfflineBanner } from "./OfflineBanner";
import { UserMenu } from "./UserMenu";
import { useAuth } from "./auth-context";
import { NAV, NAV_GROUPS, isActive } from "./nav";
import { useAlertWatcher } from "./useAlertWatcher";

function Brand() {
  return (
    <Link href="/resumen" className="flex items-center gap-2 rounded-lg" aria-label="Allocia — ir al resumen">
      <ThemedMark priority className="h-[22px] w-[31px]" />
      <span className="text-[17px] font-bold text-ink">Allocia</span>
    </Link>
  );
}

// Estructura responsive única:
//  · < md  : cabecera + barra de pestañas inferior (como la app móvil).
//  · md    : rail lateral con iconos y etiquetas.
//  · ≥ lg  : sidebar completa + barra superior con buscador y menú de usuario.
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { unread } = useAlertWatcher(String(user.id));
  // La pastilla de vidrio se desliza hasta la pestaña activa: una por cada navegación (rail/sidebar y barra inferior).
  const asideNav = useRef<HTMLElement | null>(null);
  const asidePill = useActivePill(asideNav, pathname);
  // Menú lateral de escritorio plegable. El CSS lo mueve según `data-sidebar` en <html> (que el script inicial ya fijó,
  // así no hay salto al cargar); el estado de React solo alimenta `aria-expanded` y el foco.
  const [collapsed, setCollapsed] = useState(false);
  const hideBtn = useRef<HTMLButtonElement | null>(null);
  const showBtn = useRef<HTMLButtonElement | null>(null);
  useEffect(() => setCollapsed(document.documentElement.getAttribute("data-sidebar") === "collapsed"), []);
  function setSidebar(hide: boolean) {
    const root = document.documentElement;
    if (hide) root.setAttribute("data-sidebar", "collapsed");
    else root.removeAttribute("data-sidebar");
    try {
      if (hide) localStorage.setItem(SIDEBAR_KEY, "collapsed");
      else localStorage.removeItem(SIDEBAR_KEY);
    } catch {
      /* sin almacenamiento: vale para esta visita */
    }
    setCollapsed(hide);
    // El foco pasa al botón que ahora está a la vista, para que el teclado no se pierda en lo que se ocultó.
    requestAnimationFrame(() => (hide ? showBtn : hideBtn).current?.focus());
  }
  // La descripción (no el nombre) del enlace Alertas informa cuántas hay sin leer.
  const unreadDescription = (href: string) => (href === "/market" && unread > 0 ? "alertas-sin-leer" : undefined);

  return (
    <div className="min-h-screen bg-canvas bg-[radial-gradient(60%_38%_at_75%_0%,rgb(var(--c-secondary-fixed)/0.55),transparent_70%)] bg-no-repeat">
      {unread > 0 && (
        <span id="alertas-sin-leer" className="sr-only">
          {unread === 1 ? "1 alerta sin leer" : `${unread} alertas sin leer`}
        </span>
      )}
      <a
        href="#contenido"
        className="sr-only z-[60] rounded-lg bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Saltar al contenido
      </a>

      <OfflineBanner />

      {/* Teléfono: sin cabecera fija (como la app): cada pantalla abre con su título grande, con el tema y la cuenta
          a la derecha (ver ScreenTitle). */}

      {/* Escritorio: panel lateral flotante (vidrio líquido, sin el reflejo «mojado» en escritorio) */}
      <aside
        id="menu-lateral"
        className="shell-aside sidebar no-print fixed inset-y-0 left-0 z-20 hidden w-[236px] flex-col border-r border-line lg:flex"
        aria-label="Navegación principal"
      >
        <div className="flex h-16 shrink-0 items-center justify-between pl-5 pr-2.5">
          <Link href="/resumen" aria-label="Allocia — ir al resumen">
            <ThemedLogo priority className="h-auto w-[132px]" />
          </Link>
          <button
            ref={hideBtn}
            type="button"
            onClick={() => setSidebar(true)}
            aria-label="Ocultar menú lateral"
            aria-expanded={!collapsed}
            aria-controls="menu-lateral"
            title="Ocultar menú"
            className="group grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition-colors duration-200 hover:bg-ink/5 hover:text-ink"
          >
            <PanelLeftClose size={19} strokeWidth={1.9} className="transition-transform duration-300 ease-soft group-hover:-translate-x-0.5" />
          </button>
        </div>
        <nav ref={asideNav} className="relative min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-2">
          <ActivePill box={asidePill.box} animate={asidePill.animate} className="nav-pill" />
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? "mt-5" : ""}>
              <p className="hidden px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-faint lg:block">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.hrefs.map((href) => {
                  const item = NAV.find((n) => n.href === href)!;
                  const active = isActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        aria-describedby={unreadDescription(item.href)}
                        className={`group relative z-10 flex min-h-[40px] items-center gap-3 rounded-[10px] px-3 text-[14px] transition-[color,background-color] duration-200 ease-soft ${
                          active ? "font-semibold text-ink" : "font-medium text-soft hover:bg-ink/[0.04] hover:text-ink"
                        }`}
                      >
                        <span className={`relative ${active ? "text-secondary" : ""}`}>
                          <Icon size={21} active={active} />
                                                  </span>
                        <span className="flex-1">{item.label}</span>
                        {item.href === "/market" && unread > 0 && (
                          <span
                            aria-hidden="true"
                            title="Alertas sin leer de Mi cartera y de Oportunidades"
                            className="hidden min-w-[28px] rounded-full bg-secondary-fixed px-2 py-0.5 text-center text-xs font-bold text-secondary-on-fixed lg:inline-block"
                          >
                            {unread > 9 ? "9+" : unread}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <p className="mx-5 hidden shrink-0 border-t border-line pb-4 pt-3 text-micro leading-4 text-faint lg:block">
          Prototipo académico · UADE PFI 2026. No constituye asesoramiento financiero.
        </p>
      </aside>

      {/* Contenido */}
      <div className="shell-content lg:pl-[236px]">
        <div className="no-print sticky top-0 z-30 hidden h-[72px] items-center justify-between gap-6 border-b border-line bg-canvas/80 px-6 backdrop-blur-md md:flex lg:px-10">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="shrink-0 lg:hidden">
              <Brand />
            </div>
            {/* Con el menú lateral oculto: botón para volver a abrirlo y la marca (entra desde la izquierda al plegarse). */}
            <div className="sidebar-reopen shrink-0 items-center gap-2">
              <button
                ref={showBtn}
                type="button"
                onClick={() => setSidebar(false)}
                aria-label="Mostrar menú lateral"
                aria-expanded={!collapsed}
                aria-controls="menu-lateral"
                title="Mostrar menú"
                className="group grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-card text-soft transition-colors duration-200 hover:bg-low hover:text-ink"
              >
                <PanelLeftOpen size={19} strokeWidth={1.9} className="transition-transform duration-300 ease-soft group-hover:translate-x-0.5" />
              </button>
              <Brand />
            </div>
            <AssetSearch className="w-full max-w-md" />
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
        <main
          id="contenido"
          tabIndex={-1}
          className="print-flat mx-auto w-full max-w-[1440px] px-4 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))] md:px-6 md:pt-8 lg:px-10 lg:pb-12"
        >
          <div key={pathname} className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Móvil y tablet: cápsula flotante de vidrio líquido. La pastilla es un resorte: se levanta al tocar, sigue al dedo
          al arrastrar (se estira con la velocidad) y rebota al acomodarse en la pestaña elegida. */}
      <LiquidTabBar
        unread={unread}
        unreadDescription={unreadDescription}
        className="no-print glass glass-sheen fixed inset-x-3 z-30 touch-pan-y select-none rounded-full p-1.5 md:inset-x-auto md:left-1/2 md:w-auto md:-translate-x-1/2 lg:hidden"
        style={{ bottom: "max(12px, env(safe-area-inset-bottom))" }}
      />
    </div>
  );
}
