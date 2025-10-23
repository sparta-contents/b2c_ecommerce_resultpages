import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header, SortType } from "@/components/Header";
import { PostGrid } from "@/components/PostGrid";
import { PostDetailModal } from "@/components/PostDetailModal";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { getPosts, getPost, toggleHeart, createComment, deletePost, deleteComment } from "@/lib/supabase-api";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const [sortBy, setSortBy] = useState<SortType>("latest");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const { toast } = useToast();

  const { user, signInWithGoogle, signOut } = useAuth();

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['posts', sortBy, showMyPosts ? user?.id : null],
    queryFn: () => getPosts(sortBy, showMyPosts && user ? user.id : undefined),
  });

  const { data: selectedPost, refetch: refetchPost } = useQuery({
    queryKey: ['post', selectedPostId],
    queryFn: () => getPost(selectedPostId!),
    enabled: !!selectedPostId,
  });

  const heartMutation = useMutation({
    mutationFn: toggleHeart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      if (selectedPostId) {
        queryClient.invalidateQueries({ queryKey: ['post', selectedPostId] });
      }
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      createComment(postId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      if (selectedPostId) {
        queryClient.invalidateQueries({ queryKey: ['post', selectedPostId] });
      }
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setSelectedPostId(null);
      toast({
        title: "게시물이 삭제되었습니다",
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      if (selectedPostId) {
        queryClient.invalidateQueries({ queryKey: ['post', selectedPostId] });
      }
      toast({
        title: "댓글이 삭제되었습니다",
      });
    },
  });

  const handleMyPostsClick = () => {
    setShowMyPosts(!showMyPosts);
  };

  const handleLogout = async () => {
    await signOut();
    setShowMyPosts(false);
  };

  // Convert Supabase post data to component format
  const formattedPosts = posts.map(post => ({
    id: post.id,
    title: post.title,
    contentPreview: post.content.slice(0, 60) + (post.content.length > 60 ? '...' : ''),
    imageUrl: post.image_url,
    week: post.week,
    author: {
      name: post.user.name,
      profileImage: post.user.profile_image || undefined,
    },
    heartCount: post.heart_count,
    commentCount: post.comment_count,
    createdAt: post.created_at,
    isLiked: post.hearts?.some(h => h.user_id === user?.id) || false,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header
        isLoggedIn={!!user}
        user={user ? { 
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          profileImage: user.user_metadata?.avatar_url 
        } : undefined}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onWriteClick={() => setLocation("/write")}
        onLoginClick={signInWithGoogle}
        onLogoutClick={handleLogout}
        onMyPostsClick={handleMyPostsClick}
      />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {showMyPosts && (
          <div className="mb-6">
            <h2 className="text-2xl font-semibold" data-testid="text-my-posts-title">내가 쓴 글</h2>
          </div>
        )}
        
        {postsLoading ? (
          <div className="text-center py-12" data-testid="text-loading">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        ) : formattedPosts.length === 0 ? (
          <div className="text-center py-12" data-testid="text-empty">
            <p className="text-muted-foreground">
              {showMyPosts ? "작성한 게시물이 없습니다" : "게시물이 없습니다"}
            </p>
          </div>
        ) : (
          <PostGrid
            posts={formattedPosts}
            onPostClick={(id) => setSelectedPostId(id)}
          />
        )}
      </main>

      {selectedPost && (
        <PostDetailModal
          open={!!selectedPostId}
          onOpenChange={(open) => !open && setSelectedPostId(null)}
          post={{
            id: selectedPost.id,
            title: selectedPost.title,
            content: selectedPost.content,
            imageUrl: selectedPost.image_url,
            week: selectedPost.week,
            author: {
              name: selectedPost.user.name,
              profileImage: selectedPost.user.profile_image || undefined,
            },
            heartCount: selectedPost.heart_count,
            isLiked: selectedPost.hearts?.some((h: any) => h.user_id === user?.id) || false,
            isOwn: user?.id === selectedPost.user_id,
            comments: (selectedPost.comments || []).map((c: any) => ({
              id: c.id,
              content: c.content,
              author: {
                name: c.user.name,
                profileImage: c.user.profile_image || undefined,
              },
              isOwn: user?.id === c.user_id,
            })),
          }}
          onEdit={() => {
            setLocation(`/write?edit=${selectedPostId}`);
          }}
          onDelete={() => {
            if (confirm("정말 삭제하시겠습니까?")) {
              deletePostMutation.mutate(selectedPostId!);
            }
          }}
          onLike={() => {
            if (!user) {
              toast({
                title: "로그인이 필요합니다",
                variant: "destructive",
              });
              return;
            }
            heartMutation.mutate(selectedPostId!);
          }}
          onCommentSubmit={(content) => {
            if (!user) {
              toast({
                title: "로그인이 필요합니다",
                variant: "destructive",
              });
              return;
            }
            commentMutation.mutate({ postId: selectedPostId!, content });
          }}
        />
      )}
    </div>
  );
}
