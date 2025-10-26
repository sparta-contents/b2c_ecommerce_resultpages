/**
 * 이미지 리사이징 유틸리티
 * Canvas API를 사용하여 이미지를 리사이징하고 최적화합니다.
 */

/**
 * 파일이 유효한 이미지인지 검증
 * @param file - 검증할 파일
 * @returns 유효한 경우 true
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // MIME 타입 검증 (JPG, PNG만 허용, GIF 제외)
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];

  if (!validTypes.includes(file.type)) {
    if (file.type === 'image/gif') {
      return {
        valid: false,
        error: 'GIF 파일은 지원하지 않습니다. JPG, PNG 형식만 업로드 가능합니다.',
      };
    }
    return {
      valid: false,
      error: 'JPG, PNG 형식만 지원합니다.',
    };
  }

  // 파일 크기 검증 (최대 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: '파일 크기는 10MB 이하여야 합니다.',
    };
  }

  return { valid: true };
}

/**
 * 이미지를 지정된 크기로 리사이징
 * @param file - 원본 이미지 파일
 * @param maxSize - 최대 너비/높이 (기본값: 200)
 * @param quality - JPEG 품질 (0-1, 기본값: 0.85)
 * @returns 리사이징된 이미지 Blob
 */
export async function resizeImage(
  file: File,
  maxSize: number = 200,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // 파일 유효성 검증
    const validation = validateImageFile(file);
    if (!validation.valid) {
      reject(new Error(validation.error));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Canvas 생성
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context를 생성할 수 없습니다.'));
          return;
        }

        // 리사이징 크기 계산 (정사각형으로 중앙 크롭)
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;

        canvas.width = maxSize;
        canvas.height = maxSize;

        // 이미지를 정사각형으로 크롭하여 그리기
        ctx.drawImage(
          img,
          x, y, size, size,  // 원본 이미지에서 크롭할 영역
          0, 0, maxSize, maxSize  // 캔버스에 그릴 영역
        );

        // Canvas를 Blob으로 변환 (JPEG, 품질 85%)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`이미지 리사이징 완료: ${file.size} bytes → ${blob.size} bytes`);
              resolve(blob);
            } else {
              reject(new Error('이미지 변환에 실패했습니다.'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('이미지를 로드할 수 없습니다.'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('파일을 읽을 수 없습니다.'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 이미지 파일 미리보기 URL 생성
 * @param file - 이미지 파일
 * @returns 미리보기 URL
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * 미리보기 URL 해제
 * @param url - 해제할 URL
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}
