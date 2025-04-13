/*
  # Fix content table and add sample data

  This migration ensures the content table is properly set up and populated with sample data.

  1. Changes
    - Drop and recreate content table with correct structure
    - Add proper RLS policies
    - Insert sample content data

  2. Security
    - Enable RLS
    - Add policies for CRUD operations
*/

-- First drop the existing content table if it exists
DROP TABLE IF EXISTS content;

-- Recreate the content table with proper structure
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

-- Enable RLS
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Create policies
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
CREATE TRIGGER update_content_updated_at
  BEFORE UPDATE ON content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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
  ARRAY[(SELECT id FROM companies LIMIT 1)],
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
  ARRAY[(SELECT id FROM companies LIMIT 1)],
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