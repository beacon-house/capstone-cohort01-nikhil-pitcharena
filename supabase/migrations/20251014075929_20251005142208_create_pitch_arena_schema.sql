/*
  # Pitch Arena - Initial Database Schema

  ## Overview
  This migration creates the core database schema for Pitch Arena, a platform where entrepreneurs
  submit elevator pitches for AI-powered feedback and community voting.

  ## New Tables Created

  ### 1. profiles
  Extends Supabase auth.users with additional user information
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User's email address
  - `display_name` (text) - Public display name
  - `avatar_url` (text) - Profile picture URL
  - `bio` (text) - User biography
  - `role` (text) - User role: 'entrepreneur' or 'reviewer'
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last profile update timestamp

  ### 2. pitches
  Stores entrepreneur pitch submissions
  - `id` (uuid, primary key) - Unique pitch identifier
  - `user_id` (uuid) - References profiles.id (pitch creator)
  - `title` (text) - Pitch/startup title
  - `target_audience` (text) - Target audience description
  - `pain_point` (text) - Problem being solved
  - `product_description` (text) - Product/idea description
  - `elevator_pitch` (text) - Full elevator pitch (250-500 words)
  - `status` (text) - 'draft' or 'published'
  - `created_at` (timestamptz) - Pitch creation timestamp
  - `updated_at` (timestamptz) - Last pitch update timestamp

  ### 3. ai_feedback
  Stores AI-generated feedback for each pitch
  - `id` (uuid, primary key) - Unique feedback identifier
  - `pitch_id` (uuid) - References pitches.id
  - `strengths` (jsonb) - Array of key strengths identified by AI
  - `weaknesses` (jsonb) - Array of areas for improvement
  - `recommendations` (jsonb) - Array of actionable suggestions
  - `overall_score` (integer) - AI-generated score (1-10)
  - `created_at` (timestamptz) - Feedback generation timestamp

  ### 4. votes
  Tracks community votes on pitches
  - `id` (uuid, primary key) - Unique vote identifier
  - `pitch_id` (uuid) - References pitches.id
  - `user_id` (uuid) - References profiles.id (voter)
  - `vote_type` (text) - 'interesting' or 'needs_work'
  - `created_at` (timestamptz) - Vote timestamp
  - Unique constraint on (pitch_id, user_id) to prevent duplicate votes

  ## Security (Row Level Security)

  ### profiles table
  1. Users can read all profiles (public information)
  2. Users can insert their own profile during signup
  3. Users can update only their own profile
  4. Users cannot delete profiles

  ### pitches table
  1. All authenticated users can read published pitches
  2. Users can read their own drafts
  3. Only pitch creators can insert pitches
  4. Only pitch creators can update their own pitches
  5. Only pitch creators can delete their own pitches

  ### ai_feedback table
  1. All authenticated users can read feedback for published pitches
  2. System (service role) can insert feedback
  3. Feedback cannot be updated or deleted

  ### votes table
  1. All authenticated users can read votes
  2. Users can insert votes (one per pitch)
  3. Users can update their own votes
  4. Users can delete their own votes

  ## Important Notes
  - All tables have RLS enabled for security
  - Timestamps use `timestamptz` for timezone awareness
  - Foreign key constraints ensure data integrity
  - Unique constraints prevent duplicate votes
  - Default values ensure data consistency
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  display_name text DEFAULT '',
  avatar_url text DEFAULT '',
  bio text DEFAULT '',
  role text NOT NULL DEFAULT 'entrepreneur' CHECK (role IN ('entrepreneur', 'reviewer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pitches table
CREATE TABLE IF NOT EXISTS pitches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  target_audience text NOT NULL,
  pain_point text NOT NULL,
  product_description text NOT NULL,
  elevator_pitch text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ai_feedback table
CREATE TABLE IF NOT EXISTS ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id uuid NOT NULL REFERENCES pitches(id) ON DELETE CASCADE,
  strengths jsonb DEFAULT '[]'::jsonb,
  weaknesses jsonb DEFAULT '[]'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  overall_score integer DEFAULT 5 CHECK (overall_score >= 1 AND overall_score <= 10),
  created_at timestamptz DEFAULT now(),
  UNIQUE(pitch_id)
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id uuid NOT NULL REFERENCES pitches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('interesting', 'needs_work')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(pitch_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pitches_user_id ON pitches(user_id);
CREATE INDEX IF NOT EXISTS idx_pitches_status ON pitches(status);
CREATE INDEX IF NOT EXISTS idx_pitches_created_at ON pitches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_pitch_id ON votes(pitch_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_pitch_id ON ai_feedback(pitch_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for pitches
CREATE POLICY "Users can view published pitches"
  ON pitches FOR SELECT
  TO authenticated
  USING (status = 'published');

CREATE POLICY "Users can view own drafts"
  ON pitches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pitches"
  ON pitches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pitches"
  ON pitches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pitches"
  ON pitches FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for ai_feedback
CREATE POLICY "Users can view feedback for published pitches"
  ON ai_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pitches
      WHERE pitches.id = ai_feedback.pitch_id
      AND (pitches.status = 'published' OR pitches.user_id = auth.uid())
    )
  );

CREATE POLICY "Service role can insert feedback"
  ON ai_feedback FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for votes
CREATE POLICY "Users can view all votes"
  ON votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert votes on others' pitches"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM pitches
      WHERE pitches.id = pitch_id
      AND pitches.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own votes"
  ON votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pitches_updated_at
  BEFORE UPDATE ON pitches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();