# Database Setup Instructions

## Apply Schema Updates for Class Codes and Quiz Result Visibility

To complete the implementation of the new features, you need to apply the database schema updates.

### Option 1: Using Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**

   - Go to your Supabase project dashboard
   - Navigate to the "SQL Editor" section

2. **Apply the Schema Updates**

   - Copy the contents of the `apply-updates.sql` file
   - Paste it into a new query in the SQL Editor
   - Click "RUN" to execute the SQL

3. **Verify Success**
   - You should see a success message indicating the schema was updated
   - The verification query at the end will show:
     - Number of classes with codes
     - Confirmation that the quiz result field exists

### Option 2: Using Supabase CLI (Alternative)

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project (replace with your project reference)
supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
supabase db push
```

### What These Updates Do

1. **Quiz Result Visibility**

   - Adds `show_results_to_students` column to `quizzes` table
   - Default value: `true` (students can see results)
   - Admins can toggle this when creating quizzes

2. **Class Code System**
   - Ensures all classes have unique 6-character codes
   - Auto-generates codes for new classes
   - Updates existing classes without codes
   - Adds performance index for faster lookups

### After Applying Updates

1. **Test Quiz Creation**

   - Go to `/admin/quizzes/new`
   - You should see the "Student Result Visibility" toggle

2. **Test Class Codes**

   - Go to `/admin/classes`
   - You should see class codes displayed with copy functionality

3. **Test Student Features**
   - Students can join classes with codes
   - Students automatically see all quizzes from enrolled classes
   - Result visibility respects admin settings

### Troubleshooting

If you encounter errors:

1. **Permission Errors**: Ensure you have admin access to your Supabase project
2. **Column Already Exists**: The script handles this gracefully - you can run it multiple times
3. **RLS Errors**: The updates respect existing Row Level Security policies

### Development Server

Make sure your development server is running:

```bash
npm run dev
```

The application should now be fully functional with both new features enabled!
