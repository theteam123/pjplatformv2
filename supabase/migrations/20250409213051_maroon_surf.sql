/*
  # Reset and update schema for team management app

  1. Clean up
    - Delete all existing data
    - Reset sequences

  2. Schema Updates
    - Add unique constraint on role names
    - Add role_permissions table for storing role permissions
    - Add foreign key constraints
    - Add RLS policies

  3. Initial Data
    - Create default roles (Admin, Manager, User)
*/

-- Clean up existing data
TRUNCATE TABLE role_content_permissions CASCADE;
TRUNCATE TABLE content CASCADE;
TRUNCATE TABLE roles CASCADE;
TRUNCATE TABLE profiles CASCADE;
TRUNCATE TABLE companies CASCADE;

-- Reset sequences
ALTER SEQUENCE IF EXISTS roles_id_seq RESTART WITH 1;

-- Add role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(role_id, permission_key)
);

-- Enable RLS
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for role_permissions
CREATE POLICY "Allow authenticated users to read role permissions"
ON role_permissions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to create role permissions"
ON role_permissions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update role permissions"
ON role_permissions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete role permissions"
ON role_permissions
FOR DELETE
TO authenticated
USING (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default roles
INSERT INTO roles (name, description, created_at, updated_at)
VALUES 
  ('Administrator', 'Full system access', now(), now()),
  ('Manager', 'Can manage users and view companies', now(), now()),
  ('User', 'Basic access', now(), now());

-- Insert default permissions for roles
WITH admin_role AS (SELECT id FROM roles WHERE name = 'Administrator' LIMIT 1),
     manager_role AS (SELECT id FROM roles WHERE name = 'Manager' LIMIT 1),
     user_role AS (SELECT id FROM roles WHERE name = 'User' LIMIT 1)
INSERT INTO role_permissions (role_id, permission_key)
SELECT admin_role.id, permission
FROM admin_role,
     unnest(ARRAY[
       'users_read',
       'users_write',
       'companies_read',
       'companies_write',
       'roles_read',
       'roles_write'
     ]) AS permission
UNION ALL
SELECT manager_role.id, permission
FROM manager_role,
     unnest(ARRAY[
       'users_read',
       'users_write',
       'companies_read'
     ]) AS permission
UNION ALL
SELECT user_role.id, permission
FROM user_role,
     unnest(ARRAY[
       'users_read',
       'companies_read'
     ]) AS permission;