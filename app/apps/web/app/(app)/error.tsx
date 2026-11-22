"use client";

import { ErrorState } from "@/components/ui/states";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorState message={error.message || "Ocurrió un error inesperado."} onRetry={reset} />;
}
