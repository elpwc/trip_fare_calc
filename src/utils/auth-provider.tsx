'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as auth from './auth';
import type { AuthUser } from './auth';

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error?: string;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string, code: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  registerEmail: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => auth.getToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function loadProfile() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await auth.fetchProfile();
        setUser(profile);
      } catch (err) {
        auth.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [token]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(undefined);

    try {
      const result = await auth.login(email, password);
      setToken(result.token);
      setUser(result.user);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, name: string, password: string, code: string) => {
    setLoading(true);
    setError(undefined);

    try {
      const result = await auth.register(email, name, password, code);
      setToken(result.token);
      setUser(result.user);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    auth.logout();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    setLoading(true);
    try {
      const profile = await auth.fetchProfile();
      setUser(profile);
    } catch (err) {
      auth.logout();
      setUser(null);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    await auth.changePassword(oldPassword, newPassword);
  };

  const updateName = async (name: string) => {
    const result = await auth.updateName(name);
    setUser(result.user);
  };

  const updateEmail = async (email: string) => {
    const result = await auth.updateEmail(email);
    setUser(result.user);
  };

  const registerEmail = async (email: string) => {
    await auth.registerEmail(email);
  };

  const contextValue = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      login,
      register,
      logout,
      refreshUser,
      changePassword,
      updateName,
      updateEmail,
      registerEmail,
    }),
    [user, token, loading, error]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
