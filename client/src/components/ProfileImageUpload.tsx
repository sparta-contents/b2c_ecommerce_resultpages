import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { validateImageFile, resizeImage } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';

interface ProfileImageUploadProps {
  currentImage?: string | null;
  userName: string;
  onImageChange: (blob: Blob) => Promise<void>;
  disabled?: boolean;
}

export function ProfileImageUpload({
  currentImage,
  userName,
  onImageChange,
  disabled = false,
}: ProfileImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 유효성 검증
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: '업로드 실패',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // 이미지 리사이징 (200x200px)
      const resizedBlob = await resizeImage(file, 200, 0.85);

      // 미리보기 생성
      const preview = URL.createObjectURL(resizedBlob);
      setPreviewUrl(preview);

      // 부모 컴포넌트에 전달
      await onImageChange(resizedBlob);

      toast({
        title: '업로드 성공',
        description: '프로필 사진이 변경되었습니다.',
      });
    } catch (error) {
      console.error('이미지 업로드 에러:', error);
      toast({
        title: '업로드 실패',
        description: error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // input 초기화 (같은 파일을 다시 선택할 수 있도록)
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const displayImage = previewUrl || currentImage;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
          <AvatarImage src={displayImage || undefined} />
          <AvatarFallback className="text-3xl">
            {userName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="text-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleButtonClick}
          disabled={disabled || isUploading}
        >
          <Camera className="h-4 w-4 mr-2" />
          {isUploading ? '업로드 중...' : '프로필 사진 변경'}
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          권장 200x200px 이상 (JPG, PNG)
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  );
}
