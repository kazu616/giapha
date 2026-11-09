import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "../domain/model";
import { getMe, getToken, login as loginRequest, register as registerRequest, setToken, updateMe } from "../infrastructure/http";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string, personId: string) => Promise<User>;
  logout: () => void;
  saveName: (name: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    let live = true;
    getMe()
      .then((me) => {
        if (live) setUser(me);
      })
      .catch(() => {
        setToken(null);
        if (live) setUser(null);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const session = await loginRequest(email, password);
    setToken(session.token);
    setUser(session.user);
    return session.user;
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, personId: string) => {
    const session = await registerRequest(email, password, name, personId);
    setToken(session.token);
    setUser(session.user);
    return session.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const saveName = useCallback(async (name: string) => {
    const next = await updateMe(name);
    setUser(next);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, saveName }),
    [user, loading, login, register, logout, saveName],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth phải nằm trong AuthProvider");
  return context;
}
