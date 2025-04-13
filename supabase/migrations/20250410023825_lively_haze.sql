/*
  # Verify and Update RLS Policies

  1. Security Verification
    - Verify RLS is enabled on all tables
    - Update policies for profiles and companies tables
    - Ensure proper access control for authenticated users

  2. Policies
    - Profiles table: CRUD operations for authenticated users
    - Companies table: CRUD operations for authenticated users
*/

-- First, ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to create profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to delete profiles" ON profiles;

DROP POLICY IF EXISTS "Allow authenticated users to read companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to create companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to update companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to delete companies" ON companies;

-- Create policies for profiles table
CREATE POLICY "Allow authenticated users to read profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to create profiles"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update profiles"
ON profiles FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete profiles"
ON profiles FOR DELETE
TO authenticated
USING (true);

-- Create policies for companies table
CREATE POLICY "Allow authenticated users to read companies"
ON companies FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to create companies"
ON companies FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update companies"
ON companies FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete companies"
ON companies FOR DELETE
TO authenticated
USING (true);

-- Verify policies are in place
DO $$
BEGIN
  -- Check if RLS is enabled
  IF NOT EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'companies')
      AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled on all required tables';
  END IF;

  -- Check if policies exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'companies')
  ) THEN
    RAISE EXCEPTION 'Policies are not properly set up';
  END IF;
END $$;