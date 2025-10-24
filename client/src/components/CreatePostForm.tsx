import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, RefreshCw } from "lucide-react";

export interface CreatePostFormProps {
  onSubmit: (data: { title: string; content: string; week: string; image: File | null }) => void;
  onCancel: () => void;
  initialData?: {
    title: string;
    content: string;
    week: string;
    image_url: string;
  };
}

export function CreatePostForm({ onSubmit, onCancel, initialData }: CreatePostFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [week, setWeek] = useState(initialData?.week || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const TITLE_MAX_LENGTH = 60;
  const CONTENT_MAX_LENGTH = 250;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReplaceImage = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, content, week, image: imageFile });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="title">제목</Label>
          <span className="text-xs text-muted-foreground">
            {title.length}/{TITLE_MAX_LENGTH}
          </span>
        </div>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="작품 제목을 입력하세요"
          maxLength={TITLE_MAX_LENGTH}
          required
          data-testid="input-title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="week">과제 단계</Label>
        <Select value={week} onValueChange={setWeek} required>
          <SelectTrigger id="week" data-testid="select-week">
            <SelectValue placeholder="과제 단계를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1주차 과제" data-testid="option-week1">1주차 과제</SelectItem>
            <SelectItem value="2주차 과제" data-testid="option-week2">2주차 과제</SelectItem>
            <SelectItem value="3주차 과제" data-testid="option-week3">3주차 과제</SelectItem>
            <SelectItem value="4주차 과제" data-testid="option-week4">4주차 과제</SelectItem>
            <SelectItem value="5주차 과제" data-testid="option-week5">5주차 과제</SelectItem>
            <SelectItem value="6주차 과제" data-testid="option-week6">6주차 과제</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="content">내용</Label>
          <span className="text-xs text-muted-foreground">
            {content.length}/{CONTENT_MAX_LENGTH}
          </span>
        </div>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="작품에 대한 설명을 입력하세요"
          className="min-h-[200px] resize-none"
          maxLength={CONTENT_MAX_LENGTH}
          required
          data-testid="input-content"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">이미지</Label>
        {imagePreview ? (
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={handleReplaceImage}
                data-testid="button-replace-image"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleRemoveImage}
                data-testid="button-remove-image"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <label
            htmlFor="image"
            className="flex flex-col items-center justify-center aspect-[4/3] rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors bg-muted/30"
            data-testid="label-image-upload"
          >
            <Upload className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              클릭하여 이미지 업로드
            </p>
          </label>
        )}
        <input
          id="image"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
          data-testid="input-image"
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
          취소
        </Button>
        <Button type="submit" data-testid="button-submit">
          작성 완료
        </Button>
      </div>
    </form>
  );
}
