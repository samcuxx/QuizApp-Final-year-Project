"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/providers/auth-provider";
import { getClassById, updateClass } from "@/lib/auth/client-auth-helpers";

interface ClassFormData {
  name: string;
  description: string;
  subject: string;
  semester: string;
  academicYear: string;
}

export default function EditClassPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;
  const { profile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClassFormData>({
    name: "",
    description: "",
    subject: "",
    semester: "",
    academicYear: new Date().getFullYear().toString(),
  });

  const currentYear = new Date().getFullYear();
  const academicYears = Array.from(
    { length: 5 },
    (_, i) => currentYear + i - 2
  );

  useEffect(() => {
    async function loadClass() {
      if (!profile?.id || !classId) return;

      try {
        const classData = await getClassById(classId);
        if (classData) {
          setFormData({
            name: classData.name,
            description: classData.description || "",
            subject: classData.subject || "",
            semester: classData.semester,
            academicYear: classData.academic_year,
          });
        } else {
          setError("Class not found or you do not have permission to edit it.");
        }
      } catch (error) {
        console.error("Error loading class:", error);
        setError("Failed to load class data. Please try again.");
      } finally {
        setInitialLoading(false);
      }
    }

    loadClass();
  }, [profile?.id, classId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!profile?.id) {
      setError("No admin profile found");
      return;
    }

    setLoading(true);

    try {
      const updatedClass = await updateClass(classId, {
        name: formData.name,
        description: formData.description,
        subject: formData.subject,
        semester: formData.semester,
        academic_year: formData.academicYear,
      });

      if (updatedClass) {
        router.push(`/admin/classes/${classId}`);
      }
    } catch (error: any) {
      console.error("Error updating class:", error);
      setError(error.message || "Failed to update class. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof ClassFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading class...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/classes/${classId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Class
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Class
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update the details for this class
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Class Information</CardTitle>
          <CardDescription>Update the details for your class</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Class Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Class Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="e.g., Advanced Mathematics"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Brief description of the class content and objectives"
                rows={3}
              />
            </div>

            {/* Course */}
            <div className="space-y-2">
              <Label htmlFor="subject">Course</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => updateFormData("subject", e.target.value)}
                placeholder="e.g., Mathematics, Computer Science, Biology"
              />
            </div>

            {/* Academic Year and Semester */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic Year *</Label>
                <Select
                  value={formData.academicYear}
                  onValueChange={(value) =>
                    updateFormData("academicYear", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Semester *</Label>
                <Select
                  value={formData.semester}
                  onValueChange={(value) => updateFormData("semester", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semester 1">Semester 1</SelectItem>
                    <SelectItem value="Semester 2">Semester 2</SelectItem>
                    <SelectItem value="Semester 3">Semester 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" asChild>
                <Link href={`/admin/classes/${classId}`}>Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.name || !formData.semester}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Class
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
