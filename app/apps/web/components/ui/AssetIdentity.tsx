"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { localLogoFor } from "@/lib/asset-logos";

// Un solo componente de identidad de activo para toda la web: logo (o insignia circular con el
// ticker) junto al ticker y el nombre como TEXTO real. Orden de resolución del logo:
//   1) el que entrega la API (Finnhub / CoinGecko), igual que antes;
//   2) un archivo local verificado (lib/asset-logos.ts);
//   3) insignia circular con el ticker, del mismo tamaño.
//
// El contenedor es siempre un círculo verdadero. Cómo se aloja la imagen depende de la imagen real
// (se mide una vez en un canvas pequeño; ver analyzeLogo), nunca de recortes ni ampliaciones a ciegas:
//   · «bleed»   — ícono de fondo sólido cuyo contenido cabe dentro del círculo: la imagen llena el
//                 círculo de borde a borde (así es un solo disco, no un cuadrado dentro de un recuadro);
//   · «inset»   — ícono de fondo sólido pero con contenido ancho (un wordmark) que el círculo recortaría:
//                 el círculo se pinta del color de fondo del propio ícono y la imagen va centrada con
//                 aire óptico, conservando su proporción;
//   · «contain» — marca transparente (o fondo no uniforme): disco claro con margen, centrada y sin deformar.
// Una marca que ya es un círculo (p. ej. Bitcoin) se muestra tal cual, sin marco extra.

type Size = "sm" | "md" | "lg";

const TILE: Record<Size, { box: string; text: string }> = {
  sm: { box: "h-8 w-8", text: "text-[10px]" },
  md: { box: "h-11 w-11", text: "text-xs" },
  lg: { box: "h-14 w-14", text: "text-sm" },
};

type Fit = { mode: "bleed" | "inset" | "contain"; bg: string };
const FIT_FALLBACK: Fit = { mode: "contain", bg: "#ffffff" };
const fits = new Map<string, Promise<Fit>>();

/**
 * Mide el logo en un canvas de 48 px: ¿fondo transparente o sólido?, ¿cuánto del círculo inscrito ocupa
 * su contenido? Los umbrales salen de los logos reales (AMZN/AAPL/PAM ocupan ≤ 71 % del radio, el
 * wordmark de YPF 88 %): hasta 84 % del radio se considera que cabe con margen seguro.
 */
function analyzeLogo(src: string): Promise<Fit> {
  let hit = fits.get(src);
  if (!hit) {
    hit = new Promise<Fit>((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const N = 48;
          const canvas = document.createElement("canvas");
          canvas.width = N;
          canvas.height = N;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return resolve(FIT_FALLBACK);
          ctx.drawImage(img, 0, 0, N, N);
          const { data } = ctx.getImageData(0, 0, N, N);
          const at = (x: number, y: number) => {
            const i = (y * N + x) * 4;
            return [data[i], data[i + 1], data[i + 2], data[i + 3]];
          };
          const corners = [at(1, 1), at(N - 2, 1), at(1, N - 2), at(N - 2, N - 2)];
          const transparentCorners = corners.every((c) => c[3] < 40);
          const r = N / 2;
          let far = 0;
          let minX = N, maxX = 0, minY = N, maxY = 0, covered = 0;
          if (transparentCorners) {
            for (let y = 0; y < N; y++)
              for (let x = 0; x < N; x++) {
                if (at(x, y)[3] < 40) continue;
                covered++;
                minX = Math.min(minX, x); maxX = Math.max(maxX, x);
                minY = Math.min(minY, y); maxY = Math.max(maxY, y);
                far = Math.max(far, Math.hypot(x + 0.5 - r, y + 0.5 - r));
              }
            const spanX = (maxX - minX + 1) / N;
            const spanY = (maxY - minY + 1) / N;
            const coverage = covered / (N * N);
            // Marca que ya es un círculo (ocupa casi todo el cuadro, ~π/4 de su área, sin salirse del círculo).
            const isDisc = spanX >= 0.9 && spanY >= 0.9 && coverage > 0.68 && coverage < 0.88 && far <= r * 1.06;
            return resolve(isDisc ? { mode: "bleed", bg: "#ffffff" } : FIT_FALLBACK);
          }
          const solid = [0, 1, 2].every((k) => corners.every((c) => Math.abs(c[k] - corners[0][k]) <= 28));
          if (!solid || corners.some((c) => c[3] < 250)) return resolve(FIT_FALLBACK);
          const bgc = corners[0];
          for (let y = 0; y < N; y++)
            for (let x = 0; x < N; x++) {
              const p = at(x, y);
              if (Math.abs(p[0] - bgc[0]) + Math.abs(p[1] - bgc[1]) + Math.abs(p[2] - bgc[2]) <= 90) continue;
              far = Math.max(far, Math.hypot(x + 0.5 - r, y + 0.5 - r));
            }
          const bg = `rgb(${bgc[0]} ${bgc[1]} ${bgc[2]})`;
          if (far === 0) return resolve(FIT_FALLBACK);
          resolve({ mode: far <= r * 0.84 ? "bleed" : "inset", bg });
        } catch {
          resolve(FIT_FALLBACK);
        }
      };
      img.onerror = () => resolve(FIT_FALLBACK);
      img.src = src;
    });
    fits.set(src, hit);
  }
  return hit;
}

