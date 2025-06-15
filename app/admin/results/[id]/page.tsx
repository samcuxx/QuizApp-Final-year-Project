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
  User,
  Mail,
  Hash,
  Edit,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/providers/auth-provider";
import { getAdminQuizAttemptDetails } from "@/lib/auth/client-auth-helpers";
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

interface AdminQuizAttemptDetails {
  id: string;
  quiz_id: string;
  quiz_title: string;
  class_name: string;
  student_name: string;
  student_email: string;
  student_index_number: string;
  attempt_number: number;
  started_at: string;
  submitted_at: string | null;
  score: number | null;
  total_points: number;
  time_taken: number;
  status: string;
  questions: QuestionResult[];
}

export default function AdminQuizResultDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params.id as string;
  const { profile } = useAuth();

  const [attemptDetails, setAttemptDetails] =
    useState<AdminQuizAttemptDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAttemptDetails = async () => {
      if (!profile?.id || profile.role !== "admin") {
        router.push("/auth/signin");
        return;
      }

      try {
        setLoading(true);
        const details = await getAdminQuizAttemptDetails(attemptId);
        setAttemptDetails(details);
      } catch (err) {
        console.error("Error loading attempt details:", err);
        setError("Failed to load quiz details");
      } finally {
        setLoading(false);
      }
    };

    loadAttemptDetails();
  }, [attemptId, profile?.id, profile?.role, router]);

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
    if (question.is_correct) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getAnswerDisplay = (question: QuestionResult) => {
    if (question.type === "multiple_choice" && question.options) {
      const studentAnswerText =
        question.options[question.student_answer as number] || "No answer";
      const correctAnswerText =
        question.options[question.correct_answer as number] || "Unknown";

      return (
        <div className="space-y-2">
          <div>
            <span className="font-medium">Student answer: </span>
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
            <span className="font-medium">Student answer: </span>
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
            <span className="font-medium">Student answer: </span>
            <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded border">
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

  const scorePercentage = attemptDetails.score || 0;
  const correctAnswers = attemptDetails.questions.filter(
    (q) => q.is_correct
  ).length;
  const hasEssayQuestions = attemptDetails.questions.some(
    (q) => q.type === "essay"
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/admin/results")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Results
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Quiz Result Details
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {attemptDetails.quiz_title} - {attemptDetails.class_name}
            </p>
          </div>
        </div>
        {hasEssayQuestions && attemptDetails.submitted_at && (
          <Button asChild>
            <Link href={`/admin/results/${attemptId}/grade`}>
              <Edit className="w-4 h-4 mr-2" />
              Grade Essay Questions
            </Link>
          </Button>
        )}
      </div>

      {/* Student Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Student Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{attemptDetails.student_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{attemptDetails.student_email}</p>
              </div>
            </div>
            {attemptDetails.student_index_number && (
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Index Number</p>
                  <p className="font-medium">
                    {attemptDetails.student_index_number}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quiz Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(scorePercentage)}%
              </div>
              <p className="text-sm text-muted-foreground">Final Score</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {correctAnswers}/{attemptDetails.questions.length}
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

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(scorePercentage)}%
              </span>
            </div>
            <Progress value={scorePercentage} className="h-2" />
          </div>

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
            <div className="flex items-center gap-1">
              <Hash className="h-4 w-4" />
              Attempt #{attemptDetails.attempt_number}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Question Analysis
          </CardTitle>
          <CardDescription>
            Detailed breakdown of student responses
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
                      </div>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      {question.question_text}
                    </p>

                    {/* Answer Display */}
                    <div className="mb-3">{getAnswerDisplay(question)}</div>

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-2">
                          <BookOpen className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                              Explanation
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
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
    </div>
  );
}
