/*
  # Flush users except Paul

  1. Changes
    - Delete all users except paul+test@theteam.net.au
    - Delete associated profiles
    - Reset sequences
    
  2. Data Preservation
    - Preserve Paul's user account and profile
    - Maintain referential integrity
*/

-- Delete all profiles except Paul's
DELETE FROM public.profiles
WHERE id != '163057c9-3742-4eae-85e6-987fa152cd99';

-- Delete all auth users except Paul
DELETE FROM auth.users
WHERE id != '163057c9-3742-4eae-85e6-987fa152cd99';

-- Reset sequences if they exist
ALTER SEQUENCE IF EXISTS auth.users_id_seq RESTART WITH 1;