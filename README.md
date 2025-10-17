# SPARTA Club - 결과물 제출 페이지

순수 React + Vite + Supabase로 구축된 포트폴리오 스타일의 커뮤니티 플랫폼입니다.

## 🚀 빠른 시작

### 1. Supabase 프로젝트 생성 및 설정

**자세한 설정 방법은 [SETUP.md](./SETUP.md)를 참조하세요.**

#### 필수 단계:
1. [Supabase Dashboard](https://supabase.com/dashboard)에서 새 프로젝트 생성
2. `supabase/schema.sql` 실행하여 테이블 생성
3. `supabase/seed.sql` 실행하여 예시 데이터 추가 (선택사항)
4. Storage에서 `post-images` 버킷 생성 (Public)
5. Google Cloud Console에서 OAuth 설정
6. Supabase에 Google Provider 설정

### 2. 환경 변수 설정

Replit Secrets에 다음 변수 추가:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 애플리케이션 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:5000 접속

## ✨ 주요 기능

- ✅ **Google OAuth** - 간편한 로그인
- ✅ **게시물 관리** - 작성, 수정, 삭제
- ✅ **이미지 업로드** - Supabase Storage
- ✅ **댓글 시스템** - 실시간 댓글 작성/삭제
- ✅ **하트(좋아요)** - 토글 형태의 좋아요 기능
- ✅ **과제 분류** - 1주차/2주차/3주차 과제 태그
- ✅ **정렬/필터** - 최신순/인기순, 내가 쓴 글

## 🏗️ 기술 스택

### Frontend
- **React 18** + TypeScript
- **Vite** - 빠른 빌드 도구
- **Wouter** - 경량 라우팅
- **TanStack Query** - 서버 상태 관리
- **Tailwind CSS** + **Shadcn UI** - 스타일링
- **Lucide React** - 아이콘

### Backend
- **Supabase**
  - Authentication (Google OAuth)
  - PostgreSQL Database
  - Storage (이미지)
  - Row Level Security (RLS)

## 📁 프로젝트 구조

```
sparta-club/
├── client/
│   └── src/
│       ├── components/     # UI 컴포넌트
│       ├── contexts/       # React Context (Auth)
│       ├── lib/           # Supabase 클라이언트 & API
│       └── pages/         # 페이지 컴포넌트
├── supabase/
│   ├── schema.sql        # 데이터베이스 스키마
│   └── seed.sql          # 예시 데이터
├── SETUP.md              # 상세 설정 가이드
└── README.md             # 이 파일
```

## 🎨 디자인

- **다크 모드** 포트폴리오 스타일
- **Navy-blue** 컬러 스킴
- **Inter + Noto Sans KR** 폰트
- Dribbble/Behance 영감

## 🔒 보안

- Row Level Security (RLS) 활성화
- 인증된 사용자만 작성/수정/삭제 가능
- 모든 요청에 대한 권한 검증
- 환경 변수로 민감 정보 관리

## 📝 사용 방법

1. **Google 로그인** - 우측 상단 "Google 로그인" 클릭
2. **게시물 작성** - 로그인 후 "글쓰기" 버튼 클릭
3. **이미지 업로드** - 드래그 앤 드롭 또는 클릭하여 업로드
4. **과제 선택** - 1주차/2주차/3주차 중 선택
5. **상호작용** - 하트(좋아요), 댓글 작성

## 🚢 배포

### Vercel 배포
```bash
# Vercel CLI 설치
npm install -g vercel

# 배포
vercel

# 환경 변수 설정
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

### Netlify 배포
1. GitHub 저장소에 Push
2. Netlify에서 Import
3. Build command: `npm run build`
4. Publish directory: `dist/public`
5. 환경 변수 설정

## 🤝 기여

이 프로젝트는 SPARTA 코딩클럽 과제용으로 제작되었습니다.

## 📄 라이센스

MIT License

---

**Made with ❤️ by SPARTA Club**
