/*
  # Centralize Role Management

  1. Changes
    - Create user_roles table for many-to-many relationship between users and roles
    - Remove role column from profiles table
    - Add appropriate indexes and constraints
    - Migrate existing role data to new structure
    - Update RLS policies

  2. Security
    - Enable RLS on user_roles table
    - Add policies for authenticated users
    - Maintain data integrity during migration
*/

-- Create user_roles table
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Create indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read user roles"
  ON user_roles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage user roles"
  ON user_roles FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing role data
INSERT INTO user_roles (user_id, role_id)
SELECT 
  p.id as user_id,
  r.id as role_id
FROM profiles p
CROSS JOIN roles r
WHERE p.role = r.name;

-- Remove role column from profiles
ALTER TABLE profiles DROP COLUMN role;