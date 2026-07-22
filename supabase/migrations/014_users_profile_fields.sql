-- 014: 회원가입 폼 보강 — 닉네임/실명/전화번호 필드 추가
--
-- 지금까지 users 테이블엔 id/email/role/status뿐이라 닉네임 설정도, 아이디
-- (이메일)/닉네임 중복 확인도 할 방법이 없었다. 전화번호는 컬럼만 우선
-- 만들어둔다 — 실제 SMS OTP 인증은 별도 유료 벤더(NHN Cloud/Solapi 등)
-- 계약이 필요해 이번엔 입력만 받고 인증 자체는 아직 안 붙인다.
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS real_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- 닉네임은 설정된 경우에 한해 유니크 (NULL은 여러 개 허용)
CREATE UNIQUE INDEX IF NOT EXISTS users_nickname_uniq ON users (nickname) WHERE nickname IS NOT NULL;
