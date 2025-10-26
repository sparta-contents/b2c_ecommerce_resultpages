# PRD: 내 정보 수정 기능

## 1. 개요

### 목적
사용자가 자신의 프로필 정보(이름, 프로필 사진)를 수정할 수 있는 기능을 제공하여 개인화된 경험을 향상시킵니다.

### 범위
- 사용자 이름 변경
- 프로필 사진 변경 (업로드)
- 변경 사항 즉시 반영

## 2. 배경 및 문제 정의

### 현재 상황
- 사용자는 Google OAuth로 로그인 시 자동으로 프로필이 생성됨
- 한 번 생성된 프로필 정보를 변경할 수 없음
- Google 프로필과 다른 정보를 사용하고 싶어도 불가능

### 해결하고자 하는 문제
1. 사용자가 본명 대신 닉네임을 사용하고 싶을 때
2. Google 프로필 사진 대신 다른 이미지를 사용하고 싶을 때
3. 프로필 정보를 개인화하고 싶을 때

## 3. 사용자 스토리

### 주요 페르소나
- **일반 사용자**: 커뮤니티에서 활동하며 자신의 정체성을 표현하고 싶은 사용자

### 사용자 시나리오
```
AS A 로그인한 사용자
I WANT TO 내 프로필 정보를 수정하고
SO THAT 커뮤니티에서 원하는 이름과 이미지로 활동할 수 있다
```

### 상세 사용자 스토리

1. **프로필 페이지 접근**
   - GIVEN 사용자가 로그인된 상태일 때
   - WHEN 네비게이션 바에서 프로필 아이콘을 클릭하여 드롭다운 메뉴를 열고
   - AND "내 정보 수정" 메뉴 항목을 클릭하면
   - THEN `/profile` 페이지로 이동한다

2. **이름 변경**
   - GIVEN 프로필 수정 페이지에 있을 때
   - WHEN 이름 입력 필드에 새로운 이름(1-16자)을 입력하고 저장하면
   - THEN 시스템은 이름을 업데이트하고 성공 메시지를 표시한다
   - AND 모든 게시글/댓글에 새 이름이 즉시 반영된다

3. **프로필 사진 변경**
   - GIVEN 프로필 수정 페이지에 있을 때
   - WHEN 새로운 이미지 파일(JPG/PNG)을 업로드하고 저장하면
   - THEN 시스템은 이미지를 자동으로 리사이징(200x200px)하고 최적화하여 Supabase Storage에 저장한다
   - AND 프로필 사진이 업데이트되고 미리보기가 표시된다
   - AND 모든 게시글/댓글에 새 프로필 사진이 즉시 반영된다

4. **유효성 검증**
   - GIVEN 사용자가 프로필을 수정하려 할 때
   - WHEN 이름이 비어있거나 너무 길면 (16자 초과)
   - THEN 에러 메시지를 표시하고 저장되지 않는다
   -
   - WHEN 이미지 파일이 JPG/PNG가 아니거나 원본 크기가 10MB를 초과하면
   - THEN 에러 메시지를 표시하고 업로드되지 않는다
   -
   - WHEN 유효한 이미지를 업로드하면
   - THEN 자동으로 200x200px로 리사이징되고 용량이 최적화된다

## 4. 기능 요구사항

### 4.1 UI/UX 요구사항

#### 프로필 수정 페이지 (`/profile`)

**레이아웃**
```
┌─────────────────────────────────────┐
│  내 정보 수정                        │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────┐                        │
│  │         │  [프로필 사진 변경]      │
│  │  사진   │                        │
│  │         │                        │
│  └─────────┘                        │
│                                     │
│  이름                               │
│  ┌─────────────────────────────┐   │
│  │ 현재 이름                    │   │
│  └─────────────────────────────┘   │
│                                     │
│  이메일 (읽기 전용)                 │
│  ┌─────────────────────────────┐   │
│  │ user@example.com            │   │
│  └─────────────────────────────┘   │
│                                     │
│           [취소]  [저장하기]        │
└─────────────────────────────────────┘
```

**구성 요소**
1. **프로필 사진 영역**
   - 현재 프로필 사진 표시 (원형, 120px)
   - "프로필 사진 변경" 버튼
   - 클릭 시 파일 선택 다이얼로그 오픈
   - **지원 형식: JPG, PNG만 허용 (GIF 제외)**
   - **권장 사이즈: 200x200px 이상** (자동 리사이징됨)
   - 원본 최대 파일 크기: 10MB (업로드 시간 및 메모리 관리용)
   - 업로드 시 클라이언트에서 자동으로 200x200px로 리사이징 및 용량 최적화
   - **최종 저장 용량: 일반적으로 50-150KB** (원본 크기와 무관)
   - 업로드 후 미리보기 표시
   - 권장 사이즈 안내 텍스트 표시: "권장 200x200px 이상 (JPG, PNG)"

2. **이름 입력 필드**
   - 텍스트 입력
   - **최소 1자, 최대 16자**
   - 실시간 유효성 검증 (16자 초과 시 입력 제한)
   - 글자 수 표시: "12/16"
   - 현재 이름으로 초기화

3. **이메일 표시**
   - 읽기 전용 (변경 불가)
   - 현재 이메일 표시

4. **버튼**
   - 취소: 변경 사항 무시하고 이전 페이지로
   - 저장하기: 변경 사항 저장 (Primary 버튼)

#### 네비게이션 바 수정
- 기존 프로필 드롭다운 메뉴에 "내 정보 수정" 항목 추가
- 로그인 상태: 프로필 아이콘 클릭 → 드롭다운 메뉴
  - **"내 정보 수정"** (새로 추가) - `/profile` 페이지로 이동
  - "내가 쓴 글" (기존)
  - "관리자 대시보드" (관리자만 표시, 기존)
  - "로그아웃" (기존)

### 4.2 기술 요구사항

#### API 엔드포인트

**1. 프로필 조회**
```typescript
// GET /api/users/:userId
// 또는 Supabase: supabase.from('users').select('*').eq('id', userId).single()
Response: {
  id: string;
  email: string;
  name: string;
  profile_image: string | null;
  role: string;
  created_at: string;
}
```

**2. 프로필 업데이트**
```typescript
// PATCH /api/users/:userId
// 또는 Supabase: supabase.from('users').update(data).eq('id', userId)
Request: {
  name?: string;
  profile_image?: string;
}
Response: {
  success: boolean;
  user: User;
}
```

**3. 프로필 사진 업로드**
```typescript
// POST /api/upload/profile-image
// 또는 Supabase: supabase.storage.from('profile-images').upload(path, file)
Request: FormData { file: File }
Response: {
  url: string;
}
```

#### 데이터베이스

**기존 테이블 활용**
- `users` 테이블은 이미 존재하며 필요한 필드 포함
- RLS 정책도 이미 설정되어 있음: "Users can update their own profile"

**Storage Bucket 추가**
- Bucket 이름: `profile-images`
- Public bucket으로 설정
- 폴더 구조: `{user_id}/{timestamp}.{ext}`

#### 프론트엔드 구현

**파일 구조**
```
client/src/
├── pages/
│   └── profile.tsx              # 새로 생성
├── components/
│   ├── Header.tsx               # 수정: "내 정보 수정" 메뉴 항목 추가
│   └── ProfileImageUpload.tsx   # 새로 생성
├── lib/
│   └── supabase-api.ts          # 함수 추가
├── App.tsx                      # 수정: /profile 라우트 추가
└── hooks/
    └── useProfile.ts             # 새로 생성 (선택사항)
```

**Header 컴포넌트 수정 사항**
- `HeaderProps`에 `onProfileEditClick?: () => void` 추가
- 드롭다운 메뉴에 "내 정보 수정" 항목 추가 (Settings 아이콘 사용)
- 메뉴 순서: 내 정보 수정 → 내가 쓴 글 → 관리자 대시보드 → 로그아웃

**주요 함수**
```typescript
// supabase-api.ts에 추가
export async function getUserProfile(userId: string)
export async function updateUserProfile(userId: string, data: { name?: string; profile_image?: string })
export async function uploadProfileImage(file: File): Promise<string>
  // 이미지 리사이징 및 최적화 포함:
  // 1. 원본 파일 검증 (JPG/PNG만, 최대 10MB)
  // 2. Canvas API 사용하여 200x200px로 리사이징
  // 3. 품질 85%로 압축
  // 4. Supabase Storage에 업로드
  // 5. Public URL 반환

// 클라이언트 측 이미지 리사이징 헬퍼 함수
export async function resizeImage(file: File, maxSize: number = 200): Promise<Blob>
```

### 4.3 유효성 검증

**클라이언트 측**
- 이름: 1-16자, 공백만으로 구성 불가, 실시간 글자 수 제한
- 이미지 원본: **JPG/PNG만 허용 (GIF 제외)**, 원본 최대 10MB (업로드 성능 고려)
- 이미지 리사이징:
  - 클라이언트에서 200x200px로 리사이징 (Canvas API)
  - JPEG 품질 85%로 압축
  - **최종 용량: 일반적으로 50-150KB** (원본 크기와 무관하게 자동 최적화)
  - 따라서 원본이 10MB여도 최종 업로드되는 파일은 150KB 이하

**서버 측 (Supabase RLS)**
- 본인만 자신의 프로필 수정 가능
- 이메일, id, role 변경 불가

### 4.4 보안 요구사항

1. **인증/인가**
   - 로그인한 사용자만 접근 가능
   - 본인의 프로필만 수정 가능 (RLS로 강제)

