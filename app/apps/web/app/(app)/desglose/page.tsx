import type { Metadata } from "next";
import { DesgloseView } from "@/components/views/DesgloseView";

export const metadata: Metadata = { title: "Desglose" };

export default function Page() {
  return <DesgloseView />;
}
