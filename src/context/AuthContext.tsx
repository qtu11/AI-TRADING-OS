"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, googleAuthProvider, isFirebaseConfigured } from "@/lib/firebase/client";
import { getUserProfile, saveUserProfile } from "@/lib/firebase/db-service";
import { UserProfile } from "@/types/user.types";

const ENV_ADMIN_LOGIN = process.env.NEXT_PUBLIC_ADMIN_LOGIN || "[EMAIL_ADDRESS]";
const ENV_ADMIN_PASS = "Qtusdev"; // Default master pass matching ENV configuration

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isConfigured: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string, fallbackUser?: Partial<User>, customRole?: "admin" | "user") => {
    try {
      let profile = await getUserProfile(uid);
      if (!profile) {
        profile = {
          id: uid,
          email: fallbackUser?.email || "trader@aitrading.os",
          displayName: fallbackUser?.displayName || (customRole === "admin" ? "System Administrator (Admin)" : "Elite Trader"),
          photoURL: fallbackUser?.photoURL || undefined,
          role: customRole || (fallbackUser?.email === ENV_ADMIN_LOGIN ? "admin" : "user"),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          currency: "USD",
          startingCapital: 0,
          experienceLevel: "pro",
          tradingStyle: "day_trading",
          preferredSessions: ["london", "newYork"],
          preferredSymbols: ["EURUSD", "XAUUSD", "GBPUSD"],
          riskProfile: "moderate",
          onboardingCompleted: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveUserProfile(profile);
      } else if (customRole) {
        profile.role = customRole;
      }
      setUserProfile(profile);
    } catch (error) {
      console.warn("Could not fetch user profile:", error);
    }
  };

  useEffect(() => {
    // Check if Admin session is stored in localStorage
    const savedAdmin = localStorage.getItem("ai_trading_os_admin_session");
    if (savedAdmin === "true") {
      const adminUser = {
        uid: "admin-master-01",
        email: ENV_ADMIN_LOGIN,
        displayName: "System Administrator (Admin)",
        photoURL: "",
      } as unknown as User;
      setUser(adminUser);
      fetchProfile("admin-master-01", adminUser, "admin").finally(() => setLoading(false));
      return;
    }

    if (!auth || !isFirebaseConfigured) {
      // Local Developer Fallback when Firebase credentials are not yet entered
      const localId = "dev-trader-01";
      const dummyUser = {
        uid: localId,
        email: "boss@aitrading.os",
        displayName: "Boss Trader",
        photoURL: "",
      } as unknown as User;

      setUser(dummyUser);
      fetchProfile(localId, dummyUser).finally(() => setLoading(false));
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.uid, currentUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    localStorage.removeItem("ai_trading_os_admin_session");
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    const result = await signInWithPopup(auth, googleAuthProvider);
    if (result.user) {
      await fetchProfile(result.user.uid, result.user, "user");
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    // 1. Check Master Admin credentials from ENV
    if (
      email.trim().toLowerCase() === ENV_ADMIN_LOGIN.toLowerCase() &&
      pass === ENV_ADMIN_PASS
    ) {
      localStorage.setItem("ai_trading_os_admin_session", "true");
      const adminUser = {
        uid: "admin-master-01",
        email: ENV_ADMIN_LOGIN,
        displayName: "System Administrator (Admin)",
        photoURL: "",
      } as unknown as User;
      setUser(adminUser);
      await fetchProfile("admin-master-01", adminUser, "admin");
      return;
    }

    // 2. Regular customer email login via Firebase Auth
    localStorage.removeItem("ai_trading_os_admin_session");
    if (!auth) {
      throw new Error("Firebase Auth is not initialized or invalid credentials.");
    }
    const result = await signInWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      await fetchProfile(result.user.uid, result.user, "user");
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    localStorage.removeItem("ai_trading_os_admin_session");
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      await updateProfile(result.user, { displayName: name });
      await fetchProfile(result.user.uid, { ...result.user, displayName: name }, "user");
    }
  };

  const logout = async () => {
    localStorage.removeItem("ai_trading_os_admin_session");
    if (auth) {
      await signOut(auth);
    }
    setUser(null);
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    if (user?.uid) {
      await fetchProfile(user.uid, user);
    }
  };

  const updateUserProfileData = async (data: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updated: UserProfile = {
      ...userProfile,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await saveUserProfile(updated);
    setUserProfile(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAdmin: userProfile?.role === "admin",
        isConfigured: isFirebaseConfigured,
        loginWithGoogle,
        loginWithEmail,
        signUpWithEmail,
        logout,
        refreshProfile,
        updateUserProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
