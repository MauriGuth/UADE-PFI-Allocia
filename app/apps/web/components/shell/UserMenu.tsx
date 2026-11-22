"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { IconGear, IconLogout } from "../icons";
import { useAuth } from "./auth-context";

export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const menuId = useId();
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen(!open)}
        className="flex items-center rounded-full p-1 transition-colors hover:bg-low"
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary-fixed text-sm font-bold text-secondary-on-fixed">
          {initials(user.name)}
        </span>
        <span className="sr-only">
          {user.name}
        </span>
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-64 animate-pop-in overflow-hidden rounded-card border border-line bg-card shadow-pop"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
            <p className="truncate text-xs text-soft">{user.email}</p>
          </div>
          <Link
            role="menuitem"
            href="/ajustes"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-low"
          >
            <IconGear size={18} className="text-soft" /> Ajustes
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setConfirm(true);
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink hover:bg-low"
          >
            <IconLogout size={18} className="text-soft" /> Cerrar sesión
          </button>
        </div>
      )}
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
