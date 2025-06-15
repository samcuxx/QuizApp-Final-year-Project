"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Code, Users, Clock, BookOpen } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/providers/auth-provider";
import {
  joinQuizWithCode,
  joinClassWithCode,
} from "@/lib/auth/client-auth-helpers";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function JoinPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [quizCode, setQuizCode] = useState("");
  const [classCode, setClassCode] = useState("");
  const [foundQuiz, setFoundQuiz] = useState<{
    id: string;
    title: string;
    class_name: string;
    status: string;
    duration_minutes?: number;
    attempts_allowed?: number;
    scheduled_start?: string;
    description?: string;
    instructions?: string;
  } | null>(null);

  const handleJoinQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !quizCode.trim()) return;

    setLoading(true);
    try {
      const result = await joinQuizWithCode(quizCode.trim(), profile.id);

      if (result.success && result.quiz) {
        setFoundQuiz(result.quiz);
        toast.success("Quiz found! You can now take this quiz.");
      } else {
        toast.error(result.error || "Failed to find quiz");
        setFoundQuiz(null);
      }
    } catch (error) {
      console.error("Error joining quiz:", error);
      toast.error("Failed to join quiz");
      setFoundQuiz(null);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !classCode.trim()) return;

    setLoading(true);
    try {
      const result = await joinClassWithCode(classCode.trim(), profile.id);

      if (result.success && result.class) {
        toast.success(result.message || "Successfully joined class!");
        router.push("/student/classes");
      } else {
        toast.error(result.error || "Failed to join class");
      }
    } catch (error) {
      console.error("Error joining class:", error);
      toast.error("Failed to join class");
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/student/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Join with Code
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter a quiz code or class code to join
          </p>
        </div>
      </div>

      <Tabs defaultValue="quiz" className="max-w-2xl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quiz" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Join Quiz
          </TabsTrigger>
          <TabsTrigger value="class" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Join Class
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quiz" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Join Quiz with Code</CardTitle>
              <CardDescription>
                Enter the 6-character quiz code provided by your instructor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleJoinQuiz} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quiz-code">Quiz Code</Label>
                  <Input
                    id="quiz-code"
                    type="text"
                    placeholder="e.g., ABC123"
                    value={quizCode}
                    onChange={(e) => {
                      setQuizCode(e.target.value.toUpperCase());
                      setFoundQuiz(null); // Clear found quiz when code changes
                    }}
                    maxLength={6}
                    className="text-center text-lg font-mono tracking-wider"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Quiz codes are exactly 6 characters long
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || quizCode.length !== 6}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Finding Quiz...
                    </>
                  ) : (
                    <>
                      <Code className="mr-2 h-4 w-4" />
                      Find Quiz
                    </>
                  )}
                </Button>
              </form>

              {/* Found Quiz Display */}
              {foundQuiz && (
                <div className="mt-6 p-4 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-green-800 dark:text-green-200">
                          {foundQuiz.title}
                        </h3>
                        {getQuizStatusBadge(foundQuiz)}
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {foundQuiz.class_name}
                      </p>
                      {foundQuiz.description && (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {foundQuiz.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-green-600 dark:text-green-400">
                        {foundQuiz.duration_minutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {foundQuiz.duration_minutes} minutes
                          </div>
                        )}
                        {foundQuiz.attempts_allowed && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {foundQuiz.attempts_allowed} attempt
                            {foundQuiz.attempts_allowed > 1 ? "s" : ""} allowed
                          </div>
                        )}
                      </div>
                      {foundQuiz.scheduled_start && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Starts: {formatDate(foundQuiz.scheduled_start)}
                        </p>
                      )}
                      {foundQuiz.instructions && (
                        <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Instructions:
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {foundQuiz.instructions}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button asChild className="w-full">
                      <Link href={`/student/quiz/${foundQuiz.id}`}>
                        Take Quiz
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Join a Quiz</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">1</span>
                  </div>
                  <span>
                    Get the 6-character quiz code from your instructor
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">2</span>
                  </div>
                  <span>Enter the code above to find the quiz</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">3</span>
                  </div>
                  <span>Click "Take Quiz" when you're ready to start</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="class" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Join Class with Code</CardTitle>
              <CardDescription>
                Enter the class code provided by your instructor to enroll
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleJoinClass} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="class-code">Class Code</Label>
                  <Input
                    id="class-code"
                    type="text"
                    placeholder="e.g., CS101-2024"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    className="text-center text-lg font-mono tracking-wider"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Class codes are provided by your instructor
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !classCode.trim()}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Joining Class...
                    </>
                  ) : (
                    <>
                      <Users className="mr-2 h-4 w-4" />
                      Join Class
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Join a Class</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-xs font-medium text-green-600">
                      1
                    </span>
                  </div>
                  <span>Ask your instructor for the class code</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-xs font-medium text-green-600">
                      2
                    </span>
                  </div>
                  <span>Enter the code above to join the class</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-xs font-medium text-green-600">
                      3
                    </span>
                  </div>
                  <span>
                    You'll be enrolled and can access all class quizzes
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
