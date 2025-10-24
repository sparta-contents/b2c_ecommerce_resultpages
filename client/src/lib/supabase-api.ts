import { supabase } from './supabase';
import type { Post, Comment } from './supabase-hooks';

export async function getPosts(
  sortBy: 'latest' | 'popular' = 'latest',
  userId?: string,
  limit: number = 100,
  offset: number = 0,
  weekFilter?: string
) {
  console.log('getPosts 호출됨, sortBy:', sortBy, 'userId:', userId, 'limit:', limit, 'offset:', offset, 'weekFilter:', weekFilter);

  let query = supabase
    .from('posts')
    .select(`
      *,
      user:users!posts_user_id_fkey(id, name, email, profile_image),
      hearts(user_id)
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

  console.log('getPosts 결과 - data count:', data?.length, 'total:', count, 'error:', error);

  if (error) {
    console.error('getPosts 에러:', error);
    throw error;
  }

  return {
    posts: (data || []) as Post[],
    total: count || 0
  };
}

export async function getPost(id: string) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      user:users!posts_user_id_fkey(id, name, email, profile_image),
      hearts(user_id),
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

  return data;
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
  console.log('softDeletePost 호출됨, id:', id);

  const { data, error } = await supabase
    .from('posts')
    .update({ is_deleted: true })
    .eq('id', id)
    .select();

  console.log('softDeletePost 결과 - data:', data, 'error:', error);

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

  // Check if heart already exists
  const { data: existingHeart } = await supabase
    .from('hearts')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();

  if (existingHeart) {
    // Remove heart
    await supabase
      .from('hearts')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    // Decrement count
    const { data: post } = await supabase
      .from('posts')
      .select('heart_count')
      .eq('id', postId)
      .single();

    if (post) {
      await supabase
        .from('posts')
        .update({ heart_count: Math.max(0, post.heart_count - 1) })
        .eq('id', postId);
    }
  } else {
    // Add heart
    await supabase
      .from('hearts')
      .insert({ post_id: postId, user_id: user.id });

    // Increment count
    const { data: post } = await supabase
      .from('posts')
      .select('heart_count')
      .eq('id', postId)
      .single();

    if (post) {
      await supabase
        .from('posts')
        .update({ heart_count: post.heart_count + 1 })
        .eq('id', postId);
    }
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
