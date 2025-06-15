"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Trophy, Clock, Users, Plus, Code } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/providers/auth-provider";
import { getStudentDashboardData } from "@/lib/auth/client-auth-helpers";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface DashboardData {
  enrolledClasses: Array<{
    id: string;
    name: string;
    subject: string;
    semester: string;
    academic_year: string;
    enrolled_at: string;
    instructor_name: string;
  }>;
  availableQuizzes: Array<{
    id: string;
    title: string;
    class_name: string;
    status: string;
    duration_minutes: number;
    attempts_allowed: number;
    scheduled_start?: string;
    scheduled_end?: string;
  }>;
  upcomingQuizzes: Array<{
    id: string;
    title: string;
    class_name: string;
    status: string;
    duration_minutes: number;
    scheduled_start?: string;
  }>;
  recentAttempts: Array<{
    id: string;
    quiz_title: string;
    class_name: string;
    started_at: string;
    submitted_at?: string;
    score?: number;
  }>;
  stats: {
    enrolledClasses: number;
    availableQuizzes: number;
    completedQuizzes: number;
    averageScore: number | null;
  };
}

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!profile?.id) return;

      try {
        const data = await getStudentDashboardData(profile.id);
        setDashboardData(data);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [profile?.id]);

  const formatScore = (score: number | null) => {
    if (score === null) return "--";
    return `${Math.round(score)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getQuizStatusBadge = (quiz: {
    status: string;
    scheduled_start?: string;
    scheduled_end?: string;
  }) => {
    const now = new Date();
    const start = quiz.scheduled_start ? new Date(quiz.scheduled_start) : null;
    const end = quiz.scheduled_end ? new Date(quiz.scheduled_end) : null;

    if (quiz.status === "active") {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
    if (quiz.status === "scheduled" && start && now < start) {
      return <Badge variant="outline">Scheduled</Badge>;
    }
    if (end && now > end) {
      return <Badge variant="secondary">Ended</Badge>;
    }
    return <Badge variant="outline">{quiz.status}</Badge>;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const stats = dashboardData?.stats || {
    enrolledClasses: 0,
    availableQuizzes: 0,
    completedQuizzes: 0,
    averageScore: null,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {profile?.name}! Here&apos;s an overview of your
            classes and quizzes.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/student/join">
              <Code className="mr-2 h-4 w-4" />
              Join Quiz
            </Link>
          </Button>
          <Button asChild>
            <Link href="/student/classes">
              <Users className="mr-2 h-4 w-4" />
              My Classes
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Enrolled Classes
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enrolledClasses}</div>
            <p className="text-xs text-muted-foreground">
              {stats.enrolledClasses === 0
                ? "Not enrolled in any classes yet"
                : stats.enrolledClasses === 1
                ? "1 class enrolled"
                : `${stats.enrolledClasses} classes enrolled`}
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
            <div className="text-2xl font-bold">{stats.availableQuizzes}</div>
            <p className="text-xs text-muted-foreground">
              {stats.availableQuizzes === 0
                ? "No quizzes available"
                : "Ready to take"}
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
            <div className="text-2xl font-bold">{stats.completedQuizzes}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedQuizzes === 0
                ? "No quizzes completed yet"
                : "Total completed"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatScore(stats.averageScore)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.averageScore === null
                ? "No scores yet"
                : "Overall performance"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest quiz activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData?.recentAttempts.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{attempt.quiz_title}</div>
                      <div className="text-sm text-muted-foreground">
                        {attempt.class_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(attempt.started_at)}
                      </div>
                    </div>
                    <div className="text-right">
                      {attempt.submitted_at ? (
                        <Badge variant="outline">
                          {formatScore(attempt.score)}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">In Progress</Badge>
                      )}
                    </div>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/student/results">View All Results</Link>
                </Button>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>

        {/* Quick Actions / Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>
              {stats.enrolledClasses === 0
                ? "Getting Started"
                : "Quick Actions"}
            </CardTitle>
            <CardDescription>
              {stats.enrolledClasses === 0
                ? "How to get the most out of your quiz experience"
                : "Common actions you might want to take"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.enrolledClasses === 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-xs font-medium text-green-600">
                      1
                    </span>
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
                <div className="mt-4 space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/student/classes">Join a Class</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/student/join">Join Quiz with Code</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/student/join">
                    <Code className="mr-2 h-4 w-4" />
                    Join Quiz with Code
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/student/classes">
                    <Plus className="mr-2 h-4 w-4" />
                    Join Another Class
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/student/results">
                    <Trophy className="mr-2 h-4 w-4" />
                    View Quiz Results
                  </Link>
                </Button>
              </div>
            )}
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
          {dashboardData?.upcomingQuizzes.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.upcomingQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{quiz.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {quiz.class_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {quiz.scheduled_start && formatDate(quiz.scheduled_start)}
                      {quiz.duration_minutes &&
                        ` • ${quiz.duration_minutes} minutes`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getQuizStatusBadge(quiz)}
                    <Button asChild size="sm">
                      <Link href={`/student/quiz/${quiz.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>

      {/* Available Quizzes */}
      {dashboardData?.availableQuizzes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Quizzes</CardTitle>
            <CardDescription>Quizzes you can take right now</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.availableQuizzes.slice(0, 5).map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{quiz.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {quiz.class_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {quiz.duration_minutes &&
                        `${quiz.duration_minutes} minutes`}
                      {quiz.attempts_allowed &&
                        ` • ${quiz.attempts_allowed} attempt${
                          quiz.attempts_allowed > 1 ? "s" : ""
                        } allowed`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getQuizStatusBadge(quiz)}
                    <Button asChild size="sm">
                      <Link href={`/student/quiz/${quiz.id}`}>Take Quiz</Link>
                    </Button>
                  </div>
                </div>
              ))}
              {dashboardData.availableQuizzes.length > 5 && (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/student/quizzes">
                    View All Available Quizzes
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
