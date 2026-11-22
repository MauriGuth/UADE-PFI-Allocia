import type { Metadata } from "next";
import { ActivoView } from "@/components/views/ActivoView";

function safeDecode(s: string) {
  try {
    return decodeURIComponent(s).toUpperCase();
  } catch {
    return s.toUpperCase();
  }
}

type Props = { params: Promise<{ ticker: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticker } = await params;
  return { title: safeDecode(ticker) };
}

export default async function Page({ params }: Props) {
  const { ticker } = await params;
  return <ActivoView ticker={safeDecode(ticker)} />;
}
