# 결과물 제출 페이지 (Result Submission Page)

## 프로젝트 개요
사용자가 창작 작품을 공유하고 커뮤니티와 소통할 수 있는 포트폴리오 스타일의 커뮤니티 플랫폼입니다.

## 주요 기능

### 인증 시스템
- Google OAuth 로그인/로그아웃
- 세션 기반 인증 (express-session + passport)
- 인증된 사용자만 글 작성/댓글/좋아요 가능

### 게시물 관리
- 게시물 작성 (제목, 내용, 이미지 업로드)
- 게시물 수정/삭제 (본인만 가능)
- 그리드 레이아웃으로 게시물 목록 표시
- 모달 형태의 게시물 상세보기
- 정렬 옵션: 최신순(latest), 인기순(popular)
- "내가 쓴 글" 필터링

### 이미지 업로드
- Replit Object Storage 사용
- 로컬 파일 업로드
- 이미지 미리보기

### 상호작용
- 하트(좋아요) 기능 - 토글 형태
- 댓글 작성/삭제
- 실시간 카운트 업데이트

## 기술 스택

### Frontend
- React + TypeScript
- Wouter (라우팅)
- TanStack Query (상태 관리)
- Shadcn UI (컴포넌트)
- Tailwind CSS (스타일링)
- Lucide React (아이콘)

### Backend
- Express.js
- Passport.js (Google OAuth)
- Multer (파일 업로드)
- Drizzle ORM
- Supabase (PostgreSQL)

### Storage
- Replit Object Storage (이미지)
- Supabase (데이터베이스)

## 데이터베이스 스키마

### users
- id (varchar, UUID)
- email (varchar, unique)
- name (varchar)
- profileImage (varchar, nullable)

### posts
- id (varchar, UUID)
- userId (varchar, FK -> users.id)
- title (varchar)
- content (text)
- imageUrl (varchar)
- createdAt (timestamp)

### comments
- id (varchar, UUID)
- postId (varchar, FK -> posts.id)
- userId (varchar, FK -> users.id)
- content (text)
- createdAt (timestamp)

### hearts
- id (varchar, UUID)
- postId (varchar, FK -> posts.id)
- userId (varchar, FK -> users.id)
- unique(postId, userId)

## API 엔드포인트

### 인증
- GET `/api/auth/me` - 현재 사용자 정보
- GET `/api/auth/google` - Google OAuth 시작
- GET `/api/auth/google/callback` - OAuth 콜백
- POST `/api/auth/logout` - 로그아웃

### 게시물
- GET `/api/posts?sortBy=latest&userId=xxx` - 게시물 목록
- GET `/api/posts/:id` - 게시물 상세
- POST `/api/posts` - 게시물 작성 (multipart/form-data)
- PATCH `/api/posts/:id` - 게시물 수정
- DELETE `/api/posts/:id` - 게시물 삭제

### 하트
- POST `/api/posts/:postId/heart` - 좋아요 토글

### 댓글
- POST `/api/posts/:postId/comments` - 댓글 작성
- PATCH `/api/comments/:id` - 댓글 수정
- DELETE `/api/comments/:id` - 댓글 삭제

## 디자인
- 다크 모드 포트폴리오 스타일
- Navy-blue 컬러 스킴
- Inter + Noto Sans KR 폰트
- Dribbble/Behance 스타일 영감

## 환경 변수
- DATABASE_URL (Supabase)
- GOOGLE_OAUTH_CLIENT_ID
- GOOGLE_OAUTH_CLIENT_SECRET
- SESSION_SECRET
- DEFAULT_OBJECT_STORAGE_BUCKET_ID
- PUBLIC_OBJECT_SEARCH_PATHS
- PRIVATE_OBJECT_DIR

## 페이지 구성
- `/` - 홈 (게시물 목록)
- `/write` - 게시물 작성

## 주요 컴포넌트
- Header: 로고, 정렬 옵션, 프로필 메뉴
- PostGrid: 게시물 그리드 레이아웃
- PostCard: 개별 게시물 카드
- PostDetailModal: 게시물 상세 모달
- CreatePostForm: 게시물 작성 폼
- CommentSection: 댓글 섹션
