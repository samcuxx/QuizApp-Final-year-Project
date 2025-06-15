"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  Search,
  Download,
  Eye,
  Edit,
  Filter,
  Calendar,
  Clock,
  Target,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/providers/auth-provider";
import {
  getClassesForAdmin,
  getQuizzesForAdmin,
  getAdminQuizResults,
  calculateQuizResults,
} from "@/lib/auth/client-auth-helpers";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface QuizResult {
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
  has_essay_questions: boolean;
}

interface Class {
  id: string;
  name: string;
  subject: string;
  semester: string;
  academic_year: string;
}

interface Quiz {
  id: string;
  title: string;
  class_id: string;
  class_name: string;
}

export default function AdminResultsPage() {
  const router = useRouter();
  const { profile } = useAuth();

  const [results, setResults] = useState<QuizResult[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedQuiz, setSelectedQuiz] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [calculatingScores, setCalculatingScores] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!profile?.id || profile.role !== "admin") {
        router.push("/auth/signin");
        return;
      }

      try {
        setLoading(true);

        // Load classes, quizzes, and results in parallel
        const [classesData, quizzesData, resultsData] = await Promise.all([
          getClassesForAdmin(profile.id),
          getQuizzesForAdmin(profile.id),
          getAdminQuizResults(profile.id),
        ]);

        setClasses(classesData);
        setQuizzes(quizzesData);
        setResults(resultsData);
      } catch (error) {
        console.error("Error loading results data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile?.id, profile?.role, router]);

  const filteredResults = results.filter((result) => {
    const matchesSearch =
      result.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.quiz_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.class_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass =
      selectedClass === "all" ||
      quizzes.find((q) => q.id === result.quiz_id)?.class_id === selectedClass;

    const matchesQuiz =
      selectedQuiz === "all" || result.quiz_id === selectedQuiz;

    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "completed" &&
        result.submitted_at &&
        result.score !== null) ||
      (selectedStatus === "in_progress" && !result.submitted_at) ||
      (selectedStatus === "needs_grading" &&
        result.submitted_at &&
        result.has_essay_questions &&
        result.score === null);

    return matchesSearch && matchesClass && matchesQuiz && matchesStatus;
  });

  const calculateStats = () => {
    const completedResults = results.filter(
      (r) => r.submitted_at && r.score !== null
    );
    const submittedResults = results.filter((r) => r.submitted_at);
    const totalAttempts = results.length;
    const completedAttempts = completedResults.length;
    const submittedAttempts = submittedResults.length;

    const averageScore =
      completedResults.length > 0
        ? completedResults.reduce((sum, r) => sum + (r.score || 0), 0) /
          completedResults.length
        : 0;

    const needsGrading = results.filter(
      (r) => r.submitted_at && r.has_essay_questions && r.score === null
    ).length;

    const pendingCalculation = results.filter(
      (r) => r.submitted_at && r.score === null && !r.has_essay_questions
    ).length;

    const uniqueStudents = new Set(results.map((r) => r.student_email)).size;

    return {
      totalAttempts,
      completedAttempts,
      submittedAttempts,
      averageScore,
      needsGrading,
      pendingCalculation,
      uniqueStudents,
    };
  };

  const formatTime = (timeInSeconds: number | null) => {
    if (!timeInSeconds || timeInSeconds === 0) return "N/A";

    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;

    if (minutes === 0) {
      return `${seconds}s`;
    } else if (seconds === 0) {
      return `${minutes}m`;
    } else {
      return `${minutes}m ${seconds}s`;
    }
  };

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
    if (score === null) return "Pending";
    return `${Math.round(score)}%`;
  };

  const getScoreBadge = (score: number | null, hasEssayQuestions: boolean) => {
    if (score === null) {
      return hasEssayQuestions ? (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
          Needs Grading
        </Badge>
      ) : (
        <Badge variant="outline">Pending</Badge>
      );
    }

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

  const exportResults = () => {
    const csvContent = [
      [
        "Student Name",
        "Email",
        "Index Number",
        "Quiz Title",
        "Class",
        "Score",
        "Total Points",
        "Submitted At",
        "Time Taken (minutes)",
        "Status",
      ],
      ...filteredResults.map((result) => [
        result.student_name,
        result.student_email,
        result.student_index_number,
        result.quiz_title,
        result.class_name,
        result.score ? `${Math.round(result.score)}%` : "Pending",
        result.total_points,
        result.submitted_at ? formatDate(result.submitted_at) : "Not submitted",
        formatTime(result.time_taken),
        result.submitted_at ? "Completed" : "In Progress",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz-results-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const calculatePendingScores = async () => {
    if (!profile?.id) return;

    setCalculatingScores(true);
    try {
      // Find all submitted attempts that don't have scores and don't have essay questions
      const pendingAttempts = results.filter(
        (result) =>
          result.submitted_at &&
          result.score === null &&
          !result.has_essay_questions
      );

      if (pendingAttempts.length === 0) {
        alert(
          "No pending automatic scores to calculate! Essays need manual grading."
        );
        return;
      }

      console.log(
        `Found ${pendingAttempts.length} attempts needing automatic score calculation`
      );

      // Calculate scores for each pending attempt
      const promises = pendingAttempts.map((attempt) => {
        console.log(`Calculating score for attempt ${attempt.id}`);
        return calculateQuizResults(attempt.id);
      });

      await Promise.all(promises);

      // Reload the results data
      await refreshData();

      alert(
        `Successfully calculated scores for ${pendingAttempts.length} attempts!`
      );
    } catch (error) {
      console.error("Error calculating pending scores:", error);
      alert("Error calculating scores. Please try again.");
    } finally {
      setCalculatingScores(false);
    }
  };

  const refreshData = async () => {
    if (!profile?.id) return;

    setRefreshing(true);
    try {
      const [classesData, quizzesData, resultsData] = await Promise.all([
        getClassesForAdmin(profile.id),
        getQuizzesForAdmin(profile.id),
        getAdminQuizResults(profile.id),
      ]);

      setClasses(classesData);
      setQuizzes(quizzesData);
      setResults(resultsData);
    } catch (error) {
      console.error("Error refreshing data:", error);
      alert("Error refreshing data. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSpinner />
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Quiz Results Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage quiz performance across all your classes
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={refreshData} variant="outline" disabled={refreshing}>
            {refreshing ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
          <Button
            onClick={calculatePendingScores}
            variant="outline"
            disabled={calculatingScores}
          >
            {calculatingScores ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Calculating...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Calculate Scores
              </>
            )}
          </Button>
          <Button onClick={exportResults} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button asChild>
            <Link href="/admin/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Attempts
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.submittedAttempts} submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatScore(stats.averageScore)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.completedAttempts} graded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueStudents}</div>
            <p className="text-xs text-muted-foreground">Unique participants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Scores
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.pendingCalculation}
            </div>
            <p className="text-xs text-muted-foreground">Auto-gradable</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Grading</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.needsGrading}
            </div>
            <p className="text-xs text-muted-foreground">Essay questions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalAttempts > 0
                ? Math.round(
                    (stats.submittedAttempts / stats.totalAttempts) * 100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Submitted attempts</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students, quizzes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quiz</label>
              <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
                <SelectTrigger>
                  <SelectValue placeholder="All quizzes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quizzes</SelectItem>
                  {quizzes
                    .filter(
                      (quiz) =>
                        selectedClass === "all" ||
                        quiz.class_id === selectedClass
                    )
                    .map((quiz) => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="needs_grading">Needs Grading</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedClass("all");
                  setSelectedQuiz("all");
                  setSelectedStatus("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Results</CardTitle>
          <CardDescription>
            {filteredResults.length} of {results.length} results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredResults.length === 0 ? (
            <div className="text-center py-8">
              <Award className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Results Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                No quiz results match your current filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Quiz</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {result.student_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {result.student_email}
                          </div>
                          {result.student_index_number && (
                            <div className="text-xs text-muted-foreground">
                              {result.student_index_number}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{result.quiz_title}</div>
                          <div className="text-sm text-muted-foreground">
                            Attempt #{result.attempt_number}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{result.class_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatScore(result.score)}
                          </span>
                          {getScoreBadge(
                            result.score,
                            result.has_essay_questions
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {result.submitted_at ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {formatDate(result.submitted_at)}
                          </div>
                        ) : (
                          <Badge variant="outline">In Progress</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {result.time_taken ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {formatTime(result.time_taken)}
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/results/${result.id}`}>
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Link>
                          </Button>
                          {result.has_essay_questions &&
                            result.submitted_at && (
                              <Button asChild variant="outline" size="sm">
                                <Link
                                  href={`/admin/results/${result.id}/grade`}
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Grade
                                </Link>
                              </Button>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
