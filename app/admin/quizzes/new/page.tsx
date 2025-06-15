"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
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
import { getClassesForAdmin, createQuiz } from "@/lib/auth/client-auth-helpers";

interface Class {
  id: string;
  name: string;
  subject: string;
  semester: string;
  academic_year: string;
}

interface Question {
  id: string;
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

export default function NewQuizPage() {
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
  const [showResultsToStudents, setShowResultsToStudents] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);

  // UI state
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(true);

  useEffect(() => {
    async function loadClasses() {
      if (!profile?.id) return;

      try {
        const data = await getClassesForAdmin(profile.id);
        setClasses(data || []);
      } catch (error) {
        console.error("Error loading classes:", error);
        setError("Failed to load classes");
      } finally {
        setLoadingClasses(false);
      }
    }

    loadClasses();
  }, [profile?.id]);

  const generateQuestionId = () =>
    `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addQuestion = (type: Question["type"]) => {
    const newQuestion: Question = {
      id: generateQuestionId(),
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
    setQuestions(questions.filter((q) => q.id !== id));
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
    if (questions.length === 0) return "At least one question is required";

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
      const quizData = {
        title: title.trim(),
        description: description.trim(),
        class_id: classId,
        duration_minutes: durationMinutes,
        attempts_allowed: attemptsAllowed,
        scheduled_start: scheduledStart || null,
        scheduled_end: scheduledEnd || null,
        instructions: instructions.trim() || null,
        show_results_to_students: showResultsToStudents,
        questions: questions.map((q) => ({
          type: q.type,
          question_text: q.question_text.trim(),
          points: q.points,
          ...(q.type === "multiple_choice" && {
            options: q.options?.filter((opt) => opt.trim()),
            correct_answer: q.correct_answer,
          }),
          ...(q.type === "true_false" && {
            correct_answer: q.correct_answer,
          }),
          explanation: q.explanation?.trim() || null,
        })),
      };

      const quiz = await createQuiz(quizData);
      router.push(`/admin/quizzes/${quiz.id}`);
    } catch (error) {
      console.error("Error creating quiz:", error);
      setError("Failed to create quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  if (loadingClasses) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Loading classes...
          </p>
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
            <Link href="/admin/quizzes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quizzes
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create New Quiz
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Build your quiz with multiple question types and scheduling
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
              Set up the fundamental details of your quiz
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

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">
                    Student Result Visibility
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow students to see their quiz results and correct answers
                    after submission
                  </p>
                </div>
                <Switch
                  checked={showResultsToStudents}
                  onCheckedChange={setShowResultsToStudents}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Questions</span>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addQuestion("multiple_choice")}
                >
                  <HelpCircle className="h-4 w-4 mr-1" />
                  Multiple Choice
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addQuestion("true_false")}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  True/False
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addQuestion("essay")}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Essay
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Add questions to your quiz. Drag to reorder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No questions yet
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by adding your first question above.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((question, index) => {
                  const Icon = questionTypeIcons[question.type];
                  return (
                    <Card key={question.id} className="border border-gray-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <GripVertical className="h-4 w-4 text-gray-400" />
                            <Icon className="h-4 w-4 text-gray-600" />
                            <Badge variant="secondary">
                              {questionTypeLabels[question.type]}
                            </Badge>
                            <span className="text-sm font-medium text-gray-600">
                              Question {index + 1}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-2">
                              <Label
                                htmlFor={`points-${question.id}`}
                                className="text-sm"
                              >
                                Points:
                              </Label>
                              <Input
                                id={`points-${question.id}`}
                                type="number"
                                min="1"
                                value={question.points}
                                onChange={(e) =>
                                  updateQuestion(question.id, {
                                    points: parseInt(e.target.value) || 1,
                                  })
                                }
                                className="w-16"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuestion(question.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`question-${question.id}`}>
                            Question Text
                          </Label>
                          <Textarea
                            id={`question-${question.id}`}
                            value={question.question_text}
                            onChange={(e) =>
                              updateQuestion(question.id, {
                                question_text: e.target.value,
                              })
                            }
                            placeholder="Enter your question here..."
                            rows={2}
                            required
                          />
                        </div>

                        {/* Multiple Choice Options */}
                        {question.type === "multiple_choice" &&
                          question.options && (
                            <div className="space-y-3">
                              <Label>Answer Options</Label>
                              {question.options.map((option, optionIndex) => (
                                <div
                                  key={optionIndex}
                                  className="flex items-center space-x-2"
                                >
                                  <input
                                    type="radio"
                                    name={`correct-${question.id}`}
                                    checked={
                                      question.correct_answer === optionIndex
                                    }
                                    onChange={() =>
                                      updateQuestion(question.id, {
                                        correct_answer: optionIndex,
                                      })
                                    }
                                    className="mt-1"
                                    aria-label={`Select option ${
                                      optionIndex + 1
                                    } as correct answer`}
                                  />
                                  <Input
                                    value={option}
                                    onChange={(e) =>
                                      updateOption(
                                        question.id,
                                        optionIndex,
                                        e.target.value
                                      )
                                    }
                                    placeholder={`Option ${optionIndex + 1}`}
                                    className="flex-1"
                                  />
                                  {question.options!.length > 2 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        removeOption(question.id, optionIndex)
                                      }
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addOption(question.id)}
                                className="mt-2"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Option
                              </Button>
                            </div>
                          )}

                        {/* True/False Options */}
                        {question.type === "true_false" && (
                          <div className="space-y-2">
                            <Label>Correct Answer</Label>
                            <Select
                              value={question.correct_answer as string}
                              onValueChange={(value) =>
                                updateQuestion(question.id, {
                                  correct_answer: value,
                                })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">True</SelectItem>
                                <SelectItem value="false">False</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Essay Instructions */}
                        {question.type === "essay" && (
                          <div className="space-y-2">
                            <Label htmlFor={`explanation-${question.id}`}>
                              Answer Guidelines (Optional)
                            </Label>
                            <Textarea
                              id={`explanation-${question.id}`}
                              value={question.explanation || ""}
                              onChange={(e) =>
                                updateQuestion(question.id, {
                                  explanation: e.target.value,
                                })
                              }
                              placeholder="Provide guidelines for what constitutes a good answer..."
                              rows={2}
                            />
                          </div>
                        )}

                        {/* Common Explanation */}
                        {question.type !== "essay" && (
                          <div className="space-y-2">
                            <Label htmlFor={`explanation-${question.id}`}>
                              Explanation (Optional)
                            </Label>
                            <Textarea
                              id={`explanation-${question.id}`}
                              value={question.explanation || ""}
                              onChange={(e) =>
                                updateQuestion(question.id, {
                                  explanation: e.target.value,
                                })
                              }
                              placeholder="Explain why this is the correct answer..."
                              rows={2}
                            />
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
            <Link href="/admin/quizzes">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Quiz...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Quiz
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
