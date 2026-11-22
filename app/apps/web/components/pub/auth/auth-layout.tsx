import type { ReactNode } from "react";
import { ThemeToggle } from "../../theme/ThemeToggle";
import { PubScope } from "../pub-scope";

export function AuthLayout({ showcase, children }: { showcase: ReactNode; children: ReactNode }) {
  return (
    <PubScope className="grid min-h-dvh bg-pub-card lg:h-dvh lg:grid-cols-2 lg:overflow-hidden">
      {showcase}
      <main className="relative flex flex-col overflow-hidden bg-pub-card lg:overflow-y-auto">
        <div className="absolute right-3 top-3 z-10 sm:right-5 sm:top-5">
          <ThemeToggle variant="pub" />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(205,196,255,0.5),transparent_70%)] lg:hidden"
        />
        <div className="relative mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center px-5 py-10 sm:px-8 lg:py-14">
          {children}
        </div>
      </main>
    </PubScope>
  );
}
