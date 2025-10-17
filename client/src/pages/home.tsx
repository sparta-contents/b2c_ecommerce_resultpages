import { useState } from "react";
import { Header, SortType } from "@/components/Header";
import { PostGrid } from "@/components/PostGrid";
import { PostDetailModal } from "@/components/PostDetailModal";
import { useLocation } from "wouter";
import thumbnail1 from "@assets/generated_images/Sample_artwork_thumbnail_1_5e0832bc.png";
import thumbnail2 from "@assets/generated_images/Sample_artwork_thumbnail_2_a8775b77.png";
import thumbnail3 from "@assets/generated_images/Sample_artwork_thumbnail_3_a4c16f1e.png";

// todo: remove mock functionality
const mockPosts = [
  {
    id: "1",
    imageUrl: thumbnail1,
    title: "추상적인 디지털 아트워크",
    author: {
      name: "김지수",
      profileImage: "https://i.pravatar.cc/150?img=1",
    },
    content: "현대적인 기하학적 패턴과 생동감 있는 그라디언트를 활용한 디지털 아트 작품입니다. 분홍색과 보라색 그라디언트가 어우러진 추상적인 일러스트레이션으로, 크리에이티브 포트폴리오에 적합합니다.",
    contentPreview: "현대적인 기하학적 패턴과 생동감 있는 그라디언트를 활용한 디지털 아트 작품입니다.",
    heartCount: 24,
    commentCount: 8,
    isLiked: false,
    comments: [
      {
        id: "c1",
        author: { name: "이서연", profileImage: "https://i.pravatar.cc/150?img=5" },
        content: "색감이 정말 아름답네요!",
      },
      {
        id: "c2",
        author: { name: "최지훈", profileImage: "https://i.pravatar.cc/150?img=8" },
        content: "영감을 받았습니다 👍",
      },
    ],
    isOwn: true,
  },
  {
    id: "2",
    imageUrl: thumbnail2,
    title: "미니멀리스트 풍경 디지털 아트",
    author: {
      name: "박민준",
      profileImage: "https://i.pravatar.cc/150?img=12",
    },
    content: "푸른색과 오렌지색 석양을 활용한 미니멀리스트 풍경 디지털 아트입니다. 깔끔한 기하학적 구성과 현대적인 일러스트 스타일로 창의적인 포트폴리오에 적합합니다.",
    contentPreview: "푸른색과 오렌지색 석양을 활용한 미니멀리스트 풍경 디지털 아트입니다.",
    heartCount: 42,
    commentCount: 15,
    isLiked: false,
    comments: [
      {
        id: "c3",
        author: { name: "정수민", profileImage: "https://i.pravatar.cc/150?img=3" },
        content: "색감 대비가 인상적이네요",
      },
    ],
    isOwn: false,
  },
  {
    id: "3",
    imageUrl: thumbnail3,
    title: "테크놀로지 테마 추상 일러스트",
    author: {
      name: "이서연",
      profileImage: "https://i.pravatar.cc/150?img=5",
    },
    content: "그라디언트와 흐르는 선을 활용한 추상적인 테크놀로지 테마 일러스트입니다. 청록색과 보라색 컬러로 현대적인 크리에이티브 쇼케이스에 적합한 작품입니다.",
    contentPreview: "그라디언트와 흐르는 선을 활용한 추상적인 테크놀로지 테마 일러스트입니다.",
    heartCount: 31,
    commentCount: 12,
    isLiked: true,
    comments: [],
    isOwn: false,
  },
  {
    id: "4",
    imageUrl: thumbnail1,
    title: "모던 컬러 스터디",
    author: {
      name: "최지훈",
      profileImage: "https://i.pravatar.cc/150?img=8",
    },
    content: "다양한 색상 조합을 실험한 추상 작품입니다. 기하학적 형태와 그라디언트를 활용하여 시각적 깊이를 표현했습니다.",
    contentPreview: "다양한 색상 조합을 실험한 추상 작품입니다.",
    heartCount: 18,
    commentCount: 5,
    isLiked: false,
    comments: [
      {
        id: "c4",
        author: { name: "김지수", profileImage: "https://i.pravatar.cc/150?img=1" },
        content: "실험적인 접근이 좋네요!",
        isOwn: true,
      },
    ],
    isOwn: false,
  },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [sortBy, setSortBy] = useState<SortType>("latest");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // todo: remove mock functionality
  const [showMyPosts, setShowMyPosts] = useState(false);

  // todo: remove mock functionality
  const currentUser = {
    name: "김지수",
    profileImage: "https://i.pravatar.cc/150?img=1",
  };

  const selectedPost = mockPosts.find((p) => p.id === selectedPostId);

  // todo: remove mock functionality - replace with real sorting
  const sortedPosts = [...mockPosts].sort((a, b) => {
    if (sortBy === "popular") {
      return b.heartCount - a.heartCount;
    }
    return parseInt(b.id) - parseInt(a.id);
  });

  const filteredPosts = showMyPosts
    ? sortedPosts.filter((p) => p.isOwn)
    : sortedPosts;

  const handleMyPostsClick = () => {
    setShowMyPosts(!showMyPosts);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        isLoggedIn={isLoggedIn}
        user={currentUser}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onWriteClick={() => setLocation("/write")}
        onLoginClick={() => {
          console.log("Login clicked");
          setIsLoggedIn(true);
        }}
        onLogoutClick={() => {
          console.log("Logout clicked");
          setIsLoggedIn(false);
          setShowMyPosts(false);
        }}
        onMyPostsClick={handleMyPostsClick}
      />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {showMyPosts && (
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">내가 쓴 글</h2>
          </div>
        )}
        <PostGrid
          posts={filteredPosts}
          onPostClick={(id) => setSelectedPostId(id)}
        />
      </main>

      {selectedPost && (
        <PostDetailModal
          open={!!selectedPostId}
          onOpenChange={(open) => !open && setSelectedPostId(null)}
          post={selectedPost}
          onEdit={() => {
            console.log("Edit post:", selectedPostId);
            setSelectedPostId(null);
          }}
          onDelete={() => {
            console.log("Delete post:", selectedPostId);
            setSelectedPostId(null);
          }}
          onLike={() => {
            console.log("Like/Unlike post:", selectedPostId);
          }}
          onCommentSubmit={(comment) => {
            console.log("New comment:", comment);
          }}
        />
      )}
    </div>
  );
}
