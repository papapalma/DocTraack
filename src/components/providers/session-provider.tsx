"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { SessionUser } from "@/types";
import { useRouter } from "next/navigation";

interface SessionContextType {
  user: SessionUser | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextType>({
  user: null,
  isLoading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", {
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/?auth=login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed:", e);
    }
  }, [router]);

  return (
    <SessionContext.Provider value={{ user, isLoading, refresh: fetchSession, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
