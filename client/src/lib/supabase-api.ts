import { supabase } from './supabase';
import type { Post, Comment, HomeworkReview, HomeworkReviewStatus } from './supabase-hooks';
import { normalizePhone } from './phone-utils';

export async function getPosts(
  sortBy: 'latest' | 'popular' = 'latest',
  userId?: string,
  limit: number = 100,
  offset: number = 0,
  weekFilter?: string,
  currentUserId?: string
) {
  let query = supabase
    .from('posts')
    .select(`
      *,
      user:users!posts_user_id_fkey(id, name, email, profile_image)
    `, { count: 'exact' });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  // Filter out deleted posts at query level
  query = query.eq('is_deleted', false);

  // Filter by week if provided
  if (weekFilter) {
    query = query.eq('week', weekFilter);
  }

  if (sortBy === 'popular') {
    query = query.order('heart_count', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  // Add pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('getPosts 에러:', error);
    throw error;
  }

  const posts = data || [];

  // Fetch user's liked posts in a single query if user is logged in
  let likedPostIds = new Set<string>();
  if (currentUserId && posts.length > 0) {
    const postIds = posts.map(p => p.id);
    const { data: hearts } = await supabase
      .from('hearts')
      .select('post_id')
      .eq('user_id', currentUserId)
      .in('post_id', postIds);

    likedPostIds = new Set(hearts?.map(h => h.post_id) || []);
  }

  // Add hearts array with only current user's like status
  const postsWithHearts = posts.map(post => ({
    ...post,
    hearts: currentUserId && likedPostIds.has(post.id) ? [{ user_id: currentUserId }] : []
  }));

  return {
    posts: postsWithHearts as Post[],
    total: count || 0
  };
}

export async function getPost(id: string, currentUserId?: string) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      user:users!posts_user_id_fkey(id, name, email, profile_image),
      comments(
        id,
        content,
        created_at,
        user_id,
        is_deleted,
        user:users!comments_user_id_fkey(id, name, profile_image)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  // Check if post is deleted
  if (data && data.is_deleted) {
    throw new Error('Post not found');
  }

  // Filter deleted comments on client side
  if (data && data.comments) {
    data.comments = data.comments.filter((c: any) => !c.is_deleted);
  }

  // Fetch user's like status if logged in
  let isLiked = false;
  if (currentUserId) {
    const { data: heart } = await supabase
      .from('hearts')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', currentUserId)
      .maybeSingle(); // Use maybeSingle() to avoid 406 error

    isLiked = !!heart;
  }

  // Add hearts array with only current user's like status
  return {
    ...data,
    hearts: currentUserId && isLiked ? [{ user_id: currentUserId }] : []
  };
}

export async function createPost(data: {
  title: string;
  content: string;
  week: string;
  image_url: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return post;
}

export async function updatePost(id: string, data: {
  title?: string;
  content?: string;
  week?: string;
  image_url?: string;
}) {
  const { data: post, error } = await supabase
    .from('posts')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return post;
}

// Soft delete for regular users
export async function softDeletePost(id: string) {
  const { data, error } = await supabase
    .from('posts')
    .update({ is_deleted: true })
    .eq('id', id)
    .select();

  if (error) {
    console.error('softDeletePost 에러:', error);
    throw error;
  }

  return data;
}

// Hard delete for admins only
export async function deletePost(id: string) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function toggleHeart(postId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if heart already exists - use maybeSingle() to avoid 406 error when no heart exists
  const { data: existingHeart, error: checkError } = await supabase
    .from('hearts')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle();

  // Ignore "no rows returned" error, but throw other errors
  if (checkError && checkError.code !== 'PGRST116') {
    throw checkError;
  }

  if (existingHeart) {
    // Remove heart - trigger will automatically decrement heart_count
    const { error } = await supabase
      .from('hearts')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    if (error) throw error;
  } else {
    // Add heart - trigger will automatically increment heart_count
    const { error } = await supabase
      .from('hearts')
      .insert({ post_id: postId, user_id: user.id });

    if (error) throw error;
  }
}

export async function createComment(postId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      content,
    })
    .select(`
      *,
      user:users!comments_user_id_fkey(id, name, profile_image)
    `)
    .single();

  if (error) throw error;

  // Increment comment count
  const { data: post } = await supabase
    .from('posts')
    .select('comment_count')
    .eq('id', postId)
    .single();

  if (post) {
    await supabase
      .from('posts')
      .update({ comment_count: post.comment_count + 1 })
      .eq('id', postId);
  }

  return comment;
}

