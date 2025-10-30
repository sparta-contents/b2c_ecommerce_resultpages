# 사전 승인 인증 모달 로그인 상태 표시 개선 계획

## 문제 상황

### 현재 동작
1. 사용자가 Google 로그인 실행
2. Google OAuth 성공 → Supabase Auth 세션 생성
3. `users` 테이블에 사용자 없음 (PGRST116 에러)
4. `needsVerification = true` 설정 → 사전 승인 모달 표시
5. **문제**: Header에 프로필 이미지가 표시됨 (로그인된 것처럼 보임)

### 문제 원인 분석

**AuthContext.tsx:131 - onAuthStateChange**
```typescript
setUser(session?.user ?? null);  // ⚠️ Google 로그인 직후 user가 설정됨
```

**home.tsx:300**
```typescript
<Header
  isLoggedIn={!!user}  // ⚠️ user가 있으면 true → 프로필 표시
  user={user ? {...} : undefined}
/>
```

**문제점**:
- Google OAuth 성공 시 Supabase Auth 세션이 생성됨
- `user` state가 세션의 user로 설정됨
- `users` 테이블에 없어도 `user` state는 존재
- Header는 `user` 존재 여부만 확인하여 로그인 상태로 표시

---

## 수정 방안

### 해결 전략
**"사전 승인 대기 중"은 로그아웃 상태로 처리**

사전 승인 모달이 표시되는 동안:
- Header에 "Google 로그인" 버튼 표시
- 프로필 이미지/메뉴 숨김
- 실제 Supabase 세션은 유지 (RLS 정책으로 사용자 생성을 위해 필요)

### 수정 항목

#### 1. AuthContext - isAuthenticated 플래그 추가

**파일**: `client/src/contexts/AuthContext.tsx`

**변경 내용**:
```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;  // ✅ 추가: 실제 인증 완료 여부
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  needsVerification: boolean;
  pendingGoogleUser: {...} | null;
  clearVerificationState: () => void;
}
```

**로직 추가**:
```typescript
// isAuthenticated 계산
const isAuthenticated = !!user && !needsVerification;

// Context Provider value 업데이트
<AuthContext.Provider value={{
  user,
  loading,
  userRole,
  isAdmin,
  isAuthenticated,  // ✅ 추가
  signInWithGoogle,
  signOut,
  needsVerification,
  pendingGoogleUser,
  clearVerificationState
}}>
```

**핵심 로직**:
- `user`가 있어도 `needsVerification === true`이면 `isAuthenticated = false`
- `users` 테이블에 등록된 사용자만 인증 완료로 간주

---

#### 2. Home 페이지 - Header props 수정

**파일**: `client/src/pages/home.tsx`

**변경 전**:
```typescript
const { user, loading, isAdmin, signInWithGoogle, signOut } = useAuth();

<Header
  isLoggedIn={!!user}  // ❌ 문제: user만 체크
  isAdmin={isAdmin}
  user={user ? {...} : undefined}
  ...
/>
```

**변경 후**:
```typescript
const { user, loading, isAdmin, isAuthenticated, signInWithGoogle, signOut } = useAuth();

<Header
  isLoggedIn={isAuthenticated}  // ✅ 수정: isAuthenticated 사용
  isAdmin={isAdmin}
  user={isAuthenticated && user ? {...} : undefined}  // ✅ 추가 조건
  ...
/>
```

**효과**:
- 사전 승인 모달이 뜬 상태: `isLoggedIn = false`, `user = undefined`
- Header에 "Google 로그인" 버튼 표시
- 프로필 메뉴 숨김

---

#### 3. Admin 페이지 - 동일 수정

**파일**: `client/src/pages/admin.tsx`

**변경 내용**:
```typescript
const { user, isAdmin, isAuthenticated } = useAuth();

// 인증되지 않았거나 관리자가 아니면 리다이렉트
if (!isAuthenticated || !isAdmin) {
  setLocation("/");
  return null;
}
```

---

#### 4. Profile 페이지 - 접근 제어 추가

**파일**: `client/src/pages/profile.tsx`

**추가 내용**:
```typescript
const { user, isAuthenticated } = useAuth();

// 인증되지 않으면 메인으로 리다이렉트
if (!isAuthenticated) {
  setLocation("/");
  return null;
}
```

---

#### 5. Write 페이지 - 동일 패턴 적용

**파일**: `client/src/pages/write.tsx`

