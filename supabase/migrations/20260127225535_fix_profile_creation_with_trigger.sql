/*
  # Fix Profile Creation with Trigger

  1. Changes
    - Drop existing insert policy on profiles
    - Create a database trigger to automatically create profile when user signs up
    - This avoids RLS issues during signup flow
  
  2. Security
    - Profiles are created automatically via trigger (bypasses RLS)
    - Users can still read all profiles (for displaying voter names)
    - Users can update their own profile
*/

-- Drop the existing insert policy since we'll use a trigger instead
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', 'User'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();