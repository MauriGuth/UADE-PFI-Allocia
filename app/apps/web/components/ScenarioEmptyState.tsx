"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, type MarketStatus } from "@/lib/client";

type AnalysisRequest = NonNullable<MarketStatus["analysisRequests"]>[number];

const STATE_LABEL: Record<AnalysisRequest["state"], string> = {
  queued: "Pedido en cola",
  processing: "En proceso",
  ready: "Listo",
  failed: "No se pudo",
};

const STATE_CLASS: Record<AnalysisRequest["state"], string> = {
  queued: "bg-high text-ink",
  processing: "bg-secondary-fixed text-secondary-on-fixed",
  ready: "bg-ok-bg text-ok",
  failed: "bg-danger-bg text-danger",
};

const POLL_MS = 10_000;
// Tope de sondeos por pedido: 12 × 10 s = 2 minutos. Después se deja de
// consultar y se invita a volver a mirar más tarde.
const MAX_POLLS = 12;

/**
 * Estado vacío explícito del bloque de escenarios: explica por qué no hay
 * informe y permite pedir el análisis sin salir de la pantalla. Usa las
 * funciones existentes del cliente (requestAnalysis + marketStatus) y muestra
 * el estado de cada pedido; cuando se completan, avisa al padre para recargar.
 */
export function ScenarioEmptyState({ ticker, onReady }: { ticker?: string; onReady?: () => void | Promise<void> }) {
  const [requests, setRequests] = useState<AnalysisRequest[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Pedidos del activo de esta pantalla; si no hay ninguno con ese ticker, se
  // muestran todos (el análisis siempre se pide para toda la cartera).
  const relevant = useMemo(() => {
    const all = requests ?? [];
    if (!ticker) return all;
    const own = all.filter((r) => r.ticker === ticker);
    return own.length > 0 ? own : all;
  }, [requests, ticker]);
  const pending = relevant.some((r) => r.state === "queued" || r.state === "processing");
  // Cantidad de sondeos hechos desde el último pedido; al llegar al tope se detiene.
  const polls = useRef(0);
  const [pollsExhausted, setPollsExhausted] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await api.marketStatus();
      if (alive.current) setRequests(s.analysisRequests ?? []);
    } catch {
      /* El estado no está disponible: se conserva el último conocido. */
    }
  }, []);

  // Mientras haya pedidos en cola o en proceso, se consulta el estado cada 10 s,
  // como máximo MAX_POLLS veces; el temporizador se limpia al desmontar o al terminar.
  useEffect(() => {
    if (!pending || pollsExhausted) return;
    const t = window.setInterval(() => {
      polls.current += 1;
      if (polls.current > MAX_POLLS) {
        window.clearInterval(t);
        setPollsExhausted(true);
        return;
      }
      void load();
    }, POLL_MS);
    return () => window.clearInterval(t);
  }, [pending, pollsExhausted, load]);

  // Al pasar de «en proceso» a terminado, el padre recarga los escenarios.
  const wasPending = useRef(false);
  useEffect(() => {
    if (pending) {
      wasPending.current = true;
    } else if (wasPending.current) {
      wasPending.current = false;
      void onReady?.();
    }
  }, [pending, onReady]);

  async function request() {
    setBusy(true);
    setError(null);
    setNotice(null);
    polls.current = 0;
    setPollsExhausted(false);
    try {
      const r = await api.requestAnalysis();
      if (!alive.current) return;
      setNotice(r.message || "Pedido recibido.");
      await load();
    } catch (e) {
      if (alive.current) setError(e instanceof Error ? e.message : "No se pudo solicitar el análisis.");
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  return (
    <div className="rounded-xl bg-low p-4">
      <p className="text-sm font-semibold leading-5 text-ink">
        Todavía no hay un informe reciente para {ticker ? ticker : "tus activos"}.
      </p>
      <p className="mt-1 text-[13px] leading-5 text-soft">
        Los escenarios se generan a partir de noticias y datos con fuente; sin evidencia suficiente, no se inventan.
      </p>
      <div className="no-print mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={request} disabled={busy || (pending && !pollsExhausted)} className="btn-primary btn-sm">
          {busy ? "Enviando pedido…" : pending && !pollsExhausted ? "Análisis en curso" : "Solicitar análisis ahora"}
        </button>
        {ticker ? <span className="text-xs text-soft">Se analizan todos los activos de tu cartera.</span> : null}
      </div>
      <div aria-live="polite" className="mt-2 space-y-1.5 text-[12.5px] leading-[18px] text-soft">
        {notice ? <p>{notice}</p> : null}
        {pollsExhausted && pending ? (
          <p>El análisis sigue en curso. Dejamos de consultar por ahora: actualizá la pantalla más tarde para ver si está listo.</p>
        ) : null}
        {relevant.length > 0 ? (
          <ul className="flex flex-wrap gap-2" aria-label="Estado de los pedidos de análisis">
            {relevant.map((r) => (
              <li key={r.ticker} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card py-1 pl-2.5 pr-1.5 text-xs text-ink">
                <span className="font-semibold">{r.ticker}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${STATE_CLASS[r.state]}`}>{STATE_LABEL[r.state]}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="alert-error mt-2">
          {error}
        </p>
      ) : null}
    </div>
  );
}
