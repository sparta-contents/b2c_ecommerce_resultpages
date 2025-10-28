-- Create approved_users table for pre-approved user verification
-- This table stores name and phone number of users who are allowed to register

CREATE TABLE IF NOT EXISTS approved_users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, phone)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_approved_users_name_phone ON approved_users(name, phone);
CREATE INDEX IF NOT EXISTS idx_approved_users_user_id ON approved_users(user_id);
CREATE INDEX IF NOT EXISTS idx_approved_users_is_verified ON approved_users(is_verified);

-- Enable Row Level Security (RLS)
ALTER TABLE approved_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- SELECT Policies
CREATE POLICY "Admins can view all approved_users" ON approved_users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role = 'admin')
);

CREATE POLICY "Anyone can verify approved_users for registration" ON approved_users FOR SELECT USING (
  true
);

-- INSERT Policy
CREATE POLICY "Only admins can create approved_users" ON approved_users FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role = 'admin')
);

-- UPDATE Policies
CREATE POLICY "Admins can update all approved_users" ON approved_users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role = 'admin')
);

CREATE POLICY "Users can update their own approved_users record" ON approved_users FOR UPDATE USING (
  is_verified = false AND user_id IS NULL
) WITH CHECK (
  is_verified = true AND user_id = auth.uid()::text
);

CREATE POLICY "Only admins can delete approved_users" ON approved_users FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role = 'admin')
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_approved_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_approved_users_updated_at
  BEFORE UPDATE ON approved_users
  FOR EACH ROW
  EXECUTE FUNCTION update_approved_users_updated_at();
