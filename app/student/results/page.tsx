"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Clock,
  BookOpen,
  TrendingUp,
  Calendar,
  BarChart3,
  Award,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/providers/auth-provider";
import { getStudentQuizAttempts } from "@/lib/auth/client-auth-helpers";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface QuizAttempt {
  id: string;
  quiz_id: string;
  started_at: string;
  submitted_at: string | null;
  score: number | null;
  answers: Record<string, any>;
  quiz_title: string;
  class_name: string;
  show_results_to_students: boolean;
}

export default function StudentResultsPage() {
  const { profile } = useAuth();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      if (!profile?.id) return;

      try {
        const data = await getStudentQuizAttempts(profile.id);
        setAttempts(data);
      } catch (error) {
        console.error("Error loading quiz results:", error);
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, [profile?.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatScore = (score: number | null) => {
    if (score === null) return "N/A";
    return `${Math.round(score)}%`;
  };

  const getScoreBadge = (score: number | null, showResults: boolean) => {
    if (!showResults) return <Badge variant="outline">Results Hidden</Badge>;
    if (score === null) return <Badge variant="secondary">Pending</Badge>;

    if (score >= 90)
      return <Badge className="bg-green-100 text-green-800">A</Badge>;
    if (score >= 80)
      return <Badge className="bg-blue-100 text-blue-800">B</Badge>;
    if (score >= 70)
      return <Badge className="bg-yellow-100 text-yellow-800">C</Badge>;
    if (score >= 60)
      return <Badge className="bg-orange-100 text-orange-800">D</Badge>;
    return <Badge className="bg-red-100 text-red-800">F</Badge>;
  };

  const calculateStats = () => {
    const completedAttempts = attempts.filter(
      (a) => a.submitted_at && a.score !== null && a.show_results_to_students
    );
    const totalAttempts = attempts.length;
    const averageScore =
      completedAttempts.length > 0
        ? completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) /
          completedAttempts.length
        : 0;

    const gradeDistribution = {
      A: completedAttempts.filter((a) => (a.score || 0) >= 90).length,
      B: completedAttempts.filter(
        (a) => (a.score || 0) >= 80 && (a.score || 0) < 90
      ).length,
      C: completedAttempts.filter(
        (a) => (a.score || 0) >= 70 && (a.score || 0) < 80
      ).length,
      D: completedAttempts.filter(
        (a) => (a.score || 0) >= 60 && (a.score || 0) < 70
      ).length,
      F: completedAttempts.filter((a) => (a.score || 0) < 60).length,
    };

    return {
      totalAttempts,
      completedAttempts: completedAttempts.length,
      averageScore,
      gradeDistribution,
      bestScore:
        completedAttempts.length > 0
          ? Math.max(...completedAttempts.map((a) => a.score || 0))
          : 0,
    };
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Quiz Results
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View your quiz performance and track your progress
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/student/dashboard">Back to Dashboard</Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedAttempts} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatScore(stats.averageScore)}
            </div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatScore(stats.bestScore)}
            </div>
            <p className="text-xs text-muted-foreground">Highest achievement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Grade Distribution
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-1">
              {Object.entries(stats.gradeDistribution).map(([grade, count]) => (
                <div key={grade} className="text-center">
                  <div className="text-xs font-medium">{grade}</div>
                  <div className="text-sm text-muted-foreground">{count}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Grade breakdown
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Results List */}
      {attempts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Quiz History</CardTitle>
            <CardDescription>
              Your recent quiz attempts and scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{attempt.quiz_title}</div>
                    <div className="text-sm text-muted-foreground">
                      {attempt.class_name}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Started: {formatDate(attempt.started_at)}
                      </div>
                      {attempt.submitted_at && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Completed: {formatDate(attempt.submitted_at)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {attempt.show_results_to_students
                          ? formatScore(attempt.score)
                          : "Hidden"}
                      </div>
                      {attempt.submitted_at ? (
                        getScoreBadge(
                          attempt.score,
                          attempt.show_results_to_students
                        )
                      ) : (
                        <Badge variant="outline">In Progress</Badge>
                      )}
                    </div>

                    {attempt.submitted_at ? (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/student/results/${attempt.id}`}>
                          View Details
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild size="sm">
                        <Link href={`/student/quiz/${attempt.quiz_id}`}>
                          Continue
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Empty State */
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Trophy className="mx-auto h-16 w-16 text-gray-400" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  No Quiz Results Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  You haven't completed any quizzes yet. Start taking quizzes to
                  see your results here.
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button asChild>
                  <Link href="/student/dashboard">View Available Quizzes</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/student/join">Join Quiz with Code</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Insights */}
      {stats.completedAttempts > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
            <CardDescription>
              Tips to improve your quiz performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.averageScore >= 80 && (
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Award className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-green-800 dark:text-green-200">
                      Excellent Performance!
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      You're consistently scoring well. Keep up the great work!
                    </div>
                  </div>
                </div>
              )}

              {stats.averageScore < 70 && stats.completedAttempts >= 3 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-800 dark:text-yellow-200">
                      Room for Improvement
                    </div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300">
                      Consider reviewing course materials before taking quizzes.
                      Your average could improve with more preparation.
                    </div>
                  </div>
                </div>
              )}

              {stats.gradeDistribution.A > stats.gradeDistribution.F && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-800 dark:text-blue-200">
                      Consistent High Performance
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      You're earning more A's than low grades. Great job
                      maintaining high standards!
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
