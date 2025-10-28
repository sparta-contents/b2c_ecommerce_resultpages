import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  getApprovedUsers,
  getApprovedUserStats,
  deleteApprovedUser,
  type ApprovedUser,
} from "@/lib/supabase-api";
import { formatPhone } from "@/lib/phone-utils";
import { Users, UserPlus, Upload, Search, Trash2, Edit } from "lucide-react";
import { AddApprovedUserModal } from "./AddApprovedUserModal";
import { BulkUploadModal } from "./BulkUploadModal";
import { EditApprovedUserModal } from "./EditApprovedUserModal";

export function ApprovedUserManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | boolean>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ApprovedUser | null>(null);
  const { toast } = useToast();

  const pageSize = 30;

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ["approved-user-stats"],
    queryFn: getApprovedUserStats,
  });

  // Fetch approved users
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["approved-users", search, statusFilter, currentPage],
    queryFn: () =>
      getApprovedUsers(
        {
          search: search || undefined,
          is_verified: statusFilter,
        },
        {
          limit: pageSize,
          offset: currentPage * pageSize,
        }
      ),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteApprovedUser,
    onSuccess: () => {
      toast({
        title: "삭제 완료",
        description: "승인 사용자가 삭제되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["approved-users"] });
      queryClient.invalidateQueries({ queryKey: ["approved-user-stats"] });
    },
    onError: (error) => {
      toast({
        title: "삭제 실패",
        description: error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async (user: ApprovedUser) => {
    const confirmMessage = user.is_verified
      ? `정말 삭제하시겠습니까?\n\n${user.name} (${formatPhone(user.phone)})\n\n이미 인증된 사용자입니다. 삭제하면 users 테이블과의 연결만 해제됩니다.`
      : `정말 삭제하시겠습니까?\n\n${user.name} (${formatPhone(user.phone)})`;

    if (window.confirm(confirmMessage)) {
      deleteMutation.mutate(user.id);
    }
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}명</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">인증 완료</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.verified || 0}명</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">미인증</CardTitle>
            <Users className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.unverified || 0}명</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle>승인 사용자 관리</CardTitle>
              <CardDescription>사전 승인된 사용자 명단을 관리합니다</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowAddModal(true)} size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                개별 추가
              </Button>
              <Button onClick={() => setShowBulkModal(true)} size="sm" variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                대량 등록
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="이름 또는 전화번호로 검색..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(0);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter === "all" ? "all" : statusFilter.toString()}
              onValueChange={(value) => {
                setStatusFilter(value === "all" ? "all" : value === "true");
                setCurrentPage(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="true">인증 완료</SelectItem>
                <SelectItem value="false">미인증</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : data && data.approvedUsers.length > 0 ? (
            <>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-sm font-medium">이름</th>
                      <th className="p-3 text-left text-sm font-medium">전화번호</th>
                      <th className="p-3 text-left text-sm font-medium">인증 여부</th>
                      <th className="p-3 text-left text-sm font-medium">연결 계정</th>
                      <th className="p-3 text-left text-sm font-medium">등록일</th>
                      <th className="p-3 text-center text-sm font-medium">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.approvedUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-muted/30">
                        <td className="p-3">{user.name}</td>
                        <td className="p-3">{formatPhone(user.phone)}</td>
                        <td className="p-3">
                          {user.is_verified ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✅ 인증 완료
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              ⏳ 미인증
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {user.user ? (
                            <div>
                              <div>{user.user.name}</div>
                              <div className="text-xs">{user.user.email}</div>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString("ko-KR")}
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(user)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    전체 {data.total}명 중 {currentPage * pageSize + 1}-
                    {Math.min((currentPage + 1) * pageSize, data.total)}명 표시
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                    >
                      이전
                    </Button>
                    <div className="flex items-center px-3 text-sm">
                      페이지 {currentPage + 1} / {totalPages}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage >= totalPages - 1}
                    >
                      다음
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {search || statusFilter !== "all"
                ? "검색 결과가 없습니다."
                : "등록된 승인 사용자가 없습니다."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showAddModal && (
        <AddApprovedUserModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showBulkModal && (
        <BulkUploadModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
        />
      )}

      {editingUser && (
        <EditApprovedUserModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          user={editingUser}
        />
      )}
    </div>
  );
}
