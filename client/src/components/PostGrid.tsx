import { PostCard, PostCardProps } from "./PostCard";

export interface PostGridProps {
  posts: PostCardProps[];
  onPostClick: (postId: string) => void;
}

export function PostGrid({ posts, onPostClick }: PostGridProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground text-lg">게시물이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          {...post}
          onClick={() => onPostClick(post.id)}
        />
      ))}
    </div>
  );
}
