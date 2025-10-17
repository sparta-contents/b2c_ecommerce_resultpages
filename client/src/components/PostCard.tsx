import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle } from "lucide-react";

export interface PostCardProps {
  id: string;
  imageUrl: string;
  title: string;
  author: {
    name: string;
    profileImage?: string;
  };
  contentPreview: string;
  heartCount: number;
  commentCount: number;
  onClick?: () => void;
}

export function PostCard({
  imageUrl,
  title,
  author,
  contentPreview,
  heartCount,
  commentCount,
  onClick,
}: PostCardProps) {
  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group"
      onClick={onClick}
      data-testid={`card-post-${title}`}
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-lg line-clamp-1" data-testid="text-post-title">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={author.profileImage} />
            <AvatarFallback>{author.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground" data-testid="text-author-name">
            {author.name}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2" data-testid="text-content-preview">
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
}
