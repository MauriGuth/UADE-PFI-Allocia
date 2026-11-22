import type { Metadata } from "next";
import { CarteraView } from "@/components/views/CarteraView";

export const metadata: Metadata = { title: "Cartera" };

export default function Page() {
  return <CarteraView />;
}
