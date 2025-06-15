import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Trophy, Clock, Users } from "lucide-react";
import Link from "next/link";

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here's an overview of your classes and quizzes.
          </p>
        </div>
        <Button asChild>
          <Link href="/student/classes">
            <Users className="mr-2 h-4 w-4" />
            View All Classes
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Enrolled Classes
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Not enrolled in any classes yet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Quizzes
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              No quizzes available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Quizzes
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              No quizzes completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">No scores yet</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest quiz activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Trophy className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                No activity yet
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Your quiz activities will appear here once you start
                participating.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              How to get the most out of your quiz experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <span className="text-xs font-medium text-green-600">1</span>
                </div>
                <span className="text-sm">
                  Ask your instructor for a class code
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">2</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Join your class using the provided code
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">3</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Participate in scheduled quizzes
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">4</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  View your results and feedback
                </span>
              </div>
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/student/classes">Browse Classes</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Quizzes */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Quizzes</CardTitle>
          <CardDescription>
            Scheduled quizzes for your enrolled classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
              No upcoming quizzes
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Scheduled quizzes will appear here when your instructors create
              them.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
