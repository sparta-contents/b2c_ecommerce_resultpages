import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { bulkInsertApprovedUsers, type BulkApprovedUser } from "@/lib/supabase-api";
import { normalizePhone } from "@/lib/phone-utils";
import { AlertCircle, Check, Plus, Trash2, Filter } from "lucide-react";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CellData {
  name: string;
  phone: string;
  error?: string;
}

export function BulkUploadModal({ isOpen, onClose }: BulkUploadModalProps) {
  const [rows, setRows] = useState<CellData[]>(
    Array.from({ length: 100 }, () => ({ name: "", phone: "" }))
  );
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const { toast } = useToast();
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Validate data whenever rows change
    const timer = setTimeout(() => {
      validateData();
    }, 300);

    return () => clearTimeout(timer);
  }, [rows]);

  const validateData = () => {
    const newRows = rows.map((row, idx) => {
      // Skip empty rows
      if (!row.name.trim() && !row.phone.trim()) {
        return { ...row, error: undefined };
      }

      // Validate name
      if (!row.name.trim()) {
        return { ...row, error: "이름을 입력해주세요" };
      }

      // Validate phone
      if (!row.phone.trim()) {
        return { ...row, error: "전화번호를 입력해주세요" };
      }

      try {
        const normalized = normalizePhone(row.phone);

        // Check for duplicates in the batch
        const duplicateIdx = rows.findIndex(
          (r, i) =>
            i < idx &&
            r.name.trim() === row.name.trim() &&
            normalizePhone(r.phone) === normalized
        );

        if (duplicateIdx !== -1) {
          return { ...row, error: `중복 (${duplicateIdx + 1}번째 행과 동일)` };
        }

        return { ...row, error: undefined };
      } catch (error) {
        return {
          ...row,
          error: error instanceof Error ? error.message : "전화번호 형식 오류",
        };
      }
    });

    setRows(newRows);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTableElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");

    // Parse TSV (tab-separated values from Excel/Google Sheets)
    const lines = pasteData.split("\n").filter((line) => line.trim());
    const parsedRows: CellData[] = lines.map((line) => {
      const [name = "", phone = ""] = line.split("\t");
      return {
        name: name.trim(),
        phone: phone.trim(),
      };
    });

    // Skip header row if it looks like a header
    const firstRow = parsedRows[0];
    if (
      firstRow &&
      (firstRow.name.toLowerCase().includes("이름") ||
        firstRow.name.toLowerCase().includes("name"))
    ) {
      parsedRows.shift();
    }

    // Update rows
    const newRows = [...rows];
    parsedRows.forEach((row, idx) => {
      if (idx < newRows.length) {
        newRows[idx] = row;
      }
    });

    setRows(newRows);

    toast({
      title: "붙여넣기 완료",
      description: `${parsedRows.length}행의 데이터가 붙여넣기되었습니다.`,
    });
  };

  const handleCellChange = (rowIdx: number, field: "name" | "phone", value: string) => {
    const newRows = [...rows];
    newRows[rowIdx] = { ...newRows[rowIdx], [field]: value };
    setRows(newRows);
  };

  const addRows = (count: number = 10) => {
    setRows([...rows, ...Array.from({ length: count }, () => ({ name: "", phone: "" }))]);
  };

  const clearAll = () => {
    if (window.confirm("모든 데이터를 삭제하시겠습니까?")) {
      setRows(Array.from({ length: 100 }, () => ({ name: "", phone: "" })));
      toast({
        title: "삭제 완료",
        description: "모든 데이터가 삭제되었습니다.",
      });
    }
  };

  const mutation = useMutation({
    mutationFn: bulkInsertApprovedUsers,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["approved-users"] });
      queryClient.invalidateQueries({ queryKey: ["approved-user-stats"] });

      toast({
        title: "대량 등록 완료",
        description: `성공: ${result.success}명, 실패: ${result.failed}명`,
      });

      if (result.errors.length > 0) {
        console.error("Bulk upload errors:", result.errors);
      }

      if (result.success > 0) {
        onClose();
      }
    },
    onError: (error) => {
      toast({
        title: "대량 등록 실패",
        description: error instanceof Error ? error.message : "등록 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    const validRows = rows.filter(
      (row) => row.name.trim() && row.phone.trim() && !row.error
    );

    if (validRows.length === 0) {
      toast({
        title: "입력 오류",
        description: "저장할 데이터가 없습니다.",
        variant: "destructive",
      });
      return;
    }

    const hasErrors = rows.some((row) => row.error);
    if (hasErrors) {
      const errorCount = rows.filter((row) => row.error).length;
      if (
        !window.confirm(
          `${errorCount}개의 오류가 있습니다.\n오류를 제외한 ${validRows.length}개의 데이터만 저장하시겠습니까?`
        )
      ) {
        return;
      }
    }

    mutation.mutate(validRows);
  };

  const filledRows = rows.filter((row) => row.name.trim() || row.phone.trim());
  const validRows = filledRows.filter((row) => !row.error);
  const errorRows = filledRows.filter((row) => row.error);

  const displayRows = showErrorsOnly ? rows.filter((row) => row.error) : rows;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold mb-2">대량 등록 - 스프레드시트 스타일</h2>
          <p className="text-sm text-muted-foreground">
            💡 엑셀이나 구글 시트에서 복사해서 표에 붙여넣으세요 (Ctrl+V / Cmd+V)
          </p>
        </div>

        {/* Statistics */}
        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-6 text-sm">
            <div>
              통계: <span className="font-semibold">총 {filledRows.length}행</span>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <Check className="h-4 w-4" />
              <span className="font-semibold">정상 {validRows.length}명</span>
            </div>
            <div className="flex items-center gap-1 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="font-semibold">오류 {errorRows.length}명</span>
            </div>
            <label className="flex items-center gap-2 ml-auto cursor-pointer">
              <input
                type="checkbox"
                checked={showErrorsOnly}
                onChange={(e) => setShowErrorsOnly(e.target.checked)}
                className="rounded"
              />
              <Filter className="h-4 w-4" />
              <span>오류만 보기</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-3 border-b flex gap-2">
          <Button size="sm" variant="outline" onClick={() => addRows(10)}>
            <Plus className="h-4 w-4 mr-2" />
            행 추가
          </Button>
          <Button size="sm" variant="outline" onClick={clearAll}>
            <Trash2 className="h-4 w-4 mr-2" />
            전체 삭제
          </Button>
        </div>

        {/* Table */}
        <div ref={tableRef} className="flex-1 overflow-auto px-6 py-4">
          <table
            className="w-full border-collapse"
            onPaste={handlePaste}
            tabIndex={0}
          >
            <thead className="sticky top-0 bg-muted z-10">
              <tr>
                <th className="border p-2 text-left w-12 text-sm font-medium">#</th>
                <th className="border p-2 text-left text-sm font-medium">이름</th>
                <th className="border p-2 text-left text-sm font-medium">전화번호</th>
                <th className="border p-2 text-center w-24 text-sm font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, idx) => {
                const actualIdx = showErrorsOnly ? rows.indexOf(row) : idx;
                return (
                  <tr
                    key={actualIdx}
                    className={row.error ? "bg-red-50 dark:bg-red-900/10" : ""}
                  >
                    <td className="border p-1 text-center text-sm text-muted-foreground">
                      {actualIdx + 1}
                    </td>
                    <td className="border p-0">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) =>
                          handleCellChange(actualIdx, "name", e.target.value)
                        }
                        className={`w-full p-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          row.error ? "border-red-500" : ""
                        }`}
                        placeholder="홍길동"
                      />
                    </td>
                    <td className="border p-0">
                      <input
                        type="text"
                        value={row.phone}
                        onChange={(e) =>
                          handleCellChange(actualIdx, "phone", e.target.value)
                        }
                        className={`w-full p-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          row.error ? "border-red-500" : ""
                        }`}
                        placeholder="010-1234-5678"
                      />
                    </td>
                    <td className="border p-1 text-center">
                      {row.error ? (
                        <div
                          className="text-xs text-red-600 cursor-help"
                          title={row.error}
                        >
                          ⚠️ 오류
                        </div>
                      ) : row.name || row.phone ? (
                        <div className="text-xs text-green-600">✅ 정상</div>
                      ) : (
                        <div className="text-xs text-muted-foreground">-</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Error List */}
        {errorRows.length > 0 && (
          <div className="px-6 py-3 border-t bg-red-50 dark:bg-red-900/10">
            <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              ⚠️ {errorRows.length}개 오류 발견:
            </div>
            <div className="text-xs text-red-700 dark:text-red-300 space-y-1 max-h-20 overflow-y-auto">
              {errorRows.slice(0, 10).map((row, idx) => {
                const rowIdx = rows.indexOf(row);
                return (
                  <div key={idx}>
                    - {rowIdx + 1}번째 행: {row.error}
                  </div>
                );
              })}
              {errorRows.length > 10 && (
                <div className="text-muted-foreground">
                  ... 외 {errorRows.length - 10}개
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || validRows.length === 0}
            className="flex-1"
          >
            {mutation.isPending ? "저장 중..." : `저장 (${validRows.length}명)`}
          </Button>
        </div>

        {/* Usage Tips */}
        <div className="px-6 py-4 border-t bg-muted/30 text-xs text-muted-foreground">
          <div className="font-semibold mb-2">사용 팁:</div>
          <ol className="list-decimal list-inside space-y-1">
            <li>엑셀/구글시트에서 이름, 전화번호 컬럼 선택 → Ctrl+C</li>
            <li>표의 아무 셀이나 클릭 → Ctrl+V</li>
            <li>자동으로 검증 완료 후 "저장" 버튼 클릭</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
