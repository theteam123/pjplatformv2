/*
  # Fix Roles RLS Policies

  1. Changes
    - Enable RLS on roles table
    - Add policies for CRUD operations on roles table
    - Add policies for role management
  
  2. Security
    - Enable RLS on roles table
    - Add policies for authenticated users to:
      - Read all roles
      - Create new roles
      - Update existing roles
      - Delete roles
*/

-- Enable RLS on roles table if not already enabled
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to read roles" ON roles;
DROP POLICY IF EXISTS "Allow authenticated users to create roles" ON roles;
DROP POLICY IF EXISTS "Allow authenticated users to update roles" ON roles;
DROP POLICY IF EXISTS "Allow authenticated users to delete roles" ON roles;

-- Create new policies
CREATE POLICY "Allow authenticated users to read roles"
ON roles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to create roles"
ON roles
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update roles"
ON roles
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete roles"
ON roles
FOR DELETE
TO authenticated
USING (true);