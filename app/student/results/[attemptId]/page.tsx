"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trophy,
  Target,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/providers/auth-provider";
import { getQuizAttemptDetails } from "@/lib/auth/client-auth-helpers";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface QuestionResult {
  id: string;
  question_number: number;
  type: "multiple_choice" | "true_false" | "essay";
  question_text: string;
  points: number;
  options?: string[];
  correct_answer?: any;
  explanation?: string;
  student_answer?: any;
  points_awarded: number;
  is_correct: boolean;
}

interface QuizAttemptDetails {
  id: string;
  quiz_id: string;
  quiz_title: string;
  class_name: string;
  started_at: string;
  submitted_at: string | null;
  score: number | null;
  total_points: number;
  time_taken: number; // in seconds
  show_results_to_students: boolean;
  questions: QuestionResult[];
}

export default function QuizResultDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params.attemptId as string;
  const { profile } = useAuth();

  const [attemptDetails, setAttemptDetails] =
    useState<QuizAttemptDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAttemptDetails = async () => {
      if (!profile?.id) {
        router.push("/auth/signin");
        return;
      }

      try {
        setLoading(true);

        // Get detailed quiz attempt results
        const details = await getQuizAttemptDetails(attemptId);
        setAttemptDetails(details);
      } catch (err) {
        console.error("Error loading attempt details:", err);
        setError("Failed to load quiz details");
      } finally {
        setLoading(false);
      }
    };

    loadAttemptDetails();
  }, [attemptId, profile?.id, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getQuestionIcon = (question: QuestionResult) => {
    if (!attemptDetails?.show_results_to_students) {
      return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }

    if (question.is_correct) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getAnswerDisplay = (question: QuestionResult) => {
    if (!attemptDetails?.show_results_to_students) {
      return (
        <span className="text-gray-500">Results hidden by instructor</span>
      );
    }

    if (question.type === "multiple_choice" && question.options) {
      const studentAnswerText =
        question.options[question.student_answer as number] || "No answer";
      const correctAnswerText =
        question.options[question.correct_answer as number] || "Unknown";

      return (
        <div className="space-y-2">
          <div>
            <span className="font-medium">Your answer: </span>
            <span
              className={
                question.is_correct ? "text-green-600" : "text-red-600"
              }
            >
              {studentAnswerText}
            </span>
          </div>
          {!question.is_correct && (
            <div>
              <span className="font-medium">Correct answer: </span>
              <span className="text-green-600">{correctAnswerText}</span>
            </div>
          )}
        </div>
      );
    }

    if (question.type === "true_false") {
      return (
        <div className="space-y-2">
          <div>
            <span className="font-medium">Your answer: </span>
            <span
              className={
                question.is_correct ? "text-green-600" : "text-red-600"
              }
            >
              {question.student_answer === "true" ? "True" : "False"}
            </span>
          </div>
          {!question.is_correct && (
            <div>
              <span className="font-medium">Correct answer: </span>
              <span className="text-green-600">
                {question.correct_answer === "true" ? "True" : "False"}
              </span>
            </div>
          )}
        </div>
      );
    }

    if (question.type === "essay") {
      return (
        <div className="space-y-2">
          <div>
            <span className="font-medium">Your answer: </span>
            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded border">
              {question.student_answer || "No answer provided"}
            </div>
          </div>
        </div>
      );
    }

    return <span>Answer not available</span>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !attemptDetails) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Error Loading Results
            </h3>
            <p className="text-red-600 mb-4">
              {error || "Quiz results not found"}
            </p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scorePercentage =
    attemptDetails.show_results_to_students && attemptDetails.score
      ? (attemptDetails.score / 100) * 100
      : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/student/results")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Results
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {attemptDetails.quiz_title} - Results
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {attemptDetails.class_name}
            </p>
          </div>
        </div>
      </div>

      {/* Quiz Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Quiz Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {attemptDetails.show_results_to_students
                  ? `${Math.round(scorePercentage)}%`
                  : "Hidden"}
              </div>
              <p className="text-sm text-muted-foreground">Final Score</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {attemptDetails.show_results_to_students
                  ? `${
                      attemptDetails.questions.filter((q) => q.is_correct)
                        .length
                    }/${attemptDetails.questions.length}`
                  : "Hidden"}
              </div>
              <p className="text-sm text-muted-foreground">Correct Answers</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatTime(attemptDetails.time_taken)}
              </div>
              <p className="text-sm text-muted-foreground">Time Taken</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {attemptDetails.total_points}
              </div>
              <p className="text-sm text-muted-foreground">Total Points</p>
            </div>
          </div>

          {attemptDetails.show_results_to_students && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(scorePercentage)}%
                </span>
              </div>
              <Progress value={scorePercentage} className="h-2" />
            </div>
          )}

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Started: {formatDate(attemptDetails.started_at)}
            </div>
            {attemptDetails.submitted_at && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Completed: {formatDate(attemptDetails.submitted_at)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Visibility Notice */}
      {!attemptDetails.show_results_to_students && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                  Results Hidden
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Your instructor has chosen not to show detailed results for
                  this quiz. You can see that you completed the quiz, but scores
                  and correct answers are hidden.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Question Details
          </CardTitle>
          <CardDescription>
            {attemptDetails.show_results_to_students
              ? "Review your answers and see explanations"
              : "Question details are hidden by your instructor"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {attemptDetails.questions.map((question) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  {getQuestionIcon(question)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">
                        Question {question.question_number}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {question.points} points
                        </Badge>
                        {attemptDetails.show_results_to_students && (
                          <Badge
                            variant={
                              question.is_correct ? "default" : "destructive"
                            }
                            className={
                              question.is_correct
                                ? "bg-green-100 text-green-800"
                                : ""
                            }
                          >
                            {question.points_awarded}/{question.points}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      {question.question_text}
                    </p>

                    {/* Answer Display */}
                    <div className="mb-3">{getAnswerDisplay(question)}</div>

                    {/* Explanation */}
                    {attemptDetails.show_results_to_students &&
                      question.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start gap-2">
                            <BookOpen className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                                Explanation
                              </h4>
                              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                {question.explanation}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/student/results">
                <ArrowLeft className="w-4 h-4 mr-2" />
                All Results
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/student/dashboard">Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="/student/classes">My Classes</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
