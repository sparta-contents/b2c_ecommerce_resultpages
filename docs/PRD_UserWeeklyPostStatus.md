# PRD: 사용자 - 주차별 게시글 작성 현황

## 1. 개요

### 목적
관리자가 각 사용자의 주차별 과제 제출 현황을 한눈에 파악하고, 빠르게 게시글을 확인할 수 있는 기능 제공

### 목표
- 사용자별 1주차~6주차 과제 제출 현황 시각화
- 빠른 게시글 조회를 위한 인터랙티브 UI
- 대량 데이터 처리를 위한 최적화된 성능

---

## 2. 기능 요구사항

### 2.1 위치
- **배치**: 관리자 대시보드 (`/admin`)
- **순서**: "최근 게시글" 섹션과 "일별 게시글 통계" 차트 사이

### 2.2 데이터 표시

#### 필터링
- ✅ **일반 사용자만 표시** (admin 계정 제외)
- ✅ role이 'user'인 계정만 포함
- ✅ 최근 활동 순으로 정렬 (선택사항)

#### 리스트 구조
```
[사용자명] [이메일]
[1주차] [2주차] [3주차] [4주차] [5주차] [6주차]
```

**예시**:
```
김철수 (chulsoo@example.com)
[1주차] [2주차] [3주차] [4주차] [5주차] [6주차]
```

#### 주차 태그 스타일
| 상태 | 색상 | 설명 |
|------|------|------|
| 작성됨 | **파란색** (`bg-blue-500`) | 해당 주차 과제 제출 완료 |
| 미작성 | **회색** (`bg-gray-200`) | 해당 주차 과제 미제출 |

### 2.3 인터랙션

#### 태그 클릭 이벤트
1. **작성된 주차 태그 클릭 시**:
   - 해당 주차 게시글 상세 모달 열기
   - 게시글이 1개: 단일 모달 표시
   - 게시글이 2개 이상: 슬라이드 모달 표시

2. **미작성 주차 태그 클릭 시**:
   - 클릭 불가 (cursor: not-allowed)
   - 또는 "작성된 게시글이 없습니다" 토스트 메시지

#### 슬라이드 모달 (2개 이상일 때)
```
┌─────────────────────────────────────────┐
│       게시글 1 / 3                       │
│  ─────────────────────────────────────  │
│                                         │
│ [<]  [게시글 상세 내용]              [>]  │
│                                         │
└─────────────────────────────────────────┘
```

- **좌우 화살표 버튼**: 이전/다음 게시글 이동
- **인디케이터**: "1 / 3" 형식으로 현재 위치 표시
- **키보드 단축키** (선택사항):
  - `←` 왼쪽 화살표: 이전 게시글
  - `→` 오른쪽 화살표: 다음 게시글
  - `Esc`: 모달 닫기

---

## 3. 기술 요구사항

### 3.1 데이터 구조

#### API 응답 형식
```typescript
interface UserWeeklyPostStatus {
  userId: string;
  userName: string;
  email: string;
  weeklyPosts: {
    "1주차 과제": string[];  // 게시글 ID 배열
    "2주차 과제": string[];
    "3주차 과제": string[];
    "4주차 과제": string[];
    "5주차 과제": string[];
    "6주차 과제": string[];
  };
}
```

#### Supabase 쿼리
```sql
SELECT
  u.id,
  u.name,
  u.email,
  json_object_agg(
    p.week,
    json_agg(p.id ORDER BY p.created_at DESC)
  ) as weekly_posts
FROM users u
LEFT JOIN posts p ON u.id = p.user_id AND p.deleted = false
WHERE u.role = 'user'  -- admin 제외
GROUP BY u.id, u.name, u.email
ORDER BY u.name ASC;
```

### 3.2 캐싱 전략

#### React Query 설정
```typescript
const { data: userWeeklyStatus } = useQuery({
  queryKey: ['admin-user-weekly-status'],
  queryFn: getUserWeeklyPostStatus,
  staleTime: 1000 * 60 * 10,  // 10분
  gcTime: 1000 * 60 * 30,      // 30분
});
```

