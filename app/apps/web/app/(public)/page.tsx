import { DashboardPreview } from "@/components/pub/dashboard/dashboard-preview";
import { Features } from "@/components/pub/features";
import { Hero, HeroBackdrop, HeroRegions } from "@/components/pub/hero";
import { PubScope } from "@/components/pub/pub-scope";
import { SiteHeader } from "@/components/pub/site-header";

export default function WelcomePage() {
  return (
    <PubScope className="relative min-h-screen overflow-x-hidden">
      <HeroBackdrop />
      <SiteHeader />
      <main className="relative">
        <HeroRegions />
        <Hero />
        <DashboardPreview />
        <Features />
      </main>
      <footer className="relative z-20 px-5 pb-5 pt-3 text-center">
        <p className="text-[11px] text-pub-muted-foreground">
          Prototipo académico (UADE · PFI 2026). No constituye asesoramiento financiero.
        </p>
      </footer>
    </PubScope>
  );
}
