import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreatePostForm } from "@/components/CreatePostForm";
import { useMutation } from "@tanstack/react-query";
import { createPost, updatePost, uploadImage } from "@/lib/supabase-api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editMode?: boolean;
  initialData?: {
    id: string;
    title: string;
    content: string;
    week: string;
    image_url: string;
  };
}

export function CreatePostModal({
  open,
  onOpenChange,
  editMode = false,
  initialData,
}: CreatePostModalProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const createPostMutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({
        title: "게시물이 작성되었습니다",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "게시물 작성에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updatePost(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      // 수정된 게시글의 상세 정보 캐시도 무효화
      queryClient.invalidateQueries({ queryKey: ['post', variables.id] });
      toast({
        title: "게시물이 수정되었습니다",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "게시물 수정에 실패했습니다",
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
    if (!editMode && !data.image) {
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

      let imageUrl = initialData?.image_url || "";

      // Upload new image if provided
      if (data.image) {
        imageUrl = await uploadImage(data.image);
      }

      const postData = {
        title: data.title,
        content: data.content,
        week: data.week,
        image_url: imageUrl,
      };

      if (editMode && initialData) {
        updatePostMutation.mutate({ id: initialData.id, data: postData });
      } else {
        createPostMutation.mutate(postData);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "이미지 업로드에 실패했습니다",
        description: error instanceof Error ? error.message : "알 수 없는 오류",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>
            {editMode ? "게시물 수정" : "새 게시물 작성"}
          </DialogTitle>
        </DialogHeader>
        {isUploading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">이미지 업로드 중...</p>
          </div>
        ) : (
          <CreatePostForm
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            initialData={initialData}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
