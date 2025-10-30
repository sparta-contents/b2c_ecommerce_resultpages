import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Users, FileText, MessageCircle, Heart, UserCheck, BarChart3 } from "lucide-react";
import { PostDetailModal } from "@/components/PostDetailModal";
import { WeeklyPostsChart } from "@/components/WeeklyPostsChart";
import { WeekFilterChart } from "@/components/WeekFilterChart";
import { UserWeeklyPostStatus } from "@/components/UserWeeklyPostStatus";
import { ApprovedUserManagement } from "@/components/ApprovedUserManagement";
import { getPost, toggleHeart, createComment, updateComment, softDeletePost, softDeleteComment, getWeeklyPostStats, getWeekFilterStats } from "@/lib/supabase-api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type TabType = "stats" | "weekly" | "approved-users";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { user, isAdmin, isAuthenticated } = useAuth();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("stats");
  const { toast } = useToast();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersResult, postsResult, commentsResult, heartsResult] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('comments').select('id', { count: 'exact', head: true }),
        supabase.from('hearts').select('id', { count: 'exact', head: true }),
      ]);

      return {
        users: usersResult.count || 0,
        posts: postsResult.count || 0,
        comments: commentsResult.count || 0,
        hearts: heartsResult.count || 0,
      };
    },
  });

  const { data: recentPosts } = useQuery({
    queryKey: ['admin-recent-posts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('posts')
        .select('*, user:users(name, email)')
        .order('created_at', { ascending: false })
        .limit(10);

      return data || [];
    },
  });

  const { data: weeklyStats } = useQuery({
    queryKey: ['weekly-post-stats'],
    queryFn: getWeeklyPostStats,
  });

  const { data: selectedPost } = useQuery({
    queryKey: ['post', selectedPostId],
    queryFn: () => getPost(selectedPostId!),
    enabled: !!selectedPostId,
  });

  const heartMutation = useMutation({
    mutationFn: toggleHeart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-recent-posts'] });
      if (selectedPostId) {
        queryClient.invalidateQueries({ queryKey: ['post', selectedPostId] });
      }
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      createComment(postId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-recent-posts'] });
      if (selectedPostId) {
        queryClient.invalidateQueries({ queryKey: ['post', selectedPostId] });
      }
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      updateComment(commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-recent-posts'] });
      if (selectedPostId) {
        queryClient.invalidateQueries({ queryKey: ['post', selectedPostId] });
      }
      toast({
        title: "댓글이 수정되었습니다",
      });
    },
  });

  const softDeletePostMutation = useMutation({
    mutationFn: softDeletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-recent-posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setSelectedPostId(null);
      toast({
        title: "게시물이 삭제되었습니다",
      });
    },
  });

  const softDeleteCommentMutation = useMutation({
    mutationFn: softDeleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-recent-posts'] });
      if (selectedPostId) {
        queryClient.invalidateQueries({ queryKey: ['post', selectedPostId] });
      }
      toast({
        title: "댓글이 삭제되었습니다",
      });
    },
  });

  // Redirect if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">관리자 대시보드</h1>
            <Button variant="outline" onClick={() => setLocation("/")}>
              메인으로
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("stats")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "stats"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                통계
              </div>
            </button>
            <button
              onClick={() => setActiveTab("weekly")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "weekly"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                주간별 제출 현황
              </div>
            </button>
            <button
              onClick={() => setActiveTab("approved-users")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "approved-users"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                승인 사용자 관리
              </div>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {activeTab === "stats" && (
          <>
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">로딩 중...</p>
              </div>
            ) : (
              <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.users}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">총 게시글</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.posts}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">총 댓글</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.comments}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">총 좋아요</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.hearts}</div>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Posts Chart */}
            {weeklyStats && weeklyStats.length > 0 && (
              <WeeklyPostsChart data={weeklyStats} />
            )}

            {/* User Weekly Post Status */}
            <UserWeeklyPostStatus />

            {/* Recent Posts */}
            <Card>
              <CardHeader>
                <CardTitle>최근 게시글</CardTitle>
                <CardDescription>최근 작성된 게시글 10개</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentPosts?.map((post: any) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedPostId(post.id)}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold">{post.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          작성자: {post.user?.name} ({post.user?.email})
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(post.created_at).toLocaleString('ko-KR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {post.heart_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {post.comment_count}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
            )}
          </>
        )}

        {activeTab === "weekly" && <UserWeeklyPostStatus />}

        {activeTab === "approved-users" && <ApprovedUserManagement />}
      </main>

      {selectedPostId && selectedPost && (
        <PostDetailModal
          open={true}
          onOpenChange={(open) => !open && setSelectedPostId(null)}
          isAdmin={true}
          isLoading={false}
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
            // 관리자 페이지에서는 편집 기능 비활성화하거나, 원하면 구현 가능
            toast({
              title: "관리자 페이지에서는 편집할 수 없습니다",
              description: "메인 페이지에서 편집해주세요",
            });
          }}
          onDelete={() => {
            if (confirm("정말 삭제하시겠습니까?")) {
              softDeletePostMutation.mutate(selectedPostId);
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
            heartMutation.mutate(selectedPostId);
          }}
          onCommentSubmit={(content) => {
            if (!user) {
              toast({
                title: "로그인이 필요합니다",
                variant: "destructive",
              });
              return;
            }
            commentMutation.mutate({ postId: selectedPostId, content });
          }}
          onEditComment={(commentId, content) => {
            if (!user) {
              toast({
                title: "로그인이 필요합니다",
                variant: "destructive",
              });
              return;
            }
            updateCommentMutation.mutate({ commentId, content });
          }}
          onDeleteComment={(commentId) => {
            if (confirm("정말 댓글을 삭제하시겠습니까?")) {
              softDeleteCommentMutation.mutate(commentId);
            }
          }}
        />
      )}
    </div>
  );
}
