import { PostGrid } from "../PostGrid";
import thumbnail1 from "@assets/generated_images/Sample_artwork_thumbnail_1_5e0832bc.png";
import thumbnail2 from "@assets/generated_images/Sample_artwork_thumbnail_2_a8775b77.png";
import thumbnail3 from "@assets/generated_images/Sample_artwork_thumbnail_3_a4c16f1e.png";

export default function PostGridExample() {
  const posts = [
    {
      id: "1",
      imageUrl: thumbnail1,
      title: "추상적인 디지털 아트워크",
      author: {
        name: "김지수",
        profileImage: "https://i.pravatar.cc/150?img=1",
      },
      contentPreview: "현대적인 기하학적 패턴과 생동감 있는 그라디언트를 활용한 디지털 아트 작품입니다.",
      heartCount: 24,
      commentCount: 8,
    },
    {
      id: "2",
      imageUrl: thumbnail2,
      title: "미니멀리스트 풍경",
      author: {
        name: "박민준",
        profileImage: "https://i.pravatar.cc/150?img=12",
      },
      contentPreview: "푸른색과 오렌지색 석양을 활용한 미니멀리스트 풍경 디지털 아트입니다.",
      heartCount: 42,
      commentCount: 15,
    },
    {
      id: "3",
      imageUrl: thumbnail3,
      title: "테크놀로지 테마 일러스트",
      author: {
        name: "이서연",
        profileImage: "https://i.pravatar.cc/150?img=5",
      },
      contentPreview: "그라디언트와 흐르는 선을 활용한 추상적인 테크놀로지 테마 일러스트입니다.",
      heartCount: 31,
      commentCount: 12,
    },
    {
      id: "4",
      imageUrl: thumbnail1,
      title: "모던 컬러 스터디",
      author: {
        name: "최지훈",
        profileImage: "https://i.pravatar.cc/150?img=8",
      },
      contentPreview: "다양한 색상 조합을 실험한 추상 작품입니다.",
      heartCount: 18,
      commentCount: 5,
    },
  ];

  return (
    <div className="p-8">
      <PostGrid posts={posts} onPostClick={(id) => console.log("Post clicked:", id)} />
    </div>
  );
}
