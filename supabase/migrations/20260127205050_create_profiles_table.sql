/*
  # Create User Profiles Table

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text, required) - User's display name
      - `created_at` (timestamptz) - When profile was created
  
  2. Security
    - Enable RLS on `profiles` table
    - Allow authenticated users to read all profiles (for displaying voter names)
    - Allow users to insert their own profile during signup
    - Allow users to update their own profile
    - Users cannot delete profiles
  
  3. Notes
    - The profile is created when a user signs up
    - The name is used when voting instead of asking for it
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all profiles (needed to display voter names)
CREATE POLICY "Authenticated users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to insert their own profile during signup
CREATE POLICY "Users can create their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