#### 캐시 무효화 조건
- 새 게시글 작성
- 게시글 삭제
- 관리자가 대시보드 새로고침 버튼 클릭 시

#### 최적화 포인트
1. **초기 로딩**: 사용자 목록만 먼저 로드 (게시글 ID만)
2. **지연 로딩**: 태그 클릭 시 게시글 상세 데이터 fetch
3. **메모이제이션**: 사용자 컴포넌트를 React.memo로 감싸기
4. **가상화** (선택사항): 사용자 100명 이상일 경우 react-window 사용

### 3.3 컴포넌트 구조

```
AdminDashboard
├── UserWeeklyPostStatus (NEW)
│   ├── UserPostStatusList
│   │   └── UserPostStatusItem
│   │       ├── UserInfo
│   │       └── WeekTagGroup
│   │           └── WeekTag (clickable)
│   └── PostSlideModal (NEW)
│       ├── SlideControls (prev/next buttons)
│       ├── PostDetailContent (재사용)
│       └── SlideIndicator
```

---

## 4. UI/UX 상세

### 4.1 레이아웃

```tsx
<Card>
  <CardHeader>
    <CardTitle>수강생 - 주차별 게시글 작성 현황</CardTitle>
    <CardDescription>
      수강생의 주차별 과제 제출 현황입니다. 파란색 태그를 클릭하여 게시글을 확인하세요.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-4 max-h-[600px] overflow-y-auto">
      {users.map(user => (
        <div key={user.id} className="border-b pb-4 last:border-b-0">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.profile_image} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 ml-10">
            {weeks.map(week => (
              <Badge
                key={week}
                className={hasPost(user, week)
                  ? "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"}
                onClick={() => hasPost(user, week) && openModal(user, week)}
              >
                {week}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

### 4.2 슬라이드 모달

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-5xl">
    <DialogHeader>
      <DialogTitle className="flex items-center justify-between">
        <span>{currentWeek} - {currentUser.name}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft />
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {totalPosts}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            disabled={currentIndex === totalPosts - 1}
          >
            <ChevronRight />
          </Button>
        </div>
      </DialogTitle>
    </DialogHeader>

    <PostDetailContent post={currentPost} />
  </DialogContent>
</Dialog>
```

### 4.3 반응형 디자인

| 화면 크기 | 레이아웃 |
|-----------|----------|
| 모바일 (< 640px) | 주차 태그 2줄로 표시 (3개씩) |
| 태블릿 (640px~1024px) | 주차 태그 1줄 표시 |
| 데스크톱 (> 1024px) | 주차 태그 1줄 표시 |

---

## 5. 성능 최적화

### 5.1 목표 지표
- **초기 로딩 시간**: < 2초 (100명 기준)
- **태그 클릭 → 모달 오픈**: < 500ms
- **슬라이드 전환**: < 200ms

### 5.2 최적화 기법

#### 백엔드
1. **인덱스 추가**:
   ```sql
   CREATE INDEX idx_posts_user_week ON posts(user_id, week, deleted);
   CREATE INDEX idx_users_role ON users(role);
   ```

2. **쿼리 최적화**:
   - JOIN 대신 서브쿼리 사용 검토
   - 필요한 컬럼만 SELECT

#### 프론트엔드
1. **React Query**:
   - 10분 staleTime으로 불필요한 재요청 방지
   - 백그라운드 재검증 비활성화

2. **컴포넌트 최적화**:
   - `React.memo`로 사용자 아이템 메모이제이션
   - `useMemo`로 주차 태그 계산 캐싱

3. **지연 로딩**:
   - 게시글 상세 데이터는 모달 오픈 시 로드
   - 이미지 lazy loading

4. **가상 스크롤** (100명 이상):
   - `react-window` 또는 `react-virtual` 사용

---

## 6. 에러 처리

### 6.1 에러 시나리오

