/*
  # Add sample data for companies and profiles

  1. Sample Data
    - Create sample users in auth.users
    - Insert sample companies
    - Insert sample profiles linked to the users
    
  2. Data Structure
    - Companies:
      - Tech Corp
      - Design Studio
      - Startup Inc
    
    - Users/Profiles:
      - Alice Johnson (Product Manager at Tech Corp)
      - Bob Smith (Senior Developer at Tech Corp)
      - Carol Williams (UX Designer at Design Studio)
      - David Brown (Marketing Lead, no company)
*/

-- First, create users in auth.users
INSERT INTO auth.users (id, email)
VALUES 
  ('79974502-c04d-419f-a99b-149278790279', 'alice@example.com'),
  ('25a49218-154e-4927-a986-84520a71854a', 'bob@example.com'),
  ('69699991-0191-4061-986f-596e44292269', 'carol@example.com'),
  ('44444444-4444-4444-4444-444444444444', 'david@example.com')
ON CONFLICT (id) DO NOTHING;

-- Insert sample companies
DO $$
DECLARE
  tech_corp_id UUID := gen_random_uuid();
  design_studio_id UUID := gen_random_uuid();
  startup_inc_id UUID := gen_random_uuid();
BEGIN
  -- Insert companies
  INSERT INTO public.companies (id, name, website, created_at)
  VALUES
    (tech_corp_id, 'Tech Corp', 'https://techcorp.example.com', '2024-03-01T00:00:00Z'),
    (design_studio_id, 'Design Studio', 'https://designstudio.example.com', '2024-03-02T00:00:00Z'),
    (startup_inc_id, 'Startup Inc', NULL, '2024-03-03T00:00:00Z')
  ON CONFLICT (id) DO NOTHING;

  -- Insert profiles with existing user IDs
  INSERT INTO public.profiles (id, full_name, avatar_url, company_id, role, created_at)
  VALUES
    (
      '79974502-c04d-419f-a99b-149278790279',
      'Alice Johnson',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      tech_corp_id,
      'Product Manager',
      '2024-03-01T00:00:00Z'
    ),
    (
      '25a49218-154e-4927-a986-84520a71854a',
      'Bob Smith',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      tech_corp_id,
      'Senior Developer',
      '2024-03-01T00:00:00Z'
    ),
    (
      '69699991-0191-4061-986f-596e44292269',
      'Carol Williams',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      design_studio_id,
      'UX Designer',
      '2024-03-02T00:00:00Z'
    ),
    (
      '44444444-4444-4444-4444-444444444444',
      'David Brown',
      NULL,
      NULL,
      'Marketing Lead',
      '2024-03-03T00:00:00Z'
    )
  ON CONFLICT (id) DO NOTHING;
END $$;