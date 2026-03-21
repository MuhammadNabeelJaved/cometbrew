import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, AuthUser } from '../api/auth.api';
import { AxiosError } from 'axios';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<{ requiresVerification: boolean; user: AuthUser }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_STORAGE_KEY = 'auth_user';

function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const persistUser = (u: AuthUser | null) => {
    if (u) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_STORAGE_KEY);
    setUser(u);
  };

  // On mount: validate session by fetching current profile
  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      setIsLoading(false);
      return;
    }

    // Unverified users can't access protected endpoints — trust stored data + cookies
    if (!stored.isVerified) {
      setIsLoading(false);
      return;
    }

    authApi
      .getProfile(stored._id)
      .then((res) => persistUser(res.data.data))
      .catch((err: AxiosError) => {
        // 403 = unverified account (update stored user) — 401 = session expired (clear)
        if ((err.response?.status ?? 0) !== 401) {
          // Keep user in state on non-auth errors
        } else {
          persistUser(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    setError(null);
    try {
      const res = await authApi.login(email, password);
      persistUser(res.data.data);
      return res.data.data;
    } catch (err) {
      const msg = (err as AxiosError<{ message: string }>).response?.data?.message ?? 'Login failed';
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setError(null);
    try {
      const res = await authApi.register(name, email, password);
      persistUser(res.data.data);
      return { requiresVerification: !res.data.data.isVerified, user: res.data.data };
    } catch (err) {
      const msg = (err as AxiosError<{ message: string }>).response?.data?.message ?? 'Registration failed';
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      persistUser(null);
    }
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
