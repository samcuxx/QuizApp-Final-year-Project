"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { hasEnvVars } from "@/lib/utils";
import { Loader2 } from "lucide-react";

import StudentNavigation from "@/components/student/student-navigation";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if setup is required
    if (!hasEnvVars) {
      router.replace("/");
      return;
    }

    if (!loading) {
      if (!user) {
        console.log("Student layout: No user, redirecting to signin");
        router.replace("/auth/signin?role=student");
        return;
      }

      if (!profile) {
        console.log(
          "Student layout: User has no profile, redirecting to signin"
        );
        router.replace("/auth/signin?role=student&error=no-profile");
        return;
      }

      if (profile.role !== "student") {
        console.log(
          "Student layout: User is not student, redirecting to unauthorized"
        );
        router.replace("/unauthorized");
        return;
      }

      setChecking(false);
    }
  }, [user, profile, loading, router]);

  // Show loading while checking authentication
  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Return null if not authenticated (will redirect)
  if (!user || !profile || profile.role !== "student") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StudentNavigation profile={profile} />
      <main className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
