import type { Metadata } from "next";
import { RiesgoView } from "@/components/views/RiesgoView";

export const metadata: Metadata = { title: "Riesgo" };

export default function Page() {
  return <RiesgoView />;
}
