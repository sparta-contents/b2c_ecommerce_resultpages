import { CreatePostForm } from "@/components/CreatePostForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Write() {
  const [, setLocation] = useLocation();

  const handleSubmit = (data: {
    title: string;
    content: string;
    image: File | null;
  }) => {
    console.log("Form submitted:", data);
    // todo: remove mock functionality - implement real submission
    alert("게시물이 작성되었습니다!");
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">새 게시물 작성</h1>
          <p className="text-muted-foreground mt-2">
            작품을 공유하고 커뮤니티와 소통하세요
          </p>
        </div>
        <CreatePostForm onSubmit={handleSubmit} onCancel={() => setLocation("/")} />
      </main>
    </div>
  );
}
