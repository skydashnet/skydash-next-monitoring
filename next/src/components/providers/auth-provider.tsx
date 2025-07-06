"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface AuthContextType {
  isLoggedIn: boolean;
  user: any;
  loading: boolean;
  checkLoggedIn: () => Promise<void>;
  logout: () => Promise<void>;
  login: (user: any) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const publicPaths = ["/login", "/register"];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const router = useRouter();
  const pathname = usePathname();

  const checkLoggedIn = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/me`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setIsLoggedIn(true);
        setUser(data.user ?? data);
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (error) {
      console.error("Check login failed:", error);
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((newUser: any) => {
    setIsLoggedIn(true);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${apiUrl}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setIsLoggedIn(false);
    setUser(null);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    checkLoggedIn();
  }, [checkLoggedIn]);

  useEffect(() => {
    if (!loading && !isLoggedIn && !publicPaths.includes(pathname)) {
      router.push("/login");
    }
  }, [loading, isLoggedIn, pathname, router]);

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, user, loading, checkLoggedIn, logout, login }}
    >
      {loading && !publicPaths.includes(pathname) ? (
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
