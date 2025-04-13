/*
  # Populate Sample Data for Roles and Content

  1. Content Data
    - Add sample content items with various categories
    - Include role permissions and settings
    - Add search terms and company associations

  Note: Initial roles were already created in the previous migration
*/

-- Sample content data
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
),
(
  'Project Template',
  'Standard project documentation template',
  'Templates',
  ARRAY[]::uuid[],
  ARRAY['project', 'template', 'documentation'],
  jsonb_build_object(
    'Administrator', jsonb_build_object('view', true, 'edit', true),
    'Manager', jsonb_build_object('view', true, 'edit', true),
    'User', jsonb_build_object('view', true, 'edit', false)
  ),
  jsonb_build_object(
    'allowAttachments', true,
    'requireApproval', false,
    'notifyOnSubmission', false
  )
),
(
  'Monthly Sales Report',
  'Monthly sales performance analysis',
  'Reports',
  ARRAY[]::uuid[],
  ARRAY['sales', 'report', 'monthly', 'performance'],
  jsonb_build_object(
    'Administrator', jsonb_build_object('view', true, 'edit', true),
    'Manager', jsonb_build_object('view', true, 'edit', false),
    'User', jsonb_build_object('view', false, 'edit', false)
  ),
  jsonb_build_object(
    'allowAttachments', true,
    'requireApproval', true,
    'notifyOnSubmission', true
  )
);