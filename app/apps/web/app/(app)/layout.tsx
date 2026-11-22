import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { AuthProvider } from "@/components/shell/auth-context";
import { getSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // Cookie ausente, token vencido o inválido: se limpia y se vuelve al login.
  if (session.status === "anonymous") redirect("/api/auth/logout");

  if (session.status === "unavailable") {
    return (
      <main className="grid min-h-screen place-items-center bg-bg p-6">
        <div role="alert" className="max-w-md rounded-card border border-line bg-card p-8 text-center shadow-card">
          <h1 className="text-lg font-semibold text-ink">No pudimos verificar tu sesión</h1>
          <p className="mt-2 text-[13px] leading-[19px] text-soft">
            El servidor no está respondiendo en este momento. Tu sesión sigue guardada: reintentá en unos segundos.
          </p>
          <a href="" className="btn-primary btn-sm mt-5">
            Reintentar
          </a>
        </div>
      </main>
    );
  }

  return (
    <AuthProvider user={session.user}>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
