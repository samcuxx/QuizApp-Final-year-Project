"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Play,
  Pause,
  Copy,
  Calendar,
  Clock,
  Users,
  BookOpen,
  HelpCircle,
  CheckCircle,
  FileText,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/providers/auth-provider";
import {
  getQuizWithQuestions,
  deleteQuiz,
  updateQuizStatus,
} from "@/lib/auth/client-auth-helpers";

interface Quiz {
  id: string;
  title: string;
  description: string;
  class_id: string;
  class_name: string;
  quiz_code: string;
  status: "draft" | "scheduled" | "active" | "completed" | "cancelled";
  scheduled_start: string | null;
  scheduled_end: string | null;
  duration_minutes: number | null;
  attempts_allowed: number;
  instructions: string | null;
  created_at: string;
  questions: Question[];
}

interface Question {
  id: string;
  question_number: number;
  type: "multiple_choice" | "true_false" | "essay";
  question_text: string;
  points: number;
  options: string[] | null;
  correct_answer: string | number | null;
  explanation: string | null;
}

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  scheduled: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels = {
  draft: "Draft",
  scheduled: "Scheduled",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};

const questionTypeLabels = {
  multiple_choice: "Multiple Choice",
  true_false: "True/False",
  essay: "Essay",
};

const questionTypeIcons = {
  multiple_choice: HelpCircle,
  true_false: CheckCircle,
  essay: FileText,
};

export default function QuizDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadQuiz() {
      if (!params.id || !profile?.id) return;

      try {
        const data = await getQuizWithQuestions(params.id as string);
        setQuiz(data);
      } catch (error) {
        console.error("Error loading quiz:", error);
        setError("Failed to load quiz details");
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [params.id, profile?.id]);

  const copyQuizCode = () => {
    if (quiz?.quiz_code) {
      navigator.clipboard.writeText(quiz.quiz_code);
      // You could add a toast notification here
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!quiz) return;

    setActionLoading(true);
    try {
      await updateQuizStatus(quiz.id, newStatus);
      setQuiz({ ...quiz, status: newStatus as any });
    } catch (error) {
      console.error("Error updating quiz status:", error);
      setError("Failed to update quiz status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (
      !quiz ||
      !window.confirm(
        "Are you sure you want to delete this quiz? This action cannot be undone."
      )
    )
      return;

    setActionLoading(true);
    try {
      await deleteQuiz(quiz.id);
      router.push("/admin/quizzes");
    } catch (error) {
      console.error("Error deleting quiz:", error);
      setError("Failed to delete quiz");
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPoints =
    quiz?.questions.reduce((sum, q) => sum + q.points, 0) || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/quizzes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quizzes
            </Link>
          </Button>
        </div>
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error || "Quiz not found"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/quizzes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quizzes
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {quiz.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {quiz.class_name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={statusColors[quiz.status]}>
            {statusLabels[quiz.status]}
          </Badge>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/quizzes/${quiz.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Quiz
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Quiz Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={copyQuizCode}
              className="flex items-center"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Quiz Code: {quiz.quiz_code}
            </Button>

            {quiz.status === "draft" && (
              <Button
                size="sm"
                onClick={() => handleStatusChange("active")}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Quiz
              </Button>
            )}

            {quiz.status === "active" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("completed")}
                disabled={actionLoading}
              >
                <Pause className="h-4 w-4 mr-2" />
                End Quiz
              </Button>
            )}

            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteQuiz}
              disabled={actionLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Quiz
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quiz Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quiz.questions.length}</div>
            <p className="text-xs text-muted-foreground">
              {totalPoints} total points
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quiz.duration_minutes ? `${quiz.duration_minutes}m` : "∞"}
            </div>
            <p className="text-xs text-muted-foreground">
              {quiz.duration_minutes ? "Time limit" : "No time limit"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attempts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quiz.attempts_allowed === -1 ? "∞" : quiz.attempts_allowed}
            </div>
            <p className="text-xs text-muted-foreground">Allowed per student</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {quiz.scheduled_start ? "Yes" : "No"}
            </div>
            <p className="text-xs text-muted-foreground">
              {quiz.scheduled_start
                ? formatDate(quiz.scheduled_start)
                : "Manual start"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quiz Details */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Description
            </Label>
            <p className="mt-1">{quiz.description}</p>
          </div>

          {quiz.instructions && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Instructions
              </Label>
              <p className="mt-1">{quiz.instructions}</p>
            </div>
          )}

          {quiz.scheduled_start && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Start Time
                </Label>
                <p className="mt-1">{formatDate(quiz.scheduled_start)}</p>
              </div>
              {quiz.scheduled_end && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    End Time
                  </Label>
                  <p className="mt-1">{formatDate(quiz.scheduled_end)}</p>
                </div>
              )}
            </div>
          )}

          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Created
            </Label>
            <p className="mt-1">{formatDate(quiz.created_at)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Questions ({quiz.questions.length})</span>
            <Badge variant="outline">{totalPoints} Total Points</Badge>
          </CardTitle>
          <CardDescription>Review and manage quiz questions</CardDescription>
        </CardHeader>
        <CardContent>
          {quiz.questions.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No questions yet
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add questions to your quiz to get started.
              </p>
              <div className="mt-6">
                <Button asChild>
                  <Link href={`/admin/quizzes/${quiz.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Add Questions
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {quiz.questions.map((question) => {
                const Icon = questionTypeIcons[question.type];
                return (
                  <Card key={question.id} className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4 text-gray-600" />
                          <Badge variant="secondary">
                            {questionTypeLabels[question.type]}
                          </Badge>
                          <span className="text-sm font-medium text-gray-600">
                            Question {question.question_number}
                          </span>
                        </div>
                        <Badge variant="outline">
                          {question.points}{" "}
                          {question.points === 1 ? "point" : "points"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Question
                        </Label>
                        <p className="mt-1">{question.question_text}</p>
                      </div>

                      {/* Multiple Choice Options */}
                      {question.type === "multiple_choice" &&
                        question.options && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">
                              Options
                            </Label>
                            <div className="mt-2 space-y-2">
                              {question.options.map((option, index) => (
                                <div
                                  key={index}
                                  className={`flex items-center space-x-2 p-2 rounded-md ${
                                    question.correct_answer === index
                                      ? "bg-green-50 border border-green-200"
                                      : "bg-gray-50"
                                  }`}
                                >
                                  <div
                                    className={`w-4 h-4 rounded-full border-2 ${
                                      question.correct_answer === index
                                        ? "bg-green-500 border-green-500"
                                        : "border-gray-300"
                                    }`}
                                  />
                                  <span
                                    className={
                                      question.correct_answer === index
                                        ? "font-medium"
                                        : ""
                                    }
                                  >
                                    {option}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* True/False Answer */}
                      {question.type === "true_false" && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">
                            Correct Answer
                          </Label>
                          <p className="mt-1 font-medium">
                            {question.correct_answer === "true"
                              ? "True"
                              : "False"}
                          </p>
                        </div>
                      )}

                      {/* Essay Guidelines */}
                      {question.type === "essay" && question.explanation && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">
                            Answer Guidelines
                          </Label>
                          <p className="mt-1 text-sm text-gray-600">
                            {question.explanation}
                          </p>
                        </div>
                      )}

                      {/* Explanation for non-essay questions */}
                      {question.type !== "essay" && question.explanation && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">
                            Explanation
                          </Label>
                          <p className="mt-1 text-sm text-gray-600">
                            {question.explanation}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <label className={className}>{children}</label>;
}
