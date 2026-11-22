"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import type { AuthUser } from "@/lib/types";

interface AuthContextValue {
  user: AuthUser;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ user, children }: { user: AuthUser; children: ReactNode }) {
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (error) {
      throw error;
    }
      // Navegación completa: descarta cualquier estado en memoria del usuario anterior.
      window.location.assign("/login");
      router.refresh();
  }, [router]);

  const value = useMemo(() => ({ user, logout }), [user, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
