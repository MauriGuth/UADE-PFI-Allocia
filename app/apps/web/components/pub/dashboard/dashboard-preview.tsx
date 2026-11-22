"use client";

import { useState } from "react";
import { AllocationDonut } from "./allocation-donut";
import { DashboardSidebar } from "./dashboard-sidebar";
import { KpiCards } from "./kpi-cards";
import { PeriodSelect } from "./period-select";
import { PortfolioChart } from "./portfolio-chart";
import { SignalsList } from "./signals-list";

export function DashboardPreview() {
  const [active, setActive] = useState("Resumen");

  return (
    <section
      id="demo"
      aria-label="Vista previa del panel de Allocia con datos de demostración"
      className="relative z-20 mx-auto mt-5 max-w-[1120px] animate-rise px-3 sm:px-5"
      style={{ animationDelay: "0.38s" }}
    >
      <div className="rounded-[26px] border border-white/90 bg-white/45 p-2 dark:border-white/10 dark:bg-white/5 shadow-[0_40px_90px_-40px_rgba(76,60,190,0.45)] backdrop-blur-xl">
        <div className="flex overflow-hidden rounded-[20px] border border-pub-border/80 bg-pub-background">
          <DashboardSidebar active={active} onSelect={setActive} />

          <div className="min-w-0 flex-1 p-3.5 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-lg font-bold tracking-tight text-pub-ink">Resumen de tu cartera</h2>
                  <span className="rounded-full bg-pub-warning-soft px-2 py-0.5 text-[9px] font-semibold tracking-wide text-pub-warning uppercase">
                    Datos de demostración
                  </span>
                </div>
                <p className="text-[11px] text-pub-muted-foreground">
                  Una visión integral de tus inversiones, con contexto y oportunidades.
                </p>
              </div>
              <PeriodSelect />
            </div>

            <div className="mt-4">
              <KpiCards />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2.5 lg:grid-cols-[1.45fr_1.05fr_0.82fr]">
              <PortfolioChart />
              <AllocationDonut />
              <SignalsList />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
