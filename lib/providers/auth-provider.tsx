"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types/database";
import { hasEnvVars } from "@/lib/utils";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
    if (!hasEnvVars) {
      console.warn(
        "Supabase environment variables not set, skipping profile fetch"
      );
      return null;
    }

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // More detailed error logging
        console.error("Error getting user profile:", {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          userId,
        });

        // If the error is that the profile doesn't exist, that's expected for new users
        if (error.code === "PGRST116") {
          console.log(
            "Profile not found for user:",
            userId,
            "- this indicates the user signed up but profile creation failed"
          );
        }

        return null;
      }

      return profile;
    } catch (error) {
      console.error("Unexpected error getting user profile:", error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user && hasEnvVars) {
      const userProfile = await fetchUserProfile(user.id);
      setProfile(userProfile);
    }
  };

  const clearInvalidSession = async () => {
    console.log("Clearing invalid session - user has no profile");
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
    setUser(null);
    setProfile(null);
  };

  useEffect(() => {
    // If environment variables are not set, skip authentication
    if (!hasEnvVars) {
      console.warn(
        "Supabase environment variables not set, skipping authentication"
      );
      setLoading(false);
      return;
    }

    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          const userProfile = await fetchUserProfile(session.user.id);

          if (userProfile) {
            setProfile(userProfile);
            console.log("Valid session found for user:", {
              userId: session.user.id,
              email: session.user.email,
              role: userProfile.role,
            });
          } else {
            console.log("Invalid session - user has no profile:", {
              userId: session.user.id,
              email: session.user.email,
            });
            // Clear the invalid session
            await clearInvalidSession();
            return; // Exit early to prevent setting loading to false
          }
        } else {
          console.log("No active session found");
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event);

      if (session?.user) {
        setUser(session.user);
        const userProfile = await fetchUserProfile(session.user.id);

        if (userProfile) {
          setProfile(userProfile);
          console.log("Auth state change - valid user with profile");
        } else {
          console.log(
            "Auth state change - user has no profile, clearing session"
          );
          await clearInvalidSession();
          return; // Exit early
        }
      } else {
        console.log("Auth state change - no session");
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
