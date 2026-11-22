"use client";

import { Calendar, Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/pub/cn";

const OPTIONS = ["Últimos 7 días", "Últimos 30 días", "Últimos 90 días", "Este año"];

export function PeriodSelect() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(OPTIONS[1]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 items-center gap-2 rounded-pub-lg border border-pub-border bg-pub-card px-3 text-[10px] text-pub-muted-foreground transition-colors hover:border-pub-ring/50 hover:text-pub-ink"
      >
        <Calendar className="size-3.5" aria-hidden="true" />
        <span className="pr-2">{value}</span>
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Período"
          className="absolute right-0 z-20 mt-1.5 w-44 animate-pub-pop rounded-pub-lg border border-pub-border bg-pub-popover p-1 shadow-xl"
        >
          {OPTIONS.map((o) => (
            <li key={o} role="option" aria-selected={o === value}>
              <button
                type="button"
                onClick={() => {
                  setValue(o);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-pub-md px-2.5 py-1.5 text-left text-[11px] text-pub-ink hover:bg-pub-muted"
              >
                {o}
                {o === value && <Check className="size-3.5 text-pub-primary" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
