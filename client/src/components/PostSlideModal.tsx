import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getPost } from "@/lib/supabase-api";
import { useAuth } from "@/contexts/AuthContext";

interface PostSlideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postIds: string[];
  userName: string;
  week: string;
}

export function PostSlideModal({
  open,
  onOpenChange,
  postIds,
  userName,
  week,
}: PostSlideModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { user } = useAuth();

  const currentPostId = postIds[currentIndex];

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", currentPostId],
    queryFn: () => getPost(currentPostId),
    enabled: open && !!currentPostId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

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
                className="max-w-full max-h-full object-contain"
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
    </Dialog>
  );
}