| 시나리오 | 처리 방법 |
|----------|-----------|
| 데이터 로딩 실패 | "데이터를 불러올 수 없습니다" 에러 메시지 표시 + 재시도 버튼 |
| 게시글 없음 | "작성된 게시글이 없습니다" 빈 상태 표시 |
| 게시글 조회 실패 | 토스트 에러 메시지 + 모달 닫기 |
| 네트워크 오류 | "네트워크 연결을 확인해주세요" 메시지 |

### 6.2 로딩 상태
```tsx
{isLoading ? (
  <div className="text-center py-12">
    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
    <p className="text-muted-foreground mt-2">불러오는 중...</p>
  </div>
) : (
  <UserPostStatusList users={users} />
)}
```

---

## 7. 테스트 시나리오

### 7.1 기능 테스트
- [ ] admin 계정이 목록에서 제외되는지 확인
- [ ] 주차별 작성 현황이 정확히 표시되는지 확인
- [ ] 파란색 태그 클릭 시 모달이 정상적으로 열리는지 확인
- [ ] 회색 태그는 클릭 불가인지 확인
- [ ] 2개 이상 게시글일 때 슬라이드가 정상 작동하는지 확인
- [ ] 화살표 버튼으로 이전/다음 이동 가능한지 확인

### 7.2 성능 테스트
- [ ] 100명 데이터 로딩 시간 < 2초
- [ ] 모달 오픈 시간 < 500ms
- [ ] 슬라이드 전환 < 200ms
- [ ] 메모리 누수 없음

### 7.3 엣지 케이스
- [ ] 사용자가 0명일 때
- [ ] 특정 사용자가 모든 주차를 작성했을 때
- [ ] 특정 사용자가 하나도 작성하지 않았을 때
- [ ] 같은 주차에 10개 이상 게시글이 있을 때

---

## 8. 우선순위

### Phase 1 (MVP) - 필수
- [x] 사용자 목록 표시 (admin 제외)
- [x] 주차별 태그 표시 (파란색/회색)
- [x] 태그 클릭 → 단일 게시글 모달
- [x] 기본 캐싱 (10분 staleTime)

### Phase 2 - 중요
- [ ] 슬라이드 모달 (2개 이상일 때)
- [ ] 좌우 화살표 네비게이션
- [ ] 인덱스 추가 및 쿼리 최적화

### Phase 3 - 개선
- [ ] 키보드 단축키
- [ ] 가상 스크롤 (100명 이상)
- [ ] 사용자 검색 기능
- [ ] 진행률 표시 (예: "3/6 완료")

---

## 9. 참고 사항

### 9.1 기존 컴포넌트 재사용
- `PostDetailModal`: 게시글 상세 표시 로직 재사용
- `Avatar`: 사용자 프로필 이미지 표시
- `Badge`: 주차 태그 스타일링
- `Card`: 전체 섹션 레이아웃

### 9.2 새로 필요한 컴포넌트
- `UserWeeklyPostStatus.tsx`: 메인 컴포넌트
- `PostSlideModal.tsx`: 슬라이드 모달 (2개 이상일 때)
- `WeekTagGroup.tsx`: 주차 태그 그룹 (선택사항)

### 9.3 API 추가
```typescript
// lib/supabase-api.ts
export async function getUserWeeklyPostStatus(): Promise<UserWeeklyPostStatus[]> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      name,
      email,
      profile_image,
      posts!inner(id, week, created_at)
    `)
    .eq('role', 'user')
    .eq('posts.deleted', false)
    .order('name', { ascending: true });

  if (error) throw error;

  // Transform data to group posts by week
  return transformUserWeeklyData(data);
}
```

---

## 10. 성공 지표

- **사용성**: 관리자가 3번 이내 클릭으로 원하는 게시글에 접근 가능
- **성능**: 100명 데이터 기준 2초 이내 로딩
- **안정성**: 에러율 < 1%
- **만족도**: 관리자 피드백 수집 후 개선사항 반영

---

## 마무리

이 PRD는 관리자가 사용자의 주차별 과제 제출 현황을 효율적으로 파악하고 관리할 수 있도록 설계되었습니다. 대량 데이터 처리를 위한 캐싱 전략과 최적화 기법을 적용하여 안정적인 성능을 보장합니다.
