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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Clock,
  Calendar,
  BookOpen,
  HelpCircle,
  CheckCircle,
  FileText,
  GripVertical,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/providers/auth-provider";
import {
  getQuizWithQuestions,
  updateQuiz,
  getClassesForAdmin,
} from "@/lib/auth/client-auth-helpers";

interface Class {
  id: string;
  name: string;
  subject: string;
  semester: string;
  academic_year: string;
}

interface Question {
  id: string;
  question_number: number;
  type: "multiple_choice" | "true_false" | "essay";
  question_text: string;
  points: number;
  options?: string[];
  correct_answer?: string | number;
  explanation?: string;
}

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

export default function EditQuizPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [attemptsAllowed, setAttemptsAllowed] = useState(1);
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [instructions, setInstructions] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);

  // UI state
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!params.id || !profile?.id) return;

      try {
        // Load quiz data and classes in parallel
        const [quizData, classesData] = await Promise.all([
          getQuizWithQuestions(params.id as string),
          getClassesForAdmin(profile.id),
        ]);

        // Set quiz form data
        setTitle(quizData.title);
        setDescription(quizData.description);
        setClassId(quizData.class_id);
        setDurationMinutes(quizData.duration_minutes);
        setAttemptsAllowed(quizData.attempts_allowed);
        setInstructions(quizData.instructions || "");

        // Format dates for datetime-local input
        if (quizData.scheduled_start) {
          setScheduledStart(
            new Date(quizData.scheduled_start).toISOString().slice(0, 16)
          );
        }
        if (quizData.scheduled_end) {
          setScheduledEnd(
            new Date(quizData.scheduled_end).toISOString().slice(0, 16)
          );
        }

        // Set questions
        setQuestions(quizData.questions || []);
        setClasses(classesData || []);
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Failed to load quiz data");
      } finally {
        setInitialLoading(false);
      }
    }

    loadData();
  }, [params.id, profile?.id]);

  const generateQuestionId = () =>
    `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addQuestion = (type: Question["type"]) => {
    const newQuestion: Question = {
      id: generateQuestionId(),
      question_number: questions.length + 1,
      type,
      question_text: "",
      points: 1,
      ...(type === "multiple_choice" && {
        options: ["", "", "", ""],
        correct_answer: 0,
      }),
      ...(type === "true_false" && {
        correct_answer: "true",
      }),
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const removeQuestion = (id: string) => {
    const updatedQuestions = questions.filter((q) => q.id !== id);
    // Renumber remaining questions
    const renumberedQuestions = updatedQuestions.map((q, index) => ({
      ...q,
      question_number: index + 1,
    }));
    setQuestions(renumberedQuestions);
  };

  const updateOption = (
    questionId: string,
    optionIndex: number,
    value: string
  ) => {
    const question = questions.find((q) => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const addOption = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (question && question.options) {
      updateQuestion(questionId, {
        options: [...question.options, ""],
      });
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find((q) => q.id === questionId);
    if (question && question.options && question.options.length > 2) {
      const newOptions = question.options.filter(
        (_, index) => index !== optionIndex
      );
      updateQuestion(questionId, {
        options: newOptions,
        correct_answer:
          typeof question.correct_answer === "number" &&
          question.correct_answer >= optionIndex
            ? Math.max(0, question.correct_answer - 1)
            : question.correct_answer,
      });
    }
  };

  const validateForm = () => {
    if (!title.trim()) return "Quiz title is required";
    if (!description.trim()) return "Quiz description is required";
    if (!classId) return "Please select a class";

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.question_text.trim()) {
        return `Question ${i + 1} text is required`;
      }
      if (question.type === "multiple_choice") {
        if (
          !question.options ||
          question.options.filter((opt) => opt.trim()).length < 2
        ) {
          return `Question ${i + 1} must have at least 2 options`;
        }
        if (
          typeof question.correct_answer !== "number" ||
          question.correct_answer < 0 ||
          question.correct_answer >= question.options.length ||
          !question.options[question.correct_answer]?.trim()
        ) {
          return `Question ${i + 1} must have a valid correct answer selected`;
        }
      }
    }

    if (
      scheduledStart &&
      scheduledEnd &&
      new Date(scheduledStart) >= new Date(scheduledEnd)
    ) {
      return "Scheduled end time must be after start time";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const updateData = {
        title: title.trim(),
        description: description.trim(),
        class_id: classId,
        duration_minutes: durationMinutes,
        attempts_allowed: attemptsAllowed,
        scheduled_start: scheduledStart || null,
        scheduled_end: scheduledEnd || null,
        instructions: instructions.trim() || null,
      };

      await updateQuiz(params.id as string, updateData);

      // Note: Question updates would require a separate endpoint for full functionality
      // For now, we're only updating the quiz metadata

      router.push(`/admin/quizzes/${params.id}`);
    } catch (error) {
      console.error("Error updating quiz:", error);
      setError("Failed to update quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/quizzes/${params.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quiz
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Edit Quiz
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Update quiz details and settings
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center">
            <BookOpen className="h-3 w-3 mr-1" />
            {questions.length} Questions
          </Badge>
          <Badge variant="outline">{totalPoints} Points</Badge>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update the fundamental details of your quiz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter quiz title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Select value={classId} onValueChange={setClassId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {cls.semester} {cls.academic_year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this quiz covers"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions (Optional)</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Provide specific instructions for students"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quiz Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Quiz Settings
            </CardTitle>
            <CardDescription>
              Configure timing, attempts, and scheduling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={durationMinutes || ""}
                  onChange={(e) =>
                    setDurationMinutes(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attempts">Attempts Allowed</Label>
                <Select
                  value={attemptsAllowed.toString()}
                  onValueChange={(value) => setAttemptsAllowed(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 attempt</SelectItem>
                    <SelectItem value="2">2 attempts</SelectItem>
                    <SelectItem value="3">3 attempts</SelectItem>
                    <SelectItem value="5">5 attempts</SelectItem>
                    <SelectItem value="-1">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <Label className="text-base font-medium">
                  Scheduling (Optional)
                </Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledStart">Start Date & Time</Label>
                  <Input
                    id="scheduledStart"
                    type="datetime-local"
                    value={scheduledStart}
                    onChange={(e) => setScheduledStart(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledEnd">End Date & Time</Label>
                  <Input
                    id="scheduledEnd"
                    type="datetime-local"
                    value={scheduledEnd}
                    onChange={(e) => setScheduledEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Questions ({questions.length})</span>
              <Badge variant="outline">{totalPoints} Total Points</Badge>
            </CardTitle>
            <CardDescription>
              Questions are read-only in edit mode. Use the create new quiz page
              to add/modify questions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No questions
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  This quiz doesn't have any questions yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question) => {
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
                      <CardContent>
                        <p className="text-sm font-medium mb-2">
                          {question.question_text}
                        </p>

                        {question.type === "multiple_choice" &&
                          question.options && (
                            <div className="space-y-1">
                              {question.options.map((option, index) => (
                                <div
                                  key={index}
                                  className={`text-xs p-2 rounded ${
                                    question.correct_answer === index
                                      ? "bg-green-50 text-green-800 border border-green-200"
                                      : "bg-gray-50 text-gray-600"
                                  }`}
                                >
                                  {String.fromCharCode(65 + index)}. {option}
                                </div>
                              ))}
                            </div>
                          )}

                        {question.type === "true_false" && (
                          <div className="text-xs text-gray-600">
                            Correct answer:{" "}
                            <span className="font-medium">
                              {question.correct_answer === "true"
                                ? "True"
                                : "False"}
                            </span>
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

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4">
          <Button variant="outline" asChild>
            <Link href={`/admin/quizzes/${params.id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating Quiz...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Quiz
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
