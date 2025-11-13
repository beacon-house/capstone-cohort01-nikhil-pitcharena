/*
  # Add AI Processing Status to Pitches

  ## Overview
  Adds tracking for AI feedback generation status to provide real-time feedback to users
  about the progress of their pitch analysis.

  ## Changes Made
  
  ### 1. Modified Tables
    - `pitches`
      - Added `ai_processing_status` column (text) - Tracks AI feedback generation state
        - Possible values: 'pending', 'processing', 'completed', 'failed'
        - Default: 'pending'
      - Added `ai_processing_started_at` (timestamptz) - When AI processing began
      - Added `ai_processing_completed_at` (timestamptz) - When AI processing finished
      - Added `ai_processing_error` (text) - Error message if processing failed

  ## Important Notes
  - New status field enables real-time progress tracking for users
  - Timestamps help identify stuck or failed processing attempts
  - Error messages provide debugging information and user feedback
*/

-- Add ai_processing_status column to pitches table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitches' AND column_name = 'ai_processing_status'
  ) THEN
    ALTER TABLE pitches ADD COLUMN ai_processing_status text DEFAULT 'pending' CHECK (ai_processing_status IN ('pending', 'processing', 'completed', 'failed'));
  END IF;
END $$;

-- Add ai_processing_started_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitches' AND column_name = 'ai_processing_started_at'
  ) THEN
    ALTER TABLE pitches ADD COLUMN ai_processing_started_at timestamptz;
  END IF;
END $$;

-- Add ai_processing_completed_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitches' AND column_name = 'ai_processing_completed_at'
  ) THEN
    ALTER TABLE pitches ADD COLUMN ai_processing_completed_at timestamptz;
  END IF;
END $$;

-- Add ai_processing_error column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pitches' AND column_name = 'ai_processing_error'
  ) THEN
    ALTER TABLE pitches ADD COLUMN ai_processing_error text;
  END IF;
END $$;

-- Create index for querying by processing status
CREATE INDEX IF NOT EXISTS idx_pitches_ai_processing_status ON pitches(ai_processing_status);

-- Update existing published pitches that have AI feedback to mark them as completed
UPDATE pitches
SET ai_processing_status = 'completed',
    ai_processing_completed_at = created_at
WHERE status = 'published'
  AND EXISTS (
    SELECT 1 FROM ai_feedback
    WHERE ai_feedback.pitch_id = pitches.id
  )
  AND ai_processing_status = 'pending';

-- Update existing published pitches without AI feedback to mark them as failed (so users can retry)
UPDATE pitches
SET ai_processing_status = 'failed',
    ai_processing_error = 'AI feedback generation was not completed. Please retry.'
WHERE status = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM ai_feedback
    WHERE ai_feedback.pitch_id = pitches.id
  )
  AND ai_processing_status = 'pending';
