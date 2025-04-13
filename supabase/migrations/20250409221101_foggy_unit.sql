/*
  # Fix Paul's User Role and Profile

  1. Changes
    - Update Paul's role in auth.users
    - Ensure profile exists with correct data
    - Add proper role permissions

  2. Security
    - Maintain existing RLS policies
*/

-- Update Paul's role in auth.users
UPDATE auth.users 
SET role = 'authenticated'
WHERE id = '163057c9-3742-4eae-85e6-987fa152cd99';

-- Ensure Paul's profile exists with correct data
INSERT INTO public.profiles (
  id,
  full_name,
  avatar_url,
  role,
  created_at,
  updated_at
) VALUES (
  '163057c9-3742-4eae-85e6-987fa152cd99',
  'Paul Admin',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  'Administrator',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE 
SET 
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  role = EXCLUDED.role,
  updated_at = now();

-- Add role permissions for Administrator role
INSERT INTO public.role_permissions (role_id, permission_key)
SELECT r.id, p.permission_key
FROM (SELECT id FROM public.roles WHERE name = 'Administrator' LIMIT 1) r
CROSS JOIN (
  VALUES 
    ('users_read'),
    ('users_write'),
    ('companies_read'),
    ('companies_write'),
    ('roles_read'),
    ('roles_write')
) AS p(permission_key)
ON CONFLICT (role_id, permission_key) DO NOTHING;