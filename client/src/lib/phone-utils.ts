/**
 * Phone number utility functions
 * Handles phone number normalization and validation
 */

/**
 * Normalizes a phone number by extracting only digits
 * @param phone - Raw phone number input (can include hyphens, spaces, etc.)
 * @returns Normalized phone number with only digits
 * @throws Error if phone number format is invalid
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Validate length (10-11 digits for Korean phone numbers)
  if (digits.length < 10 || digits.length > 11) {
    throw new Error('올바른 전화번호 형식이 아닙니다. 10-11자리 숫자를 입력해주세요.');
  }

  return digits;
}

/**
 * Validates if a phone number is in correct format
 * @param phone - Phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidPhone(phone: string): boolean {
  try {
    normalizePhone(phone);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats a normalized phone number with hyphens for display
 * @param phone - Normalized phone number (digits only)
 * @returns Formatted phone number (e.g., 010-1234-5678)
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 10) {
    // 10 digits: 010-123-4567
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11) {
    // 11 digits: 010-1234-5678
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  return phone; // Return as-is if length is unexpected
}

/**
 * Checks if a phone number starts with a valid Korean mobile prefix
 * @param phone - Normalized phone number
 * @returns true if valid Korean mobile number
 */
export function isKoreanMobile(phone: string): boolean {
  const normalized = phone.replace(/\D/g, '');
  const validPrefixes = ['010', '011', '016', '017', '018', '019'];

  return validPrefixes.some(prefix => normalized.startsWith(prefix));
}
