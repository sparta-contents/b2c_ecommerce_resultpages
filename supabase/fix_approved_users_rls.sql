-- Fix RLS policy for approved_users table
-- This allows anyone (including non-authenticated users) to verify their registration

-- Drop the existing policies
DROP POLICY IF EXISTS "Only admins can view approved_users" ON approved_users;
DROP POLICY IF EXISTS "Admins can view all approved_users" ON approved_users;
DROP POLICY IF EXISTS "Anyone can verify approved_users for registration" ON approved_users;
DROP POLICY IF EXISTS "Only admins can update approved_users" ON approved_users;
DROP POLICY IF EXISTS "Users can update their own approved_users record" ON approved_users;

-- Create new SELECT policies
-- 1. Admins can view all approved users
CREATE POLICY "Admins can view all approved_users" ON approved_users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role = 'admin')
);

-- 2. Allow anyone to verify their registration (read-only for verification purposes)
CREATE POLICY "Anyone can verify approved_users for registration" ON approved_users FOR SELECT USING (
  true
);

-- Create new UPDATE policies
-- 1. Admins can update all approved users
CREATE POLICY "Admins can update all approved_users" ON approved_users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role = 'admin')
);

-- 2. Users can update their own approved_users record during verification (mark as verified)
CREATE POLICY "Users can update their own approved_users record" ON approved_users FOR UPDATE USING (
  is_verified = false AND user_id IS NULL
) WITH CHECK (
  is_verified = true AND user_id = auth.uid()::text
);
