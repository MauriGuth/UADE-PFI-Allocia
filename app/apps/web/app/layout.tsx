import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { THEME_COLORS, THEME_INIT_SCRIPT } from "@/components/theme/theme-script";
import "./globals.css";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Allocia — Inteligencia para tu cartera", template: "%s · Allocia" },
  description:
    "Analizá tu portafolio multiactivo con contexto geopolítico, señales de mercado y recomendaciones que siempre explican su porqué.",
  applicationName: "Allocia",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // El CSP exige nonce para los scripts en línea (middleware.ts): el del tema lo usa para correr antes del primer pintado.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
