import { createClient } from "@/lib/supabase/client";
import type {
  Profile,
  UserRole,
  SignUpData,
  SignInData,
} from "@/lib/types/database";

// Helper function to get redirect path based on user role
export function getRedirectPath(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "student":
      return "/student/dashboard";
    default:
      return "/";
  }
}

// Client-side auth helpers
export async function signUp(data: SignUpData) {
  const supabase = createClient();

  try {
    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      return { error: authError.message, success: false };
    }

    if (!authData.user) {
      return { error: "User creation failed", success: false };
    }

    // Create the profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      email: data.email,
      name: data.name,
      role: data.role,
      index_number: data.index_number || null,
    });

    if (profileError) {
      return { error: profileError.message, success: false };
    }

    return {
      data: authData.user,
      success: true,
      message:
        "Account created successfully! Please check your email to verify your account.",
    };
  } catch (error) {
    console.error("Sign up error:", error);
    return { error: "An unexpected error occurred", success: false };
  }
}

export async function signIn(data: SignInData) {
  const supabase = createClient();

  try {
    let email = data.email;

    // If signing in with index number, find the email first
    if (data.index_number && !data.email) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("index_number", data.index_number)
        .single();

      if (profileError || !profile) {
        return {
          error: "Student with this index number not found",
          success: false,
        };
      }

      email = profile.email;
    }

    if (!email) {
      return { error: "Email is required", success: false };
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password: data.password,
      });

    if (authError) {
      return { error: authError.message, success: false };
    }

    return { data: authData.user, success: true };
  } catch (error) {
    console.error("Sign in error:", error);
    return { error: "An unexpected error occurred", success: false };
  }
}

export async function signOut() {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: error.message, success: false };
    }

    return { success: true };
  } catch (error) {
    console.error("Sign out error:", error);
    return { error: "An unexpected error occurred", success: false };
  }
}

export async function resetPassword(email: string) {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      return { error: error.message, success: false };
    }

    return {
      success: true,
      message: "Password reset email sent! Check your inbox.",
    };
  } catch (error) {
    console.error("Reset password error:", error);
    return { error: "An unexpected error occurred", success: false };
  }
}

export async function updatePassword(password: string) {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return { error: error.message, success: false };
    }

    return { success: true, message: "Password updated successfully!" };
  } catch (error) {
    console.error("Update password error:", error);
    return { error: "An unexpected error occurred", success: false };
  }
}

// Client-side auth state helpers
export async function getCurrentUser() {
  const supabase = createClient();

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function getCurrentUserProfile(): Promise<Profile | null> {
  const supabase = createClient();

  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error getting current user profile:", error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error("Error getting current user profile:", error);
    return null;
  }
}

// Utility functions
export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === "admin";
}

export function isStudent(profile: Profile | null): boolean {
  return profile?.role === "student";
}

// Helper function to create profile for existing user (fixes orphaned auth users)
export async function createProfileForUser(userData: {
  name: string;
  role: "admin" | "student";
  index_number?: string;
}) {
  const supabase = createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "No authenticated user found", success: false };
    }

    // Create the profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email!,
      name: userData.name,
      role: userData.role,
      index_number: userData.index_number || null,
    });

    if (profileError) {
      return { error: profileError.message, success: false };
    }

    return {
      success: true,
      message: "Profile created successfully!",
    };
  } catch (error) {
    console.error("Create profile error:", error);
    return { error: "An unexpected error occurred", success: false };
  }
}

// Class management helpers
export async function getClassesForAdmin(adminId: string) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("classes")
      .select(
        `
        *,
        enrollments(count)
      `
      )
      .eq("admin_id", adminId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching classes:", error);
      return null;
    }

    // Transform the data to include counts
    const classesWithCounts =
      data?.map((cls) => ({
        ...cls,
        student_count: cls.enrollments?.[0]?.count || 0,
        quiz_count: 0, // TODO: Add quiz count when quiz functionality is implemented
      })) || [];

    return classesWithCounts;
  } catch (error) {
    console.error("Error in getClassesForAdmin:", error);
    return null;
  }
}

export async function createClass(classData: {
  name: string;
  description: string;
  subject: string;
  semester: string;
  academic_year: string;
  admin_id: string;
}) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("classes")
      .insert(classData)
      .select()
      .single();

    if (error) {
      console.error("Error creating class:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Error in createClass:", error);
    throw error;
  }
}

export async function getClassById(classId: string) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("id", classId)
      .single();

    if (error) {
      console.error("Error fetching class:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getClassById:", error);
    return null;
  }
}

export async function getStudentsInClass(classId: string) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("enrollments")
      .select(
        `
        student_id,
        enrolled_at,
        profiles:student_id (
          id,
          name,
          email,
          index_number
        )
      `
      )
      .eq("class_id", classId)
      .order("enrolled_at", { ascending: false });

    if (error) {
      console.error("Error fetching students:", error);
      return null;
    }

    // Transform the data to match our Student interface
    const students =
      data?.map((enrollment) => ({
        id: enrollment.profiles.id,
        name: enrollment.profiles.name,
        email: enrollment.profiles.email,
        index_number: enrollment.profiles.index_number,
        enrolled_at: enrollment.enrolled_at,
      })) || [];

    return students;
  } catch (error) {
    console.error("Error in getStudentsInClass:", error);
    return null;
  }
}

