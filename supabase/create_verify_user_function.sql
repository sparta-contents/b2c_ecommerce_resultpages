-- Create a database function to verify and create user
-- This bypasses RLS by running with SECURITY DEFINER

CREATE OR REPLACE FUNCTION verify_and_create_user(
  p_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_display_name TEXT,
  p_profile_image TEXT,
  p_google_id TEXT,
  p_user_id TEXT
)
RETURNS JSON AS $$
DECLARE
  v_approved_user RECORD;
  v_new_user RECORD;
BEGIN
  -- Check if user exists in approved_users table
  SELECT * INTO v_approved_user
  FROM approved_users
  WHERE name = p_name AND phone = p_phone;

  -- If not found, raise error
  IF NOT FOUND THEN
    RAISE EXCEPTION '등록되지 않은 사용자입니다. 이름과 전화번호를 확인해주세요.';
  END IF;

  -- Check if already verified
  IF v_approved_user.is_verified THEN
    RAISE EXCEPTION '이미 인증된 전화번호입니다. 다른 계정으로 가입되었을 수 있습니다.';
  END IF;

  -- Create user account
  INSERT INTO users (id, email, name, profile_image, google_id, role)
  VALUES (p_user_id, p_email, p_display_name, p_profile_image, p_google_id, 'user')
  RETURNING * INTO v_new_user;

  -- Update approved_users to mark as verified
  UPDATE approved_users
  SET is_verified = true, user_id = p_user_id, updated_at = NOW()
  WHERE id = v_approved_user.id;

  -- Return success with user data
  RETURN json_build_object(
    'success', true,
    'user', row_to_json(v_new_user)
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION verify_and_create_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_and_create_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;
