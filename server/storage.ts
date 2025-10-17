import { db } from "./db";
import { users, posts, comments, hearts } from "@shared/schema";
import type { User, InsertUser, Post, InsertPost, Comment, InsertComment, Heart, InsertHeart } from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Post methods
  getAllPosts(sortBy?: "latest" | "popular"): Promise<Post[]>;
  getPostById(id: string): Promise<Post | undefined>;
  getPostsByUserId(userId: string): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, post: Partial<InsertPost>): Promise<Post | undefined>;
  deletePost(id: string): Promise<void>;

  // Comment methods
  getCommentsByPostId(postId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: string, content: string): Promise<Comment | undefined>;
  deleteComment(id: string): Promise<void>;

  // Heart methods
  getHeartByPostAndUser(postId: string, userId: string): Promise<Heart | undefined>;
  createHeart(heart: InsertHeart): Promise<Heart>;
  deleteHeart(postId: string, userId: string): Promise<void>;
}

export class DbStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.googleId, googleId));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Post methods
  async getAllPosts(sortBy: "latest" | "popular" = "latest"): Promise<Post[]> {
    if (sortBy === "popular") {
      return await db.select().from(posts).orderBy(desc(posts.heartCount), desc(posts.createdAt));
    }
    return await db.select().from(posts).orderBy(desc(posts.createdAt));
  }

  async getPostById(id: string): Promise<Post | undefined> {
    const result = await db.select().from(posts).where(eq(posts.id, id));
    return result[0];
  }

  async getPostsByUserId(userId: string): Promise<Post[]> {
    return await db.select().from(posts).where(eq(posts.userId, userId)).orderBy(desc(posts.createdAt));
  }

  async createPost(post: InsertPost): Promise<Post> {
    const result = await db.insert(posts).values(post).returning();
    return result[0];
  }

  async updatePost(id: string, post: Partial<InsertPost>): Promise<Post | undefined> {
    const result = await db.update(posts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return result[0];
  }

  async deletePost(id: string): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  // Comment methods
  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    return await db.select().from(comments).where(eq(comments.postId, postId)).orderBy(comments.createdAt);
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const result = await db.insert(comments).values(comment).returning();
    
    // Update comment count
    await db.update(posts)
      .set({ commentCount: sql`${posts.commentCount} + 1` })
      .where(eq(posts.id, comment.postId));
    
    return result[0];
  }

  async updateComment(id: string, content: string): Promise<Comment | undefined> {
    const result = await db.update(comments)
      .set({ content })
      .where(eq(comments.id, id))
      .returning();
    return result[0];
  }

  async deleteComment(id: string): Promise<void> {
    const comment = await db.select().from(comments).where(eq(comments.id, id));
    if (comment[0]) {
      await db.delete(comments).where(eq(comments.id, id));
      
      // Update comment count
      await db.update(posts)
        .set({ commentCount: sql`${posts.commentCount} - 1` })
        .where(eq(posts.id, comment[0].postId));
    }
  }

  // Heart methods
  async getHeartByPostAndUser(postId: string, userId: string): Promise<Heart | undefined> {
    const result = await db.select().from(hearts)
      .where(and(eq(hearts.postId, postId), eq(hearts.userId, userId)));
    return result[0];
  }

  async createHeart(heart: InsertHeart): Promise<Heart> {
    const result = await db.insert(hearts).values(heart).returning();
    
    // Update heart count
    await db.update(posts)
      .set({ heartCount: sql`${posts.heartCount} + 1` })
      .where(eq(posts.id, heart.postId));
    
    return result[0];
  }

  async deleteHeart(postId: string, userId: string): Promise<void> {
    await db.delete(hearts)
      .where(and(eq(hearts.postId, postId), eq(hearts.userId, userId)));
    
    // Update heart count
    await db.update(posts)
      .set({ heartCount: sql`${posts.heartCount} - 1` })
      .where(eq(posts.id, postId));
  }
}

export const storage = new DbStorage();