export async function enrollStudentInClass(data: {
  classId: string;
  name: string;
  email: string;
  indexNumber: string;
}) {
  const supabase = createClient();

  try {
    // First, create or get the student profile
    let studentProfile;

    // Check if student already exists
    const { data: existingProfile, error: searchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", data.email)
      .single();

    if (searchError && searchError.code !== "PGRST116") {
      throw new Error(
        "Error checking existing student: " + searchError.message
      );
    }

    if (existingProfile) {
      // Student exists, check if they're already enrolled
      const { data: existingEnrollment } = await supabase
        .from("enrollments")
        .select("*")
        .eq("class_id", data.classId)
        .eq("student_id", existingProfile.id)
        .single();

      if (existingEnrollment) {
        throw new Error("Student is already enrolled in this class");
      }

      studentProfile = existingProfile;
    } else {
      // Create new student profile (without auth user)
      const profileData = {
        name: data.name,
        email: data.email,
        role: "student" as const,
        index_number: data.indexNumber,
        // Don't set id - let it auto-generate
        auth_user_id: null, // No auth user for enrolled students
      };

      const { data: newProfile, error: profileError } = await supabase
        .from("profiles")
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        throw new Error(
          "Error creating student profile: " + profileError.message
        );
      }

      studentProfile = newProfile;
    }

    // Enroll the student in the class
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("enrollments")
      .insert({
        class_id: data.classId,
        student_id: studentProfile.id,
        enrolled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (enrollmentError) {
      throw new Error("Error enrolling student: " + enrollmentError.message);
    }

    // Return the student data in the expected format
    return {
      id: studentProfile.id,
      name: studentProfile.name,
      email: studentProfile.email,
      index_number: studentProfile.index_number,
      enrolled_at: enrollment.enrolled_at,
    };
  } catch (error: any) {
    console.error("Error in enrollStudentInClass:", error);
    throw error;
  }
}

export async function enrollStudentsFromCSV(classId: string, csvFile: File) {
  const supabase = createClient();

  try {
    // Read CSV file
    const csvText = await csvFile.text();
    const lines = csvText.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error(
        "CSV file must contain at least a header row and one data row"
      );
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    // Validate headers
    const requiredHeaders = ["name", "email", "index_number"];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(", ")}`);
    }

    const nameIndex = headers.indexOf("name");
    const emailIndex = headers.indexOf("email");
    const indexNumberIndex = headers.indexOf("index_number");

    const studentsToEnroll = [];
    const errors = [];

    // Process each student row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());

      if (values.length < 3) continue; // Skip empty rows

      const name = values[nameIndex];
      const email = values[emailIndex];
      const indexNumber = values[indexNumberIndex];

      if (!name || !email || !indexNumber) {
        errors.push(`Row ${i + 1}: Missing required fields`);
        continue;
      }

      studentsToEnroll.push({ name, email, indexNumber });
    }

    if (errors.length > 0) {
      throw new Error(`CSV validation errors:\n${errors.join("\n")}`);
    }

    if (studentsToEnroll.length === 0) {
      throw new Error("No valid student data found in CSV");
    }

    // Enroll each student
    const enrolledStudents = [];
    const enrollmentErrors = [];

    for (const studentData of studentsToEnroll) {
      try {
        const enrolledStudent = await enrollStudentInClass({
          classId,
          name: studentData.name,
          email: studentData.email,
          indexNumber: studentData.indexNumber,
        });
        enrolledStudents.push(enrolledStudent);
      } catch (error: any) {
        enrollmentErrors.push(
          `${studentData.name} (${studentData.email}): ${error.message}`
        );
      }
    }

    if (enrollmentErrors.length > 0 && enrolledStudents.length === 0) {
      throw new Error(
        `Failed to enroll any students:\n${enrollmentErrors.join("\n")}`
      );
    }

    // Return successful enrollments, even if some failed
    if (enrollmentErrors.length > 0) {
      console.warn("Some students could not be enrolled:", enrollmentErrors);
    }

    return enrolledStudents;
  } catch (error: any) {
    console.error("Error in enrollStudentsFromCSV:", error);
    throw error;
  }
}

export async function removeStudentFromClass(
  classId: string,
  studentId: string
) {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from("enrollments")
      .delete()
      .eq("class_id", classId)
      .eq("student_id", studentId);

    if (error) {
      throw new Error("Error removing student: " + error.message);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in removeStudentFromClass:", error);
    throw error;
  }
}

export async function updateClass(
  classId: string,
  classData: {
    name: string;
    description: string;
    subject: string;
    semester: string;
    academic_year: string;
  }
) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("classes")
      .update({
        ...classData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", classId)
      .select()
      .single();

    if (error) {
      console.error("Error updating class:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error: any) {
    console.error("Error in updateClass:", error);
    throw error;
  }
}

export async function deleteClass(classId: string) {
  const supabase = createClient();

  try {
    const { error } = await supabase.from("classes").delete().eq("id", classId);

    if (error) {
      throw new Error("Error deleting class: " + error.message);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteClass:", error);
    throw error;
  }
}

export async function exportStudentList(classId: string) {
  const supabase = createClient();

  try {
    const students = await getStudentsInClass(classId);

    if (!students || students.length === 0) {
      throw new Error("No students found in this class");
    }

    // Create CSV content
    const headers = ["Name", "Email", "Index Number", "Enrolled Date"];
    const csvContent = [
      headers.join(","),
      ...students.map((student) =>
        [
          `"${student.name}"`,
          student.email,
          student.index_number,
          new Date(student.enrolled_at).toLocaleDateString(),
        ].join(",")
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    // Get class name for filename
    const classData = await getClassById(classId);
    const filename = `${classData?.name || "Class"}_Students_${
      new Date().toISOString().split("T")[0]
    }.csv`;

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error: any) {
    console.error("Error in exportStudentList:", error);
    throw error;
  }
}
