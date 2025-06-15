-- Quiz Management System Database Update (CORRECTED VERSION)
-- This script adds quiz functionality to the existing quiz app database
-- Fixed to use correct column names: admin_id instead of created_by for classes table

-- Drop existing quiz tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS generate_quiz_code() CASCADE;
DROP FUNCTION IF EXISTS set_quiz_code() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Quizzes table
CREATE TABLE quizzes (
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
CREATE TABLE questions (
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

-- Quiz attempts table
CREATE TABLE quiz_attempts (
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

-- Indexes for better performance
CREATE INDEX idx_quizzes_class_id ON quizzes(class_id);
CREATE INDEX idx_quizzes_created_by ON quizzes(created_by);
CREATE INDEX idx_quizzes_status ON quizzes(status);
CREATE INDEX idx_quizzes_quiz_code ON quizzes(quiz_code);
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_student_id ON quiz_attempts(student_id);

-- Enable RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quizzes
-- Admins can see all quizzes for their classes (FIXED: using admin_id instead of created_by)
CREATE POLICY "Admins can view quizzes for their classes" ON quizzes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM classes c 
            WHERE c.id = quizzes.class_id 
            AND c.admin_id = auth.uid()
        )
    );

-- Admins can create quizzes for their classes (FIXED: using admin_id instead of created_by)
CREATE POLICY "Admins can create quizzes for their classes" ON quizzes
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM classes c 
            WHERE c.id = quizzes.class_id 
            AND c.admin_id = auth.uid()
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

-- Show completion message
DO $$
BEGIN
    RAISE NOTICE 'Quiz management system tables created successfully!';
    RAISE NOTICE 'Tables created: quizzes, questions, quiz_attempts';
    RAISE NOTICE 'Functions created: generate_quiz_code, set_quiz_code, update_updated_at_column';
    RAISE NOTICE 'RLS policies configured for proper access control';
    RAISE NOTICE 'IMPORTANT: This version uses admin_id (not created_by) for classes table references';
END $$; 