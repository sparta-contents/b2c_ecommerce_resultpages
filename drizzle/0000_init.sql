-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "profile_image" text,
  "google_id" text UNIQUE,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create posts table
CREATE TABLE IF NOT EXISTS "posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "content" text NOT NULL,
  "image_url" text NOT NULL,
  "heart_count" integer DEFAULT 0 NOT NULL,
  "comment_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create comments table
CREATE TABLE IF NOT EXISTS "comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "post_id" uuid NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create hearts table
CREATE TABLE IF NOT EXISTS "hearts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "post_id" uuid NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  UNIQUE("post_id", "user_id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "posts_user_id_idx" ON "posts"("user_id");
CREATE INDEX IF NOT EXISTS "posts_created_at_idx" ON "posts"("created_at");
CREATE INDEX IF NOT EXISTS "comments_post_id_idx" ON "comments"("post_id");
CREATE INDEX IF NOT EXISTS "hearts_post_id_idx" ON "hearts"("post_id");
CREATE INDEX IF NOT EXISTS "hearts_user_id_idx" ON "hearts"("user_id");
