/*
  # Add active field to team_members table

  1. Changes
    - Add `active` boolean column to `team_members` table with default value `true`
    - All existing team members will be set to active by default
  
  2. Security
    - No changes to RLS policies needed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'active'
  ) THEN
    ALTER TABLE team_members ADD COLUMN active boolean DEFAULT true NOT NULL;
  END IF;
END $$;
