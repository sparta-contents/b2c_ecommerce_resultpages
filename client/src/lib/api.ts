import { apiRequest } from "./queryClient";

export interface PostWithDetails {
  id: string;
  title: string;
  content: string;
  week: string;
  imageUrl: string;
  heartCount: number;
  commentCount: number;
  createdAt: string;
  author: {
    name: string;
    profileImage?: string;
  };
  isLiked: boolean;
  isOwn: boolean;
  contentPreview?: string;
}

export interface CommentWithAuthor {
  id: string;
  content: string;
  createdAt: string;
  author: {
    name: string;
    profileImage?: string;
  };
  isOwn: boolean;
}

export interface PostDetail extends PostWithDetails {
  comments: CommentWithAuthor[];
}

export async function createPost(formData: FormData) {
  const res = await fetch("/api/posts", {
    method: "POST",
    body: formData,
  });
  
  if (!res.ok) {
    throw new Error("Failed to create post");
  }
  
  return res.json();
}

export async function updatePost(id: string, data: { title: string; content: string }) {
  const res = await apiRequest("PATCH", `/api/posts/${id}`, data);
  return res.json();
}

export async function deletePost(id: string) {
  const res = await apiRequest("DELETE", `/api/posts/${id}`);
  return res.json();
}

export async function toggleHeart(postId: string) {
  const res = await apiRequest("POST", `/api/posts/${postId}/heart`);
  return res.json();
}

export async function createComment(postId: string, content: string) {
  const res = await apiRequest("POST", `/api/posts/${postId}/comments`, { content });
  return res.json();
}

export async function updateComment(commentId: string, content: string) {
  const res = await apiRequest("PATCH", `/api/comments/${commentId}`, { content });
  return res.json();
}

export async function deleteComment(commentId: string) {
  const res = await apiRequest("DELETE", `/api/comments/${commentId}`);
  return res.json();
}