2. **파일 업로드 보안**
   - MIME 타입 검증 (JPG/PNG만 허용, GIF 제외)
   - 원본 파일 크기 제한 (10MB) - 업로드 시간 및 브라우저 메모리 관리
   - 클라이언트 측 자동 리사이징 (200x200px, 품질 85%)
   - **최종 Storage 저장 용량: 약 50-150KB** (리사이징으로 자동 최적화)
   - 파일명 sanitization (timestamp 기반 생성)

3. **XSS 방지**
   - 이름 입력 시 HTML 태그 제거/이스케이프

## 5. 비기능 요구사항

### 5.1 성능
- 프로필 업데이트 응답 시간: < 1초
- 이미지 업로드 시간: < 3초 (5MB 기준)
- 이미지 로딩 시 progressive loading 적용

### 5.2 사용성
- 변경 사항 저장 전 확인 다이얼로그 표시 (선택사항)
- 저장 성공/실패 시 명확한 피드백 제공
- 업로드 중 로딩 인디케이터 표시

### 5.3 호환성
- 모바일 반응형 디자인
- 최신 브라우저 (Chrome, Firefox, Safari, Edge) 지원

## 6. 예외 처리

### 6.1 에러 시나리오

| 시나리오 | 에러 메시지 | 처리 방법 |
|---------|-----------|----------|
| 이름이 비어있음 | "이름을 입력해주세요." | 저장 버튼 비활성화 |
| 이름이 너무 긺 | "이름은 16자 이내로 입력해주세요." | 입력 제한 (16자 이상 입력 불가) |
| 이미지 파일 크기 초과 | "파일 크기는 10MB 이하여야 합니다." | 업로드 취소 |
| 지원하지 않는 형식 | "JPG, PNG 형식만 지원합니다." | 업로드 취소 |
| GIF 파일 업로드 시도 | "GIF 파일은 지원하지 않습니다. JPG, PNG 형식만 업로드 가능합니다." | 업로드 취소 |
| 네트워크 에러 | "저장에 실패했습니다. 다시 시도해주세요." | 재시도 버튼 표시 |
| 권한 없음 | "프로필을 수정할 권한이 없습니다." | 에러 페이지 |

### 6.2 롤백 전략
- 이미지 업로드 후 프로필 업데이트 실패 시, 업로드된 이미지 삭제 (선택사항)
- 저장 실패 시 기존 값 유지

## 7. 마일스톤 및 일정

### Phase 1: 기본 기능 (3-4일)
- [ ] Header 컴포넌트에 "내 정보 수정" 메뉴 항목 추가
- [ ] `/profile` 라우트 추가 (App.tsx)
- [ ] 이미지 리사이징 헬퍼 함수 구현 (Canvas API)
- [ ] Supabase API 함수 추가 (프로필 조회/수정/이미지 업로드 with 리사이징)
- [ ] 프로필 페이지 UI 구현
- [ ] 이름 변경 기능 (1-16자, 글자 수 표시)
- [ ] 프로필 사진 업로드 기능 (JPG/PNG만, 자동 리사이징)

### Phase 2: UX 개선 (1-2일)
- [ ] 유효성 검증 강화
- [ ] 로딩/에러 상태 처리
- [ ] 모바일 반응형 대응
- [ ] 프로필 이미지 미리보기 기능

### Phase 3: 테스트 및 배포 (1일)
- [ ] 기능 테스트
- [ ] 크로스 브라우저 테스트
- [ ] 배포

## 8. 성공 지표

### 정량적 지표
- 프로필 수정 완료율: > 90%
- 프로필 사진 업로드 성공률: > 95%
- 페이지 로딩 시간: < 2초

### 정성적 지표
- 사용자가 프로필 변경 과정을 쉽게 이해하고 완료할 수 있음
- 변경 사항이 즉시 반영되어 피드백이 명확함

## 9. 향후 확장 가능성

### 추가 고려사항
- 프로필 사진 크롭 기능 (현재는 자동 중앙 정렬 리사이징)
- 프로필 공개/비공개 설정
- 소개글(bio) 필드 추가
- 비밀번호 변경 (현재 Google OAuth만 사용)
- 계정 삭제 기능
- WebP 형식 지원 (브라우저 호환성 확인 후)

## 10. 참고 자료

### 기술 문서
- [Supabase Storage 문서](https://supabase.com/docs/guides/storage)
- [Supabase RLS 문서](https://supabase.com/docs/guides/auth/row-level-security)

### 디자인 참고
- 기존 Shadcn UI 컴포넌트 스타일 일관성 유지
- 프로필 페이지 디자인: 깔끔하고 직관적인 폼 레이아웃

---

## 승인 및 검토

| 역할 | 이름 | 승인 날짜 | 서명 |
|-----|------|----------|-----|
| Product Owner | | | |
| Tech Lead | | | |
| Designer | | | |

**문서 버전**: 1.0
**작성일**: 2025-10-26
**최종 수정일**: 2025-10-26
CREATE POLICY "Authenticated users can upload profile images vejz8c_0" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'profile-images' AND auth.role() = 'authenticated');