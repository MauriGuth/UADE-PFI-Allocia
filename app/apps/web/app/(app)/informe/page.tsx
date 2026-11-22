import type { Metadata } from "next";
import { InformeView } from "@/components/views/InformeView";

export const metadata: Metadata = { title: "Informe" };

export default function Page() {
  return <InformeView />;
}
