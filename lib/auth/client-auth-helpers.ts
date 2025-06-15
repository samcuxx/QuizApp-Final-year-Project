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
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("No authenticated user");
  }

  try {
    // Get the user's profile to check their role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return null;
    }

    // If admin, they can access any class they created
    if (profile.role === "admin") {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId)
        .eq("admin_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching class for admin:", error);
        return null;
      }
      return data;
    }

    // If student, they can only access classes they're enrolled in
    if (profile.role === "student") {
      const { data, error } = await supabase
        .from("classes")
        .select(
          `
          *,
          enrollments!inner (
            student_id
          )
        `
        )
        .eq("id", classId)
        .eq("enrollments.student_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching class for student:", error);
        return null;
      }

      // Remove the enrollments data from response
      const { enrollments, ...classData } = data;
      return classData;
    }

    return null;
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

// Quiz Management Functions

// Get all quizzes for an admin
export async function getQuizzesForAdmin(adminId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("quizzes")
    .select(
      `
      *,
      class:classes!inner (
        id,
        name,
        subject,
        semester,
        academic_year
      )
    `
    )
    .eq("created_by", adminId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching quizzes:", error);
    throw new Error("Failed to fetch quizzes");
  }

  return data?.map((quiz) => ({
    ...quiz,
    class_name: `${quiz.class.name} - ${quiz.class.semester} ${quiz.class.academic_year}`,
  }));
}

// Create a new quiz
export async function createQuiz(quizData: any) {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("No authenticated user");

  // Start a transaction to create quiz and questions
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({
      title: quizData.title,
      description: quizData.description,
      class_id: quizData.class_id,
      duration_minutes: quizData.duration_minutes,
      attempts_allowed: quizData.attempts_allowed,
      scheduled_start: quizData.scheduled_start,
      scheduled_end: quizData.scheduled_end,
      instructions: quizData.instructions,
      show_results_to_students: quizData.show_results_to_students !== false, // default to true
      created_by: user.id,
    })
    .select()
    .single();

  if (quizError) {
    console.error("Error creating quiz:", quizError);
    throw new Error("Failed to create quiz");
  }

  // Create questions if provided
  if (quizData.questions && quizData.questions.length > 0) {
    const questionsToInsert = quizData.questions.map(
      (q: any, index: number) => ({
        quiz_id: quiz.id,
        question_number: index + 1,
        type: q.type,
        question_text: q.question_text,
        points: q.points,
        options: q.options || null,
        correct_answer:
          q.correct_answer !== undefined ? q.correct_answer : null,
        explanation: q.explanation || null,
      })
    );

    const { error: questionsError } = await supabase
      .from("questions")
      .insert(questionsToInsert);

    if (questionsError) {
      console.error("Error creating questions:", questionsError);
      // Try to cleanup the quiz if questions failed
      await supabase.from("quizzes").delete().eq("id", quiz.id);
      throw new Error("Failed to create quiz questions");
    }
  }

  return quiz;
}

// Get a specific quiz with questions
export async function getQuizWithQuestions(quizId: string) {
  const supabase = createClient();

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select(
      `
      *,
      class:classes!inner (
        id,
        name,
        subject,
        semester,
        academic_year
      )
    `
    )
    .eq("id", quizId)
    .single();

  if (quizError) {
    console.error("Error fetching quiz:", quizError);
    throw new Error("Failed to fetch quiz");
  }

  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("question_number");

  if (questionsError) {
    console.error("Error fetching questions:", questionsError);
    throw new Error("Failed to fetch questions");
  }

  return {
    ...quiz,
    questions: questions || [],
    class_name: `${quiz.class.name} - ${quiz.class.semester} ${quiz.class.academic_year}`,
  };
}

// Update a quiz
export async function updateQuiz(quizId: string, updates: any) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("quizzes")
    .update(updates)
    .eq("id", quizId)
    .select()
    .single();

  if (error) {
    console.error("Error updating quiz:", error);
    throw new Error("Failed to update quiz");
  }

  return data;
}

