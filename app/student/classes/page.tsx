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
  BookOpen,
  Users,
  Calendar,
  Plus,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/providers/auth-provider";
import { getStudentClasses } from "@/lib/auth/client-auth-helpers";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface StudentClass {
  id: string;
  name: string;
  subject: string;
  semester: string;
  academic_year: string;
  description: string;
  enrolled_at: string;
  instructor_name: string;
}

export default function StudentClassesPage() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClasses() {
      if (!profile?.id) return;

      try {
        const data = await getStudentClasses(profile.id);
        setClasses((data || []) as StudentClass[]);
      } catch (error) {
        console.error("Error loading classes:", error);
      } finally {
        setLoading(false);
      }
    }

    loadClasses();
  }, [profile?.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Classes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your enrolled classes and join new ones
          </p>
        </div>
        <Button asChild>
          <Link href="/student/join">
            <Plus className="mr-2 h-4 w-4" />
            Join Class
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Enrolled Classes
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-xs text-muted-foreground">
              {classes.length === 0
                ? "No classes enrolled yet"
                : classes.length === 1
                ? "1 class enrolled"
                : `${classes.length} classes enrolled`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Semester
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classes.length > 0 ? classes[0].semester : "--"}
            </div>
            <p className="text-xs text-muted-foreground">
              {classes.length > 0
                ? classes[0].academic_year
                : "No semester data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instructors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(classes.map((c) => c.instructor_name)).size}
            </div>
            <p className="text-xs text-muted-foreground">Unique instructors</p>
          </CardContent>
        </Card>
      </div>

      {/* Classes List */}
      {classes.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Enrolled Classes
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((classData) => (
              <Card
                key={classData.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg leading-6">
                        {classData.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {classData.subject}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {classData.semester} {classData.academic_year}
                        </Badge>
                      </div>
                    </div>
                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>Instructor: {classData.instructor_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Enrolled: {formatDate(classData.enrolled_at)}</span>
                    </div>
                  </div>

                  {classData.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                      {classData.description}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Link href={`/student/classes/${classData.id}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/student/classes/${classData.id}/quizzes`}>
                        View Quizzes
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <BookOpen className="mx-auto h-16 w-16 text-gray-400" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  No Classes Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  You haven't enrolled in any classes yet. Ask your instructor
                  for a class code to get started.
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button asChild>
                  <Link href="/student/join?tab=class">
                    <Plus className="mr-2 h-4 w-4" />
                    Join a Class
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/student/join?tab=quiz">Join Quiz Directly</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Getting Started */}
      {classes.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              How to join your first class and start taking quizzes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Get a Class Code</h4>
                  <p className="text-sm text-muted-foreground">
                    Ask your instructor for your class code. It's usually shared
                    via email, class announcements, or during class.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-blue-600">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Join Your Class</h4>
                  <p className="text-sm text-muted-foreground">
                    Click "Join a Class" above and enter your class code to
                    enroll. You'll be automatically added to the class roster.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-blue-600">3</span>
                </div>
                <div>
                  <h4 className="font-medium">Start Taking Quizzes</h4>
                  <p className="text-sm text-muted-foreground">
                    Once enrolled, you'll see available quizzes in your
                    dashboard and can join them using quiz codes or direct
                    links.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
