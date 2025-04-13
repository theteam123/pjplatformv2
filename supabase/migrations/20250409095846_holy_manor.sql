/*
  # Fix schema and add indexes

  1. Changes
    - Add indexes for better query performance
    - Add default values for JSON and array columns
    - Add foreign key reference validation trigger

  2. Security
    - Verify RLS policies are correct
*/

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_category ON content(category);
CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- Ensure proper constraints
ALTER TABLE content 
  ALTER COLUMN role_permissions SET DEFAULT '{}'::jsonb,
  ALTER COLUMN settings SET DEFAULT '{}'::jsonb,
  ALTER COLUMN company_ids SET DEFAULT '{}'::uuid[],
  ALTER COLUMN search_terms SET DEFAULT '{}'::text[];

-- Create a function to validate company_ids
CREATE OR REPLACE FUNCTION validate_company_ids()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM unnest(NEW.company_ids) AS company_id
    LEFT JOIN companies ON companies.id = company_id
    WHERE companies.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Invalid company_id found in company_ids array';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate company_ids
DROP TRIGGER IF EXISTS validate_company_ids_trigger ON content;
CREATE TRIGGER validate_company_ids_trigger
  BEFORE INSERT OR UPDATE ON content
  FOR EACH ROW
  EXECUTE FUNCTION validate_company_ids();

-- Verify RLS policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'content' AND policyname = 'Allow authenticated users to read content'
  ) THEN
    CREATE POLICY "Allow authenticated users to read content"
      ON content FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;