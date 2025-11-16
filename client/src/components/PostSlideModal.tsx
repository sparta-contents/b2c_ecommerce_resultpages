import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2, XCircle, Circle } from "lucide-react";
import { getPost, submitHomeworkReview, getHomeworkReview, deleteHomeworkReview } from "@/lib/supabase-api";
import { useAuth } from "@/contexts/AuthContext";
import { ImageLightbox } from "./ImageLightbox";
import { useToast } from "@/hooks/use-toast";
import type { HomeworkReviewStatus } from "@/lib/supabase-hooks";

interface PostSlideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postIds: string[];
  userName: string;
  userId: string;  // Added: user ID for homework review
  week: string;
}

export function PostSlideModal({
  open,
  onOpenChange,
  postIds,
  userName,
  userId,
  week,
}: PostSlideModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const currentPostId = postIds[currentIndex];

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", currentPostId],
    queryFn: () => getPost(currentPostId, user?.id),
    enabled: open && !!currentPostId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch current homework review status (admin only)
  const { data: currentReview, isLoading: reviewLoading } = useQuery({
    queryKey: ["homework-review", userId, week],
    queryFn: () => getHomeworkReview(userId, week),
    enabled: open && isAdmin,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Get current review status
  const currentStatus: HomeworkReviewStatus = currentReview
    ? currentReview.status
    : 'not_reviewed';

  // Mutation for submitting homework review
  const submitReviewMutation = useMutation({
    mutationFn: ({ status }: { status: 'passed' | 'failed' }) =>
      submitHomeworkReview(userId, week, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework-review", userId, week] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-weekly-review-status"] });
      toast({
        title: "평가 완료",
        description: "숙제 평가가 저장되었습니다.",
        duration: 3000, // 3초 후 자동으로 사라짐
      });
    },
    onError: (error) => {
      console.error('Submit review error:', error);
      toast({
        title: "평가 실패",
        description: "평가 저장에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
        duration: 3000, // 3초 후 자동으로 사라짐
      });
    },
  });

  // Mutation for deleting homework review
  const deleteReviewMutation = useMutation({
    mutationFn: () => deleteHomeworkReview(userId, week),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework-review", userId, week] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-weekly-review-status"] });
      toast({
        title: "평가 삭제",
        description: "평가가 삭제되었습니다.",
        duration: 3000, // 3초 후 자동으로 사라짐
      });
    },
    onError: (error) => {
      console.error('Delete review error:', error);
      toast({
        title: "삭제 실패",
        description: "평가 삭제에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
        duration: 3000, // 3초 후 자동으로 사라짐
      });
    },
  });

  const handleReviewSubmit = (status: 'passed' | 'failed') => {
    submitReviewMutation.mutate({ status });
  };

  const handleReviewDelete = () => {
    deleteReviewMutation.mutate();
  };

  // Reset index when modal opens or postIds change
  useEffect(() => {
    setCurrentIndex(0);
  }, [postIds, open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (e.key === "ArrowRight" && currentIndex < postIds.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentIndex, postIds.length, onOpenChange]);

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < postIds.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl h-[50vh] p-0 gap-0"
        aria-describedby={undefined}
      >
        <DialogHeader className="px-6 py-3 border-b">
          <DialogTitle className="flex items-center justify-between text-lg font-semibold">
            <span>
              {week} - {userName}
            </span>
            {postIds.length > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrev}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                  {currentIndex + 1} / {postIds.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNext}
                  disabled={currentIndex === postIds.length - 1}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : post ? (
          <div className="grid md:grid-cols-[60%_40%] h-full overflow-hidden">
            {/* Image Section */}
            <div className="bg-muted flex items-center justify-center relative h-full">
              <img
                src={post.image_url}
                alt={post.title}
                className="max-w-full max-h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setLightboxOpen(true)}
              />
            </div>

            {/* Content Section */}
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Author Info */}
                <div className="flex items-center gap-3 pb-4 border-b">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.user.profile_image || undefined} />
                    <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{post.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {post.user.name}
                    </p>
                  </div>
                </div>

                {/* Week Badge */}
                <Badge
                  className={
                    post.week === "공지"
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : ""
                  }
                >
                  {post.week}
                </Badge>

                {/* Content */}
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">좋아요</span>
                    <span className="text-sm text-muted-foreground">
                      {post.heart_count}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">댓글</span>
                    <span className="text-sm text-muted-foreground">
                      {post.comments?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Comments */}
                {post.comments && post.comments.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-3">
                      댓글 {post.comments.length}개
                    </h4>
                    <div className="space-y-3">
                      {post.comments.map((comment: any) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={comment.user.profile_image || undefined}
                            />
                            <AvatarFallback>
                              {comment.user.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {comment.user.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Review Section */}
                {isAdmin && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-3">과제 평가</h4>
                    <div className="space-y-3">
                      {/* Current Status */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">현재 상태:</span>
                        {currentStatus === 'passed' && (
                          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                            <CheckCircle2 className="h-4 w-4" />
                            통과
                          </span>
                        )}
                        {currentStatus === 'failed' && (
                          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                            <XCircle className="h-4 w-4" />
                            미통과
                          </span>
                        )}
                        {currentStatus === 'not_reviewed' && (
                          <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <Circle className="h-4 w-4" />
                            미평가
                          </span>
                        )}
                      </div>

                      {/* Review Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={currentStatus === 'passed' ? 'default' : 'outline'}
                          className={currentStatus === 'passed' ? 'bg-green-600 hover:bg-green-700' : ''}
                          onClick={() => handleReviewSubmit('passed')}
                          disabled={submitReviewMutation.isPending || deleteReviewMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          통과
                        </Button>
                        <Button
                          size="sm"
                          variant={currentStatus === 'failed' ? 'default' : 'outline'}
                          className={currentStatus === 'failed' ? 'bg-red-600 hover:bg-red-700' : ''}
                          onClick={() => handleReviewSubmit('failed')}
                          disabled={submitReviewMutation.isPending || deleteReviewMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          미통과
                        </Button>
                        {currentStatus !== 'not_reviewed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleReviewDelete}
                            disabled={submitReviewMutation.isPending || deleteReviewMutation.isPending}
                          >
                            <Circle className="h-4 w-4 mr-1" />
                            미평가로 변경
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">
              게시글을 불러올 수 없습니다.
            </p>
          </div>
        )}
      </DialogContent>

      {/* Image Lightbox */}
      {post && (
        <ImageLightbox
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          imageUrl={post.image_url}
          imageAlt={post.title}
        />
      )}
    </Dialog>
  );
}