export async function updateComment(commentId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: comment, error } = await supabase
    .from('comments')
    .update({ content })
    .eq('id', commentId)
    .select(`
      *,
      user:users!comments_user_id_fkey(id, name, profile_image)
    `)
    .single();

  if (error) throw error;
  return comment;
}

// Soft delete for regular users
export async function softDeleteComment(commentId: string) {
  const { data: comment } = await supabase
    .from('comments')
    .select('post_id')
    .eq('id', commentId)
    .single();

  const { error } = await supabase
    .from('comments')
    .update({ is_deleted: true })
    .eq('id', commentId);

  if (error) throw error;

  // Decrement comment count
  if (comment) {
    const { data: post } = await supabase
      .from('posts')
      .select('comment_count')
      .eq('id', comment.post_id)
      .single();

    if (post) {
      await supabase
        .from('posts')
        .update({ comment_count: Math.max(0, post.comment_count - 1) })
        .eq('id', comment.post_id);
    }
  }
}

// Hard delete for admins only
export async function deleteComment(commentId: string) {
  const { data: comment } = await supabase
    .from('comments')
    .select('post_id')
    .eq('id', commentId)
    .single();

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;

  // Decrement comment count
  if (comment) {
    const { data: post } = await supabase
      .from('posts')
      .select('comment_count')
      .eq('id', comment.post_id)
      .single();

    if (post) {
      await supabase
        .from('posts')
        .update({ comment_count: Math.max(0, post.comment_count - 1) })
        .eq('id', comment.post_id);
    }
  }
}

