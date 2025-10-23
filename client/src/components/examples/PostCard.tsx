import { PostCard } from "../PostCard";
import thumbnail1 from "@assets/generated_images/Sample_artwork_thumbnail_1_5e0832bc.png";

export default function PostCardExample() {
  return (
    <div className="max-w-sm">
      <PostCard
        id="1"
        imageUrl={thumbnail1}
        title="추상적인 디지털 아트워크"
        author={{
          name: "김지수",
          profileImage: "https://i.pravatar.cc/150?img=1",
        }}
        contentPreview="현대적인 기하학적 패턴과 생동감 있는 그라디언트를 활용한 디지털 아트 작품입니다."
        heartCount={24}
        commentCount={8}
        onClick={() => console.log("Post clicked")}
      />
    </div>
  );
}
