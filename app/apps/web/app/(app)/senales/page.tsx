import type { Metadata } from "next";
import { SenalesView } from "@/components/views/SenalesView";

export const metadata: Metadata = { title: "Señales" };

export default function Page() {
  return <SenalesView />;
}
