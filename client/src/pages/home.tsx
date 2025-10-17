import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header, SortType } from "@/components/Header";
import { PostGrid } from "@/components/PostGrid";
import { PostDetailModal } from "@/components/PostDetailModal";
import { useLocation } from "wouter";
import { useAuth, useLogout, googleLogin } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import type { PostWithDetails, PostDetail } from "@/lib/api";
import { toggleHeart, createComment, deletePost, deleteComment } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const [sortBy, setSortBy] = useState<SortType>("latest");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const { toast } = useToast();

  const { data: user } = useAuth();
  const logout = useLogout();

  const { data: posts = [] } = useQuery<PostWithDetails[]>({
    queryKey: ["/api/posts", { sortBy, userId: showMyPosts && user ? user.id : undefined }],
    enabled: true,
  });

  const { data: selectedPost, refetch: refetchPost } = useQuery<PostDetail>({
    queryKey: ["/api/posts", selectedPostId],
    enabled: !!selectedPostId,
  });

  const heartMutation = useMutation({
    mutationFn: (postId: string) => toggleHeart(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      if (selectedPostId) {
        refetchPost();
      }
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      createComment(postId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      if (selectedPostId) {
        refetchPost();
      }
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setSelectedPostId(null);
      toast({
        title: "게시물이 삭제되었습니다",
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      if (selectedPostId) {
        refetchPost();
      }
      toast({
        title: "댓글이 삭제되었습니다",
      });
    },
  });

  const handleMyPostsClick = () => {
    setShowMyPosts(!showMyPosts);
  };

  const handleLogout = () => {
    logout.mutate();
    setShowMyPosts(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        isLoggedIn={!!user}
        user={user ? { name: user.name, profileImage: user.profileImage || undefined } : undefined}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onWriteClick={() => setLocation("/write")}
        onLoginClick={googleLogin}
        onLogoutClick={handleLogout}
        onMyPostsClick={handleMyPostsClick}
      />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {showMyPosts && (
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">내가 쓴 글</h2>
          </div>
        )}
        <PostGrid
          posts={posts.map(p => ({
            ...p,
            contentPreview: p.content.slice(0, 60) + (p.content.length > 60 ? '...' : ''),
          }))}
          onPostClick={(id) => setSelectedPostId(id)}
        />
      </main>

      {selectedPost && (
        <PostDetailModal
          open={!!selectedPostId}
          onOpenChange={(open) => !open && setSelectedPostId(null)}
          post={{
            ...selectedPost,
            author: {
              ...selectedPost.author,
              profileImage: selectedPost.author.profileImage || undefined,
            },
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
