"use client";

import Link from "next/link";
import { NavAjustes, NavAlertas } from "../nav-icons";
import { useState } from "react";
import { DeleteAccountSection } from "../account/DeleteAccountSection";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { ThemedMark } from "@/components/theme/ThemedLogo";
import { IconChevronRight, IconExternal } from "../icons";
import { Card, Footer, ScreenTitle } from "../ui/primitives";
import { initials } from "../shell/UserMenu";
import { SourceMark } from "../ui/SourceMark";
import { sourceBrandFor } from "@/lib/source-logos";
import { useAuth } from "../shell/auth-context";

const FUENTES = [
  { marca: "F", nombre: "Finnhub", uso: "Cotizaciones, noticias y fundamentales según cobertura habilitada", url: "https://finnhub.io/" },
  { marca: "CG", nombre: "Datos proporcionados por CoinGecko", uso: "Precios e históricos cripto con fecha del proveedor", url: "https://www.coingecko.com/en/api" },
  { marca: "FRED", nombre: "FRED · Federal Reserve Bank of St. Louis", uso: "Series oficiales de tasas e inflación de EE. UU.; no datos en tiempo real", url: "https://fred.stlouisfed.org/" },
];

const META = [
  ["Versión", "0.2.0 · versión en validación"],
  ["Autores", "Huentelaf, Mauricio · Rosso, Máximo"],
  ["Cotizaciones", "Consultar fecha y fuente en cada informe"],
];

export function AjustesView() {
  const { user, logout } = useAuth();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  return (
    <div className="space-y-4 md:space-y-6">
      <ScreenTitle title="Ajustes" subtitle="Tu cuenta, el prototipo y sus fuentes de datos." />

      {/* Fila 1: Cuenta y Acerca, de altura parecida. Fila 2: Fuentes a ancho completo. Luego el aviso y, aparte, la baja. */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2 lg:items-start">
        <Card as="section" aria-labelledby="aj-cuenta">
          <h2 id="aj-cuenta" className="section-title">Tu cuenta</h2>
          <div className="mt-4 flex items-center gap-4">
            <span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-secondary-fixed text-lg font-extrabold text-secondary-on-fixed">
              {initials(user.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-ink">{user.name}</p>
              <p className="truncate text-sm text-soft">{user.email}</p>
            </div>
          </div>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            <li>
              <Link href="/account" className="flex min-h-[56px] items-center gap-3 rounded-lg py-2 hover:bg-low">
                <span aria-hidden="true" className="icon-tile h-9 w-9 rounded-[10px]"><NavAjustes size={18} /></span>
                <span className="flex-1 text-[15px]">
                  <span className="font-semibold text-ink">Cuenta y privacidad</span>
                  <span className="text-soft"> · verificar correo y descargar tus datos</span>
                </span>
                <IconChevronRight size={18} className="shrink-0 text-muted" />
              </Link>
            </li>
            <li>
              <Link href="/market" className="flex min-h-[56px] items-center gap-3 rounded-lg py-2 hover:bg-low">
                <span aria-hidden="true" className="icon-tile h-9 w-9 rounded-[10px]"><NavAlertas size={18} /></span>
                <span className="flex-1 text-[15px] font-semibold text-ink">Mercados y alertas</span>
                <IconChevronRight size={18} className="shrink-0 text-muted" />
              </Link>
            </li>
          </ul>
          <div className="mt-4">
            <p className="text-body-sm text-soft">
              Cerrar sesión solo sale de tu cuenta en este navegador. Tus datos se conservan y podés volver a entrar cuando quieras.
            </p>
            <button type="button" onClick={() => setConfirm(true)} className="btn-secondary btn-sm mt-3 w-full sm:w-auto">
              Cerrar sesión
            </button>
          </div>
        </Card>

        <Card as="section" aria-labelledby="aj-producto">
          <h2 id="aj-producto" className="section-title">Acerca de Allocia</h2>
          <div className="mt-4 flex items-center gap-4">
            <span aria-hidden="true" className="icon-tile h-14 w-14 rounded-[16px]">
              <ThemedMark className="h-[24px] w-auto" />
            </span>
            <div>
              <p className="text-xl font-extrabold text-ink">Allocia</p>
              <p className="text-sm text-soft">Prototipo académico</p>
            </div>
          </div>
          <p className="mt-4 rounded-xl bg-secondary-fixed/50 p-3.5 text-body-sm text-ink">
            Análisis de portafolios multiactivo con riesgo geopolítico y recomendaciones explicables
            mediante IA. Prototipo del Proyecto Final de Ingeniería (UADE, 2026).
          </p>
          <dl className="mt-3">
            {META.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-t border-line py-2.5">
                <dt className="text-caption text-soft">{k}</dt>
                <dd className="text-right text-caption font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <Card as="section" aria-labelledby="aj-fuentes">
        <h2 id="aj-fuentes" className="section-title">Fuentes de datos</h2>
        <p className="mt-1 text-sm text-soft">Cotizaciones, noticias y fundamentos según cobertura habilitada.</p>
        {/* Cada fuente usa la misma rejilla: marca · texto · flecha de enlace externo. */}
        <ul className="mt-4 grid gap-3 lg:grid-cols-3">
          {FUENTES.map((f) => (
            <li key={f.nombre}>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-full min-h-[84px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 rounded-[12px] border border-line p-3.5 transition-colors hover:border-outline hover:bg-low"
              >
                <SourceMark brand={sourceBrandFor(f.nombre)} fallback={f.marca} size="lg" />
                <span className="min-w-0">
                  <span className="block text-[15px] font-bold leading-5 text-ink">{f.nombre}</span>
                  <span className="mt-0.5 block text-body-sm text-soft">{f.uso}</span>
                </span>
                <IconExternal size={18} className="text-muted" />
                <span className="sr-only">(se abre en una pestaña nueva)</span>
              </a>
            </li>
          ))}
        </ul>
      </Card>

      <Card as="section" tone="low" aria-labelledby="aj-aviso">
        <h2 id="aj-aviso" className="eyebrow">Aviso</h2>
        <p className="mt-2 max-w-4xl text-caption text-soft">
          Las observaciones y recomendaciones generadas por el sistema tienen fines informativos y
          académicos. Cada salida expone la evidencia y las reglas que la originaron, y no constituye
          asesoramiento financiero ni una orden de operación.
        </p>
      </Card>

      {/* Zona de baja: separada de «Cerrar sesión», al final de la pantalla. */}
      <DeleteAccountSection layout="wide" />

      <Footer />

      <ConfirmDialog
        open={confirm}
        title="Cerrar sesión"
        confirmLabel="Cerrar sesión"
        busy={busy}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setBusy(true);
          try { await logout(); }
          catch { setBusy(false); setLogoutError("No se pudo cerrar la sesión. Intentá nuevamente."); }
        }}
      >
        ¿Querés salir de tu cuenta? Tus datos quedan guardados.
        {logoutError && <p role="alert">{logoutError}</p>}
      </ConfirmDialog>
    </div>
  );
}
