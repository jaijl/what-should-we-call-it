/*
  # Create Naming Polls Schema

  1. New Tables
    - `polls`
      - `id` (uuid, primary key)
      - `title` (text) - The question being asked (e.g., "New internal tool name")
      - `created_at` (timestamptz) - When the poll was created
    
    - `options`
      - `id` (uuid, primary key)
      - `poll_id` (uuid, foreign key) - References the poll
      - `name` (text) - The option name (e.g., "Atlas", "Beacon")
      - `created_at` (timestamptz)
    
    - `votes`
      - `id` (uuid, primary key)
      - `poll_id` (uuid, foreign key) - References the poll
      - `option_id` (uuid, foreign key) - References the option voted for
      - `voter_name` (text, nullable) - Optional voter name for visible votes
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Allow anyone to read polls, options, and votes (public voting app)
    - Allow anyone to create polls, options, and votes
    - This is designed as a team tool where all members can participate
*/

CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES options(id) ON DELETE CASCADE,
  voter_name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view polls"
  ON polls FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create polls"
  ON polls FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view options"
  ON options FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create options"
  ON options FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view votes"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create votes"
  ON votes FOR INSERT
  WITH CHECK (true);