import {
  createClient,
  createServerClientWithoutCookies,
} from "@/lib/supabase/server";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import {
  Profile,
  UserRole,
  SignUpData,
  SignInData,
} from "@/lib/types/database";
import { redirect } from "next/navigation";
import { hasEnvVars } from "@/lib/utils";

// Server-side auth helpers
export async function getUser() {
  // If env vars are not set, return null to skip auth
  if (!hasEnvVars) {
    console.warn("Supabase environment variables not set, skipping user auth");
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error getting user:", error);
    // Fallback to client without cookies if server client fails
    try {
      const supabase = createServerClientWithoutCookies();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      return error || !user ? null : user;
    } catch (fallbackError) {
      console.error("Fallback error:", fallbackError);
      return null;
    }
  }
}

export async function getUserProfile(): Promise<Profile | null> {
  try {
    const user = await getUser();
    if (!user) return null;

    const supabase = await createClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error getting user profile:", error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

export async function requireAuth(role?: UserRole) {
  const profile = await getUserProfile();

  if (!profile) {
    redirect("/auth/signin");
  }

  if (role && profile.role !== role) {
    redirect("/unauthorized");
  }

  return profile;
}

export async function requireAdmin() {
  return requireAuth("admin");
}

export async function requireStudent() {
  return requireAuth("student");
}

// Client-side auth helpers
export async function signUp(data: SignUpData) {
  const supabase = createBrowserClient();

  try {
    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      return { error: authError.message, success: false };
    }

    if (!authData.user) {
      return { error: "User creation failed", success: false };
    }

    // Create the profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      email: data.email,
      name: data.name,
      role: data.role,
      index_number: data.index_number || null,
    });

    if (profileError) {
      return { error: profileError.message, success: false };
    }

    return {
      data: authData.user,
      success: true,
      message:
        "Account created successfully! Please check your email to verify your account.",
    };
  } catch (error) {
    console.error("Sign up error:", error);
    return { error: "An unexpected error occurred", success: false };
  }
}

export async function signIn(data: SignInData) {
  const supabase = createBrowserClient();

  try {
    let email = data.email;

    // If signing in with index number, find the email first
    if (data.index_number && !data.email) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("index_number", data.index_number)
        .single();

      if (profileError || !profile) {
        return {
          error: "Student with this index number not found",
          success: false,
        };
      }

      email = profile.email;
    }

    if (!email) {
      return { error: "Email is required", success: false };
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password: data.password,
      });

    if (authError) {
      return { error: authError.message, success: false };
    }

    return { data: authData.user, success: true };
  } catch (error) {
    console.error("Sign in error:", error);
    return { error: "An unexpected error occurred", success: false };
  }
}

export async function signOut() {
  const supabase = createBrowserClient();

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: error.message, success: false };
    }

    return { success: true };
  } catch (error) {
    console.error("Sign out error:", error);
    return { error: "An unexpected error occurred", success: false };
  }
}

export async function resetPassword(email: string) {
  const supabase = createBrowserClient();

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      return { error: error.message, success: false };
    }

    return {
      success: true,
      message: "Password reset email sent! Check your inbox.",
    };
  } catch (error) {
    console.error("Reset password error:", error);
    return { error: "An unexpected error occurred", success: false };
  }
}

export async function updatePassword(password: string) {
  const supabase = createBrowserClient();

  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return { error: error.message, success: false };
    }

    return { success: true, message: "Password updated successfully!" };
  } catch (error) {
    console.error("Update password error:", error);
    return { error: "An unexpected error occurred", success: false };
  }
}

// Client-side auth state helpers
export async function getCurrentUser() {
  const supabase = createBrowserClient();

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function getCurrentUserProfile(): Promise<Profile | null> {
  const supabase = createBrowserClient();

  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error getting current user profile:", error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error("Error getting current user profile:", error);
    return null;
  }
}

// Utility functions
export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === "admin";
}

export function isStudent(profile: Profile | null): boolean {
  return profile?.role === "student";
}

export function getRedirectPath(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "student":
      return "/student/dashboard";
    default:
      return "/";
  }
}
