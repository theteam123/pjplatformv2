/*
  # Seed Database with Sample Data

  1. Sample Data
    - Companies with realistic business data
    - Content items with proper company associations
    - Users and their profiles with valid company assignments
    - Role-content permissions with proper relationships

  2. Data Integrity
    - All foreign key relationships are maintained
    - Users created before profiles
    - Proper UUID array handling for company_ids
    - No orphaned records
*/

-- Insert sample companies
INSERT INTO companies (id, name, website, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'TechCorp Solutions', 'https://techcorp.example.com', now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'Design Studio Pro', 'https://designstudio.example.com', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'Innovate Labs', 'https://innovatelabs.example.com', now(), now());

-- Insert sample content
INSERT INTO content (id, name, description, category, company_ids, search_terms, settings, created_at, updated_at)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Employee Handbook',
    'Company policies and procedures',
    'Documents',
    ARRAY[
      '11111111-1111-1111-1111-111111111111'::uuid,
      '22222222-2222-2222-2222-222222222222'::uuid
    ],
    ARRAY['policies', 'handbook', 'procedures'],
    '{"allowAttachments": true, "requireApproval": true, "notifyOnSubmission": true}'::jsonb,
    now(),
    now()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Project Templates',
    'Standard project management templates',
    'Templates',
    ARRAY['11111111-1111-1111-1111-111111111111'::uuid],
    ARRAY['project', 'template', 'management'],
    '{"allowAttachments": true, "requireApproval": false, "notifyOnSubmission": false}'::jsonb,
    now(),
    now()
  );

-- Create users in auth.users table first
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'john.smith@example.com',
    now(),
    now(),
    now()
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'jane.doe@example.com',
    now(),
    now(),
    now()
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'bob.wilson@example.com',
    now(),
    now(),
    now()
  );

-- Now insert profiles with valid user associations
INSERT INTO profiles (id, full_name, avatar_url, company_id, role, created_at, updated_at)
VALUES
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'John Smith',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    '11111111-1111-1111-1111-111111111111',
    'Administrator',
    now(),
    now()
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Jane Doe',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    '22222222-2222-2222-2222-222222222222',
    'Manager',
    now(),
    now()
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'Bob Wilson',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    '33333333-3333-3333-3333-333333333333',
    'User',
    now(),
    now()
  );

-- Insert sample role-content permissions
INSERT INTO role_content_permissions (role_id, content_id, can_view, can_edit, created_at, updated_at)
SELECT 
  r.id as role_id,
  c.id as content_id,
  CASE 
    WHEN r.name = 'Administrator' THEN true
    WHEN r.name = 'Manager' THEN true
    ELSE false
  END as can_view,
  CASE 
    WHEN r.name = 'Administrator' THEN true
    ELSE false
  END as can_edit,
  now() as created_at,
  now() as updated_at
FROM roles r
CROSS JOIN content c;