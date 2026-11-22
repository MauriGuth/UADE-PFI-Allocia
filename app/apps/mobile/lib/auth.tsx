import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";
import { ApiError, AuthUser, api, setAuthToken, setOnUnauthorized } from "./api";

const TOKEN_KEY = "allocia_token";
const USER_KEY = "allocia_user";

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  restoreError: string | null;
  retryRestore: () => Promise<void>;
  restored: boolean;
  forgetSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password:string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const restoring = useRef(false);
  const sessionEpoch = useRef(0);
  const [restored, setRestored] = useState(true);

  const clearLocal = useCallback(async () => {
    sessionEpoch.current++;
    setRestoreError(null);
    setAuthToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }, []);

  const logout=useCallback(async()=>{await api.logout();await clearLocal();},[clearLocal]);
  const deleteAccount=useCallback(async(password:string)=>{await api.deleteAccount(password);await clearLocal();},[clearLocal]);

  const retryRestore = useCallback(async () => {
    if (restoring.current) return;
    restoring.current = true;
    const epoch = sessionEpoch.current;
    setReady(false); setRestoreError(null);
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token && epoch === sessionEpoch.current) {
        setAuthToken(token);
        const currentUser = await api.me();
        if (epoch === sessionEpoch.current) { setRestored(true); setUser(currentUser); }
      }
    } catch (error) {
      if (epoch !== sessionEpoch.current) return;
      if (error instanceof ApiError && error.status === 401) await clearLocal();
      else setRestoreError('No pudimos comprobar tu sesión. Revisá la conexión y reintentá; tu sesión guardada se conserva.');
    } finally { restoring.current = false; setReady(true); }
  }, [clearLocal]);

  useEffect(() => {
    setOnUnauthorized(() => { void clearLocal(); });
    void retryRestore();
    return () => setOnUnauthorized(null);
  }, [clearLocal, retryRestore]);

  const persist = useCallback(async (token: string, u: AuthUser) => {
    setAuthToken(token);
    setRestored(false);
    setUser(u);
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(u));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.login(email, password);
      await persist(res.token, res.user);
    },
    [persist],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await api.register(name, email, password);
      await persist(res.token, res.user);
    },
    [persist],
  );

  const value = useMemo(
    () => ({ user, ready, restoreError, retryRestore, restored, forgetSession: clearLocal, login, register, logout, deleteAccount }),
    [user, ready, restoreError, retryRestore, restored, clearLocal, login, register, logout, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
