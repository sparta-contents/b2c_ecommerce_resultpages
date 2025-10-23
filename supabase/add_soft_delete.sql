-- Add soft delete functionality to posts and comments

-- 1. Add is_deleted column to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 2. Add is_deleted column to comments
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 3. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_posts_is_deleted ON posts(is_deleted);
CREATE INDEX IF NOT EXISTS idx_comments_is_deleted ON comments(is_deleted);

-- 4. Update RLS policies for posts

-- Drop existing policies
DROP POLICY IF EXISTS "Only admins can delete posts" ON posts;
DROP POLICY IF EXISTS "Only admins can delete comments" ON comments;

-- Users can soft delete their own posts (UPDATE to set is_deleted = true)
CREATE POLICY "Users can soft delete their own posts" ON posts
  FOR UPDATE
  USING (
    auth.uid()::text = user_id OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role = 'admin')
  );

-- Admins can hard delete (actual DELETE)
CREATE POLICY "Admins can hard delete posts" ON posts
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role = 'admin')
  );

-- Users can soft delete their own comments
CREATE POLICY "Users can soft delete their own comments" ON comments
  FOR UPDATE
  USING (
    auth.uid()::text = user_id OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role = 'admin')
  );

-- Admins can hard delete comments
CREATE POLICY "Admins can hard delete comments" ON comments
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role = 'admin')
  );

-- 5. Update view policies to exclude deleted items
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;

CREATE POLICY "Anyone can view non-deleted posts" ON posts
  FOR SELECT
  USING (is_deleted = false OR is_deleted IS NULL);

CREATE POLICY "Anyone can view non-deleted comments" ON comments
  FOR SELECT
  USING (is_deleted = false OR is_deleted IS NULL);
