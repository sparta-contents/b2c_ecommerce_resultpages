-- Complete Database Setup for New Supabase Instance
-- Run this in Supabase SQL Editor

-- 1. Add is_deleted columns for soft delete functionality
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_is_deleted ON posts(is_deleted);
CREATE INDEX IF NOT EXISTS idx_comments_is_deleted ON comments(is_deleted);

-- 2. Fix Users table RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Recreate INSERT policy with proper permissions
CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id);

-- Ensure UPDATE policy exists
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- 3. Update Posts RLS policies for soft delete
DROP POLICY IF EXISTS "Users can update their own posts or admins can update any" ON posts;
CREATE POLICY "Users can update their own posts or admins can update any"
  ON posts
  FOR UPDATE
  USING (
    auth.uid()::text = user_id OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role = 'admin')
  )
  WITH CHECK (true);

-- 4. Update Comments RLS policies for soft delete
DROP POLICY IF EXISTS "Users can update their own comments or admins can update any" ON comments;
CREATE POLICY "Users can update their own comments or admins can update any"
  ON comments
  FOR UPDATE
  USING (
    auth.uid()::text = user_id OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role = 'admin')
  )
  WITH CHECK (true);

-- 5. Remove hard delete policies (everyone uses soft delete)
DROP POLICY IF EXISTS "Only admins can delete posts" ON posts;
DROP POLICY IF EXISTS "Only admins can delete comments" ON comments;

-- 6. Verify all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
