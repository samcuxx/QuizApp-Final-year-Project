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
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  ArrowLeft,
  Play,
  Eye,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/providers/auth-provider";
import {
  getAvailableQuizzes,
  getClassById,
} from "@/lib/auth/client-auth-helpers";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Quiz {
  id: string;
  title: string;
  description: string;
  status: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  duration_minutes: number;
  attempts_allowed: number;
  quiz_code: string;
  class_name: string;
  class_id: string;
  student_attempts_used: number;
  student_has_completed: boolean;
  student_can_retake: boolean;
  student_submitted_attempts: number;
}

interface ClassDetails {
  id: string;
  name: string;
  subject: string;
  semester: string;
  academic_year: string;
  description: string;
}

export default function StudentClassQuizzesPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;
  const { profile } = useAuth();

  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!profile?.id) {
        router.push("/auth/signin");
        return;
      }

      try {
        setLoading(true);

        // Load class details and all available quizzes in parallel
        const [classData, allQuizzes] = await Promise.all([
          getClassById(classId),
          getAvailableQuizzes(profile.id),
        ]);

        if (!classData) {
          setError("Class not found or you don't have access to this class");
          return;
        }

        setClassDetails(classData);

        // Filter quizzes for this specific class
        const classQuizzes = allQuizzes.filter(
          (quiz) => quiz.class_id === classId
        );
        setQuizzes(classQuizzes);
      } catch (err) {
        console.error("Error loading class data:", err);
        setError("Failed to load class data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [classId, profile?.id, router]);

  const getQuizStatusInfo = (quiz: Quiz) => {
    const now = new Date();
    const start = quiz.scheduled_start ? new Date(quiz.scheduled_start) : null;
    const end = quiz.scheduled_end ? new Date(quiz.scheduled_end) : null;

    // Check if student has completed this quiz (highest priority)
    if (quiz.student_has_completed) {
      return {
        color: "bg-green-100 text-green-800 border-green-200",
        text: "Completed",
        canTake: false,
        showResults: true,
      };
    }

    // Check if student can retake (has submitted but can do more attempts)
    if (quiz.student_can_retake && quiz.status === "active") {
      return {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        text: `Retake Available (${quiz.student_attempts_used}/${quiz.attempts_allowed})`,
        canTake: true,
        showResults: true,
      };
    }

    // Global quiz status checks
    if (quiz.status === "active" && (!end || now <= end)) {
      return {
        color: "bg-green-100 text-green-800 border-green-200",
        text: "Active",
        canTake: true,
        showResults: false,
      };
    }
    if (quiz.status === "scheduled" && start && now < start) {
      return {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        text: "Scheduled",
        canTake: false,
        showResults: false,
      };
    }
    if (quiz.status === "completed" || (end && now > end)) {
      return {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        text: "Quiz Ended",
        canTake: false,
        showResults: quiz.student_submitted_attempts > 0,
      };
    }
    if (quiz.status === "draft") {
      return {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        text: "Draft",
        canTake: false,
        showResults: false,
      };
    }
    return {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      text: quiz.status,
      canTake: false,
      showResults: false,
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !classDetails) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Access Error
            </h3>
            <p className="text-red-600 mb-4">{error || "Class not found"}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button asChild>
                <Link href="/student/classes">View All Classes</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/student/classes/${classId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Class
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {classDetails.name} - Quizzes
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {classDetails.subject} • {classDetails.semester}{" "}
              {classDetails.academic_year}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          {quizzes.length} quizzes
        </Badge>
      </div>

      {/* Class Description */}
      {classDetails.description && (
        <Card>
          <CardContent className="p-4">
            <p className="text-gray-600 dark:text-gray-400">
              {classDetails.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quizzes List */}
      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Quizzes Available
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              There are no quizzes available for this class yet. Check back
              later or contact your instructor.
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild variant="outline">
                <Link href="/student/dashboard">Back to Dashboard</Link>
              </Button>
              <Button asChild>
                <Link href="/student/join">Join Quiz with Code</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {quizzes.map((quiz) => {
            const statusInfo = getQuizStatusInfo(quiz);
            return (
              <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{quiz.title}</CardTitle>
                      <CardDescription className="text-base">
                        {quiz.description}
                      </CardDescription>
                    </div>
                    <Badge className={`${statusInfo.color} border`}>
                      {statusInfo.text}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quiz Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4 mr-2" />
                      {quiz.duration_minutes
                        ? `${quiz.duration_minutes} min`
                        : "Unlimited"}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4 mr-2" />
                      {quiz.attempts_allowed === -1
                        ? "Unlimited attempts"
                        : `${quiz.student_attempts_used}/${quiz.attempts_allowed} attempts`}
                    </div>
                    {quiz.scheduled_start && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(quiz.scheduled_start)}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                        {quiz.quiz_code}
                      </span>
                    </div>
                  </div>

                  {/* Completion Status */}
                  {quiz.student_submitted_attempts > 0 && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center text-sm text-green-800 dark:text-green-200">
                        <Eye className="w-4 h-4 mr-2" />
                        <span className="font-medium">
                          {quiz.student_submitted_attempts === 1
                            ? "You have completed this quiz"
                            : `You have completed this quiz ${quiz.student_submitted_attempts} times`}
                        </span>
                        {quiz.student_can_retake && (
                          <span className="ml-2 text-blue-600 dark:text-blue-400">
                            • Retake available
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Scheduling Information */}
                  {quiz.scheduled_start && quiz.scheduled_end && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center text-sm text-blue-800 dark:text-blue-200">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="font-medium">Available:</span>
                        <span className="ml-2">
                          {formatDate(quiz.scheduled_start)} -{" "}
                          {formatDate(quiz.scheduled_end)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {statusInfo.canTake ? (
                      <Button asChild className="flex-1">
                        <Link href={`/student/quiz/${quiz.id}`}>
                          <Play className="w-4 h-4 mr-2" />
                          {quiz.student_can_retake
                            ? "Retake Quiz"
                            : "Start Quiz"}
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" disabled className="flex-1">
                        <Eye className="w-4 h-4 mr-2" />
                        {statusInfo.text === "Scheduled"
                          ? "Not Started"
                          : statusInfo.text === "Quiz Ended"
                          ? "Quiz Ended"
                          : statusInfo.text === "Completed"
                          ? "Completed"
                          : "Unavailable"}
                      </Button>
                    )}

                    {statusInfo.showResults && (
                      <Button asChild variant="outline">
                        <Link href={`/student/results`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Results
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/student/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/student/classes">
                <BookOpen className="w-4 h-4 mr-2" />
                All Classes
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/student/results">
                <Eye className="w-4 h-4 mr-2" />
                Quiz Results
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
