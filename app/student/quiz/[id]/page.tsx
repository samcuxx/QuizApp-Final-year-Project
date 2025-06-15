"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Clock,
  BookOpen,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft as ChevronLeft,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/providers/auth-provider";
import {
  getQuizForTaking,
  startQuizAttempt,
  submitQuizAttempt,
} from "@/lib/auth/client-auth-helpers";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Question {
  id: string;
  question_number: number;
  type: "multiple_choice" | "true_false" | "essay";
  question_text: string;
  points: number;
  options?: string[];
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  class_name: string;
  duration_minutes: number;
  attempts_allowed: number;
  instructions: string;
  questions: Question[];
}

export default function QuizTakingPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load quiz data
  useEffect(() => {
    async function loadQuiz() {
      if (!profile?.id || !quizId) return;

      try {
        const data = await getQuizForTaking(quizId, profile.id);
        setQuiz(data);
      } catch (error) {
        console.error("Error loading quiz:", error);
        toast.error("Failed to load quiz");
        router.push("/student/dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [profile?.id, quizId, router]);

  // Timer countdown
  useEffect(() => {
    if (!quizStarted || timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, timeRemaining]);

  const handleStartQuiz = async () => {
    if (!profile?.id || !quiz) return;

    try {
      const attempt = await startQuizAttempt(quiz.id, profile.id);
      setAttemptId(attempt.id);
      setQuizStarted(true);
      setTimeRemaining(quiz.duration_minutes * 60); // Convert to seconds
      toast.success("Quiz started! Good luck!");
    } catch (error) {
      console.error("Error starting quiz:", error);
      toast.error("Failed to start quiz");
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmitQuiz = useCallback(async () => {
    if (!attemptId || submitting) return;

    setSubmitting(true);
    try {
      await submitQuizAttempt(attemptId, answers);
      toast.success("Quiz submitted successfully!");
      router.push("/student/results");
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, answers, submitting, router]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getCompletionPercentage = () => {
    if (!quiz) return 0;
    const answeredQuestions = Object.keys(answers).length;
    return Math.round((answeredQuestions / quiz.questions.length) * 100);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-16 w-16 text-red-400" />
        <h3 className="mt-4 text-xl font-semibold">Quiz Not Found</h3>
        <p className="mt-2 text-gray-600">
          The quiz you're looking for doesn't exist or you don't have access to
          it.
        </p>
        <Button asChild className="mt-4">
          <Link href="/student/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  // Pre-quiz screen
  if (!quizStarted) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/student/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Quiz Information */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{quiz.title}</CardTitle>
                <CardDescription className="text-base mt-2">
                  {quiz.class_name}
                </CardDescription>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                Ready to Start
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {quiz.description && (
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {quiz.description}
                </p>
              </div>
            )}

            {/* Quiz Details */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{quiz.duration_minutes} minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {quiz.questions.length} questions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {quiz.attempts_allowed} attempt
                  {quiz.attempts_allowed > 1 ? "s" : ""} allowed
                </span>
              </div>
            </div>

            {/* Instructions */}
            {quiz.instructions && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Instructions
                </h3>
                <div className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                  {quiz.instructions}
                </div>
              </div>
            )}

            {/* Important Notes */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-medium text-yellow-900 dark:text-yellow-100">
                    Important Notes
                  </h3>
                  <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                    <li>• Once you start, you cannot pause the timer</li>
                    <li>• Make sure you have a stable internet connection</li>
                    <li>• Your progress will be saved automatically</li>
                    <li>• The quiz will auto-submit when time runs out</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button onClick={handleStartQuiz} size="lg" className="w-full">
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz taking interface
  const currentQ = quiz.questions[currentQuestion];
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;
  const isFirstQuestion = currentQuestion === 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Quiz Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{quiz.title}</h1>
            <p className="text-sm text-muted-foreground">{quiz.class_name}</p>
          </div>
          <div className="flex items-center gap-4">
            {timeRemaining !== null && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span
                  className={`font-mono text-lg ${
                    timeRemaining < 300 ? "text-red-600" : ""
                  }`}
                >
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
            <Button
              onClick={handleSubmitQuiz}
              disabled={submitting}
              variant="outline"
              size="sm"
            >
              {submitting ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Submit Quiz
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              Question {currentQuestion + 1} of {quiz.questions.length}
            </span>
            <span>{getCompletionPercentage()}% Complete</span>
          </div>
          <Progress value={getCompletionPercentage()} className="h-2" />
        </div>
      </div>

      {/* Question */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Question {currentQ.question_number}
                </Badge>
                <Badge variant="secondary">
                  {currentQ.points} point{currentQ.points > 1 ? "s" : ""}
                </Badge>
                <Badge variant="outline">
                  {currentQ.type
                    .replace("_", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </Badge>
              </div>
              <div className="text-lg font-medium leading-6">
                {currentQ.question_text}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Multiple Choice */}
          {currentQ.type === "multiple_choice" && currentQ.options && (
            <RadioGroup
              value={answers[currentQ.id] || ""}
              onValueChange={(value) => handleAnswerChange(currentQ.id, value)}
            >
              {currentQ.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option}
                    id={`${currentQ.id}-${index}`}
                  />
                  <Label
                    htmlFor={`${currentQ.id}-${index}`}
                    className="flex-1 cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {/* True/False */}
          {currentQ.type === "true_false" && (
            <RadioGroup
              value={answers[currentQ.id] || ""}
              onValueChange={(value) => handleAnswerChange(currentQ.id, value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id={`${currentQ.id}-true`} />
                <Label
                  htmlFor={`${currentQ.id}-true`}
                  className="cursor-pointer"
                >
                  True
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id={`${currentQ.id}-false`} />
                <Label
                  htmlFor={`${currentQ.id}-false`}
                  className="cursor-pointer"
                >
                  False
                </Label>
              </div>
            </RadioGroup>
          )}

          {/* Essay */}
          {currentQ.type === "essay" && (
            <div className="space-y-2">
              <Textarea
                placeholder="Type your answer here..."
                value={answers[currentQ.id] || ""}
                onChange={(e) =>
                  handleAnswerChange(currentQ.id, e.target.value)
                }
                className="min-h-[150px]"
              />
              <p className="text-xs text-muted-foreground">
                Write your complete answer. Be sure to address all parts of the
                question.
              </p>
            </div>
          )}

          {/* Answer Status */}
          {answers[currentQ.id] !== undefined &&
            answers[currentQ.id] !== "" && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Answer saved</span>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(currentQuestion - 1)}
          disabled={isFirstQuestion}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {quiz.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                index === currentQuestion
                  ? "bg-blue-600 text-white"
                  : answers[quiz.questions[index].id] !== undefined
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-gray-100 text-gray-600 border border-gray-300"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {isLastQuestion ? (
          <Button onClick={handleSubmitQuiz} disabled={submitting}>
            {submitting ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Submitting...
              </>
            ) : (
              "Submit Quiz"
            )}
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestion(currentQuestion + 1)}
            disabled={currentQuestion >= quiz.questions.length - 1}
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