**확인 사항**:
- 이미 로그인 체크가 있는지 확인
- 없으면 `isAuthenticated` 체크 추가

---

## 상세 구현 단계

### Step 1: AuthContext 수정

**위치**: `client/src/contexts/AuthContext.tsx:5-21`

1. `AuthContextType` 인터페이스에 `isAuthenticated` 추가
2. `AuthProvider` 내부에서 `isAuthenticated` 계산
3. Context Provider value에 `isAuthenticated` 추가

```typescript
// Line 5-21
interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;  // ✅ 추가
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  needsVerification: boolean;
  pendingGoogleUser: {...} | null;
  clearVerificationState: () => void;
}

// Line 251 근처 (isAdmin 계산 위치)
const isAdmin = userRole === 'admin';
const isAuthenticated = !!user && !needsVerification;  // ✅ 추가

// Line 254-264 (Provider value)
<AuthContext.Provider value={{
  user,
  loading,
  userRole,
  isAdmin,
  isAuthenticated,  // ✅ 추가
  signInWithGoogle,
  signOut,
  needsVerification,
  pendingGoogleUser,
  clearVerificationState
}}>
```

---

### Step 2: Home 페이지 수정

**위치**: `client/src/pages/home.tsx:33, 299-316`

```typescript
// Line 33
const { user, loading, isAdmin, isAuthenticated, signInWithGoogle, signOut } = useAuth();

// Line 299-316
<Header
  isLoggedIn={isAuthenticated}  // ✅ 수정
  isAdmin={isAdmin}
  user={
    isAuthenticated && user  // ✅ 추가 조건
      ? {
          name:
            userProfile?.name ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "User",
          profileImage: profileLoading
            ? undefined
            : userProfile?.profile_image ||
              user.user_metadata?.avatar_url,
        }
      : undefined
  }
  sortBy={sortBy}
  onSortChange={setSortBy}
  onWriteClick={() => {
    if (!isAuthenticated) {  // ✅ user 대신 isAuthenticated 사용
      toast({
        title: "로그인이 필요합니다",
        description: "Google 계정으로 로그인해주세요",
      });
      setTimeout(() => {
        signInWithGoogle();
      }, 100);
      return;
    }
    setShowCreateModal(true);
  }}
  ...
/>
```

---

### Step 3: Admin 페이지 수정

**위치**: `client/src/pages/admin.tsx:22, 131-134`

```typescript
// Line 22
const { user, isAdmin, isAuthenticated } = useAuth();

// Line 131-134
// Redirect if not authenticated or not admin
if (!isAuthenticated || !isAdmin) {
  setLocation("/");
  return null;
}
```

---

### Step 4: Profile 페이지 수정

**파일**: `client/src/pages/profile.tsx`

**추가 위치**: 컴포넌트 시작 부분 (useAuth 호출 직후)

```typescript
const { user, isAuthenticated } = useAuth();

// 인증되지 않으면 리다이렉트
if (!isAuthenticated) {
  setLocation("/");
  return null;
}
```

---

## 동작 플로우 (수정 후)

### 시나리오 1: 사전 승인 없는 사용자

```
1. Google 로그인 클릭
   ↓
2. Google OAuth 성공
   ↓
3. Supabase Auth 세션 생성
   user ≠ null
   ↓
4. users 테이블 조회 → 없음 (PGRST116)
   ↓
5. AuthContext 상태:
   - user = Google user 객체
   - needsVerification = true
   - isAuthenticated = false  ✅
   ↓
6. Header 표시:
   - isLoggedIn = false  ✅
   - "Google 로그인" 버튼 표시  ✅
   - 프로필 메뉴 숨김  ✅
   ↓
7. 사전 승인 모달 표시
```

### 시나리오 2: 사전 승인 완료 후

```
1. 사용자가 이름/전화번호 입력
   ↓
2. approved_users 확인 → 일치
   ↓
3. users 테이블에 사용자 생성
   ↓
4. clearVerificationState() 호출
   - needsVerification = false
   ↓
5. 페이지 새로고침
   ↓
6. 세션 재로드
   ↓
7. users 테이블 조회 → 있음
   ↓
8. AuthContext 상태:
   - user = user 객체
   - needsVerification = false
   - isAuthenticated = true  ✅
   ↓
9. Header 표시:
   - isLoggedIn = true  ✅
   - 프로필 이미지/메뉴 표시  ✅
```

