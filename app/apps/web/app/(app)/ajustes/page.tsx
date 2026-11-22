import type { Metadata } from "next";
import { AjustesView } from "@/components/views/AjustesView";

export const metadata: Metadata = { title: "Ajustes" };

export default function Page() {
  return <AjustesView />;
}
