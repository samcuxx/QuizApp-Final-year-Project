"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User, UserCheck } from "lucide-react";

import { signIn, getRedirectPath } from "@/lib/auth/client-auth-helpers";
import { useAuth } from "@/lib/providers/auth-provider";
import { hasEnvVars } from "@/lib/utils";

// Validation schemas
const adminSignInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const studentSignInSchema = z.object({
  identifier: z.string().min(1, "Please enter your email or index number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AdminSignInForm = z.infer<typeof adminSignInSchema>;
type StudentSignInForm = z.infer<typeof studentSignInSchema>;

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(
    searchParams.get("role") === "student" ? "student" : "admin"
  );

  // Check for error messages
  const error = searchParams.get("error");
  const showProfileError = error === "no-profile";

  // Admin form
  const adminForm = useForm<AdminSignInForm>({
    resolver: zodResolver(adminSignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Student form
  const studentForm = useForm<StudentSignInForm>({
    resolver: zodResolver(studentSignInSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user && profile && !authLoading) {
      const redirectPath = getRedirectPath(profile.role);
      router.replace(redirectPath);
    }
  }, [user, profile, authLoading, router]);

  // Check if setup is required
  if (!hasEnvVars) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Setup Required</CardTitle>
          <CardDescription className="text-center">
            Please configure your Supabase environment variables first
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full" variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show loading if checking auth state
  if (authLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const handleAdminSignIn = async (data: AdminSignInForm) => {
    setLoading(true);

    try {
      const result = await signIn({
        email: data.email,
        password: data.password,
      });

      if (result.success) {
        toast.success("Welcome back!");
        // Auth provider will handle redirect
      } else {
        toast.error(result.error || "Sign in failed");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSignIn = async (data: StudentSignInForm) => {
    setLoading(true);

    try {
      // Determine if identifier is email or index number
      const isEmail = data.identifier.includes("@");

      const result = await signIn({
        email: isEmail ? data.identifier : undefined,
        index_number: !isEmail ? data.identifier : undefined,
        password: data.password,
      });

      if (result.success) {
        toast.success("Welcome back!");
        // Auth provider will handle redirect
      } else {
        toast.error(result.error || "Sign in failed");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>Access your Quiz App account</CardDescription>
      </CardHeader>
      <CardContent>
        {showProfileError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <div className="text-sm text-red-800 dark:text-red-200">
                <p className="font-medium">Account Issue Detected</p>
                <p>
                  Your account exists but is missing profile information. Please
                  sign up again or contact support.
                </p>
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Admin
            </TabsTrigger>
            <TabsTrigger value="student" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Student
            </TabsTrigger>
          </TabsList>

          <TabsContent value="admin" className="space-y-4">
            <form
              onSubmit={adminForm.handleSubmit(handleAdminSignIn)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@school.edu"
                  {...adminForm.register("email")}
                />
                {adminForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {adminForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  {...adminForm.register("password")}
                />
                {adminForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {adminForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In as Admin
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="student" className="space-y-4">
            <form
              onSubmit={studentForm.handleSubmit(handleStudentSignIn)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="student-identifier">
                  Email or Index Number
                </Label>
                <Input
                  id="student-identifier"
                  placeholder="student@school.edu or STU123456"
                  {...studentForm.register("identifier")}
                />
                {studentForm.formState.errors.identifier && (
                  <p className="text-sm text-destructive">
                    {studentForm.formState.errors.identifier.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="student-password">Password</Label>
                <Input
                  id="student-password"
                  type="password"
                  {...studentForm.register("password")}
                />
                {studentForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {studentForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In as Student
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href={`/auth/signup?role=${activeTab}`}
              className="text-primary hover:underline font-medium"
            >
              Sign up here
            </Link>
          </p>
          <Link
            href="/auth/forgot-password"
            className="text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            Forgot your password?
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
