# Quiz App Setup Guide

## Task 1 Complete ✅

This document outlines the setup steps to get your Quiz App running with Supabase.

## Prerequisites

- Node.js 18+ installed
- A Supabase account ([supabase.com](https://supabase.com))

## 1. Environment Configuration

Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### How to get these values:

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Database Setup

1. In your Supabase project dashboard, go to the SQL Editor
2. Copy the entire contents of `lib/database-schema.sql`
3. Paste it into the SQL Editor and run it
4. This will create all necessary tables, policies, and functions

## 3. Authentication Configuration

1. In Supabase dashboard, go to Authentication → Settings
2. Configure the following:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add your production URL when deploying
   - **Email Templates**: Customize as needed

## 4. Row Level Security (RLS)

The database schema includes comprehensive RLS policies that:

- Allow users to manage their own data
- Allow admins to manage classes, quizzes, and view student data
- Restrict students to only see their enrolled classes and available quizzes

## 5. Run the Application

```bash
npm run dev
```

Your Quiz App will be available at `http://localhost:3000`

## What's Included in Task 1

✅ **Dependencies Installed:**

- Supabase client libraries
- React Hook Form for form handling
- Zod for validation
- React Hot Toast for notifications
- Date-fns for date utilities

✅ **Database Schema:**

- Complete relational database design
- User profiles with role-based access
- Classes and enrollments
- Quizzes with questions and options
- Quiz attempts and student answers
- Row Level Security policies

✅ **Authentication System:**

- Role-based authentication (Admin/Student)
- Server and client-side auth helpers
- Sign up, sign in, password reset functionality
- Protected routes and middleware

✅ **Type Safety:**

- Complete TypeScript types matching the database schema
- Form types and API response types

✅ **Providers Setup:**

- Authentication context provider
- Toast notification provider
- Theme provider (dark/light mode)

## Next Steps

- **Task 2**: Authentication System - Create signup and login pages
- The foundation is now ready for building the user interface and authentication flows

## Troubleshooting

### Common Issues:

1. **Environment variables not loading**: Ensure `.env.local` is in the project root and restart the dev server

2. **Database connection issues**: Verify your Supabase URL and keys are correct

3. **RLS policy errors**: Make sure you've run the complete database schema, including all policies

4. **Build errors**: Ensure all dependencies are installed with `npm install`

### Need Help?

Check the Supabase documentation for additional configuration options:

- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
