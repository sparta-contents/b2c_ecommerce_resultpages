import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Circle, Download } from "lucide-react";
import { getUserWeeklyPostStatus, UserWeeklyPostStatus as UserStatus, getUserWeeklyReviewStatus } from "@/lib/supabase-api";
import { PostSlideModal } from "./PostSlideModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { HomeworkReviewStatus } from "@/lib/supabase-hooks";
import { exportWeeklyStatusToExcel } from "@/lib/excel-utils";

export function UserWeeklyPostStatus() {
  const [selectedUser, setSelectedUser] = useState<UserStatus | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-user-weekly-status"],
    queryFn: getUserWeeklyPostStatus,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Fetch homework review status (admin only)
  const { data: reviewData, isLoading: reviewLoading } = useQuery({
    queryKey: ["admin-user-weekly-review-status"],
    queryFn: getUserWeeklyReviewStatus,
    enabled: isAdmin, // Only fetch if user is admin
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });

  const weeks = [
    "1주차 과제",
    "2주차 과제",
    "3주차 과제",
    "4주차 과제",
    "5주차 과제",
    "6주차 과제",
  ];

  const handleTagClick = (user: UserStatus, week: string) => {
    const postIds = user.weeklyPosts[week];
    if (postIds && postIds.length > 0) {
      setSelectedUser(user);
      setSelectedWeek(week);
    }
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setSelectedWeek(null);
  };

  // Get review status for a specific user and week
  const getReviewStatus = (userId: string, week: string): HomeworkReviewStatus => {
    if (!reviewData) return 'not_reviewed';
    const userReview = reviewData.find(r => r.userId === userId);
    return userReview?.weeklyReviews[week] || 'not_reviewed';
  };

  // Render review status badge
  const renderReviewStatus = (status: HomeworkReviewStatus) => {
    switch (status) {
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3" />
            통과
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
            <XCircle className="h-3 w-3" />
            미통과
          </span>
        );
      case 'not_reviewed':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Circle className="h-3 w-3" />
            미평가
          </span>
        );
    }
  };

  // 엑셀 다운로드 핸들러
  const handleExcelDownload = () => {
    if (!users || !reviewData) {
      toast({
        title: "다운로드 실패",
        description: "데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      setIsExporting(true);
      exportWeeklyStatusToExcel({
        users,
        reviewData,
      });
      toast({
        title: "다운로드 완료",
        description: "엑셀 파일이 다운로드되었습니다.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Excel export error:', error);
      toast({
        title: "다운로드 실패",
        description: "엑셀 파일 생성에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>수강생 - 주차별 게시글 작성 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>수강생 - 주차별 게시글 작성 현황</CardTitle>
              <CardDescription>
                수강생의 주차별 과제 제출 현황입니다. 파란색 태그를 클릭하여 게시글을 확인하세요.
              </CardDescription>
            </div>
            <Button
              onClick={handleExcelDownload}
              disabled={isExporting || !users || users.length === 0}
              variant="outline"
              size="sm"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  다운로드 중...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  엑셀 다운로드
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!users || users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">등록된 수강생이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="border-b pb-4 last:border-b-0"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profile_image || undefined} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{user.email}</span>
                        {user.approvedName && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-foreground">{user.approvedName}</span>
                          </>
                        )}
                        {user.approvedPhone && (
                          <>
                            <span>•</span>
                            <span>{user.approvedPhone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 ml-10">
                    {weeks.map((week) => {
                      const postIds = user.weeklyPosts[week] || [];
                      const hasPost = postIds.length > 0;
                      const reviewStatus = isAdmin ? getReviewStatus(user.id, week) : 'not_reviewed';

                      return (
                        <div key={week} className="flex flex-col gap-1">
                          <Badge
                            className={
                              hasPost
                                ? "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
                                : "bg-gray-200 text-gray-500 cursor-not-allowed hover:bg-gray-200"
                            }
                            onClick={() => hasPost && handleTagClick(user, week)}
                          >
                            {week.replace(" 과제", "")}
                            {postIds.length > 1 && (
                              <span className="ml-1 text-xs">({postIds.length})</span>
                            )}
                          </Badge>
                          {isAdmin && hasPost && (
                            <div className="text-center">
                              {renderReviewStatus(reviewStatus)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUser && selectedWeek && (
        <PostSlideModal
          open={true}
          onOpenChange={(open) => !open && handleCloseModal()}
          postIds={selectedUser.weeklyPosts[selectedWeek] || []}
          userName={selectedUser.name}
          userId={selectedUser.id}
          week={selectedWeek}
        />
      )}
    </>
  );
}
