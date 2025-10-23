import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Pencil, Trash2 } from "lucide-react";

export interface PostCardProps {
  id: string;
  imageUrl: string;
  title: string;
  week: string;
  author: {
    name: string;
    profileImage?: string;
  };
  contentPreview: string;
  heartCount: number;
  commentCount: number;
  onClick?: () => void;
  isAdmin?: boolean;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export const PostCard = memo(function PostCard({
  imageUrl,
  title,
  week,
  author,
  contentPreview,
  heartCount,
  commentCount,
  onClick,
  isAdmin = false,
  onEdit,
  onDelete,
}: PostCardProps) {
  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group"
      onClick={() => {
        console.log('PostCard onClick 호출됨, title:', title);
        onClick?.();
      }}
      data-testid={`card-post-${title}`}
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        {isAdmin && (
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(e);
                }}
                data-testid="button-admin-edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="icon"
                variant="destructive"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(e);
                }}
                data-testid="button-admin-delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <Badge data-testid="badge-week">{week}</Badge>
          <h3 className="font-semibold text-lg line-clamp-1" data-testid="text-post-title">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={author.profileImage} />
            <AvatarFallback>{author.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground" data-testid="text-author-name">
            {author.name}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-line" data-testid="text-content-preview">
          {contentPreview}
        </p>
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Heart className="h-4 w-4" />
            <span className="text-sm" data-testid="text-heart-count">{heartCount}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm" data-testid="text-comment-count">{commentCount}</span>
          </div>
        </div>
      </div>
    </Card>
  );
});