// Evita pedir el mismo logo varias veces: en memoria (navegación dentro de la app) y en sessionStorage
// (recargas de la pestaña). También recuerda «sin logo» (p. ej. los ETF) por unos minutos. Cada pedido de
// logo cuenta para el límite de la API, así que con 13 activos una pantalla gastaba 13 pedidos por carga.
const apiLogos = new Map<string, Promise<string | null>>();
const CACHE_KEY = "allocia:logo:v1:";
const readCached = (ticker: string): string | null | undefined => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY + ticker);
    if (!raw) return undefined;
    const { u, e } = JSON.parse(raw) as { u: string | null; e: number };
    return e > Date.now() ? u : undefined;
  } catch {
    return undefined;
  }
};
const writeCached = (ticker: string, uri: string | null) => {
  try {
    if (uri && uri.length > 150_000) return; // no llenar el almacenamiento con imágenes grandes
    sessionStorage.setItem(CACHE_KEY + ticker, JSON.stringify({ u: uri, e: Date.now() + (uri ? 30 : 5) * 60_000 }));
  } catch {
    /* almacenamiento no disponible: se sigue sin caché */
  }
};
function apiLogo(ticker: string): Promise<string | null> {
  let hit = apiLogos.get(ticker);
  if (!hit) {
    const cached = readCached(ticker);
    hit =
      cached !== undefined
        ? Promise.resolve(cached)
        : api
            .assetLogo(ticker)
            .then((r) => {
              const uri = r.dataUri ?? null;
              writeCached(ticker, uri); // solo se recuerdan respuestas correctas
              return uri;
            })
            .catch(() => {
              apiLogos.delete(ticker); // un error pasajero no se recuerda: se reintenta en la próxima carga
              return null;
            });
    apiLogos.set(ticker, hit);
  }
  return hit;
}

/** Insignia circular del activo: logo si existe; si no, el ticker en texto. Decorativa (el texto va al lado). */
export function AssetMark({
  ticker,
  assetClass,
  size = "md",
  className = "",
}: {
  ticker: string;
  assetClass?: string;
  size?: Size;
  className?: string;
}) {
  const local = localLogoFor(ticker, assetClass)?.src ?? null;
  const [fromApi, setFromApi] = useState<{ ticker: string; uri: string | null } | null>(null);
  const [broken, setBroken] = useState<string | null>(null);
  const [fit, setFit] = useState<{ src: string; fit: Fit } | null>(null);

  useEffect(() => {
    let active = true;
    apiLogo(ticker).then((uri) => {
      if (active) setFromApi({ ticker, uri });
    });
    return () => {
      active = false;
    };
  }, [ticker]);

  const apiUri = fromApi?.ticker === ticker ? fromApi.uri : null;
  const src = [apiUri, local].find((s) => s && s !== broken) ?? null;

  useEffect(() => {
    if (!src) return;
    let active = true;
    analyzeLogo(src).then((f) => {
      if (active) setFit({ src, fit: f });
    });
    return () => {
      active = false;
    };
  }, [src]);

  const t = TILE[size];
  const label = ticker.toUpperCase();
  const base = `asset-glass relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${t.box} ${className}`;

  // Sin logo (SPY, EEM, falla de carga): insignia circular con el ticker, del mismo tamaño.
  if (!src) {
    return (
      <span aria-hidden="true" className={`${base} border border-line bg-low`}>
        <span className={`px-0.5 font-bold tracking-tight text-ink ${label.length > 4 ? "text-[9px]" : t.text}`}>
          {label.slice(0, 5)}
        </span>
      </span>
    );
  }

  // Con logo: hasta medir la imagen se reserva el círculo vacío (sin saltos de tamaño ni parpadeo de formas).
  const f = fit?.src === src ? fit.fit : null;
  const imgClass = !f
    ? "hidden"
    : f.mode === "bleed"
      ? "h-full w-full object-cover"
      : f.mode === "inset"
        ? "h-[78%] w-[78%] object-contain"
        : "h-[62%] w-[62%] object-contain";
  return (
    <span aria-hidden="true" className={`${base} bg-low`} style={f ? { backgroundColor: f.bg } : undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className={imgClass} onError={() => setBroken(src)} />
    </span>
  );
}

/** Logo + ticker + nombre (texto real). `name` es opcional cuando solo se conoce el ticker. */
export function AssetIdentity({
  ticker,
  name,
  assetClass,
  size = "md",
  className = "",
  nameClassName = "",
  hideMark = false,
}: {
  ticker: string;
  name?: string;
  assetClass?: string;
  size?: Size;
  className?: string;
  nameClassName?: string;
  /** true cuando el logo se dibuja aparte (p. ej. como botón de la burbuja de resumen). */
  hideMark?: boolean;
}) {
  return (
    <span className={`flex min-w-0 items-center gap-3 ${className}`}>
      {hideMark ? null : <AssetMark ticker={ticker} assetClass={assetClass} size={size} />}
      <span className="min-w-0">
        <span className="block font-bold leading-5 text-ink">{ticker}</span>
        {name ? <span title={name} className={`block truncate text-[13px] leading-[18px] text-soft print:overflow-visible print:whitespace-normal ${nameClassName}`}>{name}</span> : null}
      </span>
    </span>
  );
}
