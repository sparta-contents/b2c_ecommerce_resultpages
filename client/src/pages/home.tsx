import { useState, useEffect, useRef, useCallback } from "react";
import { useInfiniteQuery, useQuery, useMutation } from "@tanstack/react-query";
import { Header, SortType, WeekFilter } from "@/components/Header";
import { PostGrid } from "@/components/PostGrid";
import { PostDetailModal } from "@/components/PostDetailModal";
import { CreatePostModal } from "@/components/CreatePostModal";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { getPosts, getPost, toggleHeart, createComment, updateComment, softDeletePost, softDeleteComment } from "@/lib/supabase-api";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const [sortBy, setSortBy] = useState<SortType>("latest");
  const [weekFilter, setWeekFilter] = useState<WeekFilter>("all");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editPostId, setEditPostId] = useState<string | null>(null);
  const { toast } = useToast();

  const { user, loading, isAdmin, signInWithGoogle, signOut } = useAuth();

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
    error: postsError
  } = useInfiniteQuery({
    queryKey: ['posts', sortBy, weekFilter, showMyPosts ? user?.id : null],
    queryFn: ({ pageParam = 0 }) => {
      const limit = pageParam === 0 ? 100 : 30; // First page: 100, subsequent: 30
      return getPosts(sortBy, showMyPosts && user ? user.id : undefined, limit, pageParam, weekFilter !== 'all' ? weekFilter : undefined);
    },
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((sum, page) => sum + page.posts.length, 0);
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
  const posts = data?.pages.flatMap(page => page.posts) || [];

  // 게시글 로딩 에러 처리
  useEffect(() => {
    if (postsError) {
      console.error('게시글 로딩 에러:', postsError);
      toast({
        title: "게시글을 불러오는데 실패했습니다",
        description: postsError instanceof Error ? postsError.message : "알 수 없는 오류",
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [postsError, toast]);

  // Debug: posts 데이터 모니터링
  useEffect(() => {
    console.log('Posts 상태:', {
      postsCount: posts.length,
      postsLoading,
      hasError: !!postsError,
      authLoading: loading,
      hasNextPage,
      isFetchingNextPage,
    });
  }, [posts, postsLoading, postsError, loading, hasNextPage, isFetchingNextPage]);

  // Infinite scroll implementation using Intersection Observer
  useEffect(() => {
    if (postsLoading || !hasNextPage || isFetchingNextPage) return;

    const currentLoadMoreRef = loadMoreRef.current;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          console.log('Loading more posts...');
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
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

  const { data: selectedPost, refetch: refetchPost, isLoading: selectedPostLoading } = useQuery({
    queryKey: ['post', selectedPostId],
    queryFn: async () => {
      console.log('getPost 호출됨, selectedPostId:', selectedPostId);
      const post = await getPost(selectedPostId!);
      console.log('getPost 결과:', post);
      return post;
    },
    enabled: !!selectedPostId,
  });

  const { data: editPost } = useQuery({
    queryKey: ['post', editPostId],
    queryFn: () => getPost(editPostId!),
    enabled: !!editPostId,
  });

  // Debug: selectedPostId 변경 모니터링
  useEffect(() => {
    console.log('selectedPostId 변경됨:', selectedPostId);
  }, [selectedPostId]);

  // Debug: selectedPost 변경 모니터링
  useEffect(() => {
    console.log('selectedPost 변경됨:', selectedPost);
    console.log('selectedPostLoading:', selectedPostLoading);
  }, [selectedPost, selectedPostLoading]);

  const heartMutation = useMutation({
    mutationFn: toggleHeart,
    onSuccess: (_, postId) => {
      // Update infinite query cache
      queryClient.setQueryData(
        ['posts', sortBy, weekFilter, showMyPosts ? user?.id : null],
        (oldData: any) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              posts: page.posts.map((post: any) => {
                if (post.id === postId) {
                  const isCurrentlyLiked = post.hearts?.some((h: any) => h.user_id === user?.id);
                  return {
                    ...post,
                    heart_count: isCurrentlyLiked ? post.heart_count - 1 : post.heart_count + 1,
                    hearts: isCurrentlyLiked
                      ? post.hearts.filter((h: any) => h.user_id !== user?.id)
                      : [...(post.hearts || []), { user_id: user?.id }]
                  };
                }
                return post;
              })
            }))
          };
        }
      );

      // Update single post cache if modal is open
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

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      updateComment(commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      if (selectedPostId) {
        queryClient.invalidateQueries({ queryKey: ['post', selectedPostId] });
      }
      toast({
        title: "댓글이 수정되었습니다",
      });
    },
    onError: (error) => {
      console.error('댓글 수정 실패:', error);
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
      console.log('게시글 삭제 완료, 새로고침 시작');
      toast({
        title: "게시물이 삭제되었습니다",
      });
      // 화면 새로고침
      window.location.reload();
    },
    onError: (error) => {
      console.error('게시글 삭제 실패:', error);
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
    console.log('handleLogout 호출됨');
    setShowMyPosts(false);
    await signOut();
  };

  // Show loading screen while auth is loading (max 3 seconds)
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">로딩 중...</p>
          <p className="text-xs text-muted-foreground mt-2">
            {user ? '사용자 정보 확인 중...' : '인증 확인 중...'}
          </p>
        </div>
      </div>
    );
  }

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
        isAdmin={isAdmin}
        user={user ? {
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          profileImage: user.user_metadata?.avatar_url
        } : undefined}
        sortBy={sortBy}
        weekFilter={weekFilter}
        onSortChange={setSortBy}
        onWeekFilterChange={setWeekFilter}
        onWriteClick={() => {
          if (!user) {
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
        onAdminClick={() => setLocation("/admin")}
        onLogoClick={() => {
          setShowMyPosts(false);
          setSelectedPostId(null);
          setLocation("/");
        }}
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
          <>
            <PostGrid
              posts={formattedPosts}
              onPostClick={(id) => {
                console.log('게시글 클릭됨, id:', id);
                setSelectedPostId(id);
              }}
              onLike={(postId, e) => {
                if (!user) {
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
                  <p className="text-muted-foreground">더 많은 게시글을 불러오는 중...</p>
                ) : (
                  <p className="text-muted-foreground text-sm">스크롤하여 더 보기</p>
                )}
              </div>
            )}

            {!hasNextPage && posts.length > 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">모든 게시글을 불러왔습니다</p>
              </div>
            )}
          </>
        )}
      </main>

      {selectedPostId && (
        selectedPost ? (
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
              setEditPostId(selectedPostId);
              setSelectedPostId(null);
            }}
            onDelete={() => {
              if (confirm("정말 삭제하시겠습니까?")) {
                softDeletePostMutation.mutate(selectedPostId!);
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
        )
      )}

      <CreatePostModal
        open={showCreateModal || !!editPostId}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false);
            setEditPostId(null);
          }
        }}
        editMode={!!editPostId}
        initialData={editPost ? {
          id: editPost.id,
          title: editPost.title,
          content: editPost.content,
          week: editPost.week,
          image_url: editPost.image_url,
        } : undefined}
      />
    </div>
  );
}