export async function uploadImage(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('post-images')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('post-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

// Admin Statistics
export async function getWeeklyPostStats() {
  const { data, error } = await supabase
    .from('posts')
    .select('created_at, week')
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Initialize last 30 days with 0 counts (daily basis)
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Reset to start of day
  const dailyStats: { [key: string]: number } = {};

  // Create all 30 days with 0 count
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = date.toISOString().split('T')[0];
    dailyStats[dateKey] = 0;
  }

  // Count posts per day
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  data?.forEach((post: any) => {
    const createdDate = new Date(post.created_at);
    createdDate.setHours(0, 0, 0, 0); // Reset to start of day

    if (createdDate >= thirtyDaysAgo) {
      const dateKey = createdDate.toISOString().split('T')[0];

      if (dailyStats.hasOwnProperty(dateKey)) {
        dailyStats[dateKey] = dailyStats[dateKey] + 1;
      }
    }
  });

  // Convert to array and sort
  return Object.entries(dailyStats)
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

export async function getWeekFilterStats() {
  const { data, error } = await supabase
    .from('posts')
    .select('week')
    .eq('is_deleted', false);

  if (error) throw error;

  // Count by week filter
  const weekStats: { [key: string]: number } = {
    '1주차 과제': 0,
    '2주차 과제': 0,
    '3주차 과제': 0,
  };

  data?.forEach((post: any) => {
    if (weekStats[post.week] !== undefined) {
      weekStats[post.week]++;
    }
  });

  return Object.entries(weekStats).map(([week, count]) => ({ week, count }));
}

// Profile Management

/**
 * 사용자 프로필 조회
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, profile_image, role, created_at')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * 사용자 프로필 업데이트
 */
export async function updateUserProfile(
  userId: string,
  data: { name?: string; profile_image?: string }
) {
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update(data)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return updatedUser;
}

/**
 * 프로필 이미지 업로드 (리사이징된 이미지)
 */
export async function uploadProfileImage(file: Blob, userId: string): Promise<string> {
  const fileExt = 'jpg'; // 리사이징 후 항상 JPEG
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('profile-images')
    .upload(fileName, file, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('profile-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

// User Weekly Post Status (for admin dashboard)
export interface UserWeeklyPostStatus {
  id: string;
  name: string;
  email: string;
  profile_image: string | null;
  approvedName: string | null;  // approved_users의 실제 이름
  approvedPhone: string | null; // approved_users의 전화번호
  weeklyPosts: {
    [key: string]: string[];  // week -> post IDs
  };
}

export async function getUserWeeklyPostStatus(): Promise<UserWeeklyPostStatus[]> {
  // Get all regular users (exclude admin)
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, email, profile_image')
    .eq('role', 'user')
    .order('name', { ascending: true });

  if (usersError) throw usersError;
  if (!users) return [];

  // Get approved_users info for these users
  const userIds = users.map(u => u.id);
  const { data: approvedUsers, error: approvedError } = await supabase
    .from('approved_users')
    .select('user_id, name, phone')
    .in('user_id', userIds);

  if (approvedError) {
    console.error('Error fetching approved users:', approvedError);
  }

  // Get all posts for these users
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id, user_id, week')
    .in('user_id', userIds)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (postsError) throw postsError;

  // Group posts by user and week
  const weeks = ['1주차 과제', '2주차 과제', '3주차 과제', '4주차 과제', '5주차 과제', '6주차 과제', '공지'];

  return users.map(user => {
    const userPosts = posts?.filter(p => p.user_id === user.id) || [];
    const approvedUser = approvedUsers?.find(au => au.user_id === user.id);

    const weeklyPosts: { [key: string]: string[] } = {};
    weeks.forEach(week => {
      weeklyPosts[week] = userPosts
        .filter(p => p.week === week)
        .map(p => p.id);
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      profile_image: user.profile_image,
      approvedName: approvedUser?.name || null,
      approvedPhone: approvedUser?.phone || null,
      weeklyPosts,
    };
  });
}

// ============================================
// Approved Users (Pre-approved user verification)
// ============================================

/**
 * Verifies a user against the approved_users table during login
 * @param name - User's name
 * @param phone - User's phone number
 * @param googleUser - Google OAuth user data
 * @returns Created user object
 */
export async function verifyApprovedUser(
  name: string,
  phone: string,
  googleUser: { email: string; name: string; profile_image?: string; google_id: string; user_id: string }
) {
  // Normalize phone number
  const normalizedPhone = normalizePhone(phone);

  // Debug logging
  console.log('🔍 Verification attempt:', {
    inputName: name,
    inputPhone: phone,
    normalizedPhone: normalizedPhone,
    trimmedName: name.trim(),
    userId: googleUser.user_id
  });

  // Check if user exists in approved_users table
  const { data: approvedUser, error: lookupError } = await supabase
    .from('approved_users')
    .select('*')
    .eq('name', name.trim())
    .eq('phone', normalizedPhone)
    .single();

  console.log('🔍 Query result:', { approvedUser, lookupError });

  if (lookupError || !approvedUser) {
    throw new Error('등록되지 않은 사용자입니다. 이름과 전화번호를 확인해주세요.');
  }

  // Check if already verified
  if (approvedUser.is_verified) {
    throw new Error('이미 인증된 전화번호입니다. 다른 계정으로 가입되었을 수 있습니다.');
  }

  // Create user account with the auth user ID
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      id: googleUser.user_id, // Use the auth user ID
      email: googleUser.email,
      name: googleUser.name,
      profile_image: googleUser.profile_image || null,
      google_id: googleUser.google_id,
      role: 'user',
    })
    .select()
    .single();

  if (createError || !newUser) {
    console.error('User creation failed:', createError);
    throw new Error('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
  }

  // Update approved_users table
  console.log('🔍 Updating approved_users:', {
    approvedUserId: approvedUser.id,
    newUserId: newUser.id,
    updateData: {
      is_verified: true,
      user_id: newUser.id,
    }
  });

  const { data: updatedApprovedUser, error: updateError } = await supabase
    .from('approved_users')
    .update({
      is_verified: true,
      user_id: newUser.id,
    })
    .eq('id', approvedUser.id)
    .select()
    .single();

  console.log('🔍 Update result:', { updatedApprovedUser, updateError });

  if (updateError) {
    console.error('Failed to update approved_users:', updateError);
    // Rollback: delete the created user
    await supabase.from('users').delete().eq('id', newUser.id);
    throw new Error('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
  }

  console.log('✅ Verification successful! User created and approved_users updated.');
  return newUser;
}

/**
 * Checks if a user_id has verified approved user status
 * @param userId - User ID to check
 * @returns true if verified, false otherwise
 */
export async function checkApprovedUserVerification(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('approved_users')
    .select('id')
    .eq('user_id', userId)
    .eq('is_verified', true)
    .single();

  if (error) return false;
  return !!data;
}

// ============================================
// Admin: Approved Users Management
// ============================================

export interface ApprovedUser {
  id: string;
  name: string;
  phone: string;
  is_verified: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ApprovedUserFilters {
  search?: string;
  is_verified?: boolean | 'all';
}

export interface ApprovedUserPagination {
  limit: number;
  offset: number;
}

/**
 * Get approved users list (admin only)
 * @param filters - Search and filter options
 * @param pagination - Pagination options
 * @returns List of approved users with total count
 */
export async function getApprovedUsers(
  filters: ApprovedUserFilters = {},
  pagination: ApprovedUserPagination = { limit: 30, offset: 0 }
) {
  let query = supabase
    .from('approved_users')
    .select(`
      *,
      user:users(id, name, email)
    `, { count: 'exact' });

  // Apply search filter
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
  }

  // Apply verification status filter
  if (filters.is_verified !== undefined && filters.is_verified !== 'all') {
    query = query.eq('is_verified', filters.is_verified);
  }

  // Apply sorting
  query = query.order('created_at', { ascending: false });

  // Apply pagination
  query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('getApprovedUsers error:', error);
    throw error;
  }

  return {
    approvedUsers: (data || []) as ApprovedUser[],
    total: count || 0,
  };
}

/**
 * Add a single approved user (admin only)
 * @param name - User's name
 * @param phone - User's phone number
 * @returns Created approved user
 */
export async function addApprovedUser(name: string, phone: string) {
  const normalizedPhone = normalizePhone(phone);

  // Check for duplicates
  const { data: existing } = await supabase
    .from('approved_users')
    .select('id')
    .eq('name', name)
    .eq('phone', normalizedPhone)
    .single();

  if (existing) {
    throw new Error('이미 등록된 사용자입니다.');
  }

  const { data, error } = await supabase
    .from('approved_users')
    .insert({
      name,
      phone: normalizedPhone,
    })
    .select()
    .single();

  if (error) {
    console.error('addApprovedUser error:', error);
    throw error;
  }

  return data;
}

/**
 * Update an approved user (admin only)
 * @param id - Approved user ID
 * @param updates - Fields to update
 * @returns Updated approved user
 */
export async function updateApprovedUser(
  id: string,
  updates: { name?: string; phone?: string }
) {
  const updateData: any = {};

  if (updates.name !== undefined) {
    updateData.name = updates.name;
  }

  if (updates.phone !== undefined) {
    updateData.phone = normalizePhone(updates.phone);
  }

  const { data, error } = await supabase
    .from('approved_users')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('updateApprovedUser error:', error);
    throw error;
  }

  return data;
}

/**
 * Delete an approved user (admin only)
 * @param id - Approved user ID
 */
export async function deleteApprovedUser(id: string) {
  const { error } = await supabase
    .from('approved_users')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('deleteApprovedUser error:', error);
    throw error;
  }
}

export interface BulkApprovedUser {
  name: string;
  phone: string;
  error?: string;
}

/**
 * Validates bulk approved user data before insertion
 * @param users - Array of users to validate
 * @returns Array with validation errors added
 */
export async function validateApprovedUserData(
  users: BulkApprovedUser[]
): Promise<BulkApprovedUser[]> {
  const validated = [...users];

  // Get existing approved users to check for duplicates
  const { data: existing } = await supabase
    .from('approved_users')
    .select('name, phone');

  const existingSet = new Set(
    existing?.map(u => `${u.name}:${u.phone}`) || []
  );

  const seenInBatch = new Set<string>();

  for (let i = 0; i < validated.length; i++) {
    const user = validated[i];

    // Validate name
    if (!user.name || user.name.trim().length === 0) {
      user.error = '이름을 입력해주세요';
      continue;
    }

    // Validate and normalize phone
    try {
      const normalizedPhone = normalizePhone(user.phone);
      user.phone = normalizedPhone;

      const key = `${user.name}:${normalizedPhone}`;

      // Check for duplicates in existing data
      if (existingSet.has(key)) {
        user.error = '이미 등록된 사용자입니다';
        continue;
      }

      // Check for duplicates within the batch
      if (seenInBatch.has(key)) {
        user.error = '중복된 데이터입니다';
        continue;
      }

      seenInBatch.add(key);
    } catch (error) {
      user.error = error instanceof Error ? error.message : '전화번호 형식 오류';
    }
  }

  return validated;
}

/**
 * Bulk insert approved users (admin only)
 * @param users - Array of users to insert
 * @returns Result with success and failure counts
 */
export async function bulkInsertApprovedUsers(
  users: BulkApprovedUser[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  const validated = await validateApprovedUserData(users);

  const validUsers = validated.filter(u => !u.error);
  const errors = validated
    .filter(u => u.error)
    .map((u, idx) => `${idx + 1}번째 행: ${u.error}`);

  if (validUsers.length === 0) {
    return { success: 0, failed: validated.length, errors };
  }

  const { data, error } = await supabase
    .from('approved_users')
    .insert(validUsers.map(u => ({
      name: u.name,
      phone: u.phone,
    })));

  if (error) {
    console.error('bulkInsertApprovedUsers error:', error);
    return {
      success: 0,
      failed: users.length,
      errors: [...errors, error.message],
    };
  }

  return {
    success: validUsers.length,
    failed: errors.length,
    errors,
  };
}

/**
 * Get approved users statistics (admin only)
 * @returns Statistics object
 */
export async function getApprovedUserStats() {
  const { data, error } = await supabase
    .from('approved_users')
    .select('is_verified');

  if (error) {
    console.error('getApprovedUserStats error:', error);
    throw error;
  }

  const total = data?.length || 0;
  const verified = data?.filter(u => u.is_verified).length || 0;
  const unverified = total - verified;

  return {
    total,
    verified,
    unverified,
  };
}

// ==================== Homework Review Functions ====================

/**
 * Submit or update a homework review (admin only)
 * Uses upsert to create or update based on user_id + week combination
 */
export async function submitHomeworkReview(
  userId: string,
  week: string,
  status: 'passed' | 'failed'
): Promise<HomeworkReview> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check if user is admin
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userError || userData?.role !== 'admin') {
    throw new Error('Only admins can submit homework reviews');
  }

  const { data, error } = await supabase
    .from('homework_reviews')
    .upsert({
      user_id: userId,
      week: week,
      status: status,
      reviewer_id: user.id,
    }, {
      onConflict: 'user_id,week'
    })
    .select()
    .single();

  if (error) {
    console.error('submitHomeworkReview error:', error);
    throw error;
  }

  return data as HomeworkReview;
}

/**
 * Delete a homework review (admin only)
 */
export async function deleteHomeworkReview(
  userId: string,
  week: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check if user is admin
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userError || userData?.role !== 'admin') {
    throw new Error('Only admins can delete homework reviews');
  }

  const { error } = await supabase
    .from('homework_reviews')
    .delete()
    .eq('user_id', userId)
    .eq('week', week);

  if (error) {
    console.error('deleteHomeworkReview error:', error);
    throw error;
  }
}

/**
 * Get homework review for a specific user and week (admin only)
 */
export async function getHomeworkReview(
  userId: string,
  week: string
): Promise<HomeworkReview | null> {
  const { data, error } = await supabase
    .from('homework_reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('week', week)
    .maybeSingle();

  if (error) {
    console.error('getHomeworkReview error:', error);
    throw error;
  }

  return data as HomeworkReview | null;
}

/**
 * Get all homework reviews for a specific user (admin only)
 */
export async function getUserHomeworkReviews(
  userId: string
): Promise<HomeworkReview[]> {
  const { data, error } = await supabase
    .from('homework_reviews')
    .select('*')
    .eq('user_id', userId)
    .order('week', { ascending: true });

  if (error) {
    console.error('getUserHomeworkReviews error:', error);
    throw error;
  }

  return data as HomeworkReview[];
}

/**
 * Get review status for a specific user and week
 * Returns 'passed', 'failed', or 'not_reviewed'
 */
export async function getHomeworkReviewStatus(
  userId: string,
  week: string
): Promise<HomeworkReviewStatus> {
  const review = await getHomeworkReview(userId, week);

  if (!review) {
    return 'not_reviewed';
  }

  return review.status;
}

export interface UserWeeklyReviewData {
  userId: string;
  userName: string;
  userEmail: string;
  userProfileImage: string | null;
  weeklyReviews: {
    [week: string]: HomeworkReviewStatus;
  };
}

/**
 * Get all users' weekly review status (admin only)
 * Returns review status for each user for each week
 */
export async function getUserWeeklyReviewStatus(): Promise<UserWeeklyReviewData[]> {
  // Get all regular users (exclude admin)
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, email, profile_image')
    .eq('role', 'user')
    .order('name', { ascending: true });

  if (usersError) {
    console.error('getUserWeeklyReviewStatus users error:', usersError);
    throw usersError;
  }

  if (!users) return [];

  // Get all homework reviews
  const { data: reviews, error: reviewsError } = await supabase
    .from('homework_reviews')
    .select('*');

  if (reviewsError) {
    console.error('getUserWeeklyReviewStatus reviews error:', reviewsError);
    throw reviewsError;
  }

  const weeks = ['1주차 과제', '2주차 과제', '3주차 과제', '4주차 과제', '5주차 과제', '6주차 과제'];

  return users.map(user => {
    const userReviews = reviews?.filter(r => r.user_id === user.id) || [];

    const weeklyReviews: { [week: string]: HomeworkReviewStatus } = {};
    weeks.forEach(week => {
      const review = userReviews.find(r => r.week === week);
      weeklyReviews[week] = review ? review.status as HomeworkReviewStatus : 'not_reviewed';
    });

    return {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userProfileImage: user.profile_image,
      weeklyReviews,
    };
  });
}
