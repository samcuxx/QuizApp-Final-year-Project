-- Add result visibility field to quizzes table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quizzes' AND column_name = 'show_results_to_students') THEN
        ALTER TABLE quizzes ADD COLUMN show_results_to_students BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Update the quizzes table comment
COMMENT ON COLUMN quizzes.show_results_to_students IS 'Whether students can see their quiz results and correct answers';

-- Ensure class_code index exists for performance
CREATE INDEX IF NOT EXISTS idx_classes_class_code ON classes(class_code);

-- Function to generate unique class codes (6 characters)
CREATE OR REPLACE FUNCTION generate_class_code()
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
        
        SELECT EXISTS(SELECT 1 FROM classes WHERE class_code = result) INTO code_exists;
        
        IF NOT code_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate class codes for new classes
CREATE OR REPLACE FUNCTION set_class_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.class_code IS NULL OR NEW.class_code = '' THEN
        NEW.class_code := generate_class_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for class code generation (drop first if exists)
DROP TRIGGER IF EXISTS class_code_trigger ON classes;
CREATE TRIGGER class_code_trigger
    BEFORE INSERT ON classes
    FOR EACH ROW
    EXECUTE FUNCTION set_class_code();

-- Update existing classes without class codes
UPDATE classes 
SET class_code = generate_class_code() 
WHERE class_code IS NULL OR class_code = '';

-- Verification query
SELECT 'Schema updated successfully' as status,
       (SELECT COUNT(*) FROM classes WHERE class_code IS NOT NULL) as classes_with_codes,
       (SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_name = 'quizzes' AND column_name = 'show_results_to_students') as quiz_result_field_exists; 