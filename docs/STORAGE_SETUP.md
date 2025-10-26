# Supabase Storage 설정 가이드 - 프로필 이미지

## 개요
프로필 이미지 업로드 기능을 사용하려면 Supabase Storage에 `profile-images` 버킷을 생성하고 적절한 정책을 설정해야 합니다.

## 1. Storage Bucket 생성

### A. Supabase Dashboard 접속
1. [Supabase Dashboard](https://supabase.com/dashboard) 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **Storage** 클릭

### B. Bucket 생성
1. **"Create a new bucket"** 버튼 클릭
2. 다음 설정 입력:
   - **Name**: `profile-images`
   - **Public bucket**: ✅ 체크 (프로필 이미지는 공개)
   - **File size limit**: 10 MB
   - **Allowed MIME types**: Leave empty (자동)
3. **"Create bucket"** 클릭

## 2. Storage Policy 설정

Storage Bucket이 생성되었으면 접근 권한 정책(RLS Policy)을 설정해야 합니다.

### A. Policy 페이지 접근
1. Storage 탭에서 `profile-images` 버킷 선택
2. **Policies** 탭 클릭
3. **"New Policy"** 클릭

### B. Read Policy (모두 읽기 가능)

**정책 이름**: `Anyone can view profile images`

```sql
CREATE POLICY "Anyone can view profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');
```

**또는 UI에서 설정**:
- Policy name: `Anyone can view profile images`
- Allowed operation: `SELECT`
- Policy definition: `bucket_id = 'profile-images'`

### C. Upload Policy (인증된 사용자만 업로드)

**정책 이름**: `Authenticated users can upload profile images`

```sql
CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.role() = 'authenticated'
);
```

**또는 UI에서 설정**:
- Policy name: `Authenticated users can upload profile images`
- Allowed operation: `INSERT`
- Policy definition:
  ```
  bucket_id = 'profile-images' AND
  auth.role() = 'authenticated'
  ```

### D. Delete Policy (본인만 삭제)

**정책 이름**: `Users can delete their own profile images`

```sql
CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**또는 UI에서 설정**:
- Policy name: `Users can delete their own profile images`
- Allowed operation: `DELETE`
- Policy definition:
  ```
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
  ```

## 3. SQL Editor로 한 번에 설정 (권장)

더 빠르게 설정하려면 SQL Editor를 사용하세요:

1. Supabase Dashboard → **SQL Editor**
2. 다음 SQL 실행:

```sql
-- Profile Images Storage Bucket Policies

-- 1. 읽기 정책: 모두 프로필 이미지 볼 수 있음
CREATE POLICY "Anyone can view profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

-- 2. 업로드 정책: 인증된 사용자만 업로드 가능
CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.role() = 'authenticated'
);

-- 3. 삭제 정책: 본인이 업로드한 이미지만 삭제 가능
CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 4. 설정 확인

### A. Bucket 확인
1. Storage → `profile-images` 버킷 선택
2. Public 아이콘이 표시되어야 함
3. Policies 탭에서 3개의 정책이 표시되어야 함:
   - SELECT (읽기)
   - INSERT (업로드)
   - DELETE (삭제)

### B. 테스트 업로드
1. 애플리케이션 실행: `npm run dev`
2. 로그인 후 프로필 편집 페이지(`/profile`)로 이동
3. 프로필 사진 변경 버튼 클릭
4. 이미지 선택 및 업로드
5. 성공 시 "프로필 사진이 변경되었습니다" 메시지 표시

### C. Storage에서 확인
1. Supabase Dashboard → Storage → `profile-images`
2. `{user_id}` 폴더가 생성되고 이미지가 업로드되었는지 확인
3. 이미지 파일 크기: 약 50-150KB (리사이징됨)
4. 이미지 해상도: 200x200px

## 5. 문제 해결

### 업로드 실패: "new row violates row-level security policy"
**원인**: Storage Policy가 올바르게 설정되지 않음

**해결**:
1. Storage → `profile-images` → Policies 확인
2. INSERT 정책이 있는지 확인
3. 정책 조건 재확인: `auth.role() = 'authenticated'`

### 이미지가 표시되지 않음
**원인**: Bucket이 Public이 아님 또는 SELECT 정책 없음

**해결**:
1. Bucket 설정에서 Public으로 변경
2. SELECT 정책 추가

### 삭제 실패
**원인**: DELETE 정책이 올바르지 않음

**해결**:
1. DELETE 정책 확인
2. `auth.uid()::text = (storage.foldername(name))[1]` 조건 확인

## 6. 추가 최적화 (선택사항)

### A. CDN 캐싱 설정
Supabase Storage는 자동으로 CDN을 사용하지만, 추가 설정 가능:

```sql
-- Cache-Control 헤더 설정 (1년)
UPDATE storage.buckets
SET public = true,
    file_size_limit = 10485760, -- 10MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png']
WHERE id = 'profile-images';
```

### B. Webhook 설정 (이미지 처리 자동화)
프로필 이미지 업로드 시 자동으로 처리하려면:
1. Supabase Dashboard → Database → Webhooks
2. `storage.objects` 테이블의 INSERT 이벤트 감지
3. Edge Function으로 추가 처리 (썸네일 생성 등)

## 7. 보안 체크리스트

- [x] Bucket이 Public으로 설정됨
- [x] SELECT 정책 설정 (모두 읽기 가능)
- [x] INSERT 정책 설정 (인증된 사용자만)
- [x] DELETE 정책 설정 (본인 이미지만)
- [x] 파일 크기 제한 (10MB)
- [x] MIME 타입 검증 (클라이언트 측)
- [x] 이미지 리사이징 (200x200px, 클라이언트 측)

## 8. 참고 자료

- [Supabase Storage 문서](https://supabase.com/docs/guides/storage)
- [Storage RLS 문서](https://supabase.com/docs/guides/storage/security/access-control)
- [이미지 최적화 가이드](https://supabase.com/docs/guides/storage/image-transformations)

---

## 완료!

이제 프로필 이미지 업로드 기능이 정상적으로 작동합니다. 🎉

문제가 발생하면 위의 문제 해결 섹션을 참고하거나 Supabase Dashboard의 Logs를 확인하세요.
