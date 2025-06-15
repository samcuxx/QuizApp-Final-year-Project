import { hasEnvVars } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Quiz App</h1>
          </div>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">
              Welcome to Quiz App
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300">
              Professional Educational Platform
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              A standardized platform for educational institutions to conduct
              quizzes and exams with modern, beautiful interface.
            </p>
          </div>

          {hasEnvVars ? (
            <div className="grid md:grid-cols-2 gap-6 mt-12">
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-2xl text-blue-600 dark:text-blue-400">
                    Admin Portal
                  </CardTitle>
                  <CardDescription>
                    Create classes, manage students, and conduct quizzes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="text-left space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Create and manage classes</li>
                    <li>• Design quizzes with multiple question types</li>
                    <li>• Schedule quiz sessions</li>
                    <li>• Monitor student performance</li>
                  </ul>
                  <div className="space-y-2">
                    <Button asChild className="w-full">
                      <Link href="/auth/signin?role=admin">
                        Sign In as Admin
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/auth/signup?role=admin">
                        Create Admin Account
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-2xl text-green-600 dark:text-green-400">
                    Student Portal
                  </CardTitle>
                  <CardDescription>
                    Join classes and participate in quizzes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="text-left space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Join classes with unique codes</li>
                    <li>• Participate in scheduled quizzes</li>
                    <li>• View results and feedback</li>
                    <li>• Track your progress</li>
                  </ul>
                  <div className="space-y-2">
                    <Button asChild className="w-full">
                      <Link href="/auth/signin?role=student">
                        Sign In as Student
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/auth/signup?role=student">
                        Create Student Account
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="max-w-2xl mx-auto mt-12">
              <CardHeader>
                <CardTitle className="text-xl text-amber-600 dark:text-amber-400">
                  Setup Required
                </CardTitle>
                <CardDescription>
                  Please configure your Supabase environment variables to get
                  started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-left space-y-3 text-sm">
                  <p className="font-medium">Setup Instructions:</p>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
                    <li>
                      <strong>Create Supabase Project:</strong> Visit{" "}
                      <a
                        href="https://supabase.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        supabase.com
                      </a>{" "}
                      and create a new project
                    </li>
                    <li>
                      <strong>Environment Variables:</strong> Create a{" "}
                      <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                        .env.local
                      </code>{" "}
                      file with:
                      <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs">
                        NEXT_PUBLIC_SUPABASE_URL=your_project_url
                        <br />
                        NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
                        <br />
                        SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
                      </div>
                    </li>
                    <li>
                      <strong>Database Schema:</strong> Copy all contents from{" "}
                      <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                        lib/database-schema.sql
                      </code>{" "}
                      and run in your Supabase SQL Editor
                    </li>
                    <li>
                      <strong>Restart:</strong> Restart the development server
                    </li>
                  </ol>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link
                    href="https://github.com/your-repo/quiz-app#setup"
                    target="_blank"
                  >
                    View Setup Guide
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="pt-8 text-sm text-gray-500 dark:text-gray-400">
            Built with Next.js, Supabase, and Tailwind CSS
          </div>
        </div>
      </main>
    </div>
  );
}
