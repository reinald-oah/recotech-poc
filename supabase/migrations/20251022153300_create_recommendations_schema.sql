/*
  # Create Recommendations Management Schema

  ## Overview
  This migration creates the database structure for managing client recommendations 
  for a digital agency. It enables teams to create, search, and reuse recommendations 
  with AI-powered suggestions.

  ## New Tables
  
  ### `clients`
  Stores client information for the agency
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Client company name
  - `industry` (text) - Client industry sector
  - `created_at` (timestamptz) - Record creation timestamp
  - `created_by` (uuid) - User who created the client record
  
  ### `recommendations`
  Stores all recommendations created by the team
  - `id` (uuid, primary key) - Unique identifier
  - `client_id` (uuid, foreign key) - Reference to client
  - `title` (text) - Recommendation title/summary
  - `category` (text) - Category (SEO, Social Media, Content, Design, Development, Strategy)
  - `description` (text) - Detailed recommendation content
  - `context` (text) - Context or situation that led to this recommendation
  - `priority` (text) - Priority level (High, Medium, Low)
  - `status` (text) - Status (Draft, Approved, Implemented, Archived)
  - `tags` (text array) - Searchable tags for categorization
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `created_by` (uuid) - User who created the recommendation
  
  ### `team_members`
  Stores team member profiles
  - `id` (uuid, primary key) - Matches auth.users id
  - `email` (text) - Team member email
  - `full_name` (text) - Full name
  - `role` (text) - Role (Admin, Manager, Consultant, Designer, Developer)
  - `created_at` (timestamptz) - Account creation timestamp

  ## Security
  
  Row Level Security (RLS) is enabled on all tables with the following policies:
  
  ### `clients` table
  - Authenticated users can view all clients
  - Authenticated users can insert new clients
  - Authenticated users can update all clients
  - Authenticated users can delete clients they created
  
  ### `recommendations` table
  - Authenticated users can view all recommendations
  - Authenticated users can insert new recommendations
  - Authenticated users can update all recommendations
  - Authenticated users can delete recommendations they created
  
  ### `team_members` table
  - Authenticated users can view all team members
  - Users can insert their own profile
  - Users can update their own profile
  - Users can view their own profile

  ## Important Notes
  
  1. All tables use `gen_random_uuid()` for automatic ID generation
  2. Timestamps are automatically managed with `now()` defaults
  3. The `team_members.id` is designed to match `auth.uid()` for RLS policies
  4. Foreign key constraints ensure data integrity between tables
  5. Categories and priorities use text fields for flexibility
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Strategy',
  description text NOT NULL,
  context text DEFAULT '',
  priority text DEFAULT 'Medium',
  status text DEFAULT 'Draft',
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text DEFAULT 'Consultant',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients table
CREATE POLICY "Authenticated users can view all clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete their own clients"
  ON clients FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for recommendations table
CREATE POLICY "Authenticated users can view all recommendations"
  ON recommendations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create recommendations"
  ON recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update recommendations"
  ON recommendations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete their own recommendations"
  ON recommendations FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for team_members table
CREATE POLICY "Authenticated users can view all team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own profile"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON team_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recommendations_client_id ON recommendations(client_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_category ON recommendations(category);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_tags ON recommendations USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);