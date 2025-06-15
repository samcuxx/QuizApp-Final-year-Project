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
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  BookOpen,
  Copy,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/providers/auth-provider";
import {
  getClassesForAdmin,
  deleteClass,
} from "@/lib/auth/client-auth-helpers";

interface Class {
  id: string;
  name: string;
  description: string;
  subject: string;
  semester: string;
  academic_year: string;
  class_code: string;
  created_at: string;
  student_count?: number;
  quiz_count?: number;
}

export function ClassList() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { profile } = useAuth();

  useEffect(() => {
    async function loadClasses() {
      if (!profile?.id) return;

      try {
        const data = await getClassesForAdmin(profile.id);
        setClasses(data || []);
      } catch (error) {
        console.error("Error loading classes:", error);
      } finally {
        setLoading(false);
      }
    }

    loadClasses();
  }, [profile?.id]);

  const copyClassCode = async (classCode: string) => {
    try {
      await navigator.clipboard.writeText(classCode);
      setCopiedCode(classCode);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error("Failed to copy class code:", error);
    }
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${className}"? This action cannot be undone and will remove all associated students and quizzes.`
      )
    ) {
      return;
    }

    setDeletingId(classId);

    try {
      await deleteClass(classId);
      setClasses((prev) => prev.filter((cls) => cls.id !== classId));
    } catch (error: any) {
      console.error("Error deleting class:", error);
      alert("Failed to delete class: " + (error.message || "Unknown error"));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Loading classes...
          </p>
        </div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No classes
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by creating a new class.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/admin/classes/new">
              <BookOpen className="mr-2 h-4 w-4" />
              Create Class
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {classes.map((cls) => (
        <Card key={cls.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base">{cls.name}</CardTitle>
              <CardDescription className="text-sm">
                {cls.subject} • {cls.semester} {cls.academic_year}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={deletingId === cls.id}
                >
                  {deletingId === cls.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  ) : (
                    <MoreHorizontal className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/admin/classes/${cls.id}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/classes/${cls.id}/students`}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Manage Students
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => handleDeleteClass(cls.id, cls.name)}
                  disabled={deletingId === cls.id}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Class
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {cls.description}
            </p>

            {/* Class Code Section */}
            <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                    Class Code
                  </p>
                  <p className="text-sm font-mono font-bold text-blue-900 dark:text-blue-100">
                    {cls.class_code}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyClassCode(cls.class_code)}
                  className="h-8 w-8 p-0"
                >
                  {copiedCode === cls.class_code ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-blue-600" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  <Users className="mr-1 h-3 w-3" />
                  {cls.student_count || 0} students
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <BookOpen className="mr-1 h-3 w-3" />
                  {cls.quiz_count || 0} quizzes
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
