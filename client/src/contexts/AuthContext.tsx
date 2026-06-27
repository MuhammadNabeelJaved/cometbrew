import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { authApi, AuthUser } from '../api/auth.api';
import { AxiosError } from 'axios';

export interface TwoFAPending {
  requiresTwoFactor: true;
  userId: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  socketToken: string | null;
  login: (email: string, password: string) => Promise<AuthUser | TwoFAPending>;
  loginWithToken: (userData: AuthUser, accessToken?: string) => void;
  register: (name: string, email: string, password: string) => Promise<{ requiresVerification: boolean; user: AuthUser }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
  loginFromOAuth: (userData: AuthUser) => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_STORAGE_KEY = 'auth_user';
const API_BASE = (import.meta.env.VITE_API_URL as string) ?? '';

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
  // In-memory token for Socket.IO auth — not persisted to localStorage/sessionStorage
  // so it's cleared on refresh and re-fetched below.
  const [socketToken, setSocketToken] = useState<string | null>(null);

  const persistUser = (u: AuthUser | null) => {
    if (u) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_STORAGE_KEY);
    setUser(u);
  };

  // On mount: validate session by fetching current profile.
  // After a successful profile fetch, also call refreshToken to obtain a
  // JS-accessible access token for Socket.IO auth (cross-domain cookies are
  // blocked by some browsers even with SameSite=None).
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
      .then(async (res) => {
        persistUser(res.data.data);
        // Grab a fresh access token for socket auth (non-blocking — failure is OK)
        try {
          const refreshRes = await axios.post(
            `${API_BASE}/api/v1/users/refresh-token`,
            {},
            { withCredentials: true }
          );
          const tok = refreshRes.data?.data?.accessToken as string | undefined;
          if (tok) setSocketToken(tok);
        } catch {
          // Refresh failed (expired session, server sleeping, etc.) — socket will
          // fall back to cookie-based auth via withCredentials.
        }
      })
      .catch((err: AxiosError) => {
        if ((err.response?.status ?? 0) !== 401) {
          // Keep user in state on non-auth errors
        } else {
          persistUser(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser | TwoFAPending> => {
    setError(null);
    try {
      const res = await authApi.login(email, password);
      const data = res.data.data as any;
      // 2FA pending — server signals with requiresTwoFactor: true
      if (data?.requiresTwoFactor) {
        return { requiresTwoFactor: true, userId: data.userId } as TwoFAPending;
      }
      // Server returns accessToken in body alongside the HTTP-only cookie
      if (data?.accessToken) setSocketToken(data.accessToken as string);
      persistUser(data as AuthUser);
      return data as AuthUser;
    } catch (err) {
      const msg = (err as AxiosError<{ message: string }>).response?.data?.message ?? 'Login failed';
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const loginWithToken = useCallback((userData: AuthUser, accessToken?: string) => {
    persistUser(userData);
    if (accessToken) setSocketToken(accessToken);
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
      setSocketToken(null);
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

  const loginFromOAuth = useCallback((userData: AuthUser) => {
    persistUser(userData);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        socketToken,
        login,
        loginWithToken,
        register,
        logout,
        updateUser,
        loginFromOAuth,
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
