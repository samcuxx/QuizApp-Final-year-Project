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
import { ArrowLeft, Upload, UserPlus, Users, Download } from "lucide-react";
import Link from "next/link";

import { StudentEnrollmentTabs } from "@/components/admin/student-enrollment-tabs";
import { StudentList } from "@/components/admin/student-list";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/lib/providers/auth-provider";
import {
  getClassById,
  getStudentsInClass,
  exportStudentList,
} from "@/lib/auth/client-auth-helpers";

interface Class {
  id: string;
  name: string;
  subject: string;
  semester: string;
  academic_year: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  index_number: string;
  enrolled_at: string;
}

export default function ClassStudentsPage() {
  const params = useParams();
  const classId = params.id as string;
  const { profile } = useAuth();

  const [classData, setClassData] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

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

  const handleStudentAdded = (newStudent: Student) => {
    setStudents((prev) => [...prev, newStudent]);
  };

  const handleStudentsAdded = (newStudents: Student[]) => {
    setStudents((prev) => [...prev, ...newStudents]);
  };

  const handleExportList = async () => {
    if (students.length === 0) {
      alert("No students to export");
      return;
    }

    setExporting(true);
    try {
      await exportStudentList(classId);
    } catch (error: any) {
      console.error("Error exporting student list:", error);
      alert(
        "Failed to export student list: " + (error.message || "Unknown error")
      );
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading class data..." />;
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

        <Badge variant="secondary" className="text-sm">
          <Users className="mr-1 h-4 w-4" />
          {students.length} enrolled
        </Badge>
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportList}
          disabled={exporting || students.length === 0}
        >
          {exporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export List
            </>
          )}
        </Button>
      </div>

      {/* Student Enrollment */}
      <Card>
        <CardHeader>
          <CardTitle>Student Enrollment</CardTitle>
          <CardDescription>
            Add students to this class individually or in bulk via CSV upload
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentEnrollmentTabs
            classId={classId}
            onStudentAdded={handleStudentAdded}
            onStudentsAdded={handleStudentsAdded}
          />
        </CardContent>
      </Card>

      {/* Enrolled Students */}
      <Card>
        <CardHeader>
          <CardTitle>Enrolled Students</CardTitle>
          <CardDescription>
            Manage students currently enrolled in this class
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentList
            students={students}
            classId={classId}
            onStudentRemoved={(studentId) => {
              setStudents((prev) => prev.filter((s) => s.id !== studentId));
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
