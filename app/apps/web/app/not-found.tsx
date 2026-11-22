import type { Metadata } from "next";
import { NotFoundScene } from "@/components/notfound/NotFoundScene";

export const metadata: Metadata = { title: "Página no encontrada · Allocia" };

export default function NotFound() {
  return <NotFoundScene />;
}
