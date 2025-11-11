# Heart Count Trigger 적용 가이드

## 개요
이 트리거는 `hearts` 테이블에 하트가 추가/삭제될 때 자동으로 `posts` 테이블의 `heart_count`를 업데이트합니다.

## 적용 방법

### 방법 1: Supabase Dashboard (권장)
1. Supabase Dashboard에 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. `create_heart_count_trigger.sql` 파일의 내용을 복사
5. SQL Editor에 붙여넣기
6. **Run** 버튼 클릭하여 실행

### 방법 2: Supabase CLI
```bash
# Supabase CLI가 설치되어 있다면
supabase db push --file supabase/create_heart_count_trigger.sql
```

## 적용 후 확인

SQL Editor에서 다음 쿼리를 실행하여 트리거가 정상적으로 생성되었는지 확인:

```sql
-- 트리거 확인
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'update_post_heart_count_trigger';

-- 함수 확인
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'update_post_heart_count';
```

## 테스트

트리거가 정상 작동하는지 테스트:

```sql
-- 1. 테스트용 게시글 확인 (기존 게시글 하나 선택)
SELECT id, heart_count FROM posts LIMIT 1;

-- 2. 하트 추가 (post_id를 실제 게시글 ID로 변경)
INSERT INTO hearts (post_id, user_id)
VALUES ('your-post-id', 'your-user-id');

-- 3. heart_count가 1 증가했는지 확인
SELECT id, heart_count FROM posts WHERE id = 'your-post-id';

-- 4. 하트 삭제
DELETE FROM hearts
WHERE post_id = 'your-post-id' AND user_id = 'your-user-id';

-- 5. heart_count가 1 감소했는지 확인
SELECT id, heart_count FROM posts WHERE id = 'your-post-id';
```

## 주의사항
- 이 마이그레이션은 기존 데이터의 `heart_count`를 자동으로 검증하고 수정합니다
- 트리거 생성 후에는 애플리케이션 코드에서 `heart_count` 수동 업데이트를 제거해야 합니다
- 롤백이 필요한 경우 아래 SQL을 실행:
  ```sql
  DROP TRIGGER IF EXISTS update_post_heart_count_trigger ON hearts;
  DROP FUNCTION IF EXISTS update_post_heart_count();
  ```
