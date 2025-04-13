/*
  # Flush Companies Table

  1. Changes
    - Delete all data from companies table
    - Reset any sequences
    - Keep table structure intact
    - Maintain RLS policies and triggers

  2. Security
    - Maintain existing RLS policies
    - Keep foreign key constraints
*/

-- Delete all data from companies table
TRUNCATE TABLE companies CASCADE;

-- Reset the sequence if it exists
ALTER SEQUENCE IF EXISTS companies_id_seq RESTART WITH 1;