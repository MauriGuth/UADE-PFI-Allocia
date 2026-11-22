"use client";

import { cn } from "@/lib/pub/cn";
import { NAV_ITEMS } from "@/lib/pub/nav-items";
import { LogoMark } from "../logo";

export function DashboardSidebar({ active, onSelect }: { active: string; onSelect: (label: string) => void }) {
  return (
    <aside className="hidden w-[164px] shrink-0 flex-col border-r border-pub-border/70 px-2.5 pt-6 md:flex">
      <div className="px-2.5">
        <LogoMark className="h-7" />
      </div>
      <nav aria-label="Navegación del panel (demo)" className="mt-9">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, icon: Icon }) => {
            const isActive = active === label;
            return (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => onSelect(label)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-pub-lg px-2.5 py-2 text-left text-[11.5px] whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-pub-accent font-semibold text-pub-primary"
                      : "text-pub-muted-foreground hover:bg-pub-muted hover:text-pub-ink",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" strokeWidth={isActive ? 2.4 : 1.8} />
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
