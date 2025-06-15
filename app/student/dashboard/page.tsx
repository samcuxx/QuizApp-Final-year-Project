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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Users,
  Trophy,
  TrendingUp,
  Calendar,
  Clock,
  BarChart3,
  Activity,
  Plus,
  GraduationCap,
  Target,
  CheckCircle,
  AlertCircle,
  Code,
} from "lucide-react";
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
        setDashboardData(data as DashboardData);
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
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    }
    if (quiz.status === "scheduled" && start && now < start) {
      return (
        <Badge variant="outline" className="border-blue-200 text-blue-700">
          <Clock className="w-3 h-3 mr-1" />
          Scheduled
        </Badge>
      );
    }
    if (end && now > end) {
      return (
        <Badge variant="secondary">
          <AlertCircle className="w-3 h-3 mr-1" />
          Ended
        </Badge>
      );
    }
    return <Badge variant="outline">{quiz.status}</Badge>;
  };

  const getPerformanceColor = (score: number | null) => {
    if (score === null) return "text-gray-500";
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getPerformanceLevel = (score: number | null) => {
    if (score === null) return "No data";
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Good";
    if (score >= 70) return "Average";
    if (score >= 60) return "Below Average";
    return "Needs Improvement";
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
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Welcome back, {profile?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
            Here's your academic overview and upcoming activities
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" size="lg">
            <Link href="/student/join">
              <Code className="mr-2 h-5 w-5" />
              Join Quiz
            </Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/student/classes">
              <Users className="mr-2 h-5 w-5" />
              My Classes
            </Link>
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Enrolled Classes
            </CardTitle>
            <BookOpen className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats.enrolledClasses}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.enrolledClasses === 0
                ? "Join your first class to get started"
                : stats.enrolledClasses === 1
                ? "1 active enrollment"
                : `${stats.enrolledClasses} active enrollments`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Quizzes
            </CardTitle>
            <Clock className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.availableQuizzes}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.availableQuizzes === 0
                ? "No quizzes available right now"
                : "Ready to take"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Quizzes
            </CardTitle>
            <Trophy className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {stats.completedQuizzes}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completedQuizzes === 0
                ? "Complete your first quiz"
                : "Total completed"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${getPerformanceColor(
                stats.averageScore
              )}`}
            >
              {formatScore(stats.averageScore)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getPerformanceLevel(stats.averageScore)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      {stats.averageScore !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Academic Performance
            </CardTitle>
            <CardDescription>
              Your overall performance across all completed quizzes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Performance</span>
                <span
                  className={`font-medium ${getPerformanceColor(
                    stats.averageScore
                  )}`}
                >
                  {getPerformanceLevel(stats.averageScore)} (
                  {formatScore(stats.averageScore)})
                </span>
              </div>
              <Progress value={stats.averageScore || 0} className="h-3" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">
                  {stats.averageScore >= 90 ? stats.completedQuizzes : 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Excellent (90%+)
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.averageScore >= 80 && stats.averageScore < 90
                    ? stats.completedQuizzes
                    : 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Good (80-89%)
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.averageScore >= 70 && stats.averageScore < 80
                    ? stats.completedQuizzes
                    : 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Average (70-79%)
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-red-600">
                  {stats.averageScore < 70 ? stats.completedQuizzes : 0}
                </div>
                <div className="text-xs text-muted-foreground">Below 70%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest quiz activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData?.recentAttempts &&
            dashboardData.recentAttempts.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentAttempts.slice(0, 5).map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{attempt.quiz_title}</div>
                        <div className="text-sm text-muted-foreground">
                          {attempt.class_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(attempt.started_at)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {attempt.submitted_at ? (
                        <Badge
                          variant="outline"
                          className={getPerformanceColor(attempt.score ?? null)}
                        >
                          {formatScore(attempt.score ?? null)}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          In Progress
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                <Separator />
                <Button asChild variant="outline" className="w-full">
                  <Link href="/student/results">
                    <Trophy className="mr-2 h-4 w-4" />
                    View All Results
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No activity yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Your quiz activities will appear here once you start
                  participating.
                </p>
                <Button asChild>
                  <Link href="/student/join">
                    <Code className="mr-2 h-4 w-4" />
                    Take Your First Quiz
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions / Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {stats.enrolledClasses === 0
                ? "Getting Started"
                : "Quick Actions"}
            </CardTitle>
            <CardDescription>
              {stats.enrolledClasses === 0
                ? "Follow these steps to begin your learning journey"
                : "Common actions and helpful shortcuts"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.enrolledClasses === 0 ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-blue-600">
                        1
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">Get Your Class Code</h4>
                      <p className="text-sm text-muted-foreground">
                        Ask your instructor for a class enrollment code
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-gray-600">
                        2
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground">
                        Join Your Class
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Use the code to enroll in your class
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-gray-600">
                        3
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground">
                        Take Quizzes
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Participate in scheduled quizzes and assessments
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-gray-600">
                        4
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground">
                        Track Progress
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        View your results and monitor your performance
                      </p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <Button asChild className="w-full" size="lg">
                    <Link href="/student/classes">
                      <Users className="mr-2 h-5 w-5" />
                      Join Your First Class
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/student/join">
                      <Code className="mr-2 h-4 w-4" />
                      Join Quiz with Code
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3">
                  <Button asChild className="w-full justify-start" size="lg">
                    <Link href="/student/join">
                      <Code className="mr-3 h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">Join Quiz with Code</div>
                        <div className="text-xs text-muted-foreground">
                          Enter a quiz code to participate
                        </div>
                      </div>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Link href="/student/classes">
                      <Plus className="mr-3 h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Join Another Class</div>
                        <div className="text-xs text-muted-foreground">
                          Enroll in additional classes
                        </div>
                      </div>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Link href="/student/results">
                      <Trophy className="mr-3 h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">View Quiz Results</div>
                        <div className="text-xs text-muted-foreground">
                          Check your performance history
                        </div>
                      </div>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Link href="/student/profile">
                      <GraduationCap className="mr-3 h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Profile Settings</div>
                        <div className="text-xs text-muted-foreground">
                          Manage your account
                        </div>
                      </div>
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Quizzes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Quizzes
          </CardTitle>
          <CardDescription>
            Scheduled quizzes for your enrolled classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardData?.upcomingQuizzes &&
          dashboardData.upcomingQuizzes.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.upcomingQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-lg">{quiz.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {quiz.class_name}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        {quiz.scheduled_start && (
                          <>
                            <Calendar className="w-3 h-3" />
                            {formatDate(quiz.scheduled_start)}
                          </>
                        )}
                        {quiz.duration_minutes && (
                          <>
                            <Clock className="w-3 h-3 ml-2" />
                            {quiz.duration_minutes} minutes
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getQuizStatusBadge(quiz)}
                    <Button asChild>
                      <Link href={`/student/quiz/${quiz.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No upcoming quizzes
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Scheduled quizzes will appear here when your instructors create
                them.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Quizzes */}
      {dashboardData?.availableQuizzes &&
        dashboardData.availableQuizzes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Available Quizzes
              </CardTitle>
              <CardDescription>Quizzes you can take right now</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {dashboardData.availableQuizzes.slice(0, 6).map((quiz) => (
                  <div
                    key={quiz.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium">{quiz.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {quiz.class_name}
                        </div>
                      </div>
                      {getQuizStatusBadge(quiz)}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      {quiz.duration_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {quiz.duration_minutes} min
                        </span>
                      )}
                      {quiz.attempts_allowed && (
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {quiz.attempts_allowed} attempts
                        </span>
                      )}
                    </div>
                    <Button asChild className="w-full" size="sm">
                      <Link href={`/student/quiz/${quiz.id}`}>Start Quiz</Link>
                    </Button>
                  </div>
                ))}
              </div>
              {dashboardData.availableQuizzes.length > 6 && (
                <div className="mt-4 text-center">
                  <Button asChild variant="outline">
                    <Link href="/student/classes">
                      View All Available Quizzes
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
    </div>
  );
}
