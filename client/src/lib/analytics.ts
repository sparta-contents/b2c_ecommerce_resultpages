import ReactGA from 'react-ga4';

// Google Analytics 초기화 여부
let isInitialized = false;

/**
 * Google Analytics 4 초기화
 * 환경 변수에서 측정 ID를 가져와 GA4를 초기화합니다.
 */
export const initGA = () => {
  const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;

  // 측정 ID가 없거나 placeholder인 경우 초기화하지 않음
  if (!measurementId || measurementId === 'G-XXXXXXXXXX') {
    if (import.meta.env.DEV) {
      console.warn('GA4 측정 ID가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
    }
    return;
  }

  // 이미 초기화된 경우 중복 초기화 방지
  if (isInitialized) {
    return;
  }

  try {
    ReactGA.initialize(measurementId, {
      gaOptions: {
        debug_mode: import.meta.env.DEV, // 개발 환경에서만 디버그 모드
      },
    });
    isInitialized = true;

    if (import.meta.env.DEV) {
      console.log('✅ GA4 초기화 완료:', measurementId);
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('GA4 초기화 실패:', error);
    }
  }
};

/**
 * 페이지 뷰 추적
 * @param path - 페이지 경로 (예: '/home', '/post/123')
 * @param title - 페이지 제목 (선택사항)
 */
export const trackPageView = (path: string, title?: string) => {
  if (!isInitialized) return;

  try {
    ReactGA.send({
      hitType: 'pageview',
      page: path,
      title: title || document.title,
    });

    if (import.meta.env.DEV) {
      console.log('📊 페이지 뷰 추적:', path, title);
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('페이지 뷰 추적 실패:', error);
    }
  }
};

/**
 * 커스텀 이벤트 추적
 * @param category - 이벤트 카테고리 (예: 'Post', 'User', 'Engagement')
 * @param action - 이벤트 액션 (예: 'View', 'Like', 'Comment')
 * @param label - 이벤트 라벨 (선택사항)
 * @param value - 이벤트 값 (선택사항)
 */
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
) => {
  if (!isInitialized) return;

  try {
    ReactGA.event({
      category,
      action,
      label,
      value,
    });

    if (import.meta.env.DEV) {
      console.log('🎯 이벤트 추적:', { category, action, label, value });
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('이벤트 추적 실패:', error);
    }
  }
};

/**
 * 게시글 조회 이벤트
 * @param postId - 게시글 ID
 * @param postTitle - 게시글 제목
 */
export const trackPostView = (postId: string, postTitle: string) => {
  trackEvent('Post', 'View', postTitle, undefined);
};

/**
 * 좋아요 이벤트
 * @param postId - 게시글 ID
 * @param isLiked - 좋아요 상태 (true: 좋아요, false: 좋아요 취소)
 */
export const trackLike = (postId: string, isLiked: boolean) => {
  trackEvent('Engagement', isLiked ? 'Like' : 'Unlike', postId);
};

/**
 * 댓글 작성 이벤트
 * @param postId - 게시글 ID
 */
export const trackComment = (postId: string) => {
  trackEvent('Engagement', 'Comment', postId);
};

/**
 * 게시글 작성 이벤트
 * @param week - 주차 정보
 */
export const trackPostCreate = (week: string) => {
  trackEvent('Post', 'Create', week);
};

/**
 * 로그인 이벤트
 * @param method - 로그인 방법 (예: 'Google')
 */
export const trackLogin = (method: string) => {
  trackEvent('User', 'Login', method);
};

/**
 * 로그아웃 이벤트
 */
export const trackLogout = () => {
  trackEvent('User', 'Logout');
};

/**
 * 검색 이벤트
 * @param searchTerm - 검색어
 */
export const trackSearch = (searchTerm: string) => {
  trackEvent('Search', 'Submit', searchTerm);
};
