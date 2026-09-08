import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
} from "./authStorage";
import {
  login as loginRequest,
  logout as logoutRequest,
} from "./services/authApi";
import type { AuthSession, AuthUser, LoginRequest } from "./types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSession(getAuthSession());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    function handleAuthChanged() {
      setSession(getAuthSession());
    }

    window.addEventListener("econ:auth-changed", handleAuthChanged);

    return () => {
      window.removeEventListener("econ:auth-changed", handleAuthChanged);
    };
  }, []);

  const login = useCallback(async (payload: LoginRequest): Promise<void> => {
    const response = await loginRequest(payload);

    const nextSession: AuthSession = {
      token: response.data.token,
      user: response.data.user,
    };

    setAuthSession(nextSession);
    setSession(nextSession);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutRequest();
    } finally {
      clearAuthSession();
      setSession(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: session !== null,
      isLoading,
      login,
      logout,
    }),
    [session, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
