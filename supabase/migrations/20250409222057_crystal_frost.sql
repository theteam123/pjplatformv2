/*
  # Add URL field to content table

  1. Changes
    - Add url column to content table
    - Make it nullable
    - Update existing content to have null URLs
*/

-- Add url column to content table
ALTER TABLE content
ADD COLUMN IF NOT EXISTS url text;

-- Update existing content to have null URLs
UPDATE content SET url = NULL WHERE url IS NULL;