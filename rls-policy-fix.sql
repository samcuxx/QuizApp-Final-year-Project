-- Fix RLS policies to allow students to search for quizzes by code
-- regardless of status (for proper error messages in join quiz functionality)

-- Drop the existing restrictive student policy
DROP POLICY IF EXISTS "Students can view active quizzes" ON quizzes;

-- Create a more permissive policy for students to view quizzes in their enrolled classes
-- This allows them to search by code and get proper error messages
CREATE POLICY "Students can view quizzes for enrolled classes" ON quizzes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM enrollments e 
            WHERE e.class_id = quizzes.class_id 
            AND e.student_id = auth.uid()
        )
    );

-- Also ensure classes table has proper RLS for students
DROP POLICY IF EXISTS "Students can view enrolled classes" ON classes;

CREATE POLICY "Students can view enrolled classes" ON classes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM enrollments e 
            WHERE e.class_id = classes.id 
            AND e.student_id = auth.uid()
        )
    );

-- Ensure enrollments table has proper policies
DROP POLICY IF EXISTS "Students can view own enrollments" ON enrollments;

CREATE POLICY "Students can view own enrollments" ON enrollments
    FOR SELECT
    USING (student_id = auth.uid());

CREATE POLICY "Students can insert own enrollments" ON enrollments
    FOR INSERT
    WITH CHECK (student_id = auth.uid());

-- Show completion message
SELECT 'RLS policies updated successfully' as message; 