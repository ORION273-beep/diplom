import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  balance?: number;
  createdAt?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  ready: boolean;
  setSession: (user: AuthUser, accessToken: string) => void;
  clear: () => void;
};

const STORAGE_KEY = 'onesec_auth';

const AuthContext = createContext<AuthContextValue | null>(null);

export function getAccessToken(): string | null {
  try {
    const data = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    return data?.accessToken || null;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function isLoggedIn(): boolean {
  return Boolean(getAccessToken());
}

function readStorage(): { user: AuthUser; accessToken: string } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { user?: AuthUser; accessToken?: string };
    if (!parsed.user?.id || !parsed.accessToken) return null;
    return { user: parsed.user, accessToken: parsed.accessToken };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = readStorage();
  const [user, setUser] = useState<AuthUser | null>(stored?.user ?? null);
  const [accessToken, setAccessToken] = useState<string | null>(stored?.accessToken ?? null);
  const [ready, setReady] = useState(false);

  function setSession(nextUser: AuthUser, nextToken: string) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ user: nextUser, accessToken: nextToken }));
    setUser(nextUser);
    setAccessToken(nextToken);
    setReady(true);
  }

  function clear() {
    clearAuth();
    setUser(null);
    setAccessToken(null);
    setReady(true);
  }

  // после перезагрузки подтягиваю сессию
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        if (cancelled) return;
        if (res.ok) {
          const data = (await res.json()) as { user?: AuthUser; accessToken?: string };
          if (data.user && data.accessToken) {
            setSession(data.user, data.accessToken);
            return;
          }
        }
        if (!readStorage()) clear();
      } catch {
        if (!cancelled && !readStorage()) clear();
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, ready, setSession, clear }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth без AuthProvider');
  return ctx;
}
