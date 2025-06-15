"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  UserPlus,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Download,
} from "lucide-react";
import {
  enrollStudentInClass,
  enrollStudentsFromCSV,
} from "@/lib/auth/client-auth-helpers";

interface Student {
  id: string;
  name: string;
  email: string;
  index_number: string;
  enrolled_at: string;
}

interface StudentEnrollmentTabsProps {
  classId: string;
  onStudentAdded: (student: Student) => void;
  onStudentsAdded: (students: Student[]) => void;
}

export function StudentEnrollmentTabs({
  classId,
  onStudentAdded,
  onStudentsAdded,
}: StudentEnrollmentTabsProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Manual enrollment state
  const [manualForm, setManualForm] = useState({
    name: "",
    email: "",
    indexNumber: "",
  });

  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const student = await enrollStudentInClass({
        classId,
        name: manualForm.name,
        email: manualForm.email,
        indexNumber: manualForm.indexNumber,
      });

      if (student) {
        onStudentAdded(student);
        setManualForm({ name: "", email: "", indexNumber: "" });
        setMessage({ type: "success", text: "Student enrolled successfully!" });
      }
    } catch (error: any) {
      console.error("Error enrolling student:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to enroll student. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);

    // Read and preview CSV
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      const lines = csvText.split("\n").filter((line) => line.trim());
      const headers = lines[0]?.split(",").map((h) => h.trim()) || [];

      const preview = lines.slice(1, 6).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index] || "";
          return obj;
        }, {} as any);
      });

      setCsvPreview(preview);
    };

    reader.readAsText(file);
  };

  const handleCSVUpload = async () => {
    if (!csvFile) return;

    setLoading(true);
    setMessage(null);

    try {
      const students = await enrollStudentsFromCSV(classId, csvFile);

      if (students && students.length > 0) {
        onStudentsAdded(students);
        setCsvFile(null);
        setCsvPreview([]);
        setMessage({
          type: "success",
          text: `Successfully enrolled ${students.length} students!`,
        });

        // Reset file input
        const fileInput = document.getElementById(
          "csv-file"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      }
    } catch (error: any) {
      console.error("Error uploading CSV:", error);
      setMessage({
        type: "error",
        text:
          error.message ||
          "Failed to upload CSV. Please check the format and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template =
      "name,email,index_number\nJohn Doe,john.doe@email.com,12345\nJane Smith,jane.smith@email.com,12346";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_enrollment_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {message && (
        <Alert
          className={
            message.type === "error"
              ? "border-red-200 bg-red-50"
              : "border-green-200 bg-green-50"
          }
        >
          {message.type === "error" ? (
            <AlertCircle className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <AlertDescription
            className={
              message.type === "error" ? "text-red-800" : "text-green-800"
            }
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">
            <UserPlus className="mr-2 h-4 w-4" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="csv">
            <Upload className="mr-2 h-4 w-4" />
            CSV Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Individual Student</CardTitle>
              <CardDescription>
                Enter student details to enroll them in this class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={manualForm.name}
                      onChange={(e) =>
                        setManualForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter student's full name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={manualForm.email}
                      onChange={(e) =>
                        setManualForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="student@email.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="indexNumber">Index Number *</Label>
                    <Input
                      id="indexNumber"
                      value={manualForm.indexNumber}
                      onChange={(e) =>
                        setManualForm((prev) => ({
                          ...prev,
                          indexNumber: e.target.value,
                        }))
                      }
                      placeholder="12345"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={
                    loading ||
                    !manualForm.name ||
                    !manualForm.email ||
                    !manualForm.indexNumber
                  }
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enrolling...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Enroll Student
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="csv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bulk Upload via CSV</CardTitle>
              <CardDescription>
                Upload a CSV file to enroll multiple students at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* CSV Format Instructions */}
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  CSV Format Requirements:
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>
                    • Headers:{" "}
                    <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">
                      name,email,index_number
                    </code>
                  </li>
                  <li>• One student per row</li>
                  <li>• All fields are required</li>
                  <li>• Email addresses must be unique</li>
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={downloadTemplate}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="csv-file">Choose CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleCSVFileChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* CSV Preview */}
              {csvPreview.length > 0 && (
                <div className="space-y-2">
                  <Label>Preview (First 5 rows)</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-3 py-2 text-left">Name</th>
                            <th className="px-3 py-2 text-left">Email</th>
                            <th className="px-3 py-2 text-left">
                              Index Number
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.map((row, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-3 py-2">{row.name || "-"}</td>
                              <td className="px-3 py-2">{row.email || "-"}</td>
                              <td className="px-3 py-2">
                                {row.index_number || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleCSVUpload}
                disabled={loading || !csvFile}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload CSV
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
