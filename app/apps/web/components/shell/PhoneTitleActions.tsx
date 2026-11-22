"use client";

import { ThemeToggle } from "../theme/ThemeToggle";
import { UserMenu } from "./UserMenu";

/** Tema y cuenta junto al título de cada pantalla, solo en el teléfono (ahí no hay cabecera fija). */
export function PhoneTitleActions() {
  return (
    <div className="no-print -mr-1 flex shrink-0 items-center gap-1 pt-0.5 md:hidden">
      <ThemeToggle />
      <div className="w-10">
        <UserMenu />
      </div>
    </div>
  );
}
