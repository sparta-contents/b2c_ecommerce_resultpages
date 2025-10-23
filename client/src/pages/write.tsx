import { CreatePostForm } from "@/components/CreatePostForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { createPost, uploadImage } from "@/lib/supabase-api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export default function Write() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "로그인이 필요합니다",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [user, loading, setLocation, toast]);

  const createPostMutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({
        title: "게시물이 작성되었습니다",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "게시물 작성에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: {
    title: string;
    content: string;
    week: string;
    image: File | null;
  }) => {
    if (!data.image) {
      toast({
        title: "이미지를 선택해주세요",
        variant: "destructive",
      });
      return;
    }

    if (!data.week) {
      toast({
        title: "과제 단계를 선택해주세요",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      // Upload image first
      const imageUrl = await uploadImage(data.image);

      // Create post with image URL
      createPostMutation.mutate({
        title: data.title,
        content: data.content,
        week: data.week,
        image_url: imageUrl,
      });
    } catch (error) {
      toast({
        title: "이미지 업로드에 실패했습니다",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (loading || !user) {
    return null;
  }

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
        <CreatePostForm
          onSubmit={handleSubmit}
          onCancel={() => setLocation("/")}
        />
      </main>
    </div>
  );
}
