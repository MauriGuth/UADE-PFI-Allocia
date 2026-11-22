"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { classLabel, fmtQty, pct, usd } from "@/lib/format";
import { placePopover } from "@/lib/popover";
import { provenanceLabels } from "@/lib/provenance";
import { AssetMark } from "./AssetIdentity";

export interface BubblePosition {
  ticker: string;
  name: string;
  assetClass: string;
  currency: string;
  quantity: number;
  refPrice: number | null;
  value: number | null;
  weight: number | null;
  priceAsOf?: string;
  priceCheckedAt?: string;
  priceStatus?: "recent" | "reference" | "demo";
}

const WIDTH = 300;

function priceLine(p: BubblePosition): string {
  if (p.refPrice === null) return "No disponible";
  return `${p.refPrice.toLocaleString("es-AR", { maximumFractionDigits: p.refPrice < 1 ? 6 : 2 })} ${p.currency}`;
}

/**
 * Logo de un activo que, al tocarlo, se expande en una burbuja de vidrio con el resumen de la posición (precio, valor,
 * peso y cantidad) y un acceso al detalle completo. La burbuja nace del logo (origen de la transformación en su centro),
 * flota en un portal por encima de las tarjetas y se cierra tocando afuera, con Escape, con la cruz o al desplazarse.
 * Solo muestra datos que ya tiene la cartera: no hay variación de precio porque el backend no la informa.
 */
export function AssetBubble({ position, size = "md" }: { position: BubblePosition; size?: "sm" | "md" | "lg" }) {
  const p = position;
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [place, setPlace] = useState<{ left: number; top: number; origin: string } | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();

  const close = useCallback((restoreFocus = true) => {
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
      setPlace(null);
      if (restoreFocus) trigger.current?.focus({ preventScroll: true });
    }, 170);
  }, []);

  // Posición: junto al logo, dentro de la ventana y por encima de la barra inferior. El origen de la animación es el
  // centro del logo, así la burbuja «sale» de él.
  useLayoutEffect(() => {
    if (!open || !trigger.current || !panel.current) return;
    const a = trigger.current.getBoundingClientRect();
    const vv = window.visualViewport;
    const vw = vv?.width ?? window.innerWidth;
    const vh = (vv?.height ?? window.innerHeight) - (vw < 1024 ? 96 : 0); // la cápsula inferior no tapa la burbuja
    const width = Math.min(WIDTH, vw - 32);
    const height = panel.current.offsetHeight;
    const { left, top } = placePopover(a, { width, height }, { width: vw, height: vh }, 16, 10);
    const ox = a.left + a.width / 2 - left;
    const oy = a.top + a.height / 2 - top;
    setPlace({ left, top, origin: `${ox}px ${oy}px` });
  }, [open]);

  // El foco entra a la burbuja recién cuando está visible (antes de ubicarla está oculta y no lo acepta).
  useEffect(() => {
    if (place) closeBtn.current?.focus({ preventScroll: true });
  }, [place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || trigger.current?.contains(t)) return;
      close(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    // Desplazar la página cierra la burbuja: no se queda flotando desalineada ni bloquea el scroll.
    const onScroll = () => close(false);
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true, once: true });
    window.addEventListener("resize", onScroll, { once: true });
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, close]);

  const prov = provenanceLabels(p.priceAsOf, p.priceCheckedAt);
  const freshness =
    p.priceStatus === "demo" ? "Dato de demostración" : p.priceStatus === "reference" ? `Precio de referencia · ${prov.data}` : prov.data;

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Resumen de ${p.ticker}`}
        onClick={() => (open ? close() : setOpen(true))}
        className="asset-bubble-trigger shrink-0 rounded-full"
      >
        <AssetMark ticker={p.ticker} assetClass={p.assetClass} size={size} />
      </button>
      {open
        ? createPortal(
            <div
              ref={panel}
              role="dialog"
              aria-labelledby={titleId}
              data-state={closing ? "closing" : "open"}
              className="asset-bubble glass fixed z-[70] rounded-[26px] p-4"
              style={{
                width: `min(${WIDTH}px, calc(100vw - 32px))`,
                left: place?.left ?? -9999,
                top: place?.top ?? 0,
                transformOrigin: place?.origin,
                visibility: place ? "visible" : "hidden",
              }}
            >
              <div className="flex items-start gap-3">
                <AssetMark ticker={p.ticker} assetClass={p.assetClass} size="lg" />
                <div className="min-w-0 flex-1 pt-0.5">
                  <p id={titleId} className="font-heading text-lg font-extrabold leading-6 text-ink">
                    {p.ticker}
                  </p>
                  <p className="text-[13px] leading-[18px] text-soft">{p.name}</p>
                  <p className="mt-0.5 text-caption text-muted">{classLabel(p.assetClass)}</p>
                </div>
                <button
                  ref={closeBtn}
                  type="button"
                  onClick={() => close()}
                  aria-label="Cerrar resumen"
                  className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-ink/5 hover:text-ink"
                >
                  <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
              </div>
              <dl className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-2.5 rounded-2xl bg-card/60 p-3 text-sm">
                <div>
                  <dt className="text-caption text-soft">Precio</dt>
                  <dd className="font-semibold tabular-nums text-ink">{priceLine(p)}</dd>
                </div>
                <div>
                  <dt className="text-caption text-soft">Peso en cartera</dt>
                  <dd className="font-semibold tabular-nums text-ink">{pct(p.weight)}</dd>
                </div>
                <div>
                  <dt className="text-caption text-soft">Valor de la posición</dt>
                  <dd className="font-semibold tabular-nums text-ink">{p.value === null ? "No disponible" : usd(p.value)}</dd>
                </div>
                <div>
                  <dt className="text-caption text-soft">Cantidad</dt>
                  <dd className="font-semibold tabular-nums text-ink">{fmtQty(p.quantity)}</dd>
                </div>
              </dl>
              <p className="mt-2 px-1 text-caption text-muted">{freshness}</p>
              <Link
                href={`/cartera/${encodeURIComponent(p.ticker)}`}
                className="mt-3 flex min-h-[44px] items-center justify-center rounded-full bg-ink/[0.06] text-sm font-semibold text-ink transition-colors hover:bg-ink/10"
              >
                Ver detalle de {p.ticker}
              </Link>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
