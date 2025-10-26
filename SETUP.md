# SPARTA Club - Supabase 설정 가이드

## 프로젝트 개요

순수 React (Vite) + Supabase로 구축된 커뮤니티 플랫폼입니다.

## 필요한 것

### 1. Supabase 프로젝트 생성

1. [Supabase Dashboard](https://supabase.com/dashboard)에 접속
2. "New Project" 클릭
3. 프로젝트 이름과 비밀번호 설정
4. 지역 선택 (가까운 곳)
5. 프로젝트 생성 완료까지 대기

### 2. 데이터베이스 설정

#### A. 스키마 생성

1. Supabase Dashboard에서 "SQL Editor" 탭 선택
2. `supabase/schema.sql` 파일 내용 복사
3. SQL Editor에 붙여넣고 실행

#### B. Seed 데이터 삽입 (선택사항)

1. SQL Editor에서 새 쿼리 열기
2. `supabase/seed.sql` 파일 내용 복사
3. 붙여넣고 실행

### 3. Storage 설정

#### A. Bucket 생성

1. Supabase Dashboard에서 "Storage" 탭 선택
2. "Create a new bucket" 클릭
3. Bucket 이름: `post-images`
4. Public bucket으로 설정 (체크박스 선택)
5. 생성

#### B. Storage Policy 설정

Storage 탭 > post-images > Policies에서:

**Read Policy (모두 읽기 가능):**

```sql
CREATE POLICY "Anyone can view post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');
```

**Upload Policy (인증된 사용자만 업로드):**

```sql
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-images' AND
  auth.role() = 'authenticated'
);
```

**Delete Policy (본인만 삭제):**

```sql
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 4. Google OAuth 설정

#### A. Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성
3. "APIs & Services" > "Credentials"
4. "CREATE CREDENTIALS" > "OAuth client ID"
5. Application type: Web application
6. Name: SPARTA Club
7. Authorized JavaScript origins:
   - `https://[YOUR-PROJECT-ID].supabase.co`
8. Authorized redirect URIs:
   - `https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback`
9. Client ID와 Client Secret 복사

#### B. Supabase에 Google OAuth 설정

1. Supabase Dashboard > "Authentication" > "Providers"
2. Google 찾아서 Enable
3. Client ID 입력
4. Client Secret 입력
5. 저장

### 5. 환경 변수 설정

#### Supabase 정보 가져오기

1. Supabase Dashboard > "Settings" > "API"
2. 다음 정보 복사:
   - Project URL (VITE_SUPABASE_URL)
   - anon public key (VITE_SUPABASE_ANON_KEY)

#### Replit Secrets 설정

Replit의 "Secrets" 탭에서 다음 변수 추가:

```
VITE_SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

### 6. 애플리케이션 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:5000 접속

## 주요 기능

- ✅ Google OAuth 로그인
- ✅ 게시물 작성/수정/삭제
- ✅ 이미지 업로드 (Supabase Storage)
- ✅ 댓글 작성/삭제
- ✅ 하트(좋아요) 기능
- ✅ 카테고리별 분류 (1주차/2주차/3주차)
- ✅ 정렬 (최신순/인기순)
- ✅ 내가 쓴 글 필터

## 배포

### Supabase에 RLS (Row Level Security) 활성화 확인

1. schema.sql이 이미 RLS 정책을 포함하고 있음
2. 모든 테이블에 적절한 정책이 설정됨

### Vercel/Netlify 배포

1. 저장소를 GitHub에 푸시
2. Vercel/Netlify에서 Import
3. 환경 변수 설정 (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
4. 배포

## 문제 해결

### Google OAuth 리디렉션 오류

- Google Cloud Console에서 Authorized redirect URIs 확인
- Supabase URL이 정확한지 확인

### 이미지 업로드 실패

- Storage bucket이 public인지 확인
- Storage policies가 올바르게 설정되었는지 확인

### 로그인 후 프로필 정보 없음

- users 테이블의 RLS 정책 확인
- Google OAuth에서 이메일 권한이 승인되었는지 확인

## 기술 스택

- React 18 + TypeScript
- Vite
- Supabase (Auth, Database, Storage)
- TanStack Query
- Tailwind CSS + Shadcn UI
- Wouter (라우팅)
