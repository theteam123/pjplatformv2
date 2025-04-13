/*
  # Add RLS policies for companies table

  1. Security Changes
    - Add INSERT policy for authenticated users to create companies
    - Add UPDATE policy for authenticated users to update companies
    - Add DELETE policy for authenticated users to delete companies

  Note: These policies allow authenticated users to manage companies. In a production environment, 
  you might want to add more specific conditions based on user roles or company ownership.
*/

-- Allow authenticated users to insert companies
CREATE POLICY "Allow authenticated users to create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update companies
CREATE POLICY "Allow authenticated users to update companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete companies
CREATE POLICY "Allow authenticated users to delete companies"
ON public.companies
FOR DELETE
TO authenticated
USING (true);