/*
  # Add RLS policies for profiles table

  1. Security Changes
    - Enable RLS on profiles table
    - Add policies for authenticated users to:
      - Read all profiles
      - Create new profiles
      - Update profiles
      - Delete profiles

  2. Notes
    - All authenticated users can manage profiles
    - Policies allow full CRUD operations
*/

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to create profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to delete profiles" ON profiles;

-- Create new policies
CREATE POLICY "Allow authenticated users to read profiles"
ON profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to create profiles"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete profiles"
ON profiles
FOR DELETE
TO authenticated
USING (true);