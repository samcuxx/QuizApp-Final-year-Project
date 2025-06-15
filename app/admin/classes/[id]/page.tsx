"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Users, BookOpen, Calendar, User } from "lucide-react";
import Link from "next/link";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/lib/providers/auth-provider";
import {
  getClassById,
  getStudentsInClass,
} from "@/lib/auth/client-auth-helpers";

interface Class {
  id: string;
  name: string;
  description: string;
  subject: string;
  semester: string;
  academic_year: string;
  created_at: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  index_number: string;
  enrolled_at: string;
}

export default function ClassDetailsPage() {
  const params = useParams();
  const classId = params.id as string;
  const { profile } = useAuth();

  const [classData, setClassData] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!profile?.id || !classId) return;

      try {
        const [classResult, studentsResult] = await Promise.all([
          getClassById(classId),
          getStudentsInClass(classId),
        ]);

        setClassData(classResult);
        setStudents(studentsResult || []);
      } catch (error) {
        console.error("Error loading class data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [profile?.id, classId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return <LoadingSpinner text="Loading class details..." />;
  }

  if (!classData) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Class not found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          The class you're looking for doesn't exist or you don't have access to
          it.
        </p>
        <Button asChild className="mt-4">
          <Link href="/admin/classes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Classes
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/classes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Classes
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {classData.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {classData.subject} • {classData.semester}{" "}
              {classData.academic_year}
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button variant="outline" asChild>
            <Link href={`/admin/classes/${classId}/students`}>
              <Users className="mr-2 h-4 w-4" />
              Manage Students
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/classes/${classId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Class
            </Link>
          </Button>
        </div>
      </div>

      {/* Class Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled in this class
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quizzes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Created for this class
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDate(classData.created_at)}
            </div>
            <p className="text-xs text-muted-foreground">Class creation date</p>
          </CardContent>
        </Card>
      </div>

      {/* Class Information */}
      <Card>
        <CardHeader>
          <CardTitle>Class Information</CardTitle>
          <CardDescription>
            Detailed information about this class
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Subject
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">
                {classData.subject}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Semester
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">
                {classData.semester}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Academic Year
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">
                {classData.academic_year}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Created
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">
                {formatDate(classData.created_at)}
              </p>
            </div>
          </div>

          {classData.description && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">
                {classData.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Students */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Students</CardTitle>
              <CardDescription>
                Recently enrolled students in this class
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/classes/${classId}/students`}>
                View All Students
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No students enrolled
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Start by adding students to this class.
              </p>
              <Button asChild className="mt-4">
                <Link href={`/admin/classes/${classId}/students`}>
                  <Users className="mr-2 h-4 w-4" />
                  Add Students
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {students.slice(0, 5).map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-xs">
                      #{student.index_number}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(student.enrolled_at)}
                    </p>
                  </div>
                </div>
              ))}

              {students.length > 5 && (
                <div className="text-center pt-3">
                  <p className="text-sm text-muted-foreground">
                    And {students.length - 5} more students...
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
