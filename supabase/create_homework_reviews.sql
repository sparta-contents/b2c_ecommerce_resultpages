-- Create homework_reviews table for tracking student assignment pass/fail status
-- Only admins can create, update, delete, and view reviews

-- Create the table
CREATE TABLE IF NOT EXISTS homework_reviews (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week VARCHAR NOT NULL CHECK (week IN ('1주차 과제', '2주차 과제', '3주차 과제', '4주차 과제', '5주차 과제', '6주차 과제')),
  status VARCHAR NOT NULL CHECK (status IN ('passed', 'failed')),
  reviewer_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week)  -- One review per student per week
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_homework_reviews_user_week ON homework_reviews(user_id, week);
CREATE INDEX IF NOT EXISTS idx_homework_reviews_week ON homework_reviews(week);
CREATE INDEX IF NOT EXISTS idx_homework_reviews_status ON homework_reviews(status);

-- Enable Row Level Security
ALTER TABLE homework_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can SELECT
CREATE POLICY "Admins can view all homework reviews"
  ON homework_reviews
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policy: Only admins can INSERT
CREATE POLICY "Admins can create homework reviews"
  ON homework_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policy: Only admins can UPDATE
CREATE POLICY "Admins can update homework reviews"
  ON homework_reviews
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policy: Only admins can DELETE
CREATE POLICY "Admins can delete homework reviews"
  ON homework_reviews
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_homework_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_homework_reviews_timestamp
  BEFORE UPDATE ON homework_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_homework_reviews_updated_at();

-- Grant permissions
GRANT ALL ON homework_reviews TO authenticated;
