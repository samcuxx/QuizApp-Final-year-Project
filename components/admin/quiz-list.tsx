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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  Pause,
  Eye,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/providers/auth-provider";
import { getQuizzesForAdmin } from "@/lib/auth/client-auth-helpers";

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
  question_count?: number;
  attempt_count?: number;
  created_at: string;
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

export function QuizList() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    async function loadQuizzes() {
      if (!profile?.id) return;

      try {
        const data = await getQuizzesForAdmin(profile.id);
        setQuizzes(data || []);
      } catch (error) {
        console.error("Error loading quizzes:", error);
      } finally {
        setLoading(false);
      }
    }

    loadQuizzes();
  }, [profile?.id]);

  const copyQuizCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
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
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Loading quizzes...
          </p>
        </div>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No quizzes
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by creating your first quiz.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/admin/quizzes/new">
              <BookOpen className="mr-2 h-4 w-4" />
              Create Quiz
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {quizzes.map((quiz) => (
        <Card key={quiz.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-base">{quiz.title}</CardTitle>
              <CardDescription className="text-sm">
                {quiz.class_name}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={statusColors[quiz.status]}>
                {statusLabels[quiz.status]}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/quizzes/${quiz.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/quizzes/${quiz.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Quiz
                    </Link>
                  </DropdownMenuItem>
                  {quiz.status === "draft" && (
                    <DropdownMenuItem>
                      <Play className="mr-2 h-4 w-4" />
                      Start Quiz
                    </DropdownMenuItem>
                  )}
                  {quiz.status === "active" && (
                    <DropdownMenuItem>
                      <Pause className="mr-2 h-4 w-4" />
                      Stop Quiz
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => copyQuizCode(quiz.quiz_code)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Quiz Code
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Quiz
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {quiz.description}
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Quiz Code:</span>
                <code className="bg-muted px-2 py-1 rounded font-mono">
                  {quiz.quiz_code}
                </code>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Questions:</span>
                <span>{quiz.question_count || 0}</span>
              </div>

              {quiz.duration_minutes && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{quiz.duration_minutes} minutes</span>
                </div>
              )}

              {quiz.scheduled_start && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Scheduled:</span>
                  <span>{formatDate(quiz.scheduled_start)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Attempts:</span>
                <span>
                  {quiz.attempt_count || 0} /{" "}
                  {quiz.attempts_allowed === -1 ? "∞" : quiz.attempts_allowed}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
