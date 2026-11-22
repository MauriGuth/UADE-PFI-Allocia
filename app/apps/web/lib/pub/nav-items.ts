import { ChartColumn, ClipboardList, Globe, House, Sparkle, Wallet } from "lucide-react";

export const NAV_ITEMS = [
  { label: "Resumen", icon: House },
  { label: "Mi cartera", icon: Wallet },
  { label: "Mercados", icon: ChartColumn },
  { label: "Contexto global", icon: Globe },
  { label: "Señales", icon: Sparkle },
  { label: "Recomendaciones", icon: ClipboardList },
] as const;
