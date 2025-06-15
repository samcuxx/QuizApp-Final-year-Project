// Database types for Quiz App

export type UserRole = "admin" | "student";
export type QuestionType = "multiple_choice" | "true_false" | "essay";
export type QuizStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "completed"
  | "cancelled";

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  index_number?: string; // For students only
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  name: string;
  description?: string;
  admin_id: string;
  class_code: string;
  created_at: string;
  updated_at: string;
  // Relations
  admin?: Profile;
  enrollments?: ClassEnrollment[];
  quizzes?: Quiz[];
}

export interface ClassEnrollment {
  id: string;
  class_id: string;
  student_id: string;
  enrolled_at: string;
  // Relations
  class?: Class;
  student?: Profile;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  class_id: string;
  admin_id: string;
  quiz_code: string;
  status: QuizStatus;
  scheduled_start?: string;
  scheduled_end?: string;
  duration_minutes?: number;
  show_results: boolean;
  randomize_questions: boolean;
  attempts_allowed: number;
  created_at: string;
  updated_at: string;
  // Relations
  class?: Class;
  admin?: Profile;
  questions?: Question[];
  attempts?: QuizAttempt[];
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: QuestionType;
  points: number;
  order_index: number;
  created_at: string;
  updated_at: string;
  // Relations
  quiz?: Quiz;
  options?: QuestionOption[];
  student_answers?: StudentAnswer[];
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
  created_at: string;
  // Relations
  question?: Question;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  attempt_number: number;
  started_at: string;
  submitted_at?: string;
  score?: number;
  max_score?: number;
  is_completed: boolean;
  // Relations
  quiz?: Quiz;
  student?: Profile;
  answers?: StudentAnswer[];
}

export interface StudentAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id?: string; // For multiple choice/true-false
  answer_text?: string; // For essay questions
  points_awarded: number;
  is_correct?: boolean;
  answered_at: string;
  // Relations
  attempt?: QuizAttempt;
  question?: Question;
  selected_option?: QuestionOption;
}

// Form types for creating/updating
export interface CreateQuizData {
  title: string;
  description?: string;
  class_id: string;
  scheduled_start?: string;
  scheduled_end?: string;
  duration_minutes?: number;
  show_results?: boolean;
  randomize_questions?: boolean;
  attempts_allowed?: number;
}

export interface CreateQuestionData {
  question_text: string;
  question_type: QuestionType;
  points?: number;
  options?: CreateQuestionOptionData[];
}

export interface CreateQuestionOptionData {
  option_text: string;
  is_correct: boolean;
}

export interface CreateClassData {
  name: string;
  description?: string;
}

export interface EnrollStudentsData {
  students: Array<{
    name: string;
    email: string;
    index_number: string;
  }>;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth types
export interface SignUpData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  index_number?: string; // Required for students
}

export interface SignInData {
  email?: string;
  index_number?: string;
  password: string;
}

// Dashboard data types
export interface AdminDashboardData {
  classes: Class[];
  recentQuizzes: Quiz[];
  totalStudents: number;
  activeQuizzes: number;
}

export interface StudentDashboardData {
  enrolledClasses: Class[];
  availableQuizzes: Quiz[];
  recentAttempts: QuizAttempt[];
  upcomingQuizzes: Quiz[];
}
