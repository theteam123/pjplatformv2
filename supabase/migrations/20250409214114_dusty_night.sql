/*
  # Populate User Profiles

  1. Updates
    - Create profiles for existing users
    - Associate users with companies
    - Assign appropriate roles
    - Set avatar URLs using Unsplash
  
  2. Data Integrity
    - Maintains referential integrity with auth.users
    - Links to existing companies
    - Uses valid role names
*/

-- Create profiles for existing users
INSERT INTO profiles (id, full_name, avatar_url, company_id, role, created_at, updated_at)
VALUES
  -- Alice (Developer at TechCorp)
  (
    '79974502-c04d-419f-a99b-149278790279',
    'Alice Johnson',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    '11111111-1111-1111-1111-111111111111',
    'User',
    now(),
    now()
  ),
  -- Bob (Designer at Design Studio)
  (
    '25a49218-154e-4927-a986-84520a71854a',
    'Bob Anderson',
    'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    '22222222-2222-2222-2222-222222222222',
    'Manager',
    now(),
    now()
  ),
  -- Carol (Manager at Innovate Labs)
  (
    '69699991-0191-4061-986f-596e44292269',
    'Carol Martinez',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    '33333333-3333-3333-3333-333333333333',
    'Manager',
    now(),
    now()
  ),
  -- David (Administrator at TechCorp)
  (
    '44444444-4444-4444-4444-444444444444',
    'David Wilson',
    'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    '11111111-1111-1111-1111-111111111111',
    'Administrator',
    now(),
    now()
  ),
  -- Paul (System Administrator)
  (
    '163057c9-3742-4eae-85e6-987fa152cd99',
    'Paul Admin',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    null,
    'Administrator',
    now(),
    now()
  )
ON CONFLICT (id) DO UPDATE 
SET 
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  company_id = EXCLUDED.company_id,
  role = EXCLUDED.role,
  updated_at = now();