---

## 추가 고려사항

### 1. 버튼 클릭 동작 일관성

사전 승인 모달이 떠 있는 상태에서 사용자가 다시 "Google 로그인" 버튼을 클릭하면?

**현재 동작**:
- 이미 로그인되어 있으므로 아무 일도 안 일어남

**권장 처리**:
```typescript
const signInWithGoogle = async () => {
  // 이미 사전 승인 대기 중이면 무시
  if (needsVerification) {
    return;
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) console.error('Error signing in with Google:', error);
};
```

---

### 2. 로딩 상태 표시

사전 승인 확인 중 로딩 상태 표시:

```typescript
// AuthContext에서
const [isVerifying, setIsVerifying] = useState(false);

// users 테이블 조회 전
setIsVerifying(true);

// 조회 완료 후
setIsVerifying(false);

// Header에 전달
<Header
  isLoggedIn={isAuthenticated}
  isLoading={isVerifying}  // 로딩 중이면 스피너 표시
  ...
/>
```

---

### 3. 에러 처리

사전 승인 실패 시 명확한 로그아웃 처리:

```typescript
const handleVerificationClose = async () => {
  clearVerificationState();

  // Supabase 세션도 삭제
  await supabase.auth.signOut({ scope: 'global' });

  toast({
    title: "인증 취소",
    description: "회원가입이 취소되었습니다.",
    variant: "destructive",
  });
};
```

---

## 테스트 시나리오

### 테스트 1: 사전 승인 없는 사용자
1. Google 로그인 실행
2. **확인**: Header에 "Google 로그인" 버튼 표시됨
3. **확인**: 프로필 이미지/메뉴가 표시되지 않음
4. **확인**: 사전 승인 모달 표시됨
5. 모달 닫기 클릭
6. **확인**: 로그인 버튼으로 돌아옴

### 테스트 2: 사전 승인 완료
1. 사전 승인 모달에서 정보 입력
2. 승인된 사용자 정보 입력
3. 제출
4. **확인**: 페이지 새로고침 후 프로필 표시됨
5. **확인**: 드롭다운 메뉴 작동

### 테스트 3: 페이지 접근 제어
1. 사전 승인 대기 상태에서 `/admin` 접근
2. **확인**: 메인 페이지로 리다이렉트
3. `/profile` 접근
4. **확인**: 메인 페이지로 리다이렉트

---

## 구현 체크리스트

- [ ] AuthContext에 `isAuthenticated` 플래그 추가
- [ ] AuthContext의 `isAuthenticated` 계산 로직 구현
- [ ] Home 페이지 Header에 `isAuthenticated` 적용
- [ ] Home 페이지의 모든 인증 체크를 `isAuthenticated`로 변경
- [ ] Admin 페이지 접근 제어에 `isAuthenticated` 추가
- [ ] Profile 페이지 접근 제어 추가
- [ ] Write 페이지 인증 체크 확인
- [ ] 사전 승인 모달 닫기 시 Supabase 세션 삭제 처리
- [ ] 테스트 시나리오 1 통과
- [ ] 테스트 시나리오 2 통과
- [ ] 테스트 시나리오 3 통과

---

## 예상 결과

### 개선 전
```
Google 로그인 성공
  → 프로필 이미지 표시 ❌
  → 사전 승인 모달 표시
  → 혼란스러운 UX
```

### 개선 후
```
Google 로그인 성공
  → "Google 로그인" 버튼 유지 ✅
  → 사전 승인 모달 표시
  → 명확한 "미인증" 상태 표시 ✅
```

---

## 요약

### 핵심 변경사항
1. **AuthContext**: `isAuthenticated` 플래그 추가
   - `user && !needsVerification` 조건으로 계산

2. **모든 페이지**: `!!user` 대신 `isAuthenticated` 사용
   - Header의 `isLoggedIn` prop
   - 페이지 접근 제어
   - 버튼 클릭 핸들러

3. **사전 승인 대기 상태** = 로그아웃 상태
   - Header에 로그인 버튼 표시
   - 프로필 메뉴 숨김
   - 보호된 페이지 접근 차단

### 변경 파일 목록
1. `client/src/contexts/AuthContext.tsx`
2. `client/src/pages/home.tsx`
3. `client/src/pages/admin.tsx`
4. `client/src/pages/profile.tsx`
5. `client/src/pages/write.tsx` (확인 필요)