// Delete a quiz
export async function deleteQuiz(quizId: string) {
  const supabase = createClient();

  const { error } = await supabase.from("quizzes").delete().eq("id", quizId);

  if (error) {
    console.error("Error deleting quiz:", error);
    throw new Error("Failed to delete quiz");
  }

  return true;
}

// Update quiz status
export async function updateQuizStatus(quizId: string, status: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("quizzes")
    .update({ status })
    .eq("id", quizId)
    .select()
    .single();

  if (error) {
    console.error("Error updating quiz status:", error);
    throw new Error("Failed to update quiz status");
  }

  return data;
}

// Student Dashboard Functions

// Get student's enrolled classes
export async function getStudentClasses(studentId: string) {
  const supabase = createClient();

  // First, let's get the enrollments for this student
  const { data: enrollments, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("*")
    .eq("student_id", studentId);

  if (enrollmentError) {
    console.error("Error fetching enrollments:", enrollmentError);
    throw new Error("Failed to fetch enrollments");
  }

  if (!enrollments || enrollments.length === 0) {
    return [];
  }

  // Then get the class details for each enrollment
  const classIds = enrollments.map((e) => e.class_id);
  const { data: classes, error: classError } = await supabase
    .from("classes")
    .select(
      `
      id,
      name,
      subject,
      semester,
      academic_year,
      description,
      admin:profiles!admin_id (
        name
      )
    `
    )
    .in("id", classIds);

  if (classError) {
    console.error("Error fetching classes:", classError);
    throw new Error("Failed to fetch class details");
  }

  // Combine the data
  return enrollments
    .map((enrollment) => {
      const classData = classes?.find((c) => c.id === enrollment.class_id);
      return {
        ...classData,
        enrolled_at: enrollment.enrolled_at,
        instructor_name: classData?.admin?.name || "Unknown",
      };
    })
    .filter(Boolean);
}

// Get available quizzes for student
export async function getAvailableQuizzes(studentId: string) {
  const supabase = createClient();

  // First get the student's enrolled classes
  const { data: enrollments, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("class_id")
    .eq("student_id", studentId);

  if (enrollmentError) {
    console.error("Error fetching enrollments:", enrollmentError);
    throw new Error("Failed to fetch enrollments");
  }

  if (!enrollments || enrollments.length === 0) {
    return [];
  }

  const classIds = enrollments.map((e) => e.class_id);

  // Then get quizzes for those classes (include all visible statuses for enrolled students)
  const { data: quizzes, error: quizError } = await supabase
    .from("quizzes")
    .select(
      `
      *,
      class:classes!inner (
        id,
        name,
        subject,
        semester,
        academic_year
      )
    `
    )
    .in("class_id", classIds)
    .in("status", ["scheduled", "active", "completed"]) // Include completed for results viewing
    .order("scheduled_start", { ascending: true });

  if (quizError) {
    console.error("Error fetching available quizzes:", quizError);
    throw new Error("Failed to fetch available quizzes");
  }

  if (!quizzes || quizzes.length === 0) {
    return [];
  }

  // Get student's attempts for all these quizzes
  const quizIds = quizzes.map((q) => q.id);
  const { data: attempts, error: attemptsError } = await supabase
    .from("quiz_attempts")
    .select("quiz_id, attempt_number, submitted_at, status")
    .eq("student_id", studentId)
    .in("quiz_id", quizIds);

  if (attemptsError) {
    console.error("Error fetching quiz attempts:", attemptsError);
    throw new Error("Failed to fetch quiz attempts");
  }

  // Organize attempts by quiz
  const attemptsByQuiz = (attempts || []).reduce((acc, attempt) => {
    if (!acc[attempt.quiz_id]) {
      acc[attempt.quiz_id] = [];
    }
    acc[attempt.quiz_id].push(attempt);
    return acc;
  }, {} as Record<string, any[]>);

  return quizzes.map((quiz) => {
    const studentAttempts = attemptsByQuiz[quiz.id] || [];
    const submittedAttempts = studentAttempts.filter((a) => a.submitted_at);
    const hasCompletedAttempt = submittedAttempts.length > 0;
    const attemptsUsed = studentAttempts.length;
    const maxAttemptsReached =
      quiz.attempts_allowed !== -1 && attemptsUsed >= quiz.attempts_allowed;

    // Determine if student has completed this quiz (for their perspective)
    const isCompletedForStudent =
      hasCompletedAttempt &&
      (maxAttemptsReached || quiz.attempts_allowed === 1);

    return {
      ...quiz,
      class_name: `${quiz.class.name} - ${quiz.class.semester} ${quiz.class.academic_year}`,
      // Add student-specific completion info
      student_attempts_used: attemptsUsed,
      student_has_completed: isCompletedForStudent,
      student_can_retake:
        hasCompletedAttempt && !maxAttemptsReached && quiz.attempts_allowed > 1,
      student_submitted_attempts: submittedAttempts.length,
    };
  });
}

// Join quiz with code
export async function joinQuizWithCode(quizCode: string, studentId: string) {
  const supabase = createClient();

  // Skip validation if empty code (used by startQuizAttempt)
  if (!quizCode) {
    return { success: true, quiz: null };
  }

  // First, find the quiz by code (simple query without joins)
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("*")
    .eq("quiz_code", quizCode.toUpperCase())
    .single();

  if (quizError) {
    if (quizError.code === "PGRST116") {
      return {
        error: "Quiz not found",
        success: false,
      };
    }
    console.error("Error finding quiz:", quizError);
    return { error: "Failed to find quiz", success: false };
  }

  // Check if student is enrolled in the quiz's class
  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id")
    .eq("class_id", quiz.class_id)
    .eq("student_id", studentId)
    .single();

  if (enrollmentError || !enrollment) {
    return {
      error: "You're not enrolled in this class",
      success: false,
    };
  }

  // Get class details
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("id, name, subject, semester, academic_year")
    .eq("id", quiz.class_id)
    .single();

  if (classError) {
    console.error("Error fetching class data:", classError);
    return { error: "Failed to fetch class details", success: false };
  }

  // Check if quiz is available
  const now = new Date().toISOString();
  if (quiz.status === "draft") {
    return { error: "This quiz is not yet available", success: false };
  }
  if (quiz.status === "completed") {
    return { error: "This quiz has already ended", success: false };
  }
  if (quiz.scheduled_start && now < quiz.scheduled_start) {
    return { error: "This quiz hasn't started yet", success: false };
  }
  if (quiz.scheduled_end && now > quiz.scheduled_end) {
    return { error: "This quiz has already ended", success: false };
  }

  // Check if student has already attempted this quiz
  const { data: existingAttempts, error: attemptError } = await supabase
    .from("quiz_attempts")
    .select("id, submitted_at, status")
    .eq("quiz_id", quiz.id)
    .eq("student_id", studentId);

  if (attemptError) {
    console.error("Error checking existing attempts:", attemptError);
    return { error: "Failed to check quiz attempts", success: false };
  }

  const submittedAttempts = existingAttempts?.filter(a => a.submitted_at) || [];
  const totalAttempts = existingAttempts?.length || 0;

  // Check if student has used all attempts
  if (quiz.attempts_allowed !== -1 && totalAttempts >= quiz.attempts_allowed) {
    return {
      error: "You have already used all attempts for this quiz",
      success: false,
    };
  }

  // Check if student has completed the quiz and it only allows one attempt
  if (submittedAttempts.length > 0 && quiz.attempts_allowed === 1) {
    return {
      error: "You have already completed this quiz",
      success: false,
    };
  }

  return {
    success: true,
    quiz: {
      ...quiz,
      class: classData,
      class_name: `${classData.name} - ${classData.semester} ${classData.academic_year}`,
    },
  };
}

// Get quiz for taking (with questions)
export async function getQuizForTaking(quizId: string, studentId: string) {
  const supabase = createClient();

  // First, get the quiz details
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .single();

  if (quizError) {
    console.error("Error fetching quiz:", quizError);
    throw new Error("Failed to fetch quiz");
  }

  // Check if student is enrolled in the quiz's class
  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id")
    .eq("class_id", quiz.class_id)
    .eq("student_id", studentId)
    .single();

  if (enrollmentError || !enrollment) {
    throw new Error("Access denied - you're not enrolled in this class");
  }

  // Get class details
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("id, name, subject, semester, academic_year")
    .eq("id", quiz.class_id)
    .single();

  if (classError) {
    console.error("Error fetching class data:", classError);
    throw new Error("Failed to fetch class details");
  }

  // Get questions (without correct answers for security)
  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("id, question_number, type, question_text, points, options")
    .eq("quiz_id", quizId)
    .order("question_number");

  if (questionsError) {
    console.error("Error fetching questions:", questionsError);
    throw new Error("Failed to fetch quiz questions");
  }

  return {
    ...quiz,
    class: classData,
    questions: questions || [],
    class_name: `${classData.name} - ${classData.semester} ${classData.academic_year}`,
  };
}

// Start quiz attempt
export async function startQuizAttempt(quizId: string, studentId: string) {
  const supabase = createClient();

  // First get quiz details to check attempt limits
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("attempts_allowed, status")
    .eq("id", quizId)
    .single();

  if (quizError) {
    console.error("Error fetching quiz details:", quizError);
    throw new Error("Failed to fetch quiz details");
  }

  // Get the current attempts for this student and quiz
  const { data: existingAttempts, error: countError } = await supabase
    .from("quiz_attempts")
    .select("attempt_number, submitted_at, status")
    .eq("quiz_id", quizId)
    .eq("student_id", studentId)
    .order("attempt_number", { ascending: false });

  if (countError) {
    console.error("Error counting existing attempts:", countError);
    throw new Error("Failed to check existing attempts");
  }

  const submittedAttempts = existingAttempts?.filter(a => a.submitted_at) || [];
  const totalAttempts = existingAttempts?.length || 0;

  // Check if student has used all attempts
  if (quiz.attempts_allowed !== -1 && totalAttempts >= quiz.attempts_allowed) {
    throw new Error("You have already used all attempts for this quiz");
  }

  // Check if student has completed the quiz and it only allows one attempt
  if (submittedAttempts.length > 0 && quiz.attempts_allowed === 1) {
    throw new Error("You have already completed this quiz");
  }

  // Check if there's an active (unsubmitted) attempt
  const activeAttempt = existingAttempts?.find(a => !a.submitted_at);
  if (activeAttempt) {
    // Return the existing active attempt instead of creating a new one
    return activeAttempt;
  }

  const nextAttemptNumber = totalAttempts + 1;

  const { data: attempt, error } = await supabase
    .from("quiz_attempts")
    .insert({
      quiz_id: quizId,
      student_id: studentId,
      attempt_number: nextAttemptNumber,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error starting quiz attempt:", error);
    throw new Error("Failed to start quiz attempt");
  }

  return attempt;
}

// Submit quiz attempt
export async function submitQuizAttempt(
  attemptId: string,
  answers: Record<string, any>
) {
  const supabase = createClient();

  const { data: attempt, error } = await supabase
    .from("quiz_attempts")
    .update({
      answers: answers,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", attemptId)
    .select()
    .single();

  if (error) {
    console.error("Error submitting quiz attempt:", error);
    throw new Error("Failed to submit quiz attempt");
  }

  return attempt;
}

// Get student's quiz attempts/results
export async function getStudentQuizAttempts(studentId: string) {
  const supabase = createClient();

  // Get quiz attempts for this student
  const { data: attempts, error } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("student_id", studentId)
    .order("started_at", { ascending: false });

  if (error) {
    console.error("Error fetching quiz attempts:", error);
    throw new Error("Failed to fetch quiz attempts");
  }

  if (!attempts || attempts.length === 0) {
    return [];
  }

  // Get unique quiz IDs
  const quizIds = [...new Set(attempts.map((attempt) => attempt.quiz_id))];

  // Get quiz details for all the quizzes (include result visibility setting)
  const { data: quizzes, error: quizError } = await supabase
    .from("quizzes")
    .select("id, title, duration_minutes, class_id, show_results_to_students")
    .in("id", quizIds);

  if (quizError) {
    console.error("Error fetching quiz details:", quizError);
    throw new Error("Failed to fetch quiz details");
  }

  // Get unique class IDs from quizzes
  const classIds = [...new Set(quizzes?.map((quiz) => quiz.class_id) || [])];

  // Get class details
  const { data: classes, error: classError } = await supabase
    .from("classes")
    .select("id, name, subject, semester, academic_year")
    .in("id", classIds);

  if (classError) {
    console.error("Error fetching class details:", classError);
    throw new Error("Failed to fetch class details");
  }

  // Combine the data and respect result visibility settings
  return attempts.map((attempt) => {
    const quiz = quizzes?.find((q) => q.id === attempt.quiz_id);
    const classData = classes?.find((c) => c.id === quiz?.class_id);
    const showResults = quiz?.show_results_to_students !== false; // default to true if not set

    return {
      ...attempt,
      quiz_title: quiz?.title || "Unknown Quiz",
      class_name: classData
        ? `${classData.name} - ${classData.semester} ${classData.academic_year}`
        : "Unknown Class",
      show_results_to_students: showResults,
      // Hide score and answers if results shouldn't be shown
      score: showResults ? attempt.score : null,
      answers: showResults ? attempt.answers : {},
    };
  });
}

// Get student dashboard data
export async function getStudentDashboardData(studentId: string) {
  const supabase = createClient();

  try {
    // Get all data in parallel
    const [classes, availableQuizzes, attempts] = await Promise.all([
      getStudentClasses(studentId),
      getAvailableQuizzes(studentId),
      getStudentQuizAttempts(studentId),
    ]);

    // Calculate upcoming quizzes (scheduled in next 7 days)
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingQuizzes = availableQuizzes.filter((quiz) => {
      if (!quiz.scheduled_start) return false;
      const startDate = new Date(quiz.scheduled_start);
      return startDate >= now && startDate <= nextWeek;
    });

    // Calculate stats
    const completedAttempts = attempts.filter(
      (attempt) => attempt.submitted_at
    );
    const averageScore =
      completedAttempts.length > 0
        ? completedAttempts.reduce(
            (sum, attempt) => sum + (attempt.score || 0),
            0
          ) / completedAttempts.length
        : null;

    return {
      enrolledClasses: classes,
      availableQuizzes,
      upcomingQuizzes,
      recentAttempts: attempts.slice(0, 5),
      stats: {
        enrolledClasses: classes.length,
        availableQuizzes: availableQuizzes.length,
        completedQuizzes: completedAttempts.length,
        averageScore,
      },
    };
  } catch (error) {
    console.error("Error fetching student dashboard data:", error);
    throw new Error("Failed to fetch dashboard data");
  }
}

// Join class with code
export async function joinClassWithCode(classCode: string, studentId: string) {
  const supabase = createClient();

  // First find the class by code
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("*")
    .eq("class_code", classCode.toUpperCase())
    .single();

  if (classError) {
    if (classError.code === "PGRST116") {
      return { error: "Class not found with this code", success: false };
    }
    console.error("Error finding class:", classError);
    return { error: "Failed to find class", success: false };
  }

  // Check if student is already enrolled
  const { data: existingEnrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id")
    .eq("class_id", classData.id)
    .eq("student_id", studentId)
    .single();

  if (existingEnrollment) {
    return { error: "You are already enrolled in this class", success: false };
  }

  if (enrollmentError && enrollmentError.code !== "PGRST116") {
    console.error("Error checking enrollment:", enrollmentError);
    return { error: "Failed to check enrollment status", success: false };
  }

  // Enroll the student
  const { error: insertError } = await supabase.from("enrollments").insert({
    class_id: classData.id,
    student_id: studentId,
    enrolled_at: new Date().toISOString(),
  });

  if (insertError) {
    console.error("Error enrolling student:", insertError);
    return { error: "Failed to join class", success: false };
  }

  return {
    success: true,
    class: classData,
    message: `Successfully joined ${classData.name}!`,
  };
}

// Get detailed quiz attempt results
export async function getQuizAttemptDetails(attemptId: string) {
  const supabase = createClient();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("No authenticated user");
  }

  try {
    // Get the quiz attempt with quiz and class details
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .select(
        `
        *,
        quiz:quizzes!inner (
          id,
          title,
          show_results_to_students,
          class:classes!inner (
            id,
            name,
            subject,
            semester,
            academic_year
          )
        )
      `
      )
      .eq("id", attemptId)
      .eq("student_id", user.id)
      .single();

    if (attemptError) {
      console.error("Error fetching quiz attempt:", attemptError);
      throw new Error("Failed to fetch quiz attempt details");
    }

    // Get questions for this quiz
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .eq("quiz_id", attempt.quiz_id)
      .order("question_number");

    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      throw new Error("Failed to fetch question details");
    }

    // Get student answers for this attempt
    const { data: studentAnswers, error: answersError } = await supabase
      .from("student_answers")
      .select("*")
      .eq("attempt_id", attemptId);

    if (answersError) {
      console.error("Error fetching student answers:", answersError);
      throw new Error("Failed to fetch student answers");
    }

    // Get question options for multiple choice questions
    const questionIds = questions.map((q) => q.id);
    const { data: options, error: optionsError } = await supabase
      .from("question_options")
      .select("*")
      .in("question_id", questionIds)
      .order("order_index");

    if (optionsError) {
      console.error("Error fetching question options:", optionsError);
      throw new Error("Failed to fetch question options");
    }

    // Organize options by question
    const optionsByQuestion =
      options?.reduce((acc, option) => {
        if (!acc[option.question_id]) {
          acc[option.question_id] = [];
        }
        acc[option.question_id].push(option);
        return acc;
      }, {} as Record<string, any[]>) || {};

    // Organize student answers by question
    const answersByQuestion =
      studentAnswers?.reduce((acc, answer) => {
        acc[answer.question_id] = answer;
        return acc;
      }, {} as Record<string, any>) || {};

    // Process questions with student answers
    const processedQuestions = questions.map((question) => {
      const studentAnswer = answersByQuestion[question.id];
      const questionOptions = optionsByQuestion[question.id] || [];

      // For multiple choice, convert options to simple array
      const optionsArray = questionOptions.map((opt) => opt.option_text);

      // Determine student's answer based on question type
      let studentAnswerValue;
      if (
        question.type === "multiple_choice" &&
        studentAnswer?.selected_option_id
      ) {
        const selectedOption = questionOptions.find(
          (opt) => opt.id === studentAnswer.selected_option_id
        );
        studentAnswerValue = selectedOption
          ? questionOptions.indexOf(selectedOption)
          : null;
      } else if (
        question.type === "true_false" &&
        studentAnswer?.selected_option_id
      ) {
        const selectedOption = questionOptions.find(
          (opt) => opt.id === studentAnswer.selected_option_id
        );
        studentAnswerValue = selectedOption?.option_text?.toLowerCase();
      } else if (question.type === "essay") {
        studentAnswerValue = studentAnswer?.answer_text;
      }

      // Determine correct answer
      let correctAnswerValue;
      if (question.type === "multiple_choice") {
        const correctOption = questionOptions.find((opt) => opt.is_correct);
        correctAnswerValue = correctOption
          ? questionOptions.indexOf(correctOption)
          : null;
      } else if (question.type === "true_false") {
        const correctOption = questionOptions.find((opt) => opt.is_correct);
        correctAnswerValue = correctOption?.option_text?.toLowerCase();
      }

      return {
        id: question.id,
        question_number: question.question_number,
        type: question.type,
        question_text: question.question_text,
        points: question.points,
        options: optionsArray.length > 0 ? optionsArray : undefined,
        correct_answer: correctAnswerValue,
        explanation: question.explanation,
        student_answer: studentAnswerValue,
        points_awarded: studentAnswer?.points_awarded || 0,
        is_correct: studentAnswer?.is_correct || false,
      };
    });

    // Calculate total points
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    return {
      id: attempt.id,
      quiz_id: attempt.quiz_id,
      quiz_title: attempt.quiz.title,
      class_name: `${attempt.quiz.class.name} - ${attempt.quiz.class.semester} ${attempt.quiz.class.academic_year}`,
      started_at: attempt.started_at,
      submitted_at: attempt.submitted_at,
      score: attempt.score,
      total_points: totalPoints,
      time_taken: attempt.time_taken || 0,
      show_results_to_students: attempt.quiz.show_results_to_students !== false,
      questions: processedQuestions,
    };
  } catch (error) {
    console.error("Error in getQuizAttemptDetails:", error);
    throw error;
  }
}
