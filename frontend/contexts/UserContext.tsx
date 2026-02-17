"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";

interface User {
  userId: string;
  email: string;
  name?: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { getProfile, logout: authLogout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    setIsLoading(true);
    try {
      const profile = await getProfile();
      setUser(profile);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authLogout();
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      setUser(null); // Clear user even if logout request fails
    }
  };

  // Proper pattern for initial data fetching
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts

    const initializeUser = async () => {
      try {
        const profile = await getProfile();
        if (isMounted) {
          setUser(profile);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeUser();

    return () => {
      isMounted = false; // Cleanup function
    };
  }, []); // Empty dependency array - only run on mount

  return (
    <UserContext.Provider value={{ user, isLoading, refreshUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
