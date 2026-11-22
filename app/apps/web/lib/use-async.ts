"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean; // primera carga (sin datos todavía)
  refreshing: boolean; // recarga con datos ya mostrados
  updatedAt: number | null; // última carga correcta (ms), para mostrar «Actualizado hace …»
  reload: () => Promise<void>;
}

/** Carga datos asíncronos con estados de carga, error y recarga manual. */
export function useAsync<T>(fn: () => Promise<T>, refreshIntervalMs = 30_000): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const alive = useRef(true);
  const generation = useRef(0);
  const inFlight = useRef(0);

  const run = useCallback(async () => {
    const request = ++generation.current;
    inFlight.current++;
    try {
      const result = await fnRef.current();
      if (!alive.current || request !== generation.current) return;
      setData(result);
      setError(null);
      setUpdatedAt(Date.now());
    } catch (e) {
      if (alive.current && request === generation.current) setError(e instanceof Error ? e.message : "Error inesperado");
    } finally { inFlight.current--; }
  }, []);

  useEffect(() => {
    alive.current = true;
    run();
    return () => {
      alive.current = false;
      generation.current++;
    };
  }, [run]);

  useEffect(() => {
    if (refreshIntervalMs <= 0) return;
    const refreshVisible = () => {
      if (document.visibilityState === "visible" && inFlight.current === 0) void run();
    };
    const timer = window.setInterval(refreshVisible, refreshIntervalMs);
    document.addEventListener("visibilitychange", refreshVisible);
    window.addEventListener("focus", refreshVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshVisible);
      window.removeEventListener("focus", refreshVisible);
    };
  }, [refreshIntervalMs, run]);

  const reload = useCallback(async () => {
    setRefreshing(true);
    await run();
    if (alive.current) setRefreshing(false);
  }, [run]);

  return { data, error, loading: data === null && error === null, refreshing, updatedAt, reload };
}
