/*
  # Set Administrator Role Permissions

  1. Changes
    - Ensure Administrator role has all permissions
    - Add content permissions to available set
    - Clean up any existing permissions first
    - Use proper transaction handling
*/

-- Wrap everything in a transaction
DO $$
DECLARE
  admin_role_id uuid;
  expected_count integer := 8; -- Total number of permissions
  actual_count integer;
BEGIN
  -- Get the Administrator role ID
  SELECT id INTO admin_role_id 
  FROM roles 
  WHERE name = 'Administrator' 
  LIMIT 1;

  IF admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Administrator role not found';
  END IF;

  -- Delete existing permissions for Administrator role
  DELETE FROM role_permissions
  WHERE role_id = admin_role_id;

  -- Insert all permissions for Administrator role
  INSERT INTO role_permissions (role_id, permission_key)
  VALUES
    (admin_role_id, 'users_read'),
    (admin_role_id, 'users_write'),
    (admin_role_id, 'companies_read'),
    (admin_role_id, 'companies_write'),
    (admin_role_id, 'roles_read'),
    (admin_role_id, 'roles_write'),
    (admin_role_id, 'content_read'),
    (admin_role_id, 'content_write');

  -- Verify Administrator has all permissions
  SELECT COUNT(*) INTO actual_count 
  FROM role_permissions 
  WHERE role_id = admin_role_id;

  IF actual_count != expected_count THEN
    RAISE EXCEPTION 'Administrator role does not have all permissions. Expected: %, Got: %', expected_count, actual_count;
  END IF;
END $$;