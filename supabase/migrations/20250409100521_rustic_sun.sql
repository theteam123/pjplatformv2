/*
  # Content and Roles Schema Implementation

  1. New Tables
    - `roles`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `content`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, nullable)
      - `category` (text)
      - `company_ids` (uuid[])
      - `search_terms` (text[])
      - `role_permissions` (jsonb)
      - `settings` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Indexes
    - `idx_content_category` on content(category)
    - `idx_content_created_at` on content(created_at DESC)
    - `idx_roles_name` on roles(name)

  3. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
    - Add trigger for company_ids validation

  4. Sample Data
    - Insert initial roles
    - Insert sample content items
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS content;
DROP TABLE IF EXISTS roles;

-- Create roles table
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create content table
CREATE TABLE content (
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

-- Create indexes
CREATE INDEX idx_content_category ON content(category);
CREATE INDEX idx_content_created_at ON content(created_at DESC);
CREATE INDEX idx_roles_name ON roles(name);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for roles
CREATE POLICY "Allow authenticated users to read roles"
  ON roles FOR SELECT TO authenticated
  USING (true);

-- Create RLS policies for content
CREATE POLICY "Allow authenticated users to read content"
  ON content FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert content"
  ON content FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update content"
  ON content FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete content"
  ON content FOR DELETE TO authenticated
  USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create company_ids validation function
CREATE OR REPLACE FUNCTION validate_company_ids()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_ids IS NOT NULL AND array_length(NEW.company_ids, 1) > 0 THEN
    IF EXISTS (
      SELECT 1
      FROM unnest(NEW.company_ids) AS company_id
      LEFT JOIN companies ON companies.id = company_id
      WHERE companies.id IS NULL
    ) THEN
      RAISE EXCEPTION 'Invalid company_id found in company_ids array';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at
  BEFORE UPDATE ON content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER validate_company_ids_trigger
  BEFORE INSERT OR UPDATE ON content
  FOR EACH ROW
  EXECUTE FUNCTION validate_company_ids();

-- Insert initial roles
INSERT INTO roles (name, description) VALUES
  ('Administrator', 'Full system access'),
  ('Manager', 'Can manage users and view companies'),
  ('User', 'Basic access')
ON CONFLICT (name) DO NOTHING;

-- Insert sample content
INSERT INTO content (
  name,
  description,
  category,
  company_ids,
  search_terms,
  role_permissions,
  settings
) VALUES
(
  'Expense Report',
  'Submit expense reports for reimbursement',
  'Forms',
  ARRAY[]::uuid[],
  ARRAY['expense', 'finance', 'reimbursement'],
  jsonb_build_object(
    'Administrator', jsonb_build_object('view', true, 'edit', true),
    'Manager', jsonb_build_object('view', true, 'edit', true),
    'User', jsonb_build_object('view', true, 'edit', false)
  ),
  jsonb_build_object(
    'allowAttachments', true,
    'requireApproval', true,
    'notifyOnSubmission', true
  )
),
(
  'Leave Request',
  'Request time off or leave of absence',
  'Forms',
  ARRAY[]::uuid[],
  ARRAY['leave', 'vacation', 'time-off'],
  jsonb_build_object(
    'Administrator', jsonb_build_object('view', true, 'edit', true),
    'Manager', jsonb_build_object('view', true, 'edit', true),
    'User', jsonb_build_object('view', true, 'edit', false)
  ),
  jsonb_build_object(
    'allowAttachments', false,
    'requireApproval', true,
    'notifyOnSubmission', true
  )
),
(
  'Employee Handbook',
  'Company policies and procedures',
  'Policies',
  ARRAY[]::uuid[],
  ARRAY['policies', 'handbook', 'rules'],
  jsonb_build_object(
    'Administrator', jsonb_build_object('view', true, 'edit', true),
    'Manager', jsonb_build_object('view', true, 'edit', false),
    'User', jsonb_build_object('view', true, 'edit', false)
  ),
  jsonb_build_object(
    'allowAttachments', true,
    'requireApproval', false,
    'notifyOnSubmission', false
  )
);