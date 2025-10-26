import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getUserProfile, updateUserProfile, uploadProfileImage } from '@/lib/supabase-api';
import { ProfileImageUpload } from '@/components/ProfileImageUpload';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [uploadedImageBlob, setUploadedImageBlob] = useState<Blob | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // 프로필 조회
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => getUserProfile(user!.id),
    enabled: !!user?.id,
  });

  // 초기 이름 설정
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
    }
  }, [profile]);

  // 변경 사항 감지
  useEffect(() => {
    if (profile) {
      const nameChanged = name.trim() !== '' && name !== profile.name;
      const imageChanged = uploadedImageBlob !== null;
      setHasChanges(nameChanged || imageChanged);
    }
  }, [name, uploadedImageBlob, profile]);

  // 프로필 업데이트 mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      let profileImageUrl = profile?.profile_image;

      // 이미지가 변경되었으면 업로드
      if (uploadedImageBlob) {
        profileImageUrl = await uploadProfileImage(uploadedImageBlob, user.id);
      }

      // 프로필 업데이트
      const updateData: { name?: string; profile_image?: string } = {};

      if (name.trim() !== profile?.name) {
        updateData.name = name.trim();
      }

      if (profileImageUrl !== profile?.profile_image) {
        updateData.profile_image = profileImageUrl;
      }

      return updateUserProfile(user.id, updateData);
    },
    onSuccess: () => {
      toast({
        title: '저장 완료',
        description: '프로필이 업데이트되었습니다.',
      });
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      setUploadedImageBlob(null);
      setHasChanges(false);
    },
    onError: (error) => {
      console.error('프로필 업데이트 에러:', error);
      toast({
        title: '저장 실패',
        description: error instanceof Error ? error.message : '프로필 업데이트에 실패했습니다.',
        variant: 'destructive',
      });
    },
  });

  // 로그인하지 않은 경우 홈으로 리다이렉트
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/');
    }
  }, [authLoading, user, setLocation]);

  const handleImageChange = async (blob: Blob) => {
    setUploadedImageBlob(blob);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 최대 16자 제한
    if (value.length <= 16) {
      setName(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 이름 유효성 검증
    if (name.trim().length === 0) {
      toast({
        title: '입력 오류',
        description: '이름을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (name.trim().length > 16) {
      toast({
        title: '입력 오류',
        description: '이름은 16자 이내로 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    updateMutation.mutate();
  };

  const handleCancel = () => {
    setLocation('/');
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>프로필을 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        isLoggedIn={!!user}
        isAdmin={isAdmin}
        user={user ? {
          name: profile?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          profileImage: profile?.profile_image || user.user_metadata?.avatar_url
        } : undefined}
        onLoginClick={() => {}}
        onLogoutClick={signOut}
        onMyPostsClick={() => setLocation('/')}
        onProfileEditClick={() => {}}
        onAdminClick={() => setLocation('/admin')}
        onLogoClick={() => setLocation('/')}
        variant="minimal"
        showBackButton={true}
        onBackClick={() => setLocation('/')}
      />

      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>내 정보 수정</CardTitle>
            <CardDescription>프로필 이름과 사진을 변경할 수 있습니다.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* 프로필 이미지 */}
              <div className="flex justify-center">
                <ProfileImageUpload
                  currentImage={profile.profile_image}
                  userName={profile.name}
                  onImageChange={handleImageChange}
                  disabled={updateMutation.isPending}
                />
              </div>

              {/* 이름 입력 */}
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <div className="relative">
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    placeholder="이름을 입력하세요"
                    maxLength={16}
                    disabled={updateMutation.isPending}
                    className="pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {name.length}/16
                  </span>
                </div>
              </div>

              {/* 이메일 (읽기 전용) */}
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">이메일은 변경할 수 없습니다.</p>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={updateMutation.isPending}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={!hasChanges || updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  '저장하기'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
