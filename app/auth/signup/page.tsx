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
import { Loader2, User, UserCheck, Info } from "lucide-react";

import { signUp } from "@/lib/auth/client-auth-helpers";
import { useAuth } from "@/lib/providers/auth-provider";
import { hasEnvVars } from "@/lib/utils";

// Validation schemas
const adminSignUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const studentSignUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    indexNumber: z
      .string()
      .min(3, "Index number must be at least 3 characters")
      .regex(
        /^[A-Z0-9]+$/,
        "Index number should only contain uppercase letters and numbers"
      ),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type AdminSignUpForm = z.infer<typeof adminSignUpSchema>;
type StudentSignUpForm = z.infer<typeof studentSignUpSchema>;

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(
    searchParams.get("role") === "student" ? "student" : "admin"
  );

  // Admin form
  const adminForm = useForm<AdminSignUpForm>({
    resolver: zodResolver(adminSignUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Student form
  const studentForm = useForm<StudentSignUpForm>({
    resolver: zodResolver(studentSignUpSchema),
    defaultValues: {
      name: "",
      indexNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

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

  const handleAdminSignUp = async (data: AdminSignUpForm) => {
    setLoading(true);

    try {
      const result = await signUp({
        name: data.name,
        email: data.email,
        password: data.password,
        role: "admin",
      });

      if (result.success) {
        toast.success(result.message || "Account created successfully!");
        router.push("/auth/signin?role=admin");
      } else {
        toast.error(result.error || "Sign up failed");
      }
    } catch (error) {
      console.error("Sign up error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSignUp = async (data: StudentSignUpForm) => {
    setLoading(true);

    try {
      const result = await signUp({
        name: data.name,
        email: data.email,
        password: data.password,
        role: "student",
        index_number: data.indexNumber,
      });

      if (result.success) {
        toast.success(result.message || "Account created successfully!");
        router.push("/auth/signin?role=student");
      } else {
        toast.error(result.error || "Sign up failed");
      }
    } catch (error) {
      console.error("Sign up error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create Account</CardTitle>
        <CardDescription>Join Quiz App as an admin or student</CardDescription>
      </CardHeader>
      <CardContent>
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
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium">Admin Account</p>
                <p>
                  Create and manage classes, quizzes, and student enrollments.
                </p>
              </div>
            </div>

            <form
              onSubmit={adminForm.handleSubmit(handleAdminSignUp)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="admin-name">Full Name</Label>
                <Input
                  id="admin-name"
                  placeholder="Dr. John Smith"
                  {...adminForm.register("name")}
                />
                {adminForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {adminForm.formState.errors.name.message}
                  </p>
                )}
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="admin-confirm-password">Confirm Password</Label>
                <Input
                  id="admin-confirm-password"
                  type="password"
                  {...adminForm.register("confirmPassword")}
                />
                {adminForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {adminForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Admin Account
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="student" className="space-y-4">
            <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <Info className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800 dark:text-green-200">
                <p className="font-medium">Student Account</p>
                <p>
                  Join classes and participate in quizzes using your index
                  number.
                </p>
              </div>
            </div>

            <form
              onSubmit={studentForm.handleSubmit(handleStudentSignUp)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="student-name">Full Name</Label>
                <Input
                  id="student-name"
                  placeholder="Jane Doe"
                  {...studentForm.register("name")}
                />
                {studentForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {studentForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="student-index">Index Number</Label>
                <Input
                  id="student-index"
                  placeholder="STU123456"
                  {...studentForm.register("indexNumber")}
                />
                {studentForm.formState.errors.indexNumber && (
                  <p className="text-sm text-destructive">
                    {studentForm.formState.errors.indexNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="student-email">Email</Label>
                <Input
                  id="student-email"
                  type="email"
                  placeholder="student@school.edu"
                  {...studentForm.register("email")}
                />
                {studentForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {studentForm.formState.errors.email.message}
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

              <div className="space-y-2">
                <Label htmlFor="student-confirm-password">
                  Confirm Password
                </Label>
                <Input
                  id="student-confirm-password"
                  type="password"
                  {...studentForm.register("confirmPassword")}
                />
                {studentForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {studentForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Student Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={`/auth/signin?role=${activeTab}`}
              className="text-primary hover:underline font-medium"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SignUpPage() {
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
      <SignUpContent />
    </Suspense>
  );
}
