/*
  # Improve role permissions structure
  
  1. Changes
    - Create role_content_permissions table for many-to-many relationship
    - Remove role_permissions from content table
    - Add appropriate indexes and constraints
    - Update RLS policies
  
  2. Security
    - Enable RLS on role_content_permissions table
    - Add policies for authenticated users
*/

-- Create role_content_permissions table
CREATE TABLE role_content_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  can_view boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(role_id, content_id)
);

-- Create indexes
CREATE INDEX idx_role_content_permissions_role_id ON role_content_permissions(role_id);
CREATE INDEX idx_role_content_permissions_content_id ON role_content_permissions(content_id);

-- Enable RLS
ALTER TABLE role_content_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read role permissions"
  ON role_content_permissions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage role permissions"
  ON role_content_permissions FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_role_content_permissions_updated_at
  BEFORE UPDATE ON role_content_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create temporary backup of content table
CREATE TEMP TABLE content_backup AS SELECT * FROM content;

-- Remove role_permissions from content table
ALTER TABLE content DROP COLUMN role_permissions;

-- Migrate existing permissions
DO $$
DECLARE
  content_record RECORD;
  role_record RECORD;
  permission_value jsonb;
BEGIN
  FOR content_record IN SELECT * FROM content_backup LOOP
    FOR role_record IN SELECT * FROM roles LOOP
      permission_value := content_record.role_permissions->role_record.name;
      IF permission_value IS NOT NULL THEN
        INSERT INTO role_content_permissions (
          role_id,
          content_id,
          can_view,
          can_edit
        ) VALUES (
          role_record.id,
          content_record.id,
          (permission_value->>'view')::boolean,
          (permission_value->>'edit')::boolean
        );
      END IF;
    END LOOP;
  END LOOP;
END
$$;