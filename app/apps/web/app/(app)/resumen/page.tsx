import type { Metadata } from "next";
import { ResumenView } from "@/components/views/ResumenView";

export const metadata: Metadata = { title: "Resumen" };

export default function Page() {
  return <ResumenView />;
}
