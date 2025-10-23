# GitHub 및 Vercel 배포 가이드

이 가이드는 프로젝트를 GitHub에 업로드하고 Vercel로 배포하는 전체 과정을 설명합니다.

## 📋 사전 준비사항

- [x] Git 설치됨
- [x] GitHub 계정 생성됨
- [x] Supabase 프로젝트 설정 완료
- [x] 로컬에서 프로젝트가 정상 작동함

---

## 🔧 1단계: GitHub에 프로젝트 업로드

### 1-1. 로컬 Git 상태 확인

```bash
git status
```

현재 변경사항을 확인합니다.

### 1-2. 변경사항 커밋

```bash
# 모든 변경사항 스테이징
git add .

# 커밋 메시지 작성
git commit -m "Initial commit: SPARTA Club community platform"
```

### 1-3. GitHub에서 새 저장소 생성

1. https://github.com 접속
2. 우측 상단 "+" 버튼 클릭 → "New repository" 선택
3. Repository 정보 입력:
   - **Repository name**: `sparta-club` (또는 원하는 이름)
   - **Description**: `커뮤니티 게시판 플랫폼`
   - **Public** 또는 **Private** 선택
   - ❌ **"Add a README file"** 체크 해제 (이미 있음)
   - ❌ **".gitignore"** 선택 안함 (이미 있음)
4. "Create repository" 클릭

### 1-4. 원격 저장소 연결 및 푸시

GitHub에서 생성한 저장소 페이지에 표시된 명령어 중 하나를 사용:

```bash
# 원격 저장소 추가 (main 브랜치가 없는 경우)
git remote add origin https://github.com/your-username/sparta-club.git
git branch -M main
git push -u origin main
```

또는 이미 main 브랜치가 있는 경우:

```bash
# 원격 저장소 URL 변경 (기존 origin이 있는 경우)
git remote set-url origin https://github.com/your-username/sparta-club.git
git push -u origin main
```

**주의**: `your-username`을 본인의 GitHub 사용자명으로 변경하세요.

### 1-5. 푸시 확인

브라우저에서 GitHub 저장소를 새로고침하여 코드가 올라갔는지 확인합니다.

---

## 🚀 2단계: Vercel 배포

### 2-1. Vercel 계정 생성 및 로그인

1. https://vercel.com 접속
2. "Sign Up" 클릭
3. **"Continue with GitHub"** 선택 (권장)
4. GitHub 연동 승인

### 2-2. 새 프로젝트 생성

1. Vercel 대시보드에서 **"Add New..."** 클릭
2. **"Project"** 선택
3. **"Import Git Repository"** 섹션에서 방금 생성한 저장소 선택
   - 저장소가 보이지 않으면 **"Adjust GitHub App Permissions"** 클릭하여 권한 부여
4. **"Import"** 버튼 클릭

### 2-3. 프로젝트 설정

**Configure Project** 화면에서:

1. **Framework Preset**: `Vite` 선택 (자동 감지될 수 있음)
2. **Root Directory**: 비워둠 (프로젝트 루트)
3. **Build and Output Settings**:
   - Build Command: `npm run build` (기본값)
   - Output Directory: `dist/public` (vercel.json에 설정됨)
   - Install Command: `npm install` (기본값)

### 2-4. 환경 변수 설정 ⚠️ 중요!

**Environment Variables** 섹션에서 다음 변수를 추가합니다:

```
Name: VITE_SUPABASE_URL
Value: https://your-project.supabase.co
Environment: Production, Preview, Development (모두 선택)
```

```
Name: VITE_SUPABASE_ANON_KEY
Value: your_supabase_anon_key_here
Environment: Production, Preview, Development (모두 선택)
```

**환경 변수 값 확인 방법**:
1. Supabase Dashboard → Settings → API
2. **Project URL** → `VITE_SUPABASE_URL`
3. **anon public** (API Keys) → `VITE_SUPABASE_ANON_KEY`

### 2-5. 배포 시작

1. **"Deploy"** 버튼 클릭
2. 빌드 로그를 확인하며 대기 (약 1-3분 소요)
3. 배포 완료 시 **"Congratulations!"** 메시지와 함께 URL이 표시됩니다

---

## 🎯 3단계: Supabase 설정 업데이트

배포된 Vercel URL을 Supabase에 등록해야 Google OAuth가 작동합니다.

### 3-1. Vercel 배포 URL 복사

Vercel 배포 완료 화면에서 URL 복사 (예: `https://sparta-club.vercel.app`)

### 3-2. Supabase Authentication 설정

1. Supabase Dashboard 접속
2. **Authentication** → **URL Configuration** 이동
3. **Redirect URLs** 섹션에 추가:
   ```
   https://sparta-club.vercel.app
   https://sparta-club.vercel.app/**
   ```
4. **Save** 클릭

### 3-3. Google OAuth Redirect URI 업데이트

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. OAuth 2.0 Client 선택
3. **Authorized redirect URIs**에 추가:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
4. **Save** 클릭

---

## ✅ 4단계: 배포 확인

### 4-1. 배포된 사이트 접속

Vercel URL로 접속하여 정상 작동 확인:

- [ ] 페이지가 정상적으로 로드되는가?
- [ ] Google 로그인이 작동하는가?
- [ ] 게시글 작성/조회가 정상인가?
- [ ] 이미지 업로드가 작동하는가?

### 4-2. 문제 해결

**빌드 실패 시**:
1. Vercel 대시보드 → 프로젝트 → Deployments → 실패한 배포 클릭
2. 로그 확인하여 오류 파악
3. 로컬에서 `npm run build` 실행하여 오류 재현

**Google 로그인 실패 시**:
1. Supabase Redirect URLs 재확인
2. Google Cloud Console Authorized redirect URIs 재확인
3. 브라우저 콘솔에서 에러 메시지 확인

**환경 변수 오류 시**:
1. Vercel → Settings → Environment Variables 확인
2. 변수명과 값이 정확한지 확인 (앞뒤 공백 주의)
3. 변경 후 반드시 **Redeploy** 필요

---

## 🔄 5단계: 향후 업데이트 배포

코드를 수정한 후 배포하려면:

```bash
# 변경사항 커밋
git add .
git commit -m "Update: 기능 추가/수정 설명"

# GitHub에 푸시
git push origin main
```

**자동 배포**:
- Vercel은 GitHub의 main 브랜치에 푸시하면 자동으로 배포합니다
- 배포 상태는 Vercel 대시보드에서 확인 가능

---

## 🔐 보안 체크리스트

배포 전 확인사항:

- [x] `.env.local` 파일이 `.gitignore`에 포함되어 있는가?
- [x] GitHub에 `.env.local` 파일이 업로드되지 않았는가?
- [x] Vercel 환경 변수가 올바르게 설정되었는가?
- [x] Supabase RLS 정책이 활성화되어 있는가?
- [x] Storage 정책이 올바르게 설정되어 있는가?

---

## 📞 문제 발생 시

1. **Vercel 빌드 로그** 확인
2. **브라우저 개발자 도구 콘솔** 확인
3. **Supabase 로그** 확인 (Dashboard → Logs)

---

## 🎉 배포 완료!

축하합니다! 이제 프로젝트가 전 세계에 공개되었습니다.

**배포된 URL**을 공유하여 다른 사람들에게 프로젝트를 보여주세요!
