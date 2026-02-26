import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, tokenStorage, type ApiUser, type SignupRole, type UserRole } from "@/lib/api";

interface AuthContextType {
  user: ApiUser | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (payload: { username: string; name: string; sex: string; age: number; email: string; password: string; role: SignupRole }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

async function bootstrapSession(): Promise<ApiUser | null> {
  if (!tokenStorage.hasAccessToken()) return null;

  try {
    return await api.me();
  } catch {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      tokenStorage.clear();
      return null;
    }

    try {
      const tokens = await api.refresh(refreshToken);
      tokenStorage.save(tokens);
      return await api.me();
    } catch {
      tokenStorage.clear();
      return null;
    }
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;

    bootstrapSession().then((sessionUser) => {
      if (mounted) {
        setUser(sessionUser);
        setIsLoadingAuth(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (identifier: string, password: string) => {
    const tokens = await api.login(identifier, password);
    tokenStorage.save(tokens);
    const me = await api.me();
    setUser(me);
  };

  const signup = async (payload: { username: string; name: string; sex: string; age: number; email: string; password: string; role: SignupRole }) => {
    const tokens = await api.signup(payload);
    tokenStorage.save(tokens);
    const me = await api.me();
    setUser(me);
  };

  const logout = () => {
    tokenStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoadingAuth, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export type { UserRole };
