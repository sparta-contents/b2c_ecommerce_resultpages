# Changelog

프로젝트의 모든 주요 변경사항을 기록합니다.

## [2025-01-11] - 하트 기능 쿼리 최적화 및 Database Trigger 구현

### 🚀 성능 개선

#### Hearts 쿼리 최적화
- **문제**: 모든 게시글의 모든 하트 데이터를 조인하여 불필요한 데이터 로딩 (N+1 쿼리 문제)
- **해결**:
  - 현재 로그인한 사용자의 하트만 별도 쿼리로 효율적으로 조회
  - `IN` 쿼리를 사용한 배치 조회로 성능 향상
  - `getPosts()`, `getPost()` 함수에 `currentUserId` 파라미터 추가

#### Database Trigger 구현
- **기능**: `hearts` 테이블의 INSERT/DELETE 시 `posts.heart_count` 자동 업데이트
- **구현**:
  ```sql
  CREATE TRIGGER update_post_heart_count_trigger
  AFTER INSERT OR DELETE ON hearts
  FOR EACH ROW
  EXECUTE FUNCTION update_post_heart_count();
  ```
- **보안**: `SECURITY DEFINER`로 RLS(Row Level Security)를 우회하여 안전하게 업데이트
- **데이터 정합성**: 기존 데이터 검증 및 자동 수정 쿼리 포함

#### toggleHeart 함수 리팩토링
- **성능 향상**: 4개 쿼리 → 2개 쿼리 (50% 감소)
  - **이전**: ① 하트 확인 → ② 하트 추가/삭제 → ③ heart_count 조회 → ④ heart_count 업데이트
  - **개선**: ① 하트 확인 → ② 하트 추가/삭제 (Trigger가 자동으로 heart_count 처리)
- **버그 수정**: `.maybeSingle()` 사용으로 406 에러 방지
  - 하트가 존재하지 않을 때 `.single()`은 406 에러 발생
  - `.maybeSingle()`은 null 반환으로 정상 처리

### ✨ UX 개선

#### Optimistic Update 구현
- **즉각적인 UI 반응**: 서버 응답을 기다리지 않고 즉시 하트 상태 업데이트
- **구현 세부사항**:
  - `onMutate`: 서버 요청 전 즉시 캐시 업데이트
  - `onError`: 에러 발생 시 이전 상태로 자동 롤백
  - `onSuccess`: Trigger를 신뢰하여 즉시 refetch 제거 (불필요한 네트워크 요청 방지)
- **사용자 경험**: 하트 클릭 시 즉각적인 빨간색 표시 및 숫자 증가

#### 로그인 상태 자동 동기화
- **개선**: `queryKey`에 `user?.id` 추가
- **효과**: 로그인/로그아웃 시 자동으로 쿼리 재실행하여 하트 상태 정확하게 표시

### 📁 추가된 파일
- `supabase/create_heart_count_trigger.sql` - Database Trigger SQL
- `supabase/HEART_COUNT_TRIGGER_README.md` - Trigger 적용 가이드

### 🔧 수정된 파일
- `client/src/lib/supabase-api.ts` - Hearts 쿼리 최적화 및 toggleHeart 리팩토링
- `client/src/pages/home.tsx` - Optimistic Update 구현 및 queryKey 개선
- `client/src/pages/admin.tsx` - getPost 함수 currentUserId 전달
- `client/src/components/PostSlideModal.tsx` - getPost 함수 currentUserId 전달

### 📊 성능 지표
- 하트 토글 쿼리 수: 4개 → 2개 (50% 감소)
- 불필요한 하트 데이터 로딩 제거
- UI 반응 속도: 즉각적 (Optimistic Update)
- 데이터 일관성: Database Trigger로 자동 보장

---

## [이전 버전]

이전 변경사항은 git commit history를 참조하세요.
