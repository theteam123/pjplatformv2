/*
  # Display Users Data Query

  This query joins the profiles table with companies to display:
  - User's full name
  - Avatar URL
  - Company name
  - Role
  - Creation date
*/

-- Basic query to display all user data
SELECT 
  p.id,
  p.full_name,
  p.avatar_url,
  p.role,
  c.name as company_name,
  p.created_at,
  p.updated_at
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
ORDER BY p.created_at DESC;

-- Query with additional filters and search capabilities
CREATE OR REPLACE FUNCTION search_users(
  search_query TEXT DEFAULT NULL,
  company_id UUID DEFAULT NULL
) 
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.role,
    c.name as company_name,
    p.created_at,
    p.updated_at
  FROM profiles p
  LEFT JOIN companies c ON p.company_id = c.id
  WHERE 
    (search_query IS NULL OR 
     p.full_name ILIKE '%' || search_query || '%' OR
     p.role ILIKE '%' || search_query || '%' OR
     c.name ILIKE '%' || search_query || '%')
    AND
    (company_id IS NULL OR p.company_id = company_id)
  ORDER BY p.created_at DESC;
END;
$$;