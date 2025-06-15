-- Database Schema for Quiz App
-- Run this SQL in your Supabase SQL Editor

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'student');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'essay');
CREATE TYPE quiz_status AS ENUM ('draft', 'scheduled', 'active', 'completed', 'cancelled');

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  index_number TEXT UNIQUE, -- For students only
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes table
CREATE TABLE classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  class_code TEXT UNIQUE, -- Optional unique code for class
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Class enrollments (many-to-many relationship between students and classes)
CREATE TABLE enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    quiz_code VARCHAR(6) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'cancelled')),
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    duration_minutes INTEGER,
    attempts_allowed INTEGER DEFAULT 1,
    instructions TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'essay')),
    question_text TEXT NOT NULL,
    points INTEGER DEFAULT 1,
    options JSONB, -- For multiple choice options
    correct_answer JSONB, -- For storing correct answers
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(quiz_id, question_number)
);

-- Question options (for multiple choice and true/false)
CREATE TABLE question_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id),
    attempt_number INTEGER NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    score DECIMAL(5,2),
    total_points INTEGER,
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'auto_submitted')),
    answers JSONB,
    time_taken INTEGER, -- in seconds
    UNIQUE(quiz_id, student_id, attempt_number)
);

-- Student answers
CREATE TABLE student_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  selected_option_id UUID REFERENCES question_options(id) ON DELETE SET NULL, -- For multiple choice/true-false
  answer_text TEXT, -- For essay questions
  points_awarded DECIMAL(5,2) DEFAULT 0,
  is_correct BOOLEAN,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(attempt_id, question_id)
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_index_number ON profiles(index_number) WHERE index_number IS NOT NULL;
CREATE INDEX idx_classes_admin_id ON classes(admin_id);
CREATE INDEX idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_quizzes_class_id ON quizzes(class_id);
CREATE INDEX idx_quizzes_created_by ON quizzes(created_by);
CREATE INDEX idx_quizzes_status ON quizzes(status);
CREATE INDEX idx_quizzes_quiz_code ON quizzes(quiz_code);
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_question_options_question_id ON question_options(question_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_student_id ON quiz_attempts(student_id);
CREATE INDEX idx_student_answers_attempt_id ON student_answers(attempt_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Classes: Admins can manage their classes, students can view enrolled classes
CREATE POLICY "Admins can manage own classes" ON classes FOR ALL USING (admin_id = auth.uid());
CREATE POLICY "Students can view enrolled classes" ON classes FOR SELECT USING (
  EXISTS (SELECT 1 FROM enrollments WHERE class_id = id AND student_id = auth.uid())
);

-- Class enrollments: Admins can manage, students can view their own
CREATE POLICY "Admins can manage enrollments" ON enrollments FOR ALL USING (
  EXISTS (SELECT 1 FROM classes WHERE id = class_id AND admin_id = auth.uid())
);
CREATE POLICY "Students can view own enrollments" ON enrollments FOR SELECT USING (student_id = auth.uid());

-- Quizzes: Admins can manage their quizzes, students can view available quizzes
CREATE POLICY "Admins can manage own quizzes" ON quizzes FOR ALL USING (created_by = auth.uid());
CREATE POLICY "Students can view available quizzes" ON quizzes FOR SELECT USING (
  EXISTS (SELECT 1 FROM enrollments ce 
          JOIN classes c ON ce.class_id = c.id 
          WHERE c.id = quizzes.class_id AND ce.student_id = auth.uid())
);

-- Questions: Admins can manage, students can view during quiz
CREATE POLICY "Admins can manage questions" ON questions FOR ALL USING (
  EXISTS (SELECT 1 FROM quizzes WHERE id = quiz_id AND created_by = auth.uid())
);
CREATE POLICY "Students can view questions during quiz" ON questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM quizzes q
          JOIN enrollments ce ON ce.class_id = q.class_id
          WHERE q.id = quiz_id AND ce.student_id = auth.uid() AND q.status = 'active')
);

-- Question options: Similar to questions
CREATE POLICY "Admins can manage question options" ON question_options FOR ALL USING (
  EXISTS (SELECT 1 FROM questions q 
          JOIN quizzes quiz ON q.quiz_id = quiz.id 
          WHERE q.id = question_id AND quiz.created_by = auth.uid())
);
CREATE POLICY "Students can view options during quiz" ON question_options FOR SELECT USING (
  EXISTS (SELECT 1 FROM questions q
          JOIN quizzes quiz ON q.quiz_id = quiz.id
          JOIN enrollments ce ON ce.class_id = quiz.class_id
          WHERE q.id = question_id AND ce.student_id = auth.uid() AND quiz.status = 'active')
);

-- Quiz attempts: Students can manage their attempts, admins can view all attempts for their quizzes
CREATE POLICY "Students can manage own attempts" ON quiz_attempts FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Admins can view quiz attempts" ON quiz_attempts FOR SELECT USING (
  EXISTS (SELECT 1 FROM quizzes WHERE id = quiz_id AND created_by = auth.uid())
);

-- Student answers: Students can manage their answers, admins can view answers for their quizzes
CREATE POLICY "Students can manage own answers" ON student_answers FOR ALL USING (
  EXISTS (SELECT 1 FROM quiz_attempts WHERE id = attempt_id AND student_id = auth.uid())
);
CREATE POLICY "Admins can view student answers" ON student_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM quiz_attempts qa
          JOIN quizzes q ON qa.quiz_id = q.id
          WHERE qa.id = attempt_id AND q.created_by = auth.uid())
);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique codes
CREATE OR REPLACE FUNCTION generate_unique_code(length INTEGER DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude similar looking chars
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique quiz codes
CREATE OR REPLACE FUNCTION generate_quiz_code()
RETURNS VARCHAR(6) AS $$
DECLARE
    chars VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result VARCHAR(6) := '';
    i INTEGER;
    code_exists BOOLEAN;
BEGIN
    LOOP
        result := '';
        FOR i IN 1..6 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
        END LOOP;
        
        SELECT EXISTS(SELECT 1 FROM quizzes WHERE quiz_code = result) INTO code_exists;
        
        IF NOT code_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate quiz codes
CREATE OR REPLACE FUNCTION set_quiz_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quiz_code IS NULL OR NEW.quiz_code = '' THEN
        NEW.quiz_code := generate_quiz_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quiz_code_trigger
    BEFORE INSERT ON quizzes
    FOR EACH ROW
    EXECUTE FUNCTION set_quiz_code();

-- Trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quizzes_updated_at
    BEFORE UPDATE ON quizzes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for quizzes
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Admins can see all quizzes for their classes
CREATE POLICY "Admins can view quizzes for their classes" ON quizzes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM classes c 
            WHERE c.id = quizzes.class_id 
            AND c.created_by = auth.uid()
        )
    );

-- Admins can create quizzes for their classes
CREATE POLICY "Admins can create quizzes for their classes" ON quizzes
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM classes c 
            WHERE c.id = quizzes.class_id 
            AND c.created_by = auth.uid()
        )
    );

-- Admins can update their quizzes
CREATE POLICY "Admins can update their quizzes" ON quizzes
    FOR UPDATE
    USING (created_by = auth.uid());

-- Admins can delete their quizzes
CREATE POLICY "Admins can delete their quizzes" ON quizzes
    FOR DELETE
    USING (created_by = auth.uid());

-- Students can view active quizzes for their enrolled classes
CREATE POLICY "Students can view active quizzes" ON quizzes
    FOR SELECT
    USING (
        status IN ('active', 'scheduled') AND
        EXISTS (
            SELECT 1 FROM enrollments e 
            WHERE e.class_id = quizzes.class_id 
            AND e.student_id = auth.uid()
        )
    );

-- RLS Policies for questions
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Admins can manage questions for their quizzes
CREATE POLICY "Admins can manage questions for their quizzes" ON questions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM quizzes q 
            WHERE q.id = questions.quiz_id 
            AND q.created_by = auth.uid()
        )
    );

-- Students can view questions for quizzes they have access to
CREATE POLICY "Students can view questions for accessible quizzes" ON questions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM quizzes q
            JOIN enrollments e ON e.class_id = q.class_id
            WHERE q.id = questions.quiz_id 
            AND q.status = 'active'
            AND e.student_id = auth.uid()
        )
    );

-- RLS Policies for quiz attempts
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Students can view and create their own attempts
CREATE POLICY "Students can manage their own quiz attempts" ON quiz_attempts
    FOR ALL
    USING (student_id = auth.uid());

-- Admins can view attempts for their quizzes
CREATE POLICY "Admins can view attempts for their quizzes" ON quiz_attempts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM quizzes q 
            WHERE q.id = quiz_attempts.quiz_id 
            AND q.created_by = auth.uid()
        )
    ); 