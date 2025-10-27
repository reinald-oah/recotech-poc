/*
  # Add admin policies for anonymous access

  1. Changes
    - Add SELECT policy for recommendations allowing anonymous access (for admin dashboard)
    - Add SELECT policy for team_members allowing anonymous access (for admin dashboard)
    - Add DELETE policy for recommendations allowing anonymous access (for admin dashboard)
    - Add UPDATE policy for team_members allowing anonymous access (for admin dashboard)
  
  2. Security Notes
    - These policies allow anonymous access which should be protected at the application level
    - In production, consider using Edge Functions with service role key instead
*/

-- Allow anonymous users to view recommendations (for admin dashboard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'recommendations' 
    AND policyname = 'Allow anonymous to view recommendations'
  ) THEN
    CREATE POLICY "Allow anonymous to view recommendations"
      ON recommendations
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

-- Allow anonymous users to delete recommendations (for admin dashboard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'recommendations' 
    AND policyname = 'Allow anonymous to delete recommendations'
  ) THEN
    CREATE POLICY "Allow anonymous to delete recommendations"
      ON recommendations
      FOR DELETE
      TO anon
      USING (true);
  END IF;
END $$;

-- Allow anonymous users to view team members (for admin dashboard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'team_members' 
    AND policyname = 'Allow anonymous to view team members'
  ) THEN
    CREATE POLICY "Allow anonymous to view team members"
      ON team_members
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

-- Allow anonymous users to update team members (for admin dashboard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'team_members' 
    AND policyname = 'Allow anonymous to update team members'
  ) THEN
    CREATE POLICY "Allow anonymous to update team members"
      ON team_members
      FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
