import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { updateApprovedUser, type ApprovedUser } from "@/lib/supabase-api";
import { formatPhone } from "@/lib/phone-utils";

interface EditApprovedUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ApprovedUser;
}

export function EditApprovedUserModal({ isOpen, onClose, user }: EditApprovedUserModalProps) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(formatPhone(user.phone));
  const { toast } = useToast();

  useEffect(() => {
    setName(user.name);
    setPhone(formatPhone(user.phone));
  }, [user]);

  const mutation = useMutation({
    mutationFn: () =>
      updateApprovedUser(user.id, {
        name: name.trim(),
        phone: phone.trim(),
      }),
    onSuccess: () => {
      toast({
        title: "수정 완료",
        description: "승인 사용자 정보가 수정되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["approved-users"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "수정 실패",
        description: error instanceof Error ? error.message : "수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "입력 오류",
        description: "이름을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!phone.trim()) {
      toast({
        title: "입력 오류",
        description: "전화번호를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate();
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);

    // Auto-format
    try {
      const formatted = formatPhone(value);
      if (formatted !== value && value.length >= 10) {
        setPhone(formatted);
      }
    } catch {
      // Keep as-is
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">승인 사용자 수정</h2>

        {user.is_verified && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ 이미 인증된 사용자입니다. 수정 시 주의하세요.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                이름
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                disabled={mutation.isPending}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                전화번호
              </label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="010-1234-5678"
                disabled={mutation.isPending}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
              className="flex-1"
            >
              취소
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="flex-1">
              {mutation.isPending ? "수정 중..." : "수정"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
