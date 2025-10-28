import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { addApprovedUser } from "@/lib/supabase-api";
import { formatPhone } from "@/lib/phone-utils";

interface AddApprovedUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddApprovedUserModal({ isOpen, onClose }: AddApprovedUserModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: () => addApprovedUser(name.trim(), phone.trim()),
    onSuccess: () => {
      toast({
        title: "추가 완료",
        description: "승인 사용자가 추가되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["approved-users"] });
      queryClient.invalidateQueries({ queryKey: ["approved-user-stats"] });
      onClose();
      setName("");
      setPhone("");
    },
    onError: (error) => {
      toast({
        title: "추가 실패",
        description: error instanceof Error ? error.message : "추가 중 오류가 발생했습니다.",
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
        <h2 className="text-xl font-bold mb-4">승인 사용자 추가</h2>

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
              {mutation.isPending ? "추가 중..." : "추가"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
