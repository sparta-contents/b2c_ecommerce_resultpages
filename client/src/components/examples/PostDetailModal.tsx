import { useState } from "react";
import { PostDetailModal } from "../PostDetailModal";
import { Button } from "@/components/ui/button";
import thumbnail2 from "@assets/generated_images/Sample_artwork_thumbnail_2_a8775b77.png";

export default function PostDetailModalExample() {
  const [open, setOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [heartCount, setHeartCount] = useState(42);

  const post = {
    id: "2",
    imageUrl: thumbnail2,
    title: "미니멀리스트 풍경 디지털 아트",
    content: "푸른색과 오렌지색 석양을 활용한 미니멀리스트 풍경 디지털 아트입니다. 깔끔한 기하학적 구성과 현대적인 일러스트 스타일로 창의적인 포트폴리오에 적합합니다. 색상의 대비와 단순함이 조화를 이루어 시각적으로 편안하면서도 인상적인 작품을 만들어냅니다.",
    author: {
      name: "박민준",
      profileImage: "https://i.pravatar.cc/150?img=12",
    },
    heartCount,
    isLiked,
    comments: [
      {
        id: "c1",
        author: { name: "이서연", profileImage: "https://i.pravatar.cc/150?img=5" },
        content: "색감이 정말 아름답네요! 어떤 툴로 작업하셨나요?",
      },
      {
        id: "c2",
        author: { name: "최지훈", profileImage: "https://i.pravatar.cc/150?img=8" },
        content: "미니멀한 느낌이 좋습니다 👍",
        isOwn: true,
      },
    ],
    isOwn: true,
  };

  return (
    <div>
      <Button onClick={() => setOpen(true)}>모달 열기</Button>
      <PostDetailModal
        open={open}
        onOpenChange={setOpen}
        post={post}
        onEdit={() => console.log("Edit clicked")}
        onDelete={() => console.log("Delete clicked")}
        onLike={() => {
          setIsLiked(!isLiked);
          setHeartCount(isLiked ? heartCount - 1 : heartCount + 1);
        }}
        onCommentSubmit={(comment) => console.log("New comment:", comment)}
      />
    </div>
  );
}
