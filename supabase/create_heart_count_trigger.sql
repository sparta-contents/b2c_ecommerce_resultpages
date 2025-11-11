-- ================================================
-- Heart Count Auto-Update Trigger
-- ================================================
-- This migration creates a database trigger to automatically
-- update the heart_count column in the posts table whenever
-- a heart is added or removed.
--
-- Benefits:
-- - Reduces application queries from 4 to 2
-- - Ensures data consistency
-- - Prevents race conditions
-- ================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_post_heart_count_trigger ON hearts;
DROP FUNCTION IF EXISTS update_post_heart_count();

-- Create function to update heart_count
CREATE OR REPLACE FUNCTION update_post_heart_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment heart_count when a new heart is added
    UPDATE posts
    SET heart_count = heart_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement heart_count when a heart is removed
    UPDATE posts
    SET heart_count = GREATEST(0, heart_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on hearts table
CREATE TRIGGER update_post_heart_count_trigger
AFTER INSERT OR DELETE ON hearts
FOR EACH ROW
EXECUTE FUNCTION update_post_heart_count();

-- Verify and fix any existing heart counts
-- This ensures data consistency after migration
UPDATE posts
SET heart_count = (
  SELECT COUNT(*)
  FROM hearts
  WHERE hearts.post_id = posts.id
)
WHERE EXISTS (
  SELECT 1
  FROM hearts
  WHERE hearts.post_id = posts.id
  GROUP BY hearts.post_id
  HAVING COUNT(*) != posts.heart_count
);

-- Add comment to the function
COMMENT ON FUNCTION update_post_heart_count() IS
'Automatically updates the heart_count column in posts table when hearts are added or removed';
