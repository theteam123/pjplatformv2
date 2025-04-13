/*
  # Create Roles and Content Tables

  1. New Tables
    - `roles`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `content`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `category` (text)
      - `company_ids` (uuid array)
      - `search_terms` (text array)
      - `role_permissions` (jsonb)
      - `settings` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read roles
    - Add policies for authenticated users to read/write content
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on roles
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Create policy for reading roles
CREATE POLICY "Allow authenticated users to read roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Create content table
CREATE TABLE IF NOT EXISTS content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  company_ids uuid[] DEFAULT '{}',
  search_terms text[] DEFAULT '{}',
  role_permissions jsonb NOT NULL DEFAULT '{}',
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on content
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Create policies for content
CREATE POLICY "Allow authenticated users to read content"
  ON content
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert content"
  ON content
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update content"
  ON content
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete content"
  ON content
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at
  BEFORE UPDATE ON content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial roles
INSERT INTO roles (name, description) VALUES
  ('Administrator', 'Full system access'),
  ('Manager', 'Can manage users and view companies'),
  ('User', 'Basic access')
ON CONFLICT (name) DO NOTHING;