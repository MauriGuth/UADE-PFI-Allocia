"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import type { EnrichedPosition } from "@/lib/types";
import { IconSearch } from "../icons";

// Buscador de activos de tu cartera (ticker o nombre) → detalle del activo.
export function AssetSearch({ className = "" }: { className?: string }) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [positions, setPositions] = useState<EnrichedPosition[] | null>(null);
  const loading = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  async function ensureLoaded() {
    if (positions || loading.current) return;
    loading.current = true;
    try {
      setPositions((await api.portfolio()).positions);
    } catch {
      setPositions([]);
    } finally {
      loading.current = false;
    }
  }

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term || !positions) return [];
    return positions
      .filter((p) => p.ticker.toLowerCase().includes(term) || p.name.toLowerCase().includes(term))
      .slice(0, 6);
  }, [q, positions]);

  function go(p: EnrichedPosition) {
    setOpen(false);
    setQ("");
    router.push(`/cartera/${encodeURIComponent(p.ticker)}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && open && results[active]) {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && q.trim().length > 0 && positions !== null;

  return (
    <div ref={wrap} className={`relative ${className}`}>
      <IconSearch
        size={18}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label="Buscar activos de tu cartera"
        placeholder="Ir al detalle de un activo…"
        title="Busca un activo de tu cartera y abre su detalle"
        value={q}
        autoComplete="off"
        onFocus={() => {
          ensureLoaded();
          setOpen(true);
        }}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className="w-full rounded-full border border-outline bg-card py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-muted transition-colors hover:border-faint focus:border-secondary focus:bg-card"
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-card border border-line bg-card py-1 shadow-pop"
        >
          {results.length === 0 ? (
            <li className="px-4 py-3 text-[13px] text-soft">Ningún activo de tu cartera coincide.</li>
          ) : (
            results.map((p, i) => (
              <li
                key={p.id}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(p);
                }}
                className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 ${
                  i === active ? "bg-low" : ""
                }`}
              >
                <span className="w-14 text-[13px] font-bold text-ink">{p.ticker}</span>
                <span className="min-w-0 flex-1 truncate text-xs text-soft">{p.name}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
