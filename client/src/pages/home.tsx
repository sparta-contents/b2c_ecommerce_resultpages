import { useState, useEffect, useRef, useCallback } from "react";
import { useInfiniteQuery, useQuery, useMutation } from "@tanstack/react-query";
import { Header, SortType, WeekFilter } from "@/components/Header";
import { PostGrid } from "@/components/PostGrid";
import { PostDetailModal } from "@/components/PostDetailModal";
import { CreatePostModal } from "@/components/CreatePostModal";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient } from "@/lib/queryClient";
import {
  getPosts,
  getPost,
  toggleHeart,
  createComment,
  updateComment,
  softDeletePost,
  softDeleteComment,
  getUserProfile,
} from "@/lib/supabase-api";
import { useToast } from "@/hooks/use-toast";
import { trackPostView, trackLike, trackComment, trackLogin, trackLogout } from "@/lib/analytics";

export default function Home() {
  const [, setLocation] = useLocation();
  const [sortBy, setSortBy] = useState<SortType>("latest");
  const [weekFilter, setWeekFilter] = useState<WeekFilter>("all");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editPostId, setEditPostId] = useState<string | null>(null);
  const { toast } = useToast();

  const { user, loading, isAdmin, isAuthenticated, signInWithGoogle, signOut } = useAuth();

  // 사용자 프로필 조회 (업데이트된 프로필 이미지 표시용)
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getUserProfile(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5분
  });

  // Infinite scroll observer ref
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Hooks must be called before any conditional returns
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: postsLoading,
    error: postsError,
  } = useInfiniteQuery({
    queryKey: ["posts", sortBy, weekFilter, showMyPosts ? user?.id : null, user?.id],
    queryFn: ({ pageParam = 0 }) => {
      const limit = 28; // Load 28 posts per page for better performance
      return getPosts(
        sortBy,
        showMyPosts && user ? user.id : undefined,
        limit,
        pageParam,
        weekFilter !== "all" ? weekFilter : undefined,
        user?.id // Pass current user ID for optimized heart queries
      );
    },
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce(
        (sum, page) => sum + page.posts.length,
        0
      );
      if (loadedCount >= lastPage.total) {
        return undefined; // No more pages
      }
      return loadedCount; // Return the offset for next page
    },
    initialPageParam: 0,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes - cache data to improve performance
    gcTime: 1000 * 60 * 10, // 10 minutes - keep unused data in cache
  });

  // Flatten all posts from pages
  const posts = data?.pages.flatMap((page) => page.posts) || [];

  // 게시글 로딩 에러 처리
  useEffect(() => {
    if (postsError) {
      console.error("게시글 로딩 에러:", postsError);
      toast({
        title: "게시글을 불러오는데 실패했습니다",
        description:
          postsError instanceof Error ? postsError.message : "알 수 없는 오류",
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [postsError, toast]);

  // Infinite scroll implementation using Intersection Observer
  useEffect(() => {
    if (postsLoading || !hasNextPage || isFetchingNextPage) return;

    const currentLoadMoreRef = loadMoreRef.current;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (currentLoadMoreRef) {
      observerRef.current.observe(currentLoadMoreRef);
    }

    return () => {
      if (observerRef.current && currentLoadMoreRef) {
        observerRef.current.unobserve(currentLoadMoreRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, postsLoading]);

  const {
    data: selectedPost,
    refetch: refetchPost,
    isLoading: selectedPostLoading,
  } = useQuery({
    queryKey: ["post", selectedPostId],
    queryFn: async () => {
      const post = await getPost(selectedPostId!, user?.id);
      // 게시글 조회 이벤트 추적
      if (post) {
        trackPostView(post.id, post.title);
      }
      return post;
    },
    enabled: !!selectedPostId,
  });

  const { data: editPost } = useQuery({
    queryKey: ["post", editPostId],
    queryFn: () => getPost(editPostId!, user?.id),
    enabled: !!editPostId,
  });

  const heartMutation = useMutation({
    mutationFn: toggleHeart,
    // Optimistic update - update UI immediately before server responds
    onMutate: async (postId) => {
      const queryKey = ["posts", sortBy, weekFilter, showMyPosts ? user?.id : null, user?.id];

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update cache
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: any) => {
              if (post.id === postId) {
                const isCurrentlyLiked = post.hearts?.some(
                  (h: any) => h.user_id === user?.id
                );
                const newHeartCount = isCurrentlyLiked
                  ? post.heart_count - 1
                  : post.heart_count + 1;

                return {
                  ...post,
                  heart_count: newHeartCount,
                  hearts: isCurrentlyLiked
                    ? post.hearts.filter((h: any) => h.user_id !== user?.id)
                    : [...(post.hearts || []), { user_id: user?.id }],
                };
              }
              return post;
            }),
          })),
        };
      });

      // Return context with previous data for rollback
      return { previousData, queryKey };
    },
    // On error, rollback to previous state
    onError: (err, postId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      toast({
        title: "오류가 발생했습니다",
        description: "다시 시도해주세요",
        variant: "destructive",
      });
    },
    // Trust optimistic update - don't refetch immediately
    // Database trigger handles heart_count automatically
    onSuccess: (_, postId) => {
      // We trust the optimistic update and don't refetch
      // The next natural data fetch will sync with server

      // 좋아요 이벤트 추적
      const post = posts.find(p => p.id === postId);
      const isLiked = post?.hearts?.some((h: any) => h.user_id === user?.id);
      trackLike(postId, !isLiked); // 이전 상태의 반대가 새로운 상태
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      createComment(postId, content),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (selectedPostId) {
        queryClient.invalidateQueries({ queryKey: ["post", selectedPostId] });
      }
      // 댓글 작성 이벤트 추적
      trackComment(postId);
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({
      commentId,
      content,
    }: {
      commentId: string;
      content: string;
    }) => updateComment(commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (selectedPostId) {
        queryClient.invalidateQueries({ queryKey: ["post", selectedPostId] });
      }
      toast({
        title: "댓글이 수정되었습니다",
      });
    },
    onError: (error) => {
      console.error("댓글 수정 실패:", error);
      toast({
        title: "댓글 수정에 실패했습니다",
        description: error instanceof Error ? error.message : "알 수 없는 오류",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const softDeletePostMutation = useMutation({
    mutationFn: softDeletePost,
    onSuccess: () => {
      toast({
        title: "게시물이 삭제되었습니다",
      });
      // 화면 새로고침
      window.location.reload();
    },
    onError: (error) => {
      console.error("게시글 삭제 실패:", error);
      toast({
        title: "게시물 삭제에 실패했습니다",
        description: error instanceof Error ? error.message : "알 수 없는 오류",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const softDeleteCommentMutation = useMutation({
    mutationFn: softDeleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (selectedPostId) {
        queryClient.invalidateQueries({ queryKey: ["post", selectedPostId] });
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
    setShowMyPosts(false);
    trackLogout(); // 로그아웃 이벤트 추적
    await signOut();
  };

  // Show loading screen while auth is loading (max 3 seconds)
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">로딩 중...</p>
          <p className="text-xs text-muted-foreground mt-2">
            {user ? "사용자 정보 확인 중..." : "인증 확인 중..."}
          </p>
        </div>
      </div>
    );
  }

  // Convert Supabase post data to component format
  const formattedPosts = posts.map((post) => ({
    id: post.id,
    title: post.title,
    contentPreview:
      post.content.slice(0, 60) + (post.content.length > 60 ? "..." : ""),
    imageUrl: post.image_url,
    week: post.week,
    author: {
      name: post.user.name,
      profileImage: post.user.profile_image || undefined,
    },
    heartCount: post.heart_count,
    commentCount: post.comment_count,
    createdAt: post.created_at,
    isLiked: post.hearts?.some((h) => h.user_id === user?.id) || false,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header
        isLoggedIn={isAuthenticated}
        isAdmin={isAdmin}
        user={
          isAuthenticated && user
            ? {
                name:
                  userProfile?.name ||
                  user.user_metadata?.full_name ||
                  user.email?.split("@")[0] ||
                  "User",
                profileImage: profileLoading
                  ? undefined
                  : userProfile?.profile_image ||
                    user.user_metadata?.avatar_url,
              }
            : undefined
        }
        sortBy={sortBy}
        onSortChange={setSortBy}
        onWriteClick={() => {
          if (!isAuthenticated) {
            toast({
              title: "로그인이 필요합니다",
              description: "Google 계정으로 로그인해주세요",
            });
            // 1초 후 로그인 실행
            setTimeout(() => {
              signInWithGoogle();
            }, 1000);
            return;
          }
          setShowCreateModal(true);
        }}
        onLoginClick={signInWithGoogle}
        onLogoutClick={handleLogout}
        onMyPostsClick={handleMyPostsClick}
        onProfileEditClick={() => setLocation("/profile")}
        onAdminClick={() => setLocation("/admin")}
        onLogoClick={() => {
          setShowMyPosts(false);
          setSelectedPostId(null);
          setLocation("/");
        }}
      />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="mb-6">
          <h2
            className="text-2xl font-semibold mb-4"
            data-testid={
              showMyPosts ? "text-my-posts-title" : "text-community-title"
            }
          >
            {showMyPosts ? "내가 쓴 글" : "스파르타 셀러 커뮤니티"}
          </h2>

          {/* 주차 필터 버튼 */}
          {!showMyPosts && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={weekFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setWeekFilter("all")}
                data-testid="button-week-all"
              >
                전체
              </Button>
              <Button
                variant={weekFilter === "공지" ? "default" : "outline"}
                size="sm"
                onClick={() => setWeekFilter("공지")}
                data-testid="button-week-notice"
              >
                공지
              </Button>
              <Button
                variant={weekFilter === "1주차 과제" ? "default" : "outline"}
                size="sm"
                onClick={() => setWeekFilter("1주차 과제")}
                data-testid="button-week-1"
              >
                1주차
              </Button>
              <Button
                variant={weekFilter === "2주차 과제" ? "default" : "outline"}
                size="sm"
                onClick={() => setWeekFilter("2주차 과제")}
                data-testid="button-week-2"
              >
                2주차
              </Button>
              <Button
                variant={weekFilter === "3주차 과제" ? "default" : "outline"}
                size="sm"
                onClick={() => setWeekFilter("3주차 과제")}
                data-testid="button-week-3"
              >
                3주차
              </Button>
              <Button
                variant={weekFilter === "4주차 과제" ? "default" : "outline"}
                size="sm"
                onClick={() => setWeekFilter("4주차 과제")}
                data-testid="button-week-4"
              >
                4주차
              </Button>
              <Button
                variant={weekFilter === "5주차 과제" ? "default" : "outline"}
                size="sm"
                onClick={() => setWeekFilter("5주차 과제")}
                data-testid="button-week-5"
              >
                5주차
              </Button>
              <Button
                variant={weekFilter === "6주차 과제" ? "default" : "outline"}
                size="sm"
                onClick={() => setWeekFilter("6주차 과제")}
                data-testid="button-week-6"
              >
                6주차
              </Button>
            </div>
          )}
        </div>

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
          <>
            <PostGrid
              posts={formattedPosts}
              onPostClick={(id) => {
                setSelectedPostId(id);
              }}
              onLike={(postId, e) => {
                if (!isAuthenticated) {
                  toast({
                    title: "로그인이 필요합니다",
                    description: "Google 계정으로 로그인해주세요",
                  });
                  setTimeout(() => {
                    signInWithGoogle();
                  }, 1000);
                  return;
                }
                heartMutation.mutate(postId);
              }}
            />

            {/* Infinite scroll trigger */}
            {hasNextPage && (
              <div ref={loadMoreRef} className="text-center py-8">
                {isFetchingNextPage ? (
                  <p className="text-muted-foreground">
                    더 많은 게시글을 불러오는 중...
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    스크롤하여 더 보기
                  </p>
                )}
              </div>
            )}

            {!hasNextPage && posts.length > 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  모든 게시글을 불러왔습니다
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {selectedPostId &&
        (selectedPost ? (
          <PostDetailModal
            open={true}
            onOpenChange={(open) => !open && setSelectedPostId(null)}
            isAdmin={isAdmin}
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
              isLiked:
                selectedPost.hearts?.some((h: any) => h.user_id === user?.id) ||
                false,
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
              setEditPostId(selectedPostId);
              setSelectedPostId(null);
            }}
            onDelete={() => {
              if (confirm("정말 삭제하시겠습니까?")) {
                softDeletePostMutation.mutate(selectedPostId!);
              }
            }}
            onLike={() => {
              if (!isAuthenticated) {
                toast({
                  title: "로그인이 필요합니다",
                  variant: "destructive",
                });
                return;
              }
              heartMutation.mutate(selectedPostId!);
            }}
            onCommentSubmit={(content) => {
              if (!isAuthenticated) {
                toast({
                  title: "로그인이 필요합니다",
                  variant: "destructive",
                });
                return;
              }
              commentMutation.mutate({ postId: selectedPostId!, content });
            }}
            onEditComment={(commentId, content) => {
              if (!isAuthenticated) {
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
        ) : (
          <PostDetailModal
            open={true}
            onOpenChange={(open) => !open && setSelectedPostId(null)}
            isAdmin={false}
            isLoading={true}
            post={{
              id: selectedPostId,
              title: "로딩 중...",
              content: "게시물을 불러오는 중입니다...",
              imageUrl: "",
              week: "",
              author: {
                name: "로딩 중...",
              },
              heartCount: 0,
              isLiked: false,
              comments: [],
            }}
          />
        ))}

      <CreatePostModal
        open={showCreateModal || !!editPostId}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false);
            setEditPostId(null);
          }
        }}
        editMode={!!editPostId}
        initialData={
          editPost
            ? {
                id: editPost.id,
                title: editPost.title,
                content: editPost.content,
                week: editPost.week,
                image_url: editPost.image_url,
              }
            : undefined
        }
        isAdmin={isAdmin}
      />
    </div>
  );
}
