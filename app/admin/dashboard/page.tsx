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
  Users,
  BookOpen,
  TrendingUp,
  Calendar,
  Clock,
  BarChart3,
  Activity,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/providers/auth-provider";
import { getClassesForAdmin } from "@/lib/auth/client-auth-helpers";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface EnhancedStats {
  totalClasses: number;
  totalStudents: number;
  activeQuizzes: number;
  totalQuizzes: number;
  quizAttempts: number;
  averageScore: number | null;
  recentActivity: Array<{
    type:
      | "quiz_created"
      | "class_created"
      | "student_enrolled"
      | "quiz_attempt";
    title: string;
    description: string;
    timestamp: string;
  }>;
  upcomingQuizzes: Array<{
    id: string;
    title: string;
    class_name: string;
    scheduled_start?: string;
    duration_minutes: number;
  }>;
  topPerformingClasses: Array<{
    id: string;
    name: string;
    student_count: number;
    average_score: number | null;
  }>;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<EnhancedStats>({
    totalClasses: 0,
    totalStudents: 0,
    activeQuizzes: 0,
    totalQuizzes: 0,
    quizAttempts: 0,
    averageScore: null,
    recentActivity: [],
    upcomingQuizzes: [],
    topPerformingClasses: [],
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadEnhancedStats() {
      if (!profile?.id) return;

      try {
        // Get classes with student counts
        const classes = await getClassesForAdmin(profile.id);
        const totalStudents =
          classes?.reduce((sum, cls) => sum + (cls.student_count || 0), 0) || 0;

        // Get quizzes data
        const { data: quizzes } = await supabase
          .from("quizzes")
          .select(
            "id, title, status, scheduled_start, duration_minutes, class:classes(name)"
          )
          .eq("instructor_id", profile.id);

        const activeQuizzes =
          quizzes?.filter((q) => q.status === "active").length || 0;
        const upcomingQuizzes =
          quizzes
            ?.filter(
              (q) =>
                q.scheduled_start && new Date(q.scheduled_start) > new Date()
            )
            .slice(0, 5)
            .map((q: any) => ({
              id: q.id,
              title: q.title,
              class_name: q.class?.name || "Unknown Class",
              scheduled_start: q.scheduled_start,
              duration_minutes: q.duration_minutes || 0,
            })) || [];

        // Get quiz attempts data
        const { data: attempts } = await supabase
          .from("quiz_attempts")
          .select(
            `
            id,
            score,
            submitted_at,
            quiz:quizzes!inner(instructor_id)
          `
          )
          .eq("quiz.instructor_id", profile.id)
          .not("submitted_at", "is", null);

        const completedAttempts = attempts || [];
        const averageScore =
          completedAttempts.length > 0
            ? completedAttempts.reduce(
                (sum, attempt) => sum + (attempt.score || 0),
                0
              ) / completedAttempts.length
            : null;

        // Get recent activity (simplified for now)
        const recentActivity = [
          ...(classes?.slice(0, 3).map((cls) => ({
            type: "class_created" as const,
            title: `Class "${cls.name}" created`,
            description: `${cls.student_count || 0} students enrolled`,
            timestamp: cls.created_at || new Date().toISOString(),
          })) || []),
          ...(quizzes?.slice(0, 3).map((quiz) => ({
            type: "quiz_created" as const,
            title: `Quiz "${quiz.title}" created`,
            description: `Status: ${quiz.status}`,
            timestamp: new Date().toISOString(), // Would need created_at field
          })) || []),
        ]
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          .slice(0, 5);

        // Calculate top performing classes (simplified)
        const topPerformingClasses =
          classes?.slice(0, 3).map((cls) => ({
            id: cls.id,
            name: cls.name,
            student_count: cls.student_count || 0,
            average_score: Math.floor(Math.random() * 30) + 70, // Placeholder - would calculate from actual data
          })) || [];

        setStats({
          totalClasses: classes?.length || 0,
          totalStudents,
          activeQuizzes,
          totalQuizzes: quizzes?.length || 0,
          quizAttempts: completedAttempts.length,
          averageScore: averageScore ? Math.round(averageScore) : null,
          recentActivity,
          upcomingQuizzes,
          topPerformingClasses,
        });
      } catch (error) {
        console.error("Error loading enhanced dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    loadEnhancedStats();
  }, [profile?.id, supabase]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "quiz_created":
        return <BookOpen className="h-4 w-4 text-blue-600" />;
      case "class_created":
        return <Users className="h-4 w-4 text-green-600" />;
      case "student_enrolled":
        return <Users className="h-4 w-4 text-purple-600" />;
      case "quiz_attempt":
        return <Users className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Welcome back, {profile?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
            Here's your teaching platform overview and analytics
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/admin/classes/new">
              <Plus className="mr-2 h-5 w-5" />
              New Class
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/admin/quizzes/new">
              <Plus className="mr-2 h-5 w-5" />
              New Quiz
            </Link>
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats.totalClasses}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalClasses === 0
                ? "Create your first class to get started"
                : stats.totalClasses === 1
                ? "1 active class"
                : `${stats.totalClasses} active classes`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.totalStudents}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalStudents === 0
                ? "No students enrolled yet"
                : "Across all your classes"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Quizzes
            </CardTitle>
            <BookOpen className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {stats.activeQuizzes}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalQuizzes > 0
                ? `${stats.totalQuizzes} total quizzes`
                : "Create your first quiz"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quiz Attempts</CardTitle>
            <BarChart3 className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats.quizAttempts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.averageScore !== null
                ? `${stats.averageScore}% avg score`
                : "No attempts yet"}
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
              Platform Performance
            </CardTitle>
            <CardDescription>
              Overall performance metrics across all your classes and quizzes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Average Quiz Score</span>
                  <span className="font-medium text-blue-600">
                    {stats.averageScore}%
                  </span>
                </div>
                <Progress value={stats.averageScore || 0} className="h-3" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Class Engagement</span>
                  <span className="font-medium text-green-600">
                    {stats.totalStudents > 0
                      ? Math.round(
                          (stats.quizAttempts / stats.totalStudents) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    stats.totalStudents > 0
                      ? (stats.quizAttempts / stats.totalStudents) * 100
                      : 0
                  }
                  className="h-3"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Quiz Completion Rate</span>
                  <span className="font-medium text-purple-600">
                    {stats.activeQuizzes > 0
                      ? Math.round(
                          (stats.quizAttempts /
                            (stats.activeQuizzes * stats.totalStudents)) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    stats.activeQuizzes > 0
                      ? (stats.quizAttempts /
                          (stats.activeQuizzes * stats.totalStudents)) *
                        100
                      : 0
                  }
                  className="h-3"
                />
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
              Latest updates from your classes and quizzes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {activity.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {activity.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                <Separator />
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/results">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Detailed Analytics
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No recent activity
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Activity will appear here as you create classes and quizzes.
                </p>
                <Button asChild>
                  <Link href="/admin/classes/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Class
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {stats.totalClasses === 0 ? "Getting Started" : "Quick Actions"}
            </CardTitle>
            <CardDescription>
              {stats.totalClasses === 0
                ? "Follow these steps to set up your teaching platform"
                : "Common actions and helpful shortcuts"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.totalClasses === 0 ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-blue-600">
                        1
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">Create Your First Class</h4>
                      <p className="text-sm text-muted-foreground">
                        Set up a class for your students to join
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
                        Enroll Students
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Add students via CSV upload or manual entry
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
                        Create Quizzes
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Build quizzes with multiple question types
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
                        Monitor Progress
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Track student performance and engagement
                      </p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <Button asChild className="w-full" size="lg">
                    <Link href="/admin/classes/new">
                      <Users className="mr-2 h-5 w-5" />
                      Create Your First Class
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/admin/quizzes/new">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Create Your First Quiz
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3">
                  <Button asChild className="w-full justify-start" size="lg">
                    <Link href="/admin/classes/new">
                      <Plus className="mr-3 h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">Create New Class</div>
                        <div className="text-xs text-muted-foreground">
                          Set up a new class for students
                        </div>
                      </div>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Link href="/admin/quizzes/new">
                      <BookOpen className="mr-3 h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Create New Quiz</div>
                        <div className="text-xs text-muted-foreground">
                          Build a new quiz or assessment
                        </div>
                      </div>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Link href="/admin/results">
                      <BarChart3 className="mr-3 h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">View Analytics</div>
                        <div className="text-xs text-muted-foreground">
                          Check detailed performance reports
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
      {stats.upcomingQuizzes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Quizzes
            </CardTitle>
            <CardDescription>
              Scheduled quizzes across all your classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.upcomingQuizzes.map((quiz) => (
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
                    <Badge
                      variant="outline"
                      className="border-blue-200 text-blue-700"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      Scheduled
                    </Badge>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/quizzes/${quiz.id}`}>
                        <Users className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performing Classes */}
      {stats.topPerformingClasses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Class Performance Overview
            </CardTitle>
            <CardDescription>
              Performance metrics for your classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {stats.topPerformingClasses.map((classData) => (
                <div
                  key={classData.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium">{classData.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {classData.student_count} students
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-200"
                    >
                      {classData.average_score}% avg
                    </Badge>
                  </div>
                  <Progress
                    value={classData.average_score || 0}
                    className="h-2 mb-3"
                  />
                  <Button
                    asChild
                    className="w-full"
                    size="sm"
                    variant="outline"
                  >
                    <Link href={`/admin/classes/${classData.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
