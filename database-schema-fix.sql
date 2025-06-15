-- Database Schema Fix for Foreign Key Constraint Issues
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Fix the profiles table structure
-- Remove the foreign key constraint that's causing issues
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 2: Modify the profiles table to allow non-auth users
-- Add a new column for auth users (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Update existing profiles to use auth_user_id
UPDATE profiles 
SET auth_user_id = id 
WHERE auth_user_id IS NULL AND id IN (SELECT id FROM auth.users);

-- Step 4: Make id column not dependent on auth.users
-- First, make sure id has a default value
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Step 5: Update RLS policies to work with the new structure
-- Drop old policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can create student profiles" ON profiles;

-- Create new policies that work with both auth and non-auth users
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (
  auth.uid() = auth_user_id OR auth.uid() = id
);

CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (
  auth.uid() = auth_user_id OR auth.uid() = id
);

CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE (auth_user_id = auth.uid() OR id = auth.uid()) AND role = 'admin')
);

CREATE POLICY "Admins can create student profiles" ON profiles FOR INSERT WITH CHECK (
  (role = 'student' AND EXISTS (SELECT 1 FROM profiles WHERE (auth_user_id = auth.uid() OR id = auth.uid()) AND role = 'admin'))
  OR auth.uid() = auth_user_id
  OR auth.uid() = id
);

-- Step 6: Allow admins to update student profiles (for enrollment)
CREATE POLICY "Admins can update student profiles" ON profiles FOR UPDATE USING (
  (role = 'student' AND EXISTS (SELECT 1 FROM profiles WHERE (auth_user_id = auth.uid() OR id = auth.uid()) AND role = 'admin'))
  OR auth.uid() = auth_user_id 
  OR auth.uid() = id
);

-- Step 7: Ensure the database schema matches our updated structure
-- Make sure all required columns exist with correct constraints
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS semester TEXT DEFAULT 'Semester 1',
ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2024';

-- Update any null values
UPDATE classes SET 
  subject = COALESCE(subject, ''),
  semester = COALESCE(semester, 'Semester 1'),
  academic_year = COALESCE(academic_year, '2024');

-- Make them NOT NULL after setting defaults
ALTER TABLE classes 
ALTER COLUMN subject SET NOT NULL,
ALTER COLUMN semester SET NOT NULL,
ALTER COLUMN academic_year SET NOT NULL;

-- Step 8: Verify table structure is correct
 