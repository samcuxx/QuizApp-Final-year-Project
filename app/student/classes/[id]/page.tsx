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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  ArrowLeft,
  Play,
} from "lucide-react";
import { getCurrentUserProfile } from "@/lib/auth/client-auth-helpers";

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
}

interface ClassDetails {
  id: string;
  name: string;
  subject: string;
  semester: string;
  academic_year: string;
  description: string;
  instructor_name: string;
  enrolled_at: string;
}

export default function StudentClassPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;

  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClassData = async () => {
      try {
        const profile = await getCurrentUserProfile();
        if (!profile) {
          router.push("/auth/signin");
          return;
        }

        // Mock data for now since we need to implement the API endpoints
        setClassDetails({
          id: classId,
          name: "Introduction to Computer Science",
          subject: "Computer Science",
          semester: "Fall",
          academic_year: "2024",
          description:
            "This course provides an introduction to computer science fundamentals including programming, algorithms, and data structures.",
          instructor_name: "Dr. Smith",
          enrolled_at: "2024-01-15T10:00:00Z",
        });

        setQuizzes([
          {
            id: "1",
            title: "Quiz 1: Programming Basics",
            description:
              "Test your understanding of basic programming concepts",
            status: "active",
            scheduled_start: new Date().toISOString(),
            scheduled_end: new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ).toISOString(),
            duration_minutes: 30,
            attempts_allowed: 2,
            quiz_code: "ABC123",
          },
        ]);
      } catch (err) {
        console.error("Error loading class data:", err);
        setError("Failed to load class data");
      } finally {
        setLoading(false);
      }
    };

    loadClassData();
  }, [classId, router]);

  const getQuizStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !classDetails) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error || "Class not found"}</p>
            <Button onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/student/classes")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Classes
        </Button>
      </div>

      {/* Class Details */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{classDetails.name}</CardTitle>
              <CardDescription className="text-lg">
                {classDetails.subject} • {classDetails.semester}{" "}
                {classDetails.academic_year}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              <Users className="w-3 h-3 mr-1" />
              {classDetails.instructor_name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{classDetails.description}</p>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-2" />
            Enrolled on {formatDate(classDetails.enrolled_at)}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="quizzes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="quizzes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Available Quizzes</h3>
            <Badge variant="outline">{quizzes.length} quizzes</Badge>
          </div>

          {quizzes.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No quizzes available yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {quizzes.map((quiz) => (
                <Card key={quiz.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{quiz.title}</CardTitle>
                        <CardDescription>{quiz.description}</CardDescription>
                      </div>
                      <Badge className={getQuizStatusColor(quiz.status)}>
                        {quiz.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {quiz.duration_minutes} min
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        {quiz.attempts_allowed} attempts
                      </div>
                      {quiz.scheduled_start && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          {formatDate(quiz.scheduled_start)}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-mono">{quiz.quiz_code}</span>
                      </div>
                    </div>

                    {quiz.status === "active" && (
                      <Button
                        onClick={() => router.push(`/student/quiz/${quiz.id}`)}
                        className="w-full"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Quiz
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No materials available yet</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No announcements yet</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
