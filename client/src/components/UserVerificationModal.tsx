import { useState } from 'react';
import { verifyApprovedUser } from '../lib/supabase-api';
import { formatPhone } from '../lib/phone-utils';

interface UserVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  googleUser: {
    email: string;
    name: string;
    profile_image?: string;
    google_id: string;
    user_id: string;
  };
}

export default function UserVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  googleUser,
}: UserVerificationModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    if (!phone.trim()) {
      setError('전화번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      await verifyApprovedUser(name.trim(), phone.trim(), googleUser);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);

    // Auto-format with hyphens as user types (for display)
    try {
      const formatted = formatPhone(value);
      if (formatted !== value && value.length >= 10) {
        setPhone(formatted);
      }
    } catch {
      // Invalid format, keep as-is
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">사전 승인 인증이 필요합니다</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          등록된 사용자만 이용 가능합니다. 본인 확인을 위해해 이름과 전화번호를 입력해주세요.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              이름
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
              placeholder="홍길동"
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              전화번호
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={handlePhoneChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
              placeholder="010-1234-5678"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '인증 중...' : '제출'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
