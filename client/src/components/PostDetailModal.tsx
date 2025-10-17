import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Edit, Trash2 } from "lucide-react";
import { useState } from "react";

export interface Comment {
  id: string;
  author: {
    name: string;
    profileImage?: string;
  };
  content: string;
  isOwn?: boolean;
}

export interface PostDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    id: string;
    imageUrl: string;
    title: string;
    content: string;
    week: string;
    author: {
      name: string;
      profileImage?: string;
    };
    heartCount: number;
    isLiked?: boolean;
    comments: Comment[];
    isOwn?: boolean;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onLike?: () => void;
  onCommentSubmit?: (comment: string) => void;
}

export function PostDetailModal({
  open,
  onOpenChange,
  post,
  onEdit,
  onDelete,
  onLike,
  onCommentSubmit,
}: PostDetailModalProps) {
  const [newComment, setNewComment] = useState("");

  const handleCommentSubmit = () => {
    if (newComment.trim() && onCommentSubmit) {
      onCommentSubmit(newComment);
      setNewComment("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-0 gap-0 h-[90vh]" data-testid="modal-post-detail">
        <div className="grid md:grid-cols-[60%_40%] h-full">
          <div className="bg-muted flex items-center justify-center relative overflow-hidden">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-full object-contain"
              data-testid="img-post-detail"
            />
          </div>
          <div className="flex flex-col h-full">
            <DialogHeader className="p-6 pb-4 border-b shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.author.profileImage} />
                    <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-base" data-testid="text-post-detail-title">{post.title}</DialogTitle>
                    <p className="text-sm text-muted-foreground" data-testid="text-post-detail-author">
                      {post.author.name}
                    </p>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
              <div className="space-y-3">
                <Badge data-testid="badge-week-detail">{post.week}</Badge>
                <p className="text-sm leading-relaxed" data-testid="text-post-detail-content">{post.content}</p>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  variant={post.isLiked ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  onClick={onLike}
                  data-testid="button-like"
                >
                  <Heart className={`h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
                  <span data-testid="text-heart-count-modal">{post.heartCount}</span>
                </Button>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm" data-testid="text-comment-count-modal">{post.comments.length}</span>
                </div>
              </div>

              {post.isOwn && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" onClick={onEdit} data-testid="button-edit">
                    <Edit className="h-4 w-4 mr-2" />
                    수정
                  </Button>
                  <Button variant="outline" size="sm" onClick={onDelete} data-testid="button-delete">
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제
                  </Button>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold">댓글 {post.comments.length}개</h4>
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3" data-testid={`comment-${comment.id}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.author.profileImage} />
                      <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium" data-testid="text-comment-author">{comment.author.name}</p>
                        {comment.isOwn && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-6 px-2" data-testid={`button-edit-comment-${comment.id}`}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 px-2" data-testid={`button-delete-comment-${comment.id}`}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground" data-testid="text-comment-content">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t bg-background shrink-0">
              <div className="flex gap-2">
                <Textarea
                  placeholder="댓글을 입력하세요..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px] resize-none"
                  data-testid="input-comment"
                />
                <Button onClick={handleCommentSubmit} data-testid="button-submit-comment">
                  작성
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
