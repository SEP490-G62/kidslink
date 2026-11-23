"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext, type AuthState } from "@/lib/auth-store";
import { TOKEN_KEY, USER_KEY, setToken } from "@/lib/api";
import type { User } from "@/lib/types";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 15_000,
          },
        },
      }),
  );

  const [user, setUserState] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = window.localStorage.getItem(TOKEN_KEY);
      const storedUser = window.localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        setTokenState(storedToken);
        setUserState(JSON.parse(storedUser) as User);
      }
    } catch {
      setToken(null);
      window.localStorage.removeItem(USER_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    (nextToken: string, nextUser: User) => {
      setToken(nextToken);
      window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setTokenState(nextToken);
      setUserState(nextUser);
      queryClient.clear();
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    setToken(null);
    window.localStorage.removeItem(USER_KEY);
    setTokenState(null);
    setUserState(null);
    queryClient.clear();
    window.location.href = "/login";
  }, [queryClient]);

  const setUser = useCallback((nextUser: User) => {
    window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUserState(nextUser);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, token, loading, login, logout, setUser }),
    [user, token, loading, login, logout, setUser],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </QueryClientProvider>
  );
}
