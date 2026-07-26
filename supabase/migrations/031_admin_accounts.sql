ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- 본인이 자기 is_admin을 UPDATE로 켜서 스스로 승격할 수 없도록 컬럼 단위로
-- 차단(009의 status 컬럼과 동일한 보호 패턴) — is_admin은 서비스 롤(관리자
-- API)에서만 바꿀 수 있다.
REVOKE UPDATE (is_admin) ON users FROM authenticated;

-- haloforge 계정을 관리자로 지정 — 이메일 기준(닉네임은 변경 가능해서
-- 이메일을 식별자로 쓴다). 이메일이 존재하지 않으면 조용히 0 rows affected.
UPDATE users SET is_admin = true WHERE email = 'haloforge@haloforge.kr';
