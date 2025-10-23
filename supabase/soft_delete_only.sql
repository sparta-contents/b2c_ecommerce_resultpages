-- Update RLS policies: Everyone uses soft delete only (no hard delete)

-- 1. Drop hard delete policies
DROP POLICY IF EXISTS "Admins can hard delete posts" ON posts;
DROP POLICY IF EXISTS "Admins can hard delete comments" ON comments;

-- 2. Keep soft delete policies (already created)
-- Users (including admins) can soft delete their own posts/comments via UPDATE

-- 3. Ensure no one can hard delete (remove DELETE policies entirely)
-- This prevents accidental hard deletes even from admins

-- Note: Soft delete is done via UPDATE, setting is_deleted = true
-- The existing "Users can soft delete their own posts/comments" policies handle this
