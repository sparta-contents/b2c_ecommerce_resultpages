# SPARTA Club - 결과물 제출 페이지

## 프로젝트 개요
순수 React + Vite + Supabase로 구축된 포트폴리오 스타일의 커뮤니티 플랫폼입니다.

## 최근 변경사항 (2025-10-17)
- ✅ Express 백엔드 제거 → 순수 React SPA로 전환
- ✅ Supabase 직접 연결 (Auth, Database, Storage)
- ✅ Google OAuth with Supabase Auth
- ✅ Vite 개발 서버 (포트 5000)

## 주요 기능

### 인증 시스템
- **Supabase Auth** - Google OAuth 로그인/로그아웃
- React Context 기반 인증 상태 관리
- 인증된 사용자만 글 작성/댓글/좋아요 가능

### 게시물 관리
- 게시물 작성 (제목, 내용, 과제 단계, 이미지 업로드)
- 과제 단계: 1주차 과제, 2주차 과제, 3주차 과제
- 게시물 수정/삭제 (본인만 가능)
- 그리드 레이아웃으로 게시물 목록 표시
- 모달 형태의 게시물 상세보기
- 정렬 옵션: 최신순(latest), 인기순(popular)
- "내가 쓴 글" 필터링

### 이미지 업로드
- **Supabase Storage** 사용
- post-images 버킷 (Public)
- 로컬 파일 업로드
- 이미지 미리보기

### 상호작용
- 하트(좋아요) 기능 - 토글 형태
- 댓글 작성/삭제
- 실시간 카운트 업데이트

## 기술 스택

### Frontend (순수 React SPA)
- **React 18** + TypeScript
- **Vite** - 빠른 빌드 도구
- **Wouter** - 경량 라우팅
- **TanStack Query** - 서버 상태 관리
- **Shadcn UI** - UI 컴포넌트
- **Tailwind CSS** - 스타일링
- **Lucide React** - 아이콘

### Backend (Supabase)
- **Supabase Auth** - Google OAuth
- **Supabase Database** - PostgreSQL with RLS
- **Supabase Storage** - 이미지 저장

## 데이터베이스 스키마

### users
- id (varchar, UUID)
- email (varchar, unique)
- name (varchar)
- profile_image (varchar, nullable)
- google_id (varchar, nullable)
- created_at (timestamp)

### posts
- id (varchar, UUID)
- user_id (varchar, FK -> users.id)
- title (varchar)
- content (text)
- week (varchar) - 과제 단계
- image_url (varchar)
- heart_count (integer)
- comment_count (integer)
- created_at (timestamp)
- updated_at (timestamp)

### comments
- id (varchar, UUID)
- post_id (varchar, FK -> posts.id)
- user_id (varchar, FK -> users.id)
- content (text)
- created_at (timestamp)

### hearts
- id (varchar, UUID)
- post_id (varchar, FK -> posts.id)
- user_id (varchar, FK -> users.id)
- unique(post_id, user_id)

## Supabase 설정 필요

### 환경 변수 (Replit Secrets)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 설정 파일
- `supabase/schema.sql` - 데이터베이스 스키마 (RLS 포함)
- `supabase/seed.sql` - 예시 데이터 (8개 게시물)
- `SETUP.md` - 상세 설정 가이드

### Storage Bucket
- 이름: `post-images`
- 타입: Public
- Policies 필요 (SETUP.md 참조)

## 디자인
- 다크 모드 포트폴리오 스타일
- Navy-blue 컬러 스킴
- Inter + Noto Sans KR 폰트
- Dribbble/Behance 스타일 영감

## 페이지 구성
- `/` - 홈 (게시물 목록)
- `/write` - 게시물 작성

## 주요 컴포넌트
- **AuthContext** - Supabase Auth 상태 관리
- **Header** - 로고, 정렬, 프로필 메뉴
- **PostGrid** - 게시물 그리드
- **PostCard** - 개별 게시물 카드
- **PostDetailModal** - 게시물 상세 모달
- **CreatePostForm** - 게시물 작성 폼

## Supabase API 함수
- `lib/supabase.ts` - Supabase 클라이언트
- `lib/supabase-api.ts` - CRUD 함수
- `lib/supabase-hooks.ts` - 타입 정의
- `contexts/AuthContext.tsx` - Auth Provider

## 예시 데이터
`supabase/seed.sql`에 8개의 예시 게시물 포함:
- 3명의 사용자
- 다양한 과제 단계
- 댓글 및 하트 데이터